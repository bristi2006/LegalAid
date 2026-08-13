"""
backend/app/services/evidence.py

Evidence engine — returns a domain/issue-specific evidence checklist.

Rules:
  - Only list evidence that is genuinely relevant to the legal proceeding
  - Never claim evidence exists unless the user supplied it
  - Split into: must_have (critical) and nice_to_have (supporting)
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple

# Evidence map: domain → issue → (must_have, nice_to_have)
_EVIDENCE_MAP: Dict[str, Dict[str, Tuple[List[str], List[str]]]] = {
    "consumer": {
        "defective_product": (
            ["Original purchase invoice or bill", "Product photos/videos showing the defect",
             "Warranty card (if applicable)", "Written complaint emails or messages to seller"],
            ["Expert/mechanic assessment report", "Packaging and product labels", "Bank/UPI payment proof"]
        ),
        "product_not_delivered": (
            ["Order confirmation / payment receipt", "Screenshot of 'delivered' status vs non-receipt",
             "Written complaint to seller/platform"],
            ["Delivery tracking screenshot", "Courier/logistics communication"]
        ),
        "refund_not_given": (
            ["Return/cancellation confirmation from seller", "Payment proof for original purchase",
             "Written/email demand for refund with deadline"],
            ["Screenshot of seller's refund promise", "Bank statement showing no credit"]
        ),
        "service_deficiency": (
            ["Service agreement or contract", "Paid invoice for the service",
             "Written complaint to service provider/grievance officer"],
            ["Photographs or documentation of poor service outcome",
             "Insurance policy documents (for insurance disputes)",
             "Banking statements (for banking disputes)"]
        ),
        "overcharging": (
            ["Bill/receipt showing the amount charged", "MRP label on the product (if applicable)"],
            ["Price comparison evidence (other bills, screenshots)", "Photograph of menu/price list"]
        ),
        "false_or_misleading_advertising": (
            ["Screenshot or recording of the advertisement",
             "Invoice/purchase proof showing you were induced to buy"],
            ["Expert opinion on the product's actual vs. claimed properties",
             "Comparison of advertisement claims vs. reality"]
        ),
        "unfair_contract_terms": (
            ["Copy of the contract/agreement highlighting the unfair clause"],
            ["Legal opinion or consumer forum precedent on similar unfair terms"]
        ),
        "product_caused_injury_or_damage": (
            ["Medical records/bills (for injury)", "Photographs of injury or property damage",
             "The defective product itself (preserve if possible)",
             "Purchase invoice showing product origin"],
            ["Expert assessment of defect causation", "Repair bills for property damage"]
        ),
        "ecommerce_consumer_issue": (
            ["Order ID and payment confirmation", "Screenshot of seller's profile on platform",
             "Written complaint to platform's grievance officer"],
            ["Return shipment tracking (if applicable)", "Chat/email records with seller"]
        ),
    },
    "labour": {
        "salary_not_paid": (
            ["Appointment letter / offer letter", "Salary slips for last 6 months",
             "Bank statement showing last credited salary",
             "Written demand for salary (email/WhatsApp message to employer)"],
            ["Employment ID card", "Performance appraisal / increment letter",
             "ESI/PF deduction records"]
        ),
        "salary_paid_late": (
            ["Salary slips showing credited date vs. due date",
             "Bank statements showing actual credit dates"],
            ["Written complaint to HR about delays"]
        ),
        "illegal_wage_deduction": (
            ["Salary slip showing deduction",
             "Written communication asking employer to explain the deduction"],
            ["Employment contract specifying allowable deductions"]
        ),
        "minimum_wage_violation": (
            ["Salary slips or wage records",
             "State minimum wage notification for your category (check government website)"],
            ["Employment contract", "Timesheets / attendance records"]
        ),
        "overtime_not_paid": (
            ["Attendance records / timesheets showing extra hours",
             "Written communication about overtime worked"],
            ["WhatsApp messages instructing you to stay late",
             "Salary slips (to compare regular vs actual pay)"]
        ),
        "bonus_not_paid": (
            ["Salary slips showing eligibility (wage amount)",
             "Appointment letter confirming employment period"],
            ["Company's previous bonus letters or emails"]
        ),
        "wrongful_termination_or_retrenchment": (
            ["Appointment/offer letter", "Termination letter (if any) — or document its absence",
             "Proof of notice period served",
             "Last salary slip and full-and-final settlement demand"],
            ["Performance appraisals (to counter misconduct claims)",
             "HR correspondence", "PF/ESI records confirming tenure"]
        ),
        "workplace_grievance": (
            ["Written complaint submitted to HR / Grievance Redressal Committee",
             "Dates and descriptions of incidents (chronological log)"],
            ["Witness names (if comfortable)", "Email/message evidence of the grievance"]
        ),
        "employment_terms_or_working_conditions": (
            ["Written request to employer for appointment letter (if not issued)",
             "Any written job offer or informal communication confirming terms"],
            ["Salary payment records", "ESI/PF records"]
        ),
    },
    "tenant": {
        "security_deposit_not_returned": (
            ["Rent agreement or lease deed",
             "Deposit payment proof (bank transfer / UPI / receipt)",
             "Key handover acknowledgement or vacating photos",
             "Written demand sent to landlord for deposit return"],
            ["WhatsApp/email correspondence with landlord",
             "Photographs of property condition at time of vacating",
             "Last rent receipt"]
        ),
        "illegal_eviction": (
            ["Rent agreement confirming tenancy",
             "Photographs / video of lock change or forced eviction",
             "Written notice to landlord demanding restoration of possession"],
            ["Witness statements", "Police complaint copy (if filed)",
             "Messages from landlord threatening eviction"]
        ),
        "rent_increase_dispute": (
            ["Rent agreement specifying rent and revision terms",
             "Written notice of increase from landlord",
             "Rent receipts showing previous rent amount"],
            ["Communication objecting to the increase"]
        ),
        "landlord_refuses_repairs": (
            ["Photographs or video of the repair issue",
             "Written repair request to landlord with deadline"],
            ["Repair estimate from contractor", "Municipal complaint (if structural hazard)"]
        ),
        "essential_services_withheld": (
            ["Photographs/video of cut-off (disconnected meter, dry taps)",
             "Written complaint to landlord demanding restoration",
             "Dates of the cut-off"],
            ["Electricity/water bill (to establish normal supply history)",
             "Witness from neighbours"]
        ),
        "rent_receipt_not_provided": (
            ["Bank/UPI transaction records proving rent payment",
             "Written request to landlord for receipts"],
            ["Rent agreement specifying rent amount"]
        ),
        "landlord_or_tenant_breach": (
            ["Rent agreement with the specific clause being breached",
             "Written notice citing breach and requesting remedy"],
            ["Supporting evidence of breach (photos, financial records)"]
        ),
        "unauthorized_entry_by_landlord": (
            ["Log of unauthorised entry dates and times",
             "Written notice to landlord about the violation"],
            ["Witness names", "CCTV footage (if available)"]
        ),
        "tenancy_agreement_dispute": (
            ["Any written or informal agreement (screenshots, messages)",
             "Rent payment records as proof of tenancy"],
            ["Witnesses to verbal agreement terms"]
        ),
    },
}

# Domain-level fallback (if issue not in map)
_DOMAIN_FALLBACK: Dict[str, Tuple[List[str], List[str]]] = {
    "consumer": (
        ["Purchase invoice or payment receipt", "Written complaint to seller",
         "Evidence of defect, non-delivery, or poor service"],
        ["Warranty documents", "Bank statement"],
    ),
    "labour": (
        ["Appointment/offer letter", "Salary slips", "Written demand letter to employer"],
        ["Bank statements", "Employment ID card"],
    ),
    "tenant": (
        ["Rent agreement", "Deposit receipt or payment proof", "Written notice to landlord"],
        ["Photographs", "WhatsApp/email correspondence"],
    ),
}


def get_evidence_requirements(
    domain: str,
    issue: Optional[str],
) -> Dict[str, List[str]]:
    """
    Return domain/issue-specific evidence requirements.

    Returns:
        {"must_have": [...], "nice_to_have": [...]}
    """
    domain_map = _EVIDENCE_MAP.get(domain, {})

    if issue and issue in domain_map:
        must_have, nice_to_have = domain_map[issue]
    elif domain in _DOMAIN_FALLBACK:
        must_have, nice_to_have = _DOMAIN_FALLBACK[domain]
    else:
        must_have = ["Written complaint with dates and amounts", "Payment proof if applicable"]
        nice_to_have = ["Any correspondence with the opposing party"]

    return {
        "must_have": must_have,
        "nice_to_have": nice_to_have,
        "all": must_have + nice_to_have,
    }
