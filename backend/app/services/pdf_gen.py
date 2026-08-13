import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Preformatted

def generate_pdf(text_content: str) -> bytes:
    """
    Generates a professional PDF document from plain text notice content.
    Preserves all line breaks, indentation, and spaces exactly as edited.

    :param text_content: Plain text content of the notice/grievance document.
    :return: Bytes representing the generated PDF file.
    """
    # Create an in-memory bytes buffer
    buffer = io.BytesIO()

    # Set up document layout (standard margins)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,  # 0.75 in
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    # Get sample stylesheet and configure a clean font style
    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]
    
    # Create custom preformatted style to use Helvetica and preserve formatting
    preformatted_style = ParagraphStyle(
        "NoticePreformattedStyle",
        parent=normal_style,
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor="black"
    )

    # Build the story containing the preformatted notice block
    story = [Preformatted(text_content, preformatted_style)]

    # Render the document
    doc.build(story)

    # Get the value from the buffer and close it
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
