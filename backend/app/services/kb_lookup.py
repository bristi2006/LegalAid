import json
import os
from typing import Dict, Any, Optional

KB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "legal_kb.json")
)

def lookup_kb(domain: str, issue: str) -> Optional[Dict[str, Any]]:
    """
    Performs a standard pythonic dictionary lookup for a legal issue in the local KB.
    NO LLM should be used in this step.

    :param domain: The domain string (e.g. 'consumer', 'labour', 'tenant')
    :param issue: The issue key (e.g. 'defective_product', 'salary_not_paid')
    :return: The matching dictionary entry containing acts, sections, remedies, etc., or None.
    """
    if not os.path.exists(KB_PATH):
        raise FileNotFoundError(f"Knowledge Base file not found at: {KB_PATH}")

    with open(KB_PATH, "r", encoding="utf-8") as f:
        kb = json.load(f)

    issues = kb.get("issues", [])
    for entry in issues:
        if entry.get("domain") == domain and entry.get("issue") == issue:
            return entry

    return None
