"""
backend/app/services/temporal.py

Temporal legal resolution engine.

Determines the applicable legal regime based on:
  1. Incident date vs. legislative effective dates
  2. Domain (consumer / labour / tenant / criminal)

Key cut-off dates:
  - July 1, 2024: IPC → BNS, CrPC → BNSS, Indian Evidence Act → BSA
  - November 21, 2025: Labour Codes (Code on Wages 2019, Industrial Relations
    Code 2020, OSHWC Code 2020, Code on Social Security 2020) replaced older
    statutes (Payment of Wages Act 1936, Minimum Wages Act 1948, etc.)
  - Consumer Protection Act, 2019: effective July 20, 2020
    (replaced Consumer Protection Act, 1986)
  - Model Tenancy Act, 2021: advisory/model; state adoption dates vary

The LLM must NEVER guess the applicable regime.
This engine always returns a structured result the LLM can rely on.
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional
from backend.app.models.schemas import TemporalResult

logger = logging.getLogger("legalaid.temporal")

# ── Legal cut-off dates ────────────────────────────────────────────────────────

_BNS_CUTOFF = date(2024, 7, 1)          # BNS/BNSS/BSA effective
_LABOUR_CODES_CUTOFF = date(2025, 11, 21)  # New Labour Codes effective
_CPA_2019_CUTOFF = date(2020, 7, 20)    # Consumer Protection Act 2019 effective


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse YYYY-MM-DD or DD/MM/YYYY date strings safely."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def resolve_temporal(
    domain: str,
    incident_date_str: Optional[str],
    issue: Optional[str] = None,
) -> TemporalResult:
    """
    Resolve the applicable legal regime given an incident date and domain.

    Args:
        domain: 'consumer' | 'labour' | 'tenant' | 'unsupported'
        incident_date_str: Incident date as a string (YYYY-MM-DD preferred)
        issue: Specific issue key from the KB (for fine-grained routing)

    Returns:
        TemporalResult with legal_regime, notes, and parsed incident_date
    """
    try:
        incident_date = _parse_date(incident_date_str)
        today = date.today()

        # ── Consumer ──────────────────────────────────────────────────────────────
        if domain == "consumer":
            if incident_date and incident_date < _CPA_2019_CUTOFF:
                return TemporalResult(
                    incident_date=incident_date_str,
                    legal_regime="Consumer Protection Act, 1986 (old act — incident predates July 20 2020)",
                    notes=(
                        "The Consumer Protection Act, 2019 came into force on July 20, 2020. "
                        "For incidents before this date, the Consumer Protection Act, 1986 applies. "
                        "However, complaints filed today use current procedural rules."
                    ),
                )
            return TemporalResult(
                incident_date=incident_date_str,
                legal_regime="Consumer Protection Act, 2019",
                notes=None,
            )

        # ── Labour ────────────────────────────────────────────────────────────────
        if domain == "labour":
            if incident_date and incident_date < _LABOUR_CODES_CUTOFF:
                return TemporalResult(
                    incident_date=incident_date_str,
                    legal_regime=(
                        "Pre-Code Regime: Payment of Wages Act, 1936 / "
                        "Minimum Wages Act, 1948 / Industrial Disputes Act, 1947"
                    ),
                    notes=(
                        "The new Labour Codes (Code on Wages 2019, Industrial Relations "
                        "Code 2020) came into force on November 21, 2025. "
                        "For incidents before this date, the older statutes apply. "
                        "Savings provisions under the new Codes preserve pending claims. "
                        "Consult the applicable State labour authority to confirm which "
                        "procedural rules govern your claim."
                    ),
                )
            if not incident_date:
                return TemporalResult(
                    incident_date=None,
                    legal_regime="Code on Wages, 2019 / Labour Codes (2019-2020)",
                    notes=(
                        "Incident date not provided. Assuming current regime applies. "
                        "If the incident occurred before November 21, 2025, older labour "
                        "statutes may apply — please provide the incident date."
                    ),
                )
            return TemporalResult(
                incident_date=incident_date_str,
                legal_regime="Code on Wages, 2019 / Labour Codes (2019-2020)",
                notes=(
                    "The Labour Codes (Code on Wages 2019, Industrial Relations Code 2020, "
                    "OSHWC Code 2020) are in force from November 21, 2025. "
                    "Detailed State Rules were being finalised as of early 2026; "
                    "procedural timelines may vary by state."
                ),
            )

        # ── Tenant ────────────────────────────────────────────────────────────────
        if domain == "tenant":
            # Criminal trespass / illegal eviction cross-references criminal law
            if issue in ("illegal_eviction", "essential_services_withheld",
                         "unauthorized_entry_by_landlord"):
                if incident_date and incident_date < _BNS_CUTOFF:
                    criminal_note = (
                        "Criminal trespass / interference with possession: "
                        "For incidents before July 1, 2024, the Indian Penal Code (IPC) applies — "
                        "specifically Section 441 (criminal trespass) and Section 447 (punishment). "
                        "Do NOT cite BNS for pre-July 2024 incidents."
                    )
                else:
                    criminal_note = (
                        "Criminal trespass / interference with possession: "
                        "For incidents on or after July 1, 2024, the Bharatiya Nyaya Sanhita, "
                        "2023 (BNS) applies — Section 329 covers criminal trespass. "
                        "The Indian Penal Code (IPC) no longer applies to new incidents."
                    )
                return TemporalResult(
                    incident_date=incident_date_str,
                    legal_regime="Model Tenancy Act, 2021 / Transfer of Property Act, 1882",
                    notes=criminal_note,
                )

            return TemporalResult(
                incident_date=incident_date_str,
                legal_regime="Model Tenancy Act, 2021 / State Rent Control Act (jurisdiction-dependent)",
                notes=None,
            )

        # ── Criminal matters (direct) ─────────────────────────────────────────────
        if domain == "criminal" or (issue and "criminal" in str(issue).lower()):
            if incident_date and incident_date < _BNS_CUTOFF:
                return TemporalResult(
                    incident_date=incident_date_str,
                    legal_regime="Indian Penal Code, 1860 (IPC) / Code of Criminal Procedure, 1973 (CrPC)",
                    notes=(
                        "Incident is before July 1, 2024 — IPC and CrPC apply for substantive "
                        "charges. However, if proceedings are ongoing, BNSS applies for procedure "
                        "(savings provisions in BNSS Section 531). "
                        "Do NOT cite BNS sections for this incident."
                    ),
                )
            return TemporalResult(
                incident_date=incident_date_str,
                legal_regime="Bharatiya Nyaya Sanhita, 2023 (BNS) / Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
                notes=(
                    "Incident is on or after July 1, 2024 — BNS applies for substantive offences "
                    "and BNSS applies for procedure. The IPC was repealed and does not apply to "
                    "new incidents after this date."
                ),
            )
    except Exception as e:
        logger.error("Unexpected error in resolve_temporal: %s", e)

    # Default for unknown domains or errors
    return TemporalResult(
        incident_date=incident_date_str,
        legal_regime=None,
        notes=(
            "Legal regime cannot be determined for this domain. "
            "Please consult a qualified lawyer for the applicable law."
        ),
    )
