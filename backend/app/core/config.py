"""
backend/app/core/config.py

Centralised configuration for LegalAid backend.
Replaces scattered os.environ.get() calls with a single validated Settings object.
Startup will raise immediately if a required key is missing.
"""
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Gemini ────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    # ── Groq Vision ───────────────────────────────────────────────────────
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.environ.get("GROQ_MODEL", "llama-3.2-11b-vision-preview")

    # ── CORS ──────────────────────────────────────────────────────────────
    # Set FRONTEND_URL in .env to restrict CORS to your real frontend origin.
    # Supports comma-separated values for multiple origins.
    # Example: FRONTEND_URL=https://legalaid.example.com
    # Leave blank to fall back to localhost dev origins.
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "")

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

    def get_cors_origins(self) -> List[str]:
        """
        Returns allowed CORS origins.
        - If FRONTEND_URL is set → use it (locked-down, for production).
        - Otherwise → allow common localhost ports (development).
        Supports comma-separated multiple origins in FRONTEND_URL.
        """
        if self.FRONTEND_URL:
            return [url.strip() for url in self.FRONTEND_URL.split(",") if url.strip()]
        # Development fallback — allow all common local dev ports
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
        ]

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
