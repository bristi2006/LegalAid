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

from typing import Any, Dict, List, Optional


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
    reasons: List[str] = []

    # ── Conditions that force professional review ─────────────────────────
    if is_high_risk:
        reasons.append("situation involves high-risk or emergency factors")
        return "professional_review_recommended", (
            "Professional legal review is strongly recommended because: " + "; ".join(reasons) + "."
        )

    if len(contradictions) > 0:
        reasons.append(f"{len(contradictions)} contradiction(s) detected in the facts provided")

    if len(verified_sections) == 0:
        reasons.append("no verified legal sections could be confirmed for your situation")

    if domain in ("criminal", "unsupported"):
        reasons.append("the matter falls outside or at the boundary of the supported domains")

    if reasons:
        return "professional_review_recommended", (
            "Professional legal review is recommended because: " + "; ".join(reasons) + ". "
            "The information provided is for reference only."
        )

    # ── Conditions that indicate needs_verification ───────────────────────
    verification_reasons: List[str] = []

    if len(missing_facts) > 0:
        verification_reasons.append(
            f"{len(missing_facts)} important fact(s) could not be extracted "
            f"({', '.join(missing_facts[:3])}{'...' if len(missing_facts) > 3 else ''})"
        )

    if jurisdiction_status == "needs_verification":
        verification_reasons.append(
            "jurisdiction/state could not be determined (legal rules vary significantly by state)"
        )

    if len(verified_sections) < 2:
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
        f"This analysis is strongly supported: {len(verified_sections)} verified legal sections "
        f"were found in the authoritative knowledge base, all key facts were extracted, "
        f"and no contradictions or high-risk factors were detected."
    )
