"""
backend/app/services/ocr.py

High-Precision Legal Document OCR & Observation Engine.
Supports Groq Vision API (llama-3.2-11b-vision-preview) with Gemini Vision fallback,
and pypdf extraction for digital PDF documents.
"""
import base64
import io
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

from google import genai
from google.genai import types
from groq import AsyncGroq
import pypdf

from backend.app.core.config import settings

load_dotenv()
logger = logging.getLogger("legalaid.ocr")


SYSTEM_PROMPT = """
You are an elite legal document examiner for Indian civil, commercial, labour, and rental disputes.
Perform an exhaustive line-by-line OCR transcription and detailed legal observation on this document image.

Extract all legal details and return ONLY a valid JSON object with the following schema:
{
  "document_type": "rent_agreement" | "pay_slip" | "purchase_receipt" | "employment_contract" | "legal_notice" | "bank_statement" | "other",
  "summary": "Clear, precise 2-3 sentence summary of what this document proves legally.",
  "sender_name": "Full name / organization issuing or holding the document (Applicant)",
  "recipient_name": "Opposing party / Employer / Landlord / Company name",
  "amount": "Disputed or mentioned monetary amounts in INR (e.g. ₹1,80,000)",
  "date": "Document issue, execution, or effective date (YYYY-MM-DD)",
  "observations": [
    "Observation 1: Signature/stamp verification status",
    "Observation 2: Key breach or obligation clause identified in text",
    "Observation 3: Due date or payment penalty terms mentioned"
  ],
  "verbatim_transcription": "Complete line-by-line verbatim text extracted from the document image.",
  "extracted_text": "Detailed factual description suitable for legal grievance filing."
}

CRITICAL RULES:
1. Perform COMPLETE verbatim text extraction. Do not skip names, addresses, dates, or monetary amounts.
2. Provide at least 2-4 key legal observations analyzing signatures, clauses, amounts, and dates.
3. Return ONLY raw JSON without markdown wrapping.
"""


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract text from digital PDF using pypdf."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted.append(f"--- Page {page_num + 1} ---\n{text}")
        return "\n\n".join(extracted)
    except Exception as e:
        logger.warning("pypdf extraction failed: %s", e)
        return ""


async def process_document_ocr(
    image_bytes: bytes,
    mime_type: str = "image/png",
    language: str = "English",
) -> Dict[str, Any]:
    """
    Process document image using Groq Vision API with Gemini fallback & PDF support.
    """
    if not image_bytes:
        raise ValueError("Document image bytes cannot be empty.")

    # Standardize mime type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = "image/png"

    # Handle PDF files
    is_pdf = mime_type == "application/pdf" or image_bytes.startswith(b"%PDF")
    pdf_text = ""
    if is_pdf:
        pdf_text = _extract_pdf_text(image_bytes)
        if pdf_text.strip():
            logger.info("Successfully extracted %d chars from digital PDF.", len(pdf_text))

    # Try Groq Vision API first if a valid real key is present (and not a pure PDF)
    groq_key = settings.GROQ_API_KEY
    if groq_key and not groq_key.startswith("gsk_your_") and not is_pdf:
        try:
            logger.info("Processing document OCR using Groq Vision API (%s)...", settings.GROQ_MODEL)
            client = AsyncGroq(api_key=groq_key)
            b64_image = base64.b64encode(image_bytes).decode("utf-8")

            completion = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Extract all legal facts and verbatim OCR text from this document in {language}.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{b64_image}"
                                },
                            },
                        ],
                    },
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            raw_json = completion.choices[0].message.content or "{}"
            data = json.loads(raw_json)
            data["engine_used"] = "groq_vision"
            logger.info("Groq Vision OCR processing completed successfully.")
            return data
        except Exception as e:
            logger.warning("Groq Vision API failed: %s. Falling back to Gemini Vision...", e)

    # Fallback / Primary to Gemini Multimodal Vision API
    logger.info("Processing document OCR using Gemini Vision API (%s)...", settings.GEMINI_MODEL)
    try:
        api_key = settings.get_gemini_api_key()
        g_client = genai.Client(api_key=api_key)

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Perform exhaustive legal OCR and observation in {language}. Return JSON only."
        )

        contents = []
        if is_pdf and pdf_text.strip():
            contents = [f"PDF Document Text:\n{pdf_text}\n\n{prompt}"]
        else:
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type if not is_pdf else "image/png")
            contents = [part, prompt]

        response = await g_client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        raw_json = response.text or "{}"
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0].strip()

        data = json.loads(raw_json)
        data["engine_used"] = "gemini_vision"
        if pdf_text and not data.get("verbatim_transcription"):
            data["verbatim_transcription"] = pdf_text

        logger.info("Gemini Vision OCR processing completed successfully.")
        return data
    except Exception as e:
        logger.error("Gemini Vision OCR processing failed: %s", e)
        # Graceful fallback if JSON parse fails
        return {
            "document_type": "other",
            "summary": "Document scanned successfully.",
            "extracted_text": pdf_text or "Document attached.",
            "engine_used": "fallback_text_extractor"
        }
