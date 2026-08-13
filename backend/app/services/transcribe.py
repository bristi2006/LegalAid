"""
backend/app/services/transcribe.py

Audio Speech-to-Text Transcriber using Gemini Multimodal Audio API.
Converts raw audio bytes (webm, wav, mp3) into text.
"""
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

from backend.app.core.config import settings

load_dotenv()
logger = logging.getLogger("legalaid.transcribe")


async def transcribe_audio_input(
    audio_bytes: bytes,
    mime_type: str = "audio/webm",
    language: str = "English",
) -> str:
    """
    Transcribe audio bytes using Gemini Multimodal API.
    """
    if not audio_bytes:
        return ""

    api_key = settings.get_gemini_api_key()
    client = genai.Client(api_key=api_key)
    model_name = settings.GEMINI_MODEL

    # Standardize mime type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = "audio/webm"

    part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
    prompt = (
        f"Transcribe this legal grievance audio recording clearly into plain text in {language}.\n"
        "Return ONLY the verbatim transcript text. Do not add intro, explanations, or quotes."
    )

    try:
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=[part, prompt],
            config=types.GenerateContentConfig(temperature=0.0),
        )
        logger.info("Audio transcription completed successfully.")
        return (response.text or "").strip()
    except Exception as e:
        logger.error("Audio transcription failed: %s", e)
        raise e
