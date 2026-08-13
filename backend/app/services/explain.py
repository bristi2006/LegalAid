from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Define the Pydantic schema for structured output validation
class ExplanationOutput(BaseModel):
    rights_explanation: str = Field(
        description="Detailed, professional explanation of the user's rights, remedies, and the process forward. Must be written in the requested language."
    )
    cited_sections: List[str] = Field(
        description="A list of section names/numbers (e.g. 'Section 35', 'Section 17') explicitly cited in the explanation. Must ONLY contain sections present in the retrieved KB entry. Never cite any act or section not present in the retrieved KB entry."
    )
    confidence: float = Field(
        description="Confidence score (0.0 to 1.0) indicating how well the facts match the legal provisions."
    )

def explain_rights(
    user_details: Dict[str, Any],
    kb_content: Dict[str, Any],
    language: str
) -> ExplanationOutput:
    """
    Generates a legal explanation of the user's rights based strictly on the retrieved KB content
    in the requested language.

    :param user_details: Extracted user facts/details dictionary.
    :param kb_content: Retrieved KB entry.
    :param language: Requested language for explanation.
    :return: An instance of ExplanationOutput.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Environment variable 'GEMINI_API_KEY' is not set.")

    client = genai.Client(api_key=api_key)
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    # Serialize inputs to strings
    user_details_str = json_str = json.dumps(user_details, indent=2)
    kb_content_str = json.dumps(kb_content, indent=2)

    system_instruction = (
        "You are an expert legal advisor. Your task is to explain the user's rights and options based "
        "STRICTLY and ONLY on the provided Knowledge Base (KB) content. You must write the explanation "
        "in the requested language.\n\n"
        "### CRITICAL RULE:\n"
        "You are strictly forbidden from citing any laws, acts, or sections that are not present in "
        "the provided retrieved KB content. Do not invent section numbers or default to standard laws unless "
        "they are explicitly in the provided KB content."
    )

    prompt = (
        f"### USER DETAILS AND FACTS:\n{user_details_str}\n\n"
        f"### RETRIEVED KB CONTENT:\n{kb_content_str}\n\n"
        f"### REQUESTED LANGUAGE:\n{language}\n\n"
        "Generate a structured explanation of the user's rights, detailing only sections listed in the KB content."
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ExplanationOutput,
                temperature=0.0,
            ),
        )
        return ExplanationOutput.model_validate_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM Explanation failed: {e}") from e
