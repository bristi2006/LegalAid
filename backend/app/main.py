from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from datetime import datetime
import os
from dotenv import load_dotenv

# Import our pipeline services, template renderer, verifier, PDF generator, and translator
from backend.app.services.classify import classify_user_input, ClassificationOutput
from backend.app.services.kb_lookup import lookup_kb
from backend.app.services.explain import explain_rights, ExplanationOutput
from backend.app.services.verify import verify_citations
from backend.app.services.pdf_gen import generate_pdf
from backend.app.services.translate import translate_notice_to_hindi
from backend.app.utils.template_renderer import render_document

from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(
    title="LegalAId Analysis API",
    description="Backend analysis pipeline for classifying, explaining, and drafting legal notices.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for /analyze
class AnalyzeRequest(BaseModel):
    user_input: str = Field(description="The raw legal grievance description provided by the user.")
    language: str = Field(default="English", description="Target language ('English' or 'Hindi').")

# Response schema for /analyze containing verification details for the frontend
class AnalyzeResponse(BaseModel):
    classification: ClassificationOutput = Field(description="LLM classification of the grievance.")
    explanation: ExplanationOutput = Field(description="LLM rights explanation.")
    verified_sections: List[Dict[str, Any]] = Field(description="Verified applicable legal sections cited in the explanation.")
    remedy: str = Field(description="The remedy/next steps fetched from the KB.")
    rendered_document: str = Field(description="The fully rendered text draft of the legal notice.")

# Request schema for /draft
class DraftRequest(BaseModel):
    template_id: str = Field(description="The template key from legal_kb.json, which determines the notice category.")
    date: str = Field(description="The date of the notice (usually YYYY-MM-DD).")
    sender: Dict[str, Any] = Field(description="Sender details (name, address, contact, etc.).")
    recipient: Dict[str, Any] = Field(description="Recipient details (name, address, contact, etc.).")
    relevant_facts: List[str] = Field(description="Factual timeline points.")
    issue_description: str = Field(description="Brief issue summary.")
    applicable_sections: List[Dict[str, Any]] = Field(description="List of verified legal sections.")
    remedy: str = Field(description="Requested remedy/demand.")
    extra_details: Dict[str, Any] = Field(default_factory=dict, description="Grievance-specific template parameters.")
    language: str = Field(default="English", description="Target language ('English' or 'Hindi').")

# Response schema for /draft
class DraftResponse(BaseModel):
    rendered_document: str = Field(description="The regenerated draft document notice text.")

# Request schema for /export-pdf
class ExportPdfRequest(BaseModel):
    text_content: str = Field(description="The final notice draft text to convert into PDF.")

@app.get("/health")
def health_check():
    """Simple API health probe."""
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_grievance(request: AnalyzeRequest):
    """
    Executes the full analysis pipeline:
    1. Classifies user input into domain and issue.
    2. Performs pythonic lookup on the local Knowledge Base.
    3. Explains rights using Gemini based strictly on the retrieved KB in the requested language.
    4. Verifies LLM citations using pure Python check, removing any fake sections.
    5. Renders the draft notice document using only verified sections.
    6. Translates notice text to Hindi dynamically if requested.
    """
    user_input = request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty.")

    # 1. Classification
    try:
        classification = classify_user_input(user_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification stage failed: {e}")

    # Check for unsupported issue
    if classification.domain == "unsupported" or classification.issue == "unsupported":
        raise HTTPException(
            status_code=400,
            detail="Currently unsupported issue: We could not confidently map your problem to a supported category in our Knowledge Base. LegalAId only supports consumer product defects, wage/salary claims, and tenant security deposit disputes."
        )

    # 2. KB Lookup
    kb_entry = lookup_kb(classification.domain, classification.issue)
    if not kb_entry:
        raise HTTPException(
            status_code=400, 
            detail="Currently unsupported issue: We could not confidently map your problem to a supported category in our Knowledge Base. LegalAId only supports consumer product defects, wage/salary claims, and tenant security deposit disputes."
        )

    # 3. LLM Explanation (in the user's selected language)
    try:
        explanation = explain_rights(
            user_details=classification.extracted_details.model_dump(exclude_none=True),
            kb_content=kb_entry,
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation stage failed: {e}")

    # 4. Pure Python Citation Verification
    verified_secs = verify_citations(explanation.cited_sections, kb_entry)

    # Translate remedy field to Hindi if requested
    remedy_text = kb_entry.get("remedy", "")
    if request.language.strip().lower() == "hindi":
        try:
            client = genai.Client()
            model_name = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
            resp = client.models.generate_content(
                model=model_name,
                contents=f"Translate this legal remedy/next steps into professional Hindi. You MUST keep the spelling of all Acts and sections (e.g. 'Consumer Protection Act, 2019', 'Section 35') in English: {remedy_text}",
                config=types.GenerateContentConfig(temperature=0.0)
            )
            remedy_text = resp.text.strip()
        except Exception as err:
            print(f"Warning: Failed to translate remedy: {err}")

    # 5. Render Draft Document Notice (passing only verified sections)
    try:
        # Extract sender, recipient, and facts from classification details
        extracted_details = classification.extracted_details
        sender = extracted_details.sender.model_dump(exclude_none=True) if extracted_details.sender else {}
        recipient = extracted_details.recipient.model_dump(exclude_none=True) if extracted_details.recipient else {}
        relevant_facts = extracted_details.relevant_facts or []

        # Filter out sender, recipient, and relevant_facts to construct extra_details
        extra_details = {}
        if extracted_details.extra_details:
            extra_details = extracted_details.extra_details.model_dump(exclude_none=True)

        # Format context for rendering
        context = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "sender": sender,
            "recipient": recipient,
            "relevant_facts": relevant_facts,
            "issue_description": kb_entry.get("description", ""),
            "applicable_sections": verified_secs, # Pass verified sections only
            "remedy": kb_entry.get("remedy", ""),
            "extra_details": extra_details
        }

        # Render document (always in English first to ensure templates evaluate properly)
        rendered_doc = render_document(classification.domain, context)
        
        # If target language is Hindi, translate the notice dynamically
        if request.language.strip().lower() == "hindi":
            rendered_doc = translate_notice_to_hindi(rendered_doc)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document drafting stage failed: {e}")

    return AnalyzeResponse(
        classification=classification,
        explanation=explanation,
        verified_sections=verified_secs,
        remedy=remedy_text,
        rendered_document=rendered_doc
    )

@app.post("/draft", response_model=DraftResponse)
def generate_notice_draft(request: DraftRequest):
    """
    Selects the correct Jinja2 template and drafts a notice document based on
    user-provided/edited input parameters, with dynamic Hindi translation support.
    """
    template_id = request.template_id.strip()
    
    # Map template_id to the domain/template type
    if template_id.startswith("consumer"):
        template_type = "consumer"
    elif template_id.startswith("labour"):
        template_type = "labour"
    elif template_id.startswith("tenant"):
        template_type = "tenant"
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid template_id '{template_id}'. Prefix must start with 'consumer', 'labour', or 'tenant'."
        )

    try:
        # Reconstruct rendering context
        context = {
            "date": request.date,
            "sender": request.sender,
            "recipient": request.recipient,
            "relevant_facts": request.relevant_facts,
            "issue_description": request.issue_description,
            "applicable_sections": request.applicable_sections,
            "remedy": request.remedy,
            "extra_details": request.extra_details
        }
        
        rendered_doc = render_document(template_type, context)
        
        # Translate to Hindi if requested
        if request.language.strip().lower() == "hindi":
            rendered_doc = translate_notice_to_hindi(rendered_doc)
            
        return DraftResponse(rendered_document=rendered_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drafting document failed: {e}")

@app.post("/export-pdf")
def export_notice_pdf(request: ExportPdfRequest):
    """
    Converts notice plain text content into a clean PDF document using ReportLab.
    Returns the binary PDF file stream for download.
    """
    text_content = request.text_content.strip()
    if not text_content:
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")

    try:
        pdf_bytes = generate_pdf(text_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=legal_notice.pdf",
                "Content-Length": str(len(pdf_bytes))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
