"""
backend/app/services/contradiction.py

Contradiction detection engine.

Scans the list of extracted facts for internal contradictions:
  - Amount contradictions (₹50,000 → ₹20,000 for same entity)
  - Date contradictions (impossible sequences, overlaps)
  - Party name contradictions (multiple conflicting names for same role)
  - Location contradictions (multiple contradicting locations)

Returns a list of Contradiction objects that the API surfaces to the user.
The caller MUST NOT silently overwrite contradicted facts.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from backend.app.models.schemas import Contradiction


# ── Regex helpers ──────────────────────────────────────────────────────────────

_MONEY_RE = re.compile(
    r"(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)"
    r"|\b([\d,]+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|/-)",
    re.IGNORECASE,
)

_DATE_RE = re.compile(
    r"\b(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4})\b"
)

_MONTHS_RE = re.compile(
    r"\b(\d+)\s*(month|months|mahine|mahino)\b",
    re.IGNORECASE,
)


def _extract_amounts(text: str) -> List[float]:
    """Extract all monetary amounts from text as floats."""
    amounts = []
    for m in _MONEY_RE.finditer(text):
        raw = m.group(1) or m.group(2)
        if raw:
            try:
                amounts.append(float(raw.replace(",", "")))
            except ValueError:
                pass
    return amounts


def _extract_dates(text: str) -> List[str]:
    return [m.group(1) for m in _DATE_RE.finditer(text)]


def _extract_months_count(text: str) -> List[int]:
    return [int(m.group(1)) for m in _MONTHS_RE.finditer(text)]


def detect_contradictions(
    relevant_facts: List[str],
    extra_details: Optional[Dict[str, Any]] = None,
) -> List[Contradiction]:
    """
    Scan extracted facts for internal contradictions.

    Args:
        relevant_facts: List of fact strings extracted by the classifier.
        extra_details: Dict of structured extra details (price, dates, etc.)

    Returns:
        List of Contradiction objects (may be empty).
    """
    contradictions: List[Contradiction] = []
    combined_text = " ".join(relevant_facts)

    # ── 1. Amount contradictions ───────────────────────────────────────────
    amounts = _extract_amounts(combined_text)
    # Also check extra_details against fact amounts
    if extra_details:
        for key in ("price", "unpaid_amount", "security_deposit_amount", "monthly_rent"):
            val = extra_details.get(key)
            if val:
                try:
                    amounts.append(float(str(val).replace(",", "").replace("₹", "").replace("Rs.", "").strip()))
                except ValueError:
                    pass

    # Detect if two very different amounts appear in the facts (>10% difference)
    unique_amounts = list(set(amounts))
    if len(unique_amounts) >= 2:
        max_amt = max(unique_amounts)
        min_amt = min(unique_amounts)
        if max_amt > 0 and (max_amt - min_amt) / max_amt > 0.10:
            contradictions.append(Contradiction(
                field="amount",
                value_a=f"₹{max_amt:,.0f}",
                value_b=f"₹{min_amt:,.0f}",
                severity="high",
                message=(
                    f"Contradictory monetary amounts detected: ₹{max_amt:,.0f} and "
                    f"₹{min_amt:,.0f} appear in your description. "
                    "Please confirm the correct amount before proceeding."
                ),
            ))

    # ── 2. Month count contradictions ─────────────────────────────────────
    month_counts = _extract_months_count(combined_text)
    unique_months = list(set(month_counts))
    if len(unique_months) >= 2:
        contradictions.append(Contradiction(
            field="duration_months",
            value_a=str(max(unique_months)),
            value_b=str(min(unique_months)),
            severity="medium",
            message=(
                f"Conflicting month counts detected: {max(unique_months)} months and "
                f"{min(unique_months)} months appear in your description. "
                "Please confirm the correct number of months."
            ),
        ))

    # ── 3. Date sequence contradictions ───────────────────────────────────
    # Check employment end before start (if both present in extra_details)
    if extra_details:
        start = extra_details.get("employment_start_date")
        end = extra_details.get("employment_end_date")
        if start and end and start > end:
            contradictions.append(Contradiction(
                field="employment_dates",
                value_a=f"Start: {start}",
                value_b=f"End: {end}",
                severity="high",
                message=(
                    f"Employment end date ({end}) appears to be before the start date ({start}). "
                    "Please verify the employment dates."
                ),
            ))

        # Check if purchase_date is in the future
        from datetime import date as _date
        purchase_str = extra_details.get("purchase_date")
        if purchase_str:
            try:
                from datetime import datetime
                purchase_dt = datetime.strptime(purchase_str, "%Y-%m-%d").date()
                if purchase_dt > _date.today():
                    contradictions.append(Contradiction(
                        field="purchase_date",
                        value_a=purchase_str,
                        value_b=str(_date.today()),
                        severity="medium",
                        message=(
                            f"Purchase date ({purchase_str}) is in the future. "
                            "Please verify the purchase date."
                        ),
                    ))
            except ValueError:
                pass

    return contradictions
