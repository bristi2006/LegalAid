"""
backend/app/services/translate.py  [IMPROVED v2.0]

Improvements:
  1. API key from centralised config.settings
  2. Retry logic: retries up to 3 times on transient API failure
  3. Returns original text (no raise) after all retries exhausted
     so a Hindi translation failure does NOT crash the whole pipeline
"""
import asyncio
from google import genai
from google.genai import types
import logging
import time
from dotenv import load_dotenv

from backend.app.core.config import settings

load_dotenv()
logger = logging.getLogger("legalaid.translate")


async def translate_notice_to_hindi(
    notice_text: str,
    max_retries: int = 3,
    retry_delay_seconds: float = 1.0,
) -> str:
    """
    Translate a legal notice from English to Hindi using the Gemini API.

    Rules enforced in the system prompt:
      - Act names, section numbers, personal names, addresses remain in English
      - Only explanatory prose is translated
      - Formatting is preserved exactly

    On failure (all retries exhausted): returns the original English text
    with a warning log rather than raising (allows caller pipeline to continue).

    Args:
        notice_text: Full English notice text.
        max_retries: Number of attempts before giving up.
        retry_delay_seconds: Seconds to wait between retries.

    Returns:
        Translated Hindi text, or original English text on failure.
    """
    api_key = settings.get_gemini_api_key()
    client = genai.Client(api_key=api_key)
    model_name = settings.GEMINI_MODEL

    system_instruction = (
        "You are an expert bilingual legal translator translating documents from English to Hindi.\n"
        "Your task is to translate the provided legal notice/grievance document into natural, professional Hindi.\n\n"
        "### STRICT TRANSLATION RULES:\n"
        "1. DO NOT translate any legal Act names or section numbers. They must remain exactly in English. "
        "For example, 'Consumer Protection Act, 2019', 'Section 35', 'Code on Wages, 2019', and 'Model Tenancy Act, 2021' "
        "must be written in English. Do not write them in Devanagari script.\n"
        "2. Keep personal names, company names, physical addresses, dates, and email/contact details exactly in English/their original text.\n"
        "3. Preserve the exact visual formatting, spacing, signatures, and paragraph breaks of the original text notice.\n"
        "4. Translate only the explanatory prose, facts description, and demands into Hindi.\n"
        "5. Never translate the mandatory disclaimer or the words 'LEGAL NOTICE'. Keep them in English."
    )

    last_error: Exception = RuntimeError("Unknown error in translation")
    for attempt in range(1, max_retries + 1):
        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=notice_text,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0,
                ),
            )
            logger.info("Hindi translation successful on attempt %d.", attempt)
            return response.text
        except Exception as e:
            last_error = e
            logger.warning(
                "Hindi translation attempt %d/%d failed: %s",
                attempt, max_retries, str(e)
            )
            if attempt < max_retries:
                await asyncio.sleep(retry_delay_seconds)

    logger.error(
        "Hindi translation failed after %d attempts: %s. Returning original English text.",
        max_retries, str(last_error)
    )
    return notice_text  # Graceful fallback — do NOT crash the main pipeline
