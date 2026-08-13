"""
backend/app/services/confidence.py

Legal confidence engine.

Replaces the meaningless float confidence score (e.g. 0.8743) with a
meaningful categorical assessment derived from actual analysis quality.

Levels:
  strongly_supported      — Verified citations + complete facts + known jurisdiction
  needs_verification      — Some facts missing OR jurisdiction unknown OR partial citations
  professional_review_recommended — High risk OR contradictions OR no verified sections OR criminal law
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("legalaid.confidence")


def assess_confidence(
    verified_sections: List[Dict[str, Any]],
    missing_facts: List[str],
    contradictions: List[Any],
    is_high_risk: bool,
    jurisdiction_status: str,
    domain: str,
) -> tuple[str, str]:
    """
    Determine the confidence level and reason for a legal analysis.

    Args:
        verified_sections: List of verified section dicts from verify.py
        missing_facts: List of missing mandatory fact keys from intake.py
        contradictions: List of Contradiction objects from contradiction.py
        is_high_risk: Boolean from safety.py
        jurisdiction_status: 'resolved' | 'needs_verification' | 'not_applicable'
        domain: 'consumer' | 'labour' | 'tenant'

    Returns:
        (confidence_level: str, confidence_reason: str)
    """
    try:
        # Coerce inputs to safe defaults
        v_sections = verified_sections if isinstance(verified_sections, list) else []
        m_facts = missing_facts if isinstance(missing_facts, list) else []
        contrads = contradictions if isinstance(contradictions, list) else []
        high_risk = bool(is_high_risk)
        j_status = str(jurisdiction_status) if jurisdiction_status else "needs_verification"
        dom = str(domain) if domain else "unsupported"

        reasons: List[str] = []

        # ── Conditions that force professional review ─────────────────────────
        if high_risk:
            reasons.append("situation involves high-risk or emergency factors")
            return "professional_review_recommended", (
                "Professional legal review is strongly recommended because: " + "; ".join(reasons) + "."
            )

        if len(contrads) > 0:
            reasons.append(f"{len(contrads)} contradiction(s) detected in the facts provided")

        if len(v_sections) == 0:
            reasons.append("no verified legal sections could be confirmed for your situation")

        if dom in ("criminal", "unsupported"):
            reasons.append("the matter falls outside or at the boundary of the supported domains")

        if reasons:
            return "professional_review_recommended", (
                "Professional legal review is recommended because: " + "; ".join(reasons) + ". "
                "The information provided is for reference only."
            )

        # ── Conditions that indicate needs_verification ───────────────────────
        verification_reasons: List[str] = []

        if len(m_facts) > 0:
            verification_reasons.append(
                f"{len(m_facts)} important fact(s) could not be extracted "
                f"({', '.join(m_facts[:3])}{'...' if len(m_facts) > 3 else ''})"
            )

        if j_status == "needs_verification":
            verification_reasons.append(
                "jurisdiction/state could not be determined (legal rules vary significantly by state)"
            )

        if len(v_sections) < 2:
            verification_reasons.append(
                "only one legal section could be verified for your situation"
            )

        if verification_reasons:
            return "needs_verification", (
                "This analysis needs verification because: " + "; ".join(verification_reasons) + ". "
                "The legal information may be incomplete."
            )

        # ── All checks passed → strongly supported ────────────────────────────
        return "strongly_supported", (
            f"This analysis is strongly supported: {len(v_sections)} verified legal sections "
            f"were found in the authoritative knowledge base, all key facts were extracted, "
            f"and no contradictions or high-risk factors were detected."
        )
    except Exception as e:
        logger.error("Unexpected error in assess_confidence: %s", e)

    return "needs_verification", "Confidence check failed due to an unexpected internal error."
