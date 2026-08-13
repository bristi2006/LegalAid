"""
backend/app/services/safety.py

Safety engine — detects high-risk, emergency, or violent situations BEFORE
routing to normal legal analysis.

High-risk cases still receive a legal response, but:
  - professional_review_recommended = True
  - relevant helplines are returned
  - routine notice generation is flagged as inappropriate for emergencies
"""
from __future__ import annotations

import re
from typing import List
from backend.app.models.schemas import SafetyAssessment

# ── Keyword maps ───────────────────────────────────────────────────────────────

_CRITICAL_PATTERNS = [
    # Physical violence / threats
    r"\b(beating|beat\s+me|hit\s+me|attack|assault|stab|knife|gun|pistol|shoot|kill\s+(me|us)|murder|threatened\s+to\s+kill|threaten|threatening)\b",
    # Domestic violence
    r"\b(domestic\s+violence|marital\s+violence|husband\s+(hit|beat|abus|harass|threaten)|wife\s+(hit|beat|abus)|dowry\s+(harassment|death)|498[- ]?[Aa]|abusing\s+me|abuse\s+me)\b",
    # Sexual violence
    r"(?:rape|sexual\s+assault|sexually\s+assaulted|molestation|outrage\s+of\s+modesty|sexually\s+harass|sexual\s+harass)",
    # Child safety
    r"\b(child\s+(abuse|trafficking|labour|marriage|pornography)|POCSO|minor\s+(abuse|assault)|child\s+is\s+being\s+abused|child\s+being\s+abused)\b",
    # Immediate arrest / custody
    r"\b(arrested|in\s+custody|police\s+(station|lock[- ]?up|custody)|FIR\s+filed|taken\s+by\s+police)\b",
    # Immediate danger
    r"\b(immediate\s+(danger|threat|risk)|life\s+(at\s+)?risk|help\s+me\s+now|emergency|SOS)\b",
]

_HIGH_PATTERNS = [
    # Forced eviction happening now
    r"\b(evicting\s+(me\s+)?now|eviction\s+(today|right\s+now|happening)|locked\s+(out|me\s+out)|changed\s+locks)\b",
    # Serious criminal accusations
    r"\b(false\s+(FIR|case|accusation|allegation)|framed\s+(me|by)|criminal\s+(charge|accusation))\b",
    # Large financial fraud
    r"\b(fraud|cheated|scam|ponzi|stolen\s+(money|funds)|₹\s*\d+\s*(lakh|crore|L|Cr))\b",
    # Workplace harassment (serious)
    r"\b(sexual\s+harassment\s+at\s+work|POSH|Internal\s+Complaints\s+Committee|workplace\s+assault)\b",
]

_COMPILED_CRITICAL = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _CRITICAL_PATTERNS]
_COMPILED_HIGH = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _HIGH_PATTERNS]

# ── National helplines ─────────────────────────────────────────────────────────

_HELPLINES = {
    "general_emergency": "Police: 112",
    "women_helpline": "Women Helpline (24x7): 181",
    "domestic_violence": "NCW Helpline: 7827170170",
    "child_helpline": "Childline: 1098",
    "cybercrime": "National Cyber Crime Helpline: 1930",
    "legal_aid": "National Legal Services Authority (NALSA): 15100",
    "consumer": "National Consumer Helpline: 1915",
}


def _collect_helplines(text_lower: str) -> List[str]:
    """Return relevant helplines based on the content of the complaint."""
    lines: List[str] = [_HELPLINES["legal_aid"]]

    if any(w in text_lower for w in ("domestic", "husband", "wife", "dowry", "498")):
        lines.append(_HELPLINES["domestic_violence"])
        lines.append(_HELPLINES["women_helpline"])
    if any(w in text_lower for w in ("child", "minor", "pocso")):
        lines.append(_HELPLINES["child_helpline"])
    if any(w in text_lower for w in ("police", "arrest", "fir", "custody", "kill", "murder")):
        lines.append(_HELPLINES["general_emergency"])
    if any(w in text_lower for w in ("cyber", "online fraud", "upi", "scam", "phishing")):
        lines.append(_HELPLINES["cybercrime"])
    if any(w in text_lower for w in ("consumer", "product", "refund", "ecommerce")):
        lines.append(_HELPLINES["consumer"])

    # Deduplicate while preserving order
    seen: set = set()
    result = []
    for item in lines:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def assess_safety(user_input: str) -> SafetyAssessment:
    """
    Analyse user input for high-risk or emergency indicators.

    Returns a SafetyAssessment that the caller (main.py) uses to:
      - Prepend emergency guidance to the response
      - Set professional_review_recommended = True
      - Surface helplines in the API response
    """
    text_lower = user_input.lower()

    # Check critical patterns first
    for pattern in _COMPILED_CRITICAL:
        if pattern.search(user_input):
            return SafetyAssessment(
                is_high_risk=True,
                risk_level="critical",
                safety_alert=(
                    "⚠️ Your situation may involve immediate danger, violence, or a serious criminal matter. "
                    "Please seek immediate help. The following helplines are available for you:"
                ),
                helplines=_collect_helplines(text_lower),
                professional_review_recommended=True,
            )

    # Check high-risk patterns
    for pattern in _COMPILED_HIGH:
        if pattern.search(user_input):
            return SafetyAssessment(
                is_high_risk=True,
                risk_level="high",
                safety_alert=(
                    "⚠️ This appears to be a high-risk legal situation. "
                    "We strongly recommend consulting a qualified lawyer immediately. "
                    "The following resources may help:"
                ),
                helplines=_collect_helplines(text_lower),
                professional_review_recommended=True,
            )

    return SafetyAssessment(
        is_high_risk=False,
        risk_level="low",
        professional_review_recommended=False,
    )
