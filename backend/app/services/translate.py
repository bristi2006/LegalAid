from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()

def translate_notice_to_hindi(notice_text: str) -> str:
    """
    Translates a notice document text from English to Hindi using the Gemini API.
    Strictly preserves spacing, dates, and spelling of legal acts and sections.

    :param notice_text: Raw English text notice document.
    :return: Translated notice document in Hindi.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Environment variable 'GEMINI_API_KEY' is not set.")

    client = genai.Client(api_key=api_key)
    model_name = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

    system_instruction = (
        "You are an expert bilingual legal translator translating documents from English to Hindi.\n"
        "Your task is to translate the provided legal notice/grievance document into natural, professional Hindi.\n\n"
        "### STRICT TRANSLATION RULES:\n"
        "1. DO NOT translate any legal Act names or section numbers. They must remain exactly in English. "
        "For example, 'Consumer Protection Act, 2019', 'Section 35', 'Code on Wages, 2019', and 'Model Tenancy Act, 2021' "
        "must be written in English. Do not write them in Devanagari script (e.g., do not write 'कंज्यूमर प्रोटेक्शन एक्ट').\n"
        "2. Keep personal names, company names, physical addresses, dates, and email/contact details exactly in English/their original text.\n"
        "3. Preserve the exact visual formatting, spacing, signatures, and paragraph breaks of the original text notice.\n"
        "4. Translate only the explanatory prose, facts description, and demands into Hindi."
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=notice_text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0,
            ),
        )
        return response.text
    except Exception as e:
        raise RuntimeError(f"Translation to Hindi failed: {e}") from e
