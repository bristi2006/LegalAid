"""
backend/app/services/jurisdiction.py

Jurisdiction resolution engine.
Maps the user's state/city and issue to the applicable central and state legal frameworks.
"""
from __future__ import annotations

import logging
from typing import Optional
from backend.app.models.schemas import JurisdictionResult
from backend.app.services.kb_lookup import lookup_state_labour_rule

logger = logging.getLogger("legalaid.jurisdiction")

# ── State → Applicable tenant law mapping ──────────────────────────────────────
_TENANT_STATE_LAW = {
    "maharashtra":   ("Maharashtra Rent Control Act, 1999",
                      "State-specific; applies to premises in Maharashtra."),
    "karnataka":     ("Karnataka Rent Act, 1999",
                      "State-specific; applies to premises in Karnataka."),
    "delhi":         ("Delhi Rent Control Act, 1958",
                      "State-specific; applies to tenancies in Delhi."),
    "west bengal":   ("West Bengal Premises Tenancy Act, 1997",
                      "State-specific; applies to premises in West Bengal."),
    "tamil nadu":    ("Tamil Nadu Buildings (Lease and Rent Control) Act, 1960",
                      "State-specific; applies to buildings in Tamil Nadu."),
    "kerala":        ("Kerala Buildings (Lease and Rent Control) Act, 1965",
                      "State-specific; applies to buildings in Kerala."),
    "gujarat":       ("Gujarat Tenancy and Agricultural Lands Act, 1948 / "
                      "Gujarat Rent Control Act",
                      "State-specific; check current Gujarat tenancy legislation."),
    "rajasthan":     ("Rajasthan Rent Control Act, 2001",
                      "State-specific; applies to premises in Rajasthan."),
    "punjab":        ("Punjab Rent Act, 1995",
                      "State-specific; applies to premises in Punjab."),
    "haryana":       ("Haryana Urban (Control of Rent and Eviction) Act, 1973",
                      "State-specific; applies to urban premises in Haryana."),
    "uttar pradesh": ("Uttar Pradesh Urban Buildings (Regulation of Letting, "
                      "Rent and Eviction) Act, 1972 / UP has adopted MTA variant",
                      "Uttar Pradesh: both old act and MTA variant may apply. "
                      "Consult current UP tenancy rules."),
    "andhra pradesh": ("Model Tenancy Act, 2021 (adopted/aligned)",
                       "Andhra Pradesh has aligned with the MTA framework."),
    "assam":          ("Model Tenancy Act, 2021 (adopted)",
                       "Assam has adopted the MTA."),
    "chandigarh":     ("Model Tenancy Act, 2021 (adopted by UT)",
                       "Chandigarh UT has adopted the MTA."),
    "goa":            ("Goa, Daman and Diu Buildings (Lease, Rent and Eviction) "
                       "Control Act, 1968",
                       "State-specific; applies to premises in Goa."),
    "madhya pradesh": ("Madhya Pradesh Accommodation Control Act, 1961",
                       "State-specific; check current MP tenancy legislation."),
    "odisha":         ("Odisha Rent Control Act, 2020 / MTA aligned",
                       "Odisha enacted a new Rent Control Act aligned with MTA."),
    "telangana":      ("Telangana Rent Control Act, 2017 / MTA aligned",
                       "State-specific; Telangana has its own Rent Control Act."),
}

_TPA_FALLBACK_NOTE = (
    "The Model Tenancy Act, 2021 has not been confirmed as adopted in this state. "
    "The Transfer of Property Act, 1882 (Section 108) applies as the general fallback. "
    "Check whether your state has enacted its own Rent Control Act."
)


def resolve_jurisdiction(
    domain: str,
    state: Optional[str],
    city: Optional[str] = None,
    issue: Optional[str] = None,
) -> JurisdictionResult:
    """
    Resolve the applicable legal framework for the given domain, location, and issue.

    Supports state-specific labour notifications and state tenancy acts.
    """
    try:
        if not state:
            return JurisdictionResult(
                state=None,
                city=city,
                applicable_law=None,
                jurisdiction_note=(
                    f"State/jurisdiction not specified. Legal rules vary significantly by state. "
                    f"For {'tenant' if domain == 'tenant' else 'labour'} disputes especially, please indicate your "
                    f"state to receive accurate legal information."
                ),
                status="needs_verification",
            )

        state_lower = state.lower().strip()

        # ── Consumer ──────────────────────────────────────────────────────────────
        if domain == "consumer":
            return JurisdictionResult(
                state=state,
                city=city,
                applicable_law="Consumer Protection Act, 2019",
                jurisdiction_note=(
                    "Consumer Protection Act, 2019 is a central act and applies uniformly "
                    f"across India, including {state}. District Consumer Commission for "
                    f"{city or state} has jurisdiction for claims up to ₹50 lakh."
                ),
                status="resolved",
            )

        # ── Labour ────────────────────────────────────────────────────────────────
        if domain == "labour":
            # Check if we have state-specific rule in the KB (e.g. for minimum wage)
            state_rule = lookup_state_labour_rule(state, issue or "minimum_wage_violation")
            if state_rule:
                return JurisdictionResult(
                    state=state,
                    city=city,
                    applicable_law=f"Code on Wages, 2019 / {state_rule.get('act_name')}",
                    jurisdiction_note=(
                        f"Gujarat/State framework: {state_rule.get('rule_or_notification')}. "
                        f"Minimum wage rates are notified by {state} and enforced under local rules. "
                        f"The Labour Commissioner's office in {city or state} has jurisdiction."
                    ),
                    status="resolved",
                )
            else:
                # If the issue specifically requires state rules (like minimum wages) but not verified
                if issue == "minimum_wage_violation":
                    return JurisdictionResult(
                        state=state,
                        city=city,
                        applicable_law="Code on Wages, 2019 / State Minimum Wages Notification (unverified)",
                        jurisdiction_note=(
                            f"Minimum wage rules are state-regulated. The notifications for state '{state}' "
                            f"could not be verified in the local KB. Consult local Labour Commissioner's office."
                        ),
                        status="needs_verification",
                    )
                # Default central act fallback
                return JurisdictionResult(
                    state=state,
                    city=city,
                    applicable_law="Code on Wages, 2019 (Central Act)",
                    jurisdiction_note=(
                        f"The Code on Wages, 2019 is a central act. Minimum wage rates are notified separately by "
                        f"{state} and must be checked against the current State notification. "
                        f"The Labour Commissioner's office in {city or state} handles wage claims."
                    ),
                    status="resolved",
                )

        # ── Tenant ────────────────────────────────────────────────────────────────
        if domain == "tenant":
            if state_lower in _TENANT_STATE_LAW:
                law_name, law_note = _TENANT_STATE_LAW[state_lower]
                return JurisdictionResult(
                    state=state,
                    city=city,
                    applicable_law=law_name,
                    jurisdiction_note=law_note,
                    status="resolved",
                )
            else:
                return JurisdictionResult(
                    state=state,
                    city=city,
                    applicable_law="Transfer of Property Act, 1882 (Section 108) / Model Tenancy Act, 2021 (if adopted)",
                    jurisdiction_note=_TPA_FALLBACK_NOTE,
                    status="needs_verification",
                )

        # Unknown domain
        return JurisdictionResult(
            state=state,
            city=city,
            applicable_law=None,
            jurisdiction_note="Jurisdiction cannot be resolved for unsupported domains.",
            status="not_applicable",
        )
    except Exception as e:
        logger.error("Unexpected error in resolve_jurisdiction: %s", e)

    return JurisdictionResult(
        state=state,
        city=city,
        applicable_law=None,
        jurisdiction_note="Error resolving jurisdiction: unexpected internal failure.",
        status="needs_verification",
    )
