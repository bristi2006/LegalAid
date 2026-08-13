"""
backend/app/services/pdf_gen.py  [FIXED v2.0 — CRITICAL BUG FIX]

CRITICAL FIX: Standard Helvetica font has NO Unicode/Devanagari support.
Hindi text previously rendered as blank boxes or caused layout crashes.

Fix:
  - Registers NotoSansDevanagari-Regular.ttf (Unicode, covers Devanagari + Latin)
  - Falls back gracefully to Helvetica if font file is missing
  - Switches from Preformatted (no wrapping) to Paragraph for proper text flow
  - Processes text line-by-line to preserve notice formatting
"""
from __future__ import annotations

import io
import os
import logging
import html

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger("legalaid.pdf")

# ── Font registration ──────────────────────────────────────────────────────────

_FONT_NAME = "Helvetica"  # fallback

def _register_unicode_font() -> str:
    """
    Register NotoSansDevanagari for Devanagari (Hindi) support.
    Returns the font name to use (NotoSansDevanagari or Helvetica fallback).
    """
    font_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "NotoSansDevanagari-Regular.ttf")
    )
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont("NotoSansDevanagari", font_path))
            logger.info("NotoSansDevanagari font registered for PDF Unicode support.")
            return "NotoSansDevanagari"
        except Exception as e:
            logger.warning("Failed to register NotoSansDevanagari: %s — using Helvetica fallback.", e)
    else:
        logger.warning(
            "NotoSansDevanagari-Regular.ttf not found at %s — "
            "Hindi PDF rendering will use Helvetica (Devanagari may appear as boxes). "
            "Run: python -c \"import urllib.request; urllib.request.urlretrieve("
            "'https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/"
            "NotoSansDevanagari-Regular.ttf', 'backend/app/data/NotoSansDevanagari-Regular.ttf')\"",
            font_path,
        )
    return "Helvetica"


_ACTIVE_FONT = _register_unicode_font()


def generate_pdf(text_content: str) -> bytes:
    """
    Generate a professional PDF notice from plain text content.

    Supports both English and Hindi (Devanagari) when the Noto font is present.
    Preserves all line breaks, spacing, and notice formatting.

    Args:
        text_content: The full plain-text content of the notice.

    Returns:
        PDF file as bytes.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    # Main body paragraph style — Unicode-safe
    body_style = ParagraphStyle(
        "LegalNoticeBody",
        parent=styles["Normal"],
        fontName=_ACTIVE_FONT,
        fontSize=10,
        leading=15,
        spaceAfter=0,
    )

    # Separator line style (for ━━━ dividers)
    separator_style = ParagraphStyle(
        "Separator",
        parent=styles["Normal"],
        fontName=_ACTIVE_FONT,
        fontSize=8,
        leading=10,
        textColor="grey",
    )

    story = []
    lines = text_content.split("\n")

    for line in lines:
        raw = line.rstrip()

        if not raw:
            # Blank line → small vertical space
            story.append(Spacer(1, 4))
            continue

        # Escape HTML special chars so ReportLab doesn't misinterpret them
        escaped = html.escape(raw)

        if set(raw.strip()) <= {"━", "=", "-", "_", "─"}:
            # Decorative separator line
            story.append(Paragraph(escaped, separator_style))
        else:
            story.append(Paragraph(escaped, body_style))

    try:
        doc.build(story)
    except Exception as e:
        logger.error("PDF build failed: %s", e)
        raise RuntimeError(f"PDF generation failed: {e}") from e

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
