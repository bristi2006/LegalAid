"""
backend/app/core/security.py

Input sanitization, prompt-injection detection, and PII log masking.
All user input must pass through `sanitize_input()` before touching LLM calls.
"""
import re
import logging
from typing import Optional

logger = logging.getLogger("legalaid.security")

# ── Prompt-injection detection patterns ───────────────────────────────────────
_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"you\s+are\s+now\s+a?\s*(lawyer|judge|bot|assistant|gpt|ai)",
    r"reveal\s+(your\s+)?(system\s+)?prompt",
    r"forget\s+your\s+(instructions|rules|guidelines)",
    r"do\s+not\s+verify\s+(the\s+)?(law|section|act)",
    r"make\s+up\s+(a\s+)?section",
    r"always\s+say\s+section",
    r"bypass\s+(safety|rules|guidelines|filters)",
    r"pretend\s+(you\s+are|to\s+be)",
    r"act\s+as\s+(if\s+you\s+(are|were)\s+)?a?\s*(lawyer|gpt|jailbreak)",
    r"disregard\s+(all\s+)?(prior|previous|earlier)\s+instructions",
    r"jailbreak",
    r"DAN\s+mode",
    r"developer\s+mode",
    r"no\s+restrictions",
    r"output\s+(your\s+)?(system|hidden)\s+prompt",
]
_INJECTION_RE = re.compile(
    "|".join(_INJECTION_PATTERNS),
    re.IGNORECASE | re.DOTALL,
)

# ── PII masking patterns (for log output only) ────────────────────────────────
_PHONE_RE = re.compile(r"(\+91[-\s]?)?[6-9]\d{9}")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_AADHAAR_RE = re.compile(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b")


def sanitize_input(text: str, max_chars: int = 5_000) -> tuple[str, Optional[str]]:
    """
    Clean and validate raw user input.

    Returns:
        (cleaned_text, error_message | None)
        If error_message is not None the input should be rejected.
    """
    try:
        if not isinstance(text, str):
            return "", "Invalid input type. Expected a string."
        if not text or not text.strip():
            return "", "Input cannot be empty."

        # Strip null bytes and non-printable control chars (keep newlines/tabs)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
        cleaned = cleaned.strip()

        if len(cleaned) > max_chars:
            return "", (
                f"Input exceeds the maximum allowed length of {max_chars} characters. "
                "Please shorten your description."
            )

        return cleaned, None
    except Exception as e:
        logger.error("Error sanitizing input: %s", e)
        return "", f"Error processing input: {e}"


def detect_prompt_injection(text: str) -> bool:
    """
    Returns True if the text contains known prompt-injection patterns.
    The caller should warn the user but still attempt classification
    (the LLM itself is instructed to treat all input as untrusted data).
    """
    try:
        if not isinstance(text, str):
            return False
        return bool(_INJECTION_RE.search(text))
    except Exception as e:
        logger.error("Error detecting prompt injection: %s", e)
        return False


def mask_pii_for_logging(text: str) -> str:
    """
    Replace PII (phones, emails, Aadhaar numbers) in strings before they are logged.
    Call this whenever writing user-provided text to log files.
    """
    try:
        if not isinstance(text, str):
            return str(text)
        text = _PHONE_RE.sub("[PHONE]", text)
        text = _EMAIL_RE.sub("[EMAIL]", text)
        text = _AADHAAR_RE.sub("[AADHAAR]", text)
        return text
    except Exception as e:
        logger.error("Error masking PII for logging: %s", e)
        return str(text)


def safe_log(message: str) -> str:
    """Return a log-safe version of a message (PII masked)."""
    return mask_pii_for_logging(message)
