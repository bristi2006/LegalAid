import json
import os
import logging
from typing import Dict, Any, Optional, List

KB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "legal_kb.json")
)

logger = logging.getLogger("legalaid.kb_lookup")

def lookup_kb(domain: str, issue: str) -> Optional[Dict[str, Any]]:
    """
    Performs a standard pythonic dictionary lookup for a legal issue in the local KB.
    NO LLM should be used in this step.

    :param domain: The domain string (e.g. 'consumer', 'labour', 'tenant')
    :param issue: The issue key (e.g. 'defective_product', 'salary_not_paid')
    :return: The matching dictionary entry containing acts, sections, remedies, etc., or None.
    """
    try:
        if not os.path.exists(KB_PATH):
            logger.error("Knowledge Base file not found at: %s", KB_PATH)
            return None

        with open(KB_PATH, "r", encoding="utf-8") as f:
            kb = json.load(f)

        issues = kb.get("issues", [])
        for entry in issues:
            if entry.get("domain") == domain and entry.get("issue") == issue:
                return entry
    except json.JSONDecodeError as je:
        logger.error("JSON decoding failed for KB file '%s': %s", KB_PATH, je)
    except Exception as e:
        logger.error("Unexpected error looking up KB for domain=%s issue=%s: %s", domain, issue, e)

    return None


def lookup_state_labour_rule(state: str, issue: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves state-specific labour notifications or rules from the KB metadata.
    """
    try:
        if not state:
            return None

        if not os.path.exists(KB_PATH):
            logger.error("Knowledge Base file not found at: %s", KB_PATH)
            return None

        with open(KB_PATH, "r", encoding="utf-8") as f:
            kb = json.load(f)

        rules = kb.get("state_labour_rules", [])
        for rule in rules:
            if rule.get("state", "").lower().strip() == state.lower().strip() and rule.get("issue") == issue:
                return rule
    except json.JSONDecodeError as je:
        logger.error("JSON decoding failed for KB file '%s' when looking up state rule: %s", KB_PATH, je)
    except Exception as e:
        logger.error("Unexpected error looking up state labour rule for state=%s issue=%s: %s", state, issue, e)

    return None
