"""
backend/app/services/explain.py  [ENHANCED v2.0]

Changes from v1:
  1. ExplanationOutput no longer contains a float 'confidence' field
     (replaced by categorical confidence from confidence.py).
     A dummy float field is kept for backward compatibility with the
     existing frontend which reads explanation.confidence — it now
     always returns 1.0 (it is superseded by confidence_level in
     the outer AnalyzeResponse).
  2. Structured output: rights_explanation now uses Fact→Law→Application format
  3. System prompt strengthened: LLM must ONLY cite sections from the provided
     KB content — never from memory or training data
  4. API key from centralised config
"""
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import json
import logging
from dotenv import load_dotenv

from backend.app.core.config import settings

load_dotenv()
logger = logging.getLogger("legalaid.explain")


class ExplanationOutput(BaseModel):
    rights_explanation: str = Field(
        description=(
            "Detailed professional explanation of the user's rights, structured as:\n"
            "WHAT HAPPENED: [brief fact summary]\n"
            "YOUR RIGHTS: [plain-language rights under the verified laws]\n"
            "APPLICABLE LAW: [only sections from the provided KB content]\n"
            "UNCERTAINTY: [what is unknown or requires verification]\n"
            "NEXT STEPS: [practical action steps for the user]\n"
            "Must be in the requested language."
        )
    )
    cited_sections: List[str] = Field(
        description=(
            "List of section identifiers explicitly cited in the explanation "
            "(e.g. ['Section 35', 'Section 17']). "
            "MUST ONLY contain sections present in the retrieved KB entry. "
            "Never cite any act or section not present in the provided KB content."
        )
    )
    confidence: float = Field(
        default=1.0,
        description=(
            "Deprecated float — kept for backward compatibility. "
            "The real confidence is assessed by confidence.py in the outer pipeline. "
            "Always returns 1.0."
        )
    )


async def explain_rights(
    user_details: Dict[str, Any],
    kb_content: Dict[str, Any],
    language: str,
) -> ExplanationOutput:
    """
    Generate a structured rights explanation strictly based on the KB entry.

    The LLM may ONLY cite sections that exist in kb_content['applicable_sections'].
    Any section not in the KB is filtered out by verify.py downstream.

    Args:
        user_details: Extracted user facts dict from the classifier.
        kb_content: The exact KB entry for the matched domain+issue.
        language: 'English' or 'Hindi'.

    Returns:
        ExplanationOutput with structured rights_explanation and cited_sections.
    """
    api_key = settings.get_gemini_api_key()
    client = genai.Client(api_key=api_key)
    model_name = settings.GEMINI_MODEL

    user_details_str = json.dumps(user_details, indent=2, ensure_ascii=False)
    kb_content_str = json.dumps(kb_content, indent=2, ensure_ascii=False)

    # Build a clean list of the ONLY sections the LLM may cite
    allowed_sections = [
        s.get("section", "") for s in kb_content.get("applicable_sections", [])
    ]
    allowed_sections_str = json.dumps(allowed_sections)

    system_instruction = (
        "You are an expert Indian legal rights advisor. "
        "Your ONLY task is to explain the user's rights based STRICTLY on the provided "
        "Knowledge Base (KB) content. You must write in the requested language.\n\n"

        "### ABSOLUTE CITATION RULE:\n"
        f"You may ONLY cite the following sections: {allowed_sections_str}\n"
        "These are the ONLY sections verified to exist in the authoritative KB for this issue. "
        "Do NOT cite any other act, section, sub-section, rule, or case law — not from memory, "
        "not from training data, not from inference. If you cannot find a relevant section "
        "in the provided list, say so explicitly rather than inventing one.\n\n"

        "### OUTPUT STRUCTURE:\n"
        "Structure the rights_explanation in this exact format:\n"
        "WHAT HAPPENED: [1-2 sentence summary of the user's situation]\n\n"
        "YOUR RIGHTS: [Plain-language explanation of rights — avoid legal jargon]\n\n"
        "APPLICABLE LAW: [Only cite sections from the KB. Explain what each section means "
        "in simple language and why it applies to the user's specific facts.]\n\n"
        "UNCERTAINTY: [State clearly what is unknown, unverified, or requires professional "
        "review. If the user's facts are incomplete, state what is missing.]\n\n"
        "NEXT STEPS: [Practical, actionable steps the user can take immediately]\n\n"

        "### LANGUAGE RULES:\n"
        "- Write the explanation in the requested language.\n"
        "- ALWAYS keep Act names, section numbers, and legal terms in English "
        "  (even in Hindi responses).\n"
        "- Use simple, accessible language — the user is a non-lawyer.\n\n"

        "### FABRICATION RULE:\n"
        "NEVER invent: section numbers, Act names, deadlines, court names, penalty amounts, "
        "case citations, government portals, or procedures not in the KB. "
        "If you do not know something, say you do not know."
    )

    prompt = (
        f"### USER FACTS:\n{user_details_str}\n\n"
        f"### RETRIEVED KB CONTENT (authoritative source — cite only from this):\n{kb_content_str}\n\n"
        f"### REQUESTED LANGUAGE:\n{language}\n\n"
        "Explain the user's rights using only the sections in the KB content above."
    )

    try:
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ExplanationOutput,
                temperature=0.0,
            ),
        )
        result = ExplanationOutput.model_validate_json(response.text)
        # Force confidence to 1.0 (deprecated field — real confidence is from confidence.py)
        result.confidence = 1.0
        logger.info("Explanation generated: cited_sections=%s", result.cited_sections)
        return result
    except Exception as e:
        logger.error("LLM explanation failed: %s", str(e))
        raise RuntimeError(f"LLM Explanation failed: {e}") from e
