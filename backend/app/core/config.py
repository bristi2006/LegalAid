"""
backend/app/core/config.py

Centralised configuration for LegalAid backend.
Replaces scattered os.environ.get() calls with a single validated Settings object.
Startup will raise immediately if a required key is missing.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Gemini ────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    # ── Input guards ──────────────────────────────────────────────────────
    MAX_INPUT_CHARS: int = 5_000
    MAX_FACTS_ITEMS: int = 50

    # ── Application metadata ──────────────────────────────────────────────
    APP_VERSION: str = "2.0.0"
    APP_TITLE: str = "LegalAId Analysis API — Enhanced"
    DISCLAIMER: str = (
        "This output is auto-generated for informational purposes only and does NOT "
        "constitute legal advice. Always consult a qualified advocate before taking "
        "legal action."
    )

    # ── Font path for PDF Unicode rendering ───────────────────────────────
    FONT_PATH: str = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..", "data", "NotoSansDevanagari-Regular.ttf"
        )
    )

    def validate(self) -> None:
        """Raise at startup if critical configuration is missing."""
        if not self.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Create a .env file with GEMINI_API_KEY=<your-key>."
            )

    def get_gemini_api_key(self) -> str:
        if not self.GEMINI_API_KEY:
            raise ValueError("Environment variable 'GEMINI_API_KEY' is not set.")
        return self.GEMINI_API_KEY


settings = Settings()
