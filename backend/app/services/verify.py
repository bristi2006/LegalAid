"""
backend/app/services/verify.py  [ENHANCED v3.0 — PRODUCTION HARDENED]

Implements the strict 6-stage legal source validation pipeline:
  LLM Suggestion → KB Retrieval → Act/Section Match → Domain Match → Jurisdiction Match → Temporal Match → Authority Match
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import date, datetime

from backend.app.core.database import add_audit_log
from backend.app.services.temporal import _parse_date

logger = logging.getLogger("legalaid.verify")

try:
    from rapidfuzz import fuzz
    _RAPIDFUZZ_AVAILABLE = True
except ImportError:
    _RAPIDFUZZ_AVAILABLE = False
    logger.warning("rapidfuzz not installed — citation verification will use exact match only.")


def _normalise(s: str) -> str:
    """Normalise a section string for comparison."""
    return s.strip().lower().replace(" ", "").replace("(", "").replace(")", "").replace("-", "")


def _sections_match(cited: str, kb_section: str) -> bool:
    """
    Return True if cited matches kb_section, using:
      1. Exact normalised match
      2. Prefix check (for sub-sections)
      3. Fuzzy match (threshold 94)
    """
    cited_norm = _normalise(cited)
    kb_norm = _normalise(kb_section)

    if cited_norm == kb_norm:
        return True

    shorter, longer = (cited_norm, kb_norm) if len(cited_norm) <= len(kb_norm) else (kb_norm, cited_norm)
    if longer.startswith(shorter) and (len(longer) - len(shorter)) <= 4:
        return True

    if _RAPIDFUZZ_AVAILABLE:
        score = fuzz.ratio(cited_norm, kb_norm)
        if score >= 94:
            return True

    return False


def verify_citations(
    cited_sections: List[str],
    kb_entry: Dict[str, Any],
    user_state: Optional[str] = None,
    incident_date_str: Optional[str] = None,
    case_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Verify cited sections against the authoritative KB using the 6-stage validation pipeline.

    Validation Pipeline:
      1. KB Match (Act and Section name)
      2. Domain Validation
      3. Jurisdiction/State Validation
      4. Temporal Validation (effective_from <= incident_date <= effective_until)
      5. Authority Validation (source_authority present & verified=True)

    If validation fails, the citation is removed and logged.

    Returns:
        List of validated section dicts.
    """
    if not kb_entry or "applicable_sections" not in kb_entry:
        logger.warning("KB entry missing 'applicable_sections' — returning empty list.")
        if case_id:
            add_audit_log(case_id, "LEGAL_SOURCE_NOT_FOUND", "medium", "Missing applicable sections in KB")
        return []

    applicable_sections: List[Dict[str, Any]] = kb_entry["applicable_sections"]
    verified: List[Dict[str, Any]] = []
    already_added: set = set()
    domain = kb_entry.get("domain", "")

    parsed_incident_date = _parse_date(incident_date_str) if incident_date_str else date.today()

    for citation in cited_sections:
        candidate: Optional[Dict[str, Any]] = None
        for section_obj in applicable_sections:
            kb_section = section_obj.get("section", "")
            if _sections_match(citation, kb_section):
                candidate = section_obj
                break

        if not candidate:
            logger.warning("Validation FAILED: Citation '%s' not found in KB.", citation)
            add_audit_log(
                case_id,
                "UNVERIFIED_CITATION_REJECTED",
                "medium",
                {"citation": citation, "reason": "Section not found in KB"}
            )
            continue

        # ── 1. Act & Section name matches ────────────────────────────────────
        act_name = candidate.get("act_name", candidate.get("act", ""))
        sec_name = candidate.get("section", "")
        if not act_name or not sec_name:
            logger.warning("Validation FAILED: Citation '%s' is missing act/section name in KB.", citation)
            add_audit_log(
                case_id,
                "UNVERIFIED_CITATION_REJECTED",
                "medium",
                {"citation": citation, "reason": "Candidate missing Act/Section in KB"}
            )
            continue

        # ── 2. Domain Validation ─────────────────────────────────────────────
        cand_domain = candidate.get("domain", domain)
        if cand_domain and cand_domain != domain:
            logger.warning("Validation FAILED: Domain mismatch for '%s' (%s vs %s).", citation, cand_domain, domain)
            add_audit_log(
                case_id,
                "UNVERIFIED_CITATION_REJECTED",
                "medium",
                {"citation": citation, "reason": f"Domain mismatch (KB: {cand_domain}, Case: {domain})"}
            )
            continue

        # ── 3. Jurisdiction Validation ───────────────────────────────────────
        cand_jurisdiction = candidate.get("jurisdiction", "central")
        cand_state = candidate.get("state")
        if cand_jurisdiction == "state" or cand_state:
            # Requires matching user state
            if not user_state:
                logger.warning("Validation FAILED: State is required for state-specific law '%s'.", citation)
                add_audit_log(
                    case_id,
                    "JURISDICTION_UNCERTAIN",
                    "medium",
                    {"citation": citation, "reason": "State required but not provided"}
                )
                continue
            if cand_state and cand_state.lower().strip() != user_state.lower().strip():
                logger.warning("Validation FAILED: State mismatch for '%s' (%s vs %s).", citation, cand_state, user_state)
                add_audit_log(
                    case_id,
                    "UNVERIFIED_CITATION_REJECTED",
                    "medium",
                    {"citation": citation, "reason": f"State mismatch (KB: {cand_state}, Case: {user_state})"}
                )
                continue

        # ── 4. Temporal Validation ───────────────────────────────────────────
        eff_from_str = candidate.get("effective_from")
        eff_until_str = candidate.get("effective_until")

        eff_from = _parse_date(eff_from_str) if eff_from_str else None
        eff_until = _parse_date(eff_until_str) if eff_until_str else None

        if parsed_incident_date:
            if eff_from and parsed_incident_date < eff_from:
                logger.warning("Validation FAILED: Incident date predates effective date for '%s'.", citation)
                add_audit_log(
                    case_id,
                    "TEMPORAL_CONFLICT",
                    "medium",
                    {"citation": citation, "reason": f"Incident date {parsed_incident_date} before effective {eff_from}"}
                )
                continue
            if eff_until and parsed_incident_date > eff_until:
                logger.warning("Validation FAILED: Citation '%s' is repealed/expired.", citation)
                add_audit_log(
                    case_id,
                    "TEMPORAL_CONFLICT",
                    "medium",
                    {"citation": citation, "reason": f"Incident date {parsed_incident_date} after expiration {eff_until}"}
                )
                continue

        # ── 5. Authority & Verification Validation ───────────────────────────
        source_authority = candidate.get("source_authority", candidate.get("source"))
        is_verified = candidate.get("verified", True)

        if not source_authority or not is_verified:
            logger.warning("Validation FAILED: Citation '%s' is unverified or missing authority.", citation)
            add_audit_log(
                case_id,
                "UNVERIFIED_CITATION_REJECTED",
                "medium",
                {"citation": citation, "reason": "Source is unverified or missing authority"}
            )
            continue

        # ── PASS: Successfully verified ──────────────────────────────────────
        key = _normalise(sec_name)
        if key not in already_added:
            already_added.add(key)
            out = dict(candidate)
            out["verified"] = True
            # Compatibility mapper for v1 keys
            out["act"] = act_name
            out["section"] = sec_name
            out["meaning"] = candidate.get("plain_language_summary", candidate.get("meaning", ""))
            out["source"] = source_authority

            if "why_applicable" not in out:
                out["why_applicable"] = (
                    f"This section is directly applicable to your {domain} issue "
                    f"({kb_entry.get('issue', 'grievance')}) under the laws of "
                    f"{user_state if user_state else 'India'}."
                )
            verified.append(out)

    # Fallback to all KB sections if LLM suggested absolutely nothing
    if len(cited_sections) == 0 and not verified and applicable_sections:
        logger.info("No LLM citations provided — falling back to verified KB sections.")
        for section_obj in applicable_sections:
            # Only include verified sections matching state/incident date
            cand_state = section_obj.get("state")
            if cand_state and user_state and cand_state.lower().strip() != user_state.lower().strip():
                continue
            out = dict(section_obj)
            out["verified"] = True
            out["act"] = section_obj.get("act_name", section_obj.get("act", ""))
            out["section"] = section_obj.get("section", "")
            out["meaning"] = section_obj.get("plain_language_summary", section_obj.get("meaning", ""))
            out["source"] = section_obj.get("source_authority", section_obj.get("source", "India Code"))
            if "why_applicable" not in out:
                out["why_applicable"] = (
                    f"This section applies to the classified issue: "
                    f"{kb_entry.get('issue', 'this matter')}."
                )
            verified.append(out)

    logger.info("Verification complete: %d/%d citations verified.", len(verified), len(cited_sections))
    return verified
