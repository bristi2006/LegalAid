"""
backend/app/services/intake.py

Missing-fact detection engine.

Defines mandatory and optional facts per domain+issue.
Returns clarifying questions when critical information is absent.

The engine uses a "minimum necessary questions" design:
  - Ask only what is MANDATORY for legal analysis
  - Do NOT interrogate the user unnecessarily
  - If a fact can be reasonably inferred, do not ask
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from backend.app.models.schemas import IntakeResult


# ─────────────────────────────────────────────────────────────────────────────
# Fact requirement definitions per domain / issue
# Each entry: (fact_key, question_text, mandatory: bool, infer_from_fields: list)
# ─────────────────────────────────────────────────────────────────────────────

_REQUIREMENTS: Dict[str, List[Tuple[str, str, bool, List[str]]]] = {
    # ── Consumer ────────────────────────────────────────────────────────────
    "consumer": [
        ("product_name", "What is the name or type of the product or service you purchased?", True, ["extra_details.product_name"]),
        ("purchase_amount", "How much did you pay for the product or service (in ₹)?", True, ["extra_details.price"]),
        ("purchase_date", "When did you purchase the product or service (approximate date is fine)?", True, ["extra_details.purchase_date"]),
        ("seller_name", "What is the name of the seller, company, or platform?", True, ["recipient.company_name", "recipient.name"]),
        ("complaint_raised", "Have you already raised a complaint with the seller? (Yes/No)", False, []),
    ],
    "consumer_defective_product": [
        ("defect_description", "Briefly describe what defect or fault the product has.", False, []),
        ("invoice_number", "Do you have an invoice or order number? (Optional — helps in the notice)", False, ["extra_details.invoice_number"]),
    ],
    "consumer_refund_not_given": [
        ("refund_deadline", "What deadline did the seller promise for the refund? (Approximate date)", False, []),
    ],
    "consumer_service_deficiency": [
        ("service_type", "What type of service was provided (e.g. repair, banking, insurance, telecom)?", True, []),
    ],

    # ── Labour ──────────────────────────────────────────────────────────────
    "labour": [
        ("employer_name", "What is the name of your employer or company?", True, ["recipient.company_name", "recipient.name"]),
        ("salary_amount", "What is your monthly salary or wages (in ₹)?", True, ["extra_details.unpaid_amount"]),
        ("months_unpaid", "For how many months has your salary not been paid?", True, []),
        ("employment_status", "Are you currently employed there, or have you resigned / been terminated?", True, []),
    ],
    "labour_salary_not_paid": [
        ("last_paid_date", "When was your salary last paid (approximate month/year)?", False, []),
    ],
    "labour_wrongful_termination_or_retrenchment": [
        ("termination_date", "When were you terminated (approximate date)?", True, ["extra_details.employment_end_date"]),
        ("notice_received", "Did you receive any written termination notice? (Yes/No)", True, []),
        ("years_of_service", "How many years did you work with this employer?", False, []),
    ],
    "labour_minimum_wage_violation": [
        ("state", "Which state do you work in? (Minimum wages vary by state)", True, []),
        ("job_category", "What type of work do you do (e.g. factory worker, domestic worker, construction)?", True, []),
    ],

    # ── Tenant ──────────────────────────────────────────────────────────────
    "tenant": [
        ("state", "In which state is the rented property located? (Rent laws vary significantly by state)", True, []),
        ("written_agreement", "Do you have a written rent/lease agreement? (Yes/No)", True, []),
        ("deposit_amount", "What was the security deposit amount you paid (in ₹)?", True, ["extra_details.security_deposit_amount"]),
        ("monthly_rent", "What is/was your monthly rent (in ₹)?", True, ["extra_details.monthly_rent"]),
    ],
    "tenant_security_deposit_not_returned": [
        ("vacating_date", "When did you vacate the property and hand over the keys?", True, []),
        ("deduction_reason", "Has the landlord given any reason for not returning the deposit? (If yes, briefly describe)", False, []),
    ],
    "tenant_illegal_eviction": [
        ("eviction_date", "When did the illegal eviction occur or when is it threatened?", True, []),
        ("notice_received", "Did you receive any written eviction notice from the landlord?", True, []),
    ],
    "tenant_rent_increase_dispute": [
        ("previous_rent", "What was your previous monthly rent (in ₹)?", True, ["extra_details.monthly_rent"]),
        ("new_rent", "What is the new rent being demanded by the landlord (in ₹)?", True, []),
        ("increase_notice", "Were you given written notice of the rent increase? (Yes/No)", True, []),
    ],
}


def _get_known_value(extracted_details: Dict[str, Any], field_path: str) -> Optional[str]:
    """Traverse a dot-separated path like 'extra_details.price' in extracted_details."""
    parts = field_path.split(".")
    current: Any = extracted_details
    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return None
        if current is None:
            return None
    return str(current) if current else None


def check_missing_facts(
    domain: str,
    issue: Optional[str],
    extracted_details: Dict[str, Any],
) -> IntakeResult:
    """
    Check which mandatory facts are missing from the extracted details.

    Args:
        domain: Classified legal domain
        issue: Specific issue key
        extracted_details: The ExtractedDetails dict from the classifier

    Returns:
        IntakeResult with missing_facts and clarifying_questions
    """
    # Collect all applicable requirements
    requirements: List[Tuple[str, str, bool, List[str]]] = []
    requirements += _REQUIREMENTS.get(domain, [])
    if issue:
        requirements += _REQUIREMENTS.get(f"{domain}_{issue}", [])
        requirements += _REQUIREMENTS.get(issue, [])

    # Deduplicate by fact_key
    seen_keys: set = set()
    unique_requirements = []
    for req in requirements:
        if req[0] not in seen_keys:
            seen_keys.add(req[0])
            unique_requirements.append(req)

    missing_facts: List[str] = []
    clarifying_questions: List[str] = []
    known_facts: Dict[str, Any] = {}

    for fact_key, question, is_mandatory, infer_from in unique_requirements:
        # Check if the fact can be inferred from the extracted details
        value = None
        for field_path in infer_from:
            value = _get_known_value(extracted_details, field_path)
            if value:
                break

        if value:
            known_facts[fact_key] = value
        elif is_mandatory:
            missing_facts.append(fact_key)
            clarifying_questions.append(question)
        # Optional facts with no value: skip silently

    is_ready = len(missing_facts) == 0

    return IntakeResult(
        known_facts=known_facts,
        missing_facts=missing_facts,
        clarifying_questions=clarifying_questions,
        is_ready_for_analysis=is_ready,
    )
