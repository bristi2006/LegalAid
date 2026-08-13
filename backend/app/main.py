"""
backend/app/main.py  [ENHANCED v3.0 — PRODUCTION HARDENED]

LegalAid API — Stateful Case & Hardened Audit Log Infrastructure

Endpoints:
  POST /case/start         — Initialises case, checks safety & classification
  POST /case/{id}/message  — Appends user message, updates facts statefully
  POST /case/{id}/facts    — Direct manual update of facts
  GET  /case/{id}          — Retrieves full stateful CaseResponse
  POST /case/{id}/analyze  — Runs 14-stage pipeline statefully
  GET  /case/{id}/laws     — Returns verified laws list
  GET  /case/{id}/evidence — Returns evidence checklist
  POST /case/{id}/document — Generates/returns the rendered notice document

  POST /analyze            — Stateless backward-compatible pipeline
  POST /analyze/intake     — Stateless pre-flight check
  POST /draft              — Notice regenerator
  POST /export-pdf         — PDF generator
"""
from __future__ import annotations

import logging
import os
import uuid
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# ── Internal imports ──────────────────────────────────────────────────────────
from backend.app.core.config import settings
from backend.app.core.security import sanitize_input, detect_prompt_injection, safe_log

from backend.app.services.classify import classify_user_input, ClassificationOutput
from backend.app.services.kb_lookup import lookup_kb, lookup_state_labour_rule
from backend.app.services.explain import explain_rights, ExplanationOutput
from backend.app.services.verify import verify_citations
from backend.app.services.pdf_gen import generate_pdf
from backend.app.services.translate import translate_notice_to_hindi
from backend.app.utils.template_renderer import render_document

# New v2/v3 engines
from backend.app.services.safety import assess_safety
from backend.app.services.jurisdiction import resolve_jurisdiction
from backend.app.services.temporal import resolve_temporal
from backend.app.services.intake import check_missing_facts
from backend.app.services.contradiction import detect_contradictions
from backend.app.services.evidence import get_evidence_requirements
from backend.app.services.confidence import assess_confidence

# Database operations
from backend.app.core.database import (
    init_db,
    create_case,
    get_case,
    update_case,
    add_message,
    get_messages,
    add_audit_log,
)

# Pydantic schemas
from backend.app.models.schemas import (
    AnalyzeRequest,
    IntakeCheckRequest,
    IntakeCheckResponse,
    MessageRequest,
    FactsUpdateRequest,
    DraftRequest,
    DraftResponse,
    ExportPdfRequest,
    CaseResponse,
    StructuredErrorResponse,
    ErrorDetail,
)

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("legalaid.main")


# ── Structured Error Exception ────────────────────────────────────────────────

class LegalAidException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, recoverable: bool = True):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.recoverable = recoverable


# ─────────────────────────────────────────────────────────────────────────────
# App initialisation
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_TITLE,
    description=(
        "LegalAId — AI Legal Rights Assistant for First-Generation Litigants. "
        "Powered by a verified Indian legal knowledge base, not a raw LLM."
    ),
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)


@app.on_event("startup")
def startup_event():
    """Initialise SQLite database tables on startup."""
    init_db()
    logger.info("SQLite database tables initialised.")


# ── Custom Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(LegalAidException)
async def legalaid_exception_handler(request: Request, exc: LegalAidException) -> JSONResponse:
    logger.warning("LegalAid error occurred: code=%s message=%s", exc.code, exc.message)
    # Log security/validation failures statefully
    add_audit_log(None, f"ERROR_{exc.code}", "medium" if exc.status_code == 400 else "high", exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "recoverable": exc.recoverable
            }
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception on %s: %s", request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred. Please try again.",
                "recoverable": False
            }
        },
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _guard_input(user_input: str) -> str:
    """Sanitize and size-check user input. Raise error code on failure."""
    cleaned, err = sanitize_input(user_input, max_chars=settings.MAX_INPUT_CHARS)
    if err:
        raise LegalAidException("INVALID_INPUT", err, status_code=400)
    if detect_prompt_injection(cleaned):
        logger.warning("Prompt injection pattern detected in request.")
        add_audit_log(None, "PROMPT_INJECTION_DETECTED", "high", cleaned[:100])
    return cleaned


async def _translate_if_hindi(text: str, language: str) -> str:
    """Translate text to Hindi if requested. Returns original on failure."""
    if language.strip().lower() != "hindi":
        return text
    try:
        return await translate_notice_to_hindi(text)
    except Exception as err:
        logger.warning("Hindi translation failed: %s — returning English text.", err)
        add_audit_log(None, "LLM_FAILURE", "medium", f"Hindi translation failed: {err}")
        return text


async def _run_classification_llm(user_input: str) -> ClassificationOutput:
    """Runs input classification, catching LLM and validation failures."""
    try:
        return await classify_user_input(user_input)
    except Exception as e:
        logger.error("LLM classification failed: %s", e)
        add_audit_log(None, "LLM_FAILURE", "high", f"LLM classification failure: {e}")
        # Try parsing issues or JSON malform
        if "validation" in str(e).lower() or "json" in str(e).lower():
            add_audit_log(None, "LLM_INVALID_OUTPUT", "high", "Failed to parse JSON schema output")
        raise LegalAidException("LLM_FAILURE", "The AI model failed to classify your grievance. Please try again.")


async def _run_explanation_llm(user_details: dict, kb_entry: dict, language: str) -> ExplanationOutput:
    """Runs explanation generation, catching LLM and validation failures."""
    try:
        return await explain_rights(user_details, kb_entry, language)
    except Exception as e:
        logger.error("LLM explanation failed: %s", e)
        add_audit_log(None, "LLM_FAILURE", "high", f"LLM explanation failure: {e}")
        if "validation" in str(e).lower() or "json" in str(e).lower():
            add_audit_log(None, "LLM_INVALID_OUTPUT", "high", "Failed to parse JSON schema output")
        raise LegalAidException("LLM_FAILURE", "The AI model failed to generate legal rights explanation.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /case/start  [NEW — Stateful Intake]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case/start", response_model=CaseResponse)
async def start_case(request: IntakeCheckRequest):
    """
    Statefully start a case. Validates input, checks safety, runs classification,
    and returns initial intake checks.
    """
    user_input = _guard_input(request.user_input)
    case_id = str(uuid.uuid4())

    # Create record in DB
    create_case(case_id, request.language, status="intake")
    add_message(case_id, "user", user_input)

    # 1. Safety check
    safety = assess_safety(user_input)
    if safety.is_high_risk:
        add_audit_log(case_id, "HIGH_RISK_CASE", "high" if safety.risk_level == "critical" else "medium", safety.risk_level)
        update_case(
            case_id,
            status="safety_priority",
            risk_level=safety.risk_level,
            safety_alert=safety.safety_alert,
            professional_review_recommended=True,
            helplines=safety.helplines,
        )
        return get_case(case_id)

    # 2. Classification
    classification = await _run_classification_llm(user_input)
    if classification.domain in ("unsupported",):
        add_audit_log(case_id, "LEGAL_SOURCE_NOT_FOUND", "low", f"Unsupported domain requested: {classification.domain}")
        raise LegalAidException(
            "UNSUPPORTED_DOMAIN",
            "This issue is outside our supported areas. We support consumer, tenant, and labour disputes.",
            status_code=400
        )

    # Extract initial details
    extracted = classification.extracted_details
    extra = extracted.extra_details.model_dump(exclude_none=True) if extracted.extra_details else {}
    all_facts = extracted.relevant_facts or []

    # Check missing facts
    intake_result = check_missing_facts(
        domain=classification.domain,
        issue=classification.issue,
        extracted_details={**extracted.model_dump(exclude_none=True), **extra},
    )

    # Detect contradictions
    contradictions = detect_contradictions(all_facts, extra)
    if contradictions:
        add_audit_log(case_id, "CONTRADICTION_DETECTED", "medium", [c.model_dump() for c in contradictions])

    # Resolve initial jurisdiction
    state = extra.get("state")
    city = extra.get("city")
    jurisdiction = resolve_jurisdiction(classification.domain, state, city=city, issue=classification.issue)

    # Update case state
    update_case(
        case_id,
        domain=classification.domain,
        issue=classification.issue,
        facts=all_facts,
        missing_facts=intake_result.missing_facts,
        clarifying_questions=intake_result.clarifying_questions,
        contradictions=[c.model_dump() for c in contradictions],
        risk_level=safety.risk_level,
        jurisdiction=jurisdiction.model_dump(),
    )

    return get_case(case_id)


# ─────────────────────────────────────────────────────────────────────────────
# POST /case/{id}/message  [NEW — Conversational Intake]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case/{id}/message", response_model=CaseResponse)
async def case_message(id: str, request: MessageRequest):
    """
    Appends a new message to the case history, updates facts using conversational transcript,
    and returns updated case status.
    """
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)

    user_message = _guard_input(request.content)
    add_message(id, "user", user_message)

    # Combine message history to re-classify and extract updated facts
    history = get_messages(id)
    transcript = "\n".join([f"{m['sender'].capitalize()}: {m['content']}" for m in history])

    # Re-run safety and classification on the full context
    safety = assess_safety(transcript)
    classification = await _run_classification_llm(transcript)

    extracted = classification.extracted_details
    extra = extracted.extra_details.model_dump(exclude_none=True) if extracted.extra_details else {}
    all_facts = extracted.relevant_facts or []

    # Check missing facts
    intake_result = check_missing_facts(
        domain=classification.domain,
        issue=classification.issue,
        extracted_details={**extracted.model_dump(exclude_none=True), **extra},
    )

    # Detect contradictions
    contradictions = detect_contradictions(all_facts, extra)
    if contradictions:
        add_audit_log(id, "CONTRADICTION_DETECTED", "medium", [c.model_dump() for c in contradictions])

    # Resolve jurisdiction
    state = extra.get("state")
    city = extra.get("city")
    jurisdiction = resolve_jurisdiction(classification.domain, state, city=city, issue=classification.issue)

    # Update case state
    update_case(
        id,
        status="safety_priority" if safety.is_high_risk else "intake",
        domain=classification.domain,
        issue=classification.issue,
        facts=all_facts,
        missing_facts=intake_result.missing_facts,
        clarifying_questions=intake_result.clarifying_questions,
        contradictions=[c.model_dump() for c in contradictions],
        risk_level=safety.risk_level,
        safety_alert=safety.safety_alert,
        helplines=safety.helplines,
        professional_review_recommended=safety.professional_review_recommended,
        jurisdiction=jurisdiction.model_dump(),
    )

    return get_case(id)


# ─────────────────────────────────────────────────────────────────────────────
# POST /case/{id}/facts  [NEW — Manual Facts Overrides]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case/{id}/facts", response_model=CaseResponse)
def update_case_facts(id: str, request: FactsUpdateRequest):
    """Overrides case facts and recalculates contradictions and missing parameters."""
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)

    # Validate each fact input
    cleaned_facts = [_guard_input(f) for f in request.facts]

    # Re-evaluate contradictions
    contradictions = detect_contradictions(cleaned_facts, request.extra_details)
    if contradictions:
        add_audit_log(id, "CONTRADICTION_DETECTED", "medium", [c.model_dump() for c in contradictions])

    # Re-evaluate missing facts
    intake_result = check_missing_facts(
        domain=case_db.get("domain"),
        issue=case_db.get("issue"),
        extracted_details={
            "relevant_facts": cleaned_facts,
            **request.extra_details
        },
    )

    # Resolve jurisdiction
    state = request.extra_details.get("state") or case_db["jurisdiction"].get("state")
    city = request.extra_details.get("city") or case_db["jurisdiction"].get("city")
    jurisdiction = resolve_jurisdiction(case_db.get("domain"), state, city=city, issue=case_db.get("issue"))

    update_case(
        id,
        facts=cleaned_facts,
        missing_facts=intake_result.missing_facts,
        clarifying_questions=intake_result.clarifying_questions,
        contradictions=[c.model_dump() for c in contradictions],
        jurisdiction=jurisdiction.model_dump(),
    )

    return get_case(id)


# ─────────────────────────────────────────────────────────────────────────────
# GET /case/{id}  [NEW — Get Current Case State]
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/case/{id}", response_model=CaseResponse)
def fetch_case(id: str):
    """Retrieve full stateful case response payload."""
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)
    return case_db


# ─────────────────────────────────────────────────────────────────────────────
# POST /case/{id}/analyze  [NEW — Stateful 14-Stage Execution]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case/{id}/analyze", response_model=CaseResponse)
async def analyze_case(id: str):
    """
    Statefully execute the 14-stage legal pipeline on a case.
    Stores and returns final analysis in CaseResponse format.
    """
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)

    domain = case_db.get("domain")
    issue = case_db.get("issue")
    language = case_db.get("language", "English")

    if not domain or domain == "unsupported" or not issue:
        raise LegalAidException(
            "UNSUPPORTED_DOMAIN",
            "This case has not been classified under a supported domain yet.",
            status_code=400
        )

    # Gather case parameters
    facts = case_db.get("facts", [])
    state = case_db["jurisdiction"].get("state")
    city = case_db["jurisdiction"].get("city")
    incident_date_str = None

    # Retrieve incident date from facts or message history
    history = get_messages(id)
    combined_text = " ".join(facts + [m["content"] for m in history])
    from backend.app.services.contradiction import _DATE_RE
    dates_found = _DATE_RE.findall(combined_text)
    if dates_found:
        incident_date_str = dates_found[0]

    # Resolve temporal and jurisdiction
    jurisdiction = resolve_jurisdiction(domain, state, city=city, issue=issue)
    temporal = resolve_temporal(domain, incident_date_str, issue=issue)

    # KB retrieval
    kb_entry = lookup_kb(domain, issue)
    if not kb_entry:
        raise LegalAidException("LEGAL_SOURCE_UNAVAILABLE", "No matching legal source found in Knowledge Base.")

    # Check if we have state-specific rule for labour
    if domain == "labour" and state:
        state_rule = lookup_state_labour_rule(state, issue)
        if state_rule:
            # Add state rules to kb_entry's applicable sections list
            kb_entry = dict(kb_entry)
            kb_entry["applicable_sections"] = kb_entry.get("applicable_sections", []) + state_rule.get("applicable_sections", [])

    # Intake checks
    intake = check_missing_facts(domain, issue, {"relevant_facts": facts, "state": state, "city": city})

    # Contradictions
    contradictions = detect_contradictions(facts, {"state": state, "city": city})

    # LLM Rights explanation
    user_details = {
        "relevant_facts": facts,
        "state": state,
        "city": city,
        "incident_date": incident_date_str
    }
    explanation = await _run_explanation_llm(user_details, kb_entry, language)

    # 6-Stage citation validation
    verified_secs = verify_citations(
        explanation.cited_sections,
        kb_entry,
        user_state=state,
        incident_date_str=incident_date_str,
        case_id=id
    )

    # Evidence and confidence resolutions
    evidence_info = get_evidence_requirements(domain, issue)
    confidence_level, confidence_reason = assess_confidence(
        verified_sections=verified_secs,
        missing_facts=case_db.get("missing_facts", []),
        contradictions=contradictions,
        is_high_risk=(case_db.get("risk_level") in ("high", "critical")),
        jurisdiction_status=jurisdiction.status,
        domain=domain,
    )

    # Notice rendering
    context = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "sender": {"name": "Applicant"},
        "recipient": {"company_name": "Opposing Party"},
        "relevant_facts": facts,
        "issue_description": kb_entry.get("description", ""),
        "applicable_sections": verified_secs,
        "remedy": kb_entry.get("remedy", ""),
    }
    rendered_doc = render_document(domain, context)
    if language.strip().lower() == "hindi":
        rendered_doc = await _translate_if_hindi(rendered_doc, language)

    # Next steps & rights summary
    remedy_text = await _translate_if_hindi(kb_entry.get("remedy", ""), language)
    next_steps = [remedy_text] if remedy_text else []
    rights_summary = [explanation.rights_explanation]

    # Map CaseResponse sources list
    sources = []
    for s in verified_secs:
        sources.append({
            "act_name": s.get("act"),
            "section": s.get("section"),
            "source_authority": s.get("source"),
            "source_url": s.get("source_url")
        })

    # Update state
    update_case(
        id,
        status="completed",
        case_summary=explanation.rights_explanation[:150] + "...",
        rights=rights_summary,
        applicable_laws=verified_secs,
        evidence_needed=evidence_info.get("must_have", []),
        evidence_nice_to_have=evidence_info.get("nice_to_have", []),
        confidence_level=confidence_level,
        confidence_reason=confidence_reason,
        rendered_document=rendered_doc,
        remedy=remedy_text,
        verified_sections=verified_secs,
        legal_regime=temporal.legal_regime,
        temporal_notes=temporal.notes,
        next_steps=next_steps,
    )

    return get_case(id)


# ─────────────────────────────────────────────────────────────────────────────
# GET /case/{id}/laws
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/case/{id}/laws")
def fetch_case_laws(id: str):
    """Returns verified applicable laws list for the case."""
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)
    return case_db.get("applicable_laws", [])


# ─────────────────────────────────────────────────────────────────────────────
# GET /case/{id}/evidence
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/case/{id}/evidence")
def fetch_case_evidence(id: str):
    """Returns required evidence checklist for the case."""
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)
    return {
        "must_have": case_db.get("evidence_needed", []),
        "nice_to_have": case_db.get("evidence_nice_to_have", [])
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /case/{id}/document
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/case/{id}/document")
def fetch_case_document(id: str):
    """Returns the rendered notice document text."""
    case_db = get_case(id)
    if not case_db:
        raise LegalAidException("INVALID_INPUT", f"Case '{id}' not found.", status_code=404)
    doc = case_db.get("rendered_document")
    if not doc:
        # Fallback render if not run analyze yet
        raise LegalAidException("INVALID_INPUT", "Notice has not been rendered yet. Run analyze first.", status_code=400)
    return {"rendered_document": doc}


# ─────────────────────────────────────────────────────────────────────────────
# POST /analyze  [Stateless Backward Compatibility]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/analyze")
async def analyze_grievance(request: AnalyzeRequest):
    user_input = _guard_input(request.user_input)
    language = request.language

    # Stage 1: Safety Check
    safety = assess_safety(user_input)
    if safety.is_high_risk and safety.risk_level == "critical":
        add_audit_log(None, "HIGH_RISK_CASE", "high", safety.risk_level)

    # Stage 2: Domain Classification
    classification = await _run_classification_llm(user_input)
    if classification.domain in ("unsupported",) or classification.issue in ("unsupported",):
        raise LegalAidException(
            "UNSUPPORTED_DOMAIN",
            "This issue falls outside our supported domains.",
            status_code=400
        )

    extracted_details = classification.extracted_details
    extra = extracted_details.extra_details.model_dump(exclude_none=True) if extracted_details.extra_details else {}
    state = extra.get("state")
    city = extra.get("city")
    incident_date_str = extra.get("incident_date")

    # Stage 3-5: Resolution
    jurisdiction = resolve_jurisdiction(classification.domain, state, city=city, issue=classification.issue)
    temporal = resolve_temporal(classification.domain, incident_date_str, issue=classification.issue)

    # KB Lookup
    kb_entry = lookup_kb(classification.domain, classification.issue)
    if not kb_entry:
        raise LegalAidException("LEGAL_SOURCE_UNAVAILABLE", "Matching issue was not found in legal KB.", status_code=400)

    # Add state rules if labour
    if classification.domain == "labour" and state:
        state_rule = lookup_state_labour_rule(state, classification.issue)
        if state_rule:
            kb_entry = dict(kb_entry)
            kb_entry["applicable_sections"] = kb_entry.get("applicable_sections", []) + state_rule.get("applicable_sections", [])

    # Stage 6-7: Intake & Contradictions
    intake = check_missing_facts(classification.domain, classification.issue, {**extracted_details.model_dump(exclude_none=True), **extra})
    contradictions = detect_contradictions(extracted_details.relevant_facts, extra)

    # Stage 8: Explanation
    explanation = await _run_explanation_llm(extracted_details.model_dump(exclude_none=True), kb_entry, language)

    # Stage 9: Fuzzy Citation Validation
    verified_secs = verify_citations(
        explanation.cited_sections,
        kb_entry,
        user_state=state,
        incident_date_str=incident_date_str
    )

    # Stage 10-11: Evidence & Confidence
    evidence_info = get_evidence_requirements(classification.domain, classification.issue)
    confidence_level, confidence_reason = assess_confidence(
        verified_sections=verified_secs,
        missing_facts=intake.missing_facts,
        contradictions=contradictions,
        is_high_risk=safety.is_high_risk,
        jurisdiction_status=jurisdiction.status,
        domain=classification.domain,
    )

    # Stage 12-14: Remedy, Notice & Translation
    remedy_text = await _translate_if_hindi(kb_entry.get("remedy", ""), language)
    try:
        sender = extracted_details.sender.model_dump(exclude_none=True) if extracted_details.sender else {}
        recipient = extracted_details.recipient.model_dump(exclude_none=True) if extracted_details.recipient else {}
        context = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "sender": sender,
            "recipient": recipient,
            "relevant_facts": extracted_details.relevant_facts or [],
            "issue_description": kb_entry.get("description", ""),
            "applicable_sections": verified_secs,
            "remedy": kb_entry.get("remedy", ""),
            "extra_details": extra,
        }
        rendered_doc = render_document(classification.domain, context)
        if language.strip().lower() == "hindi":
            rendered_doc = await _translate_if_hindi(rendered_doc, language)
    except Exception as e:
        logger.error("Document drafting failed: %s", e)
        raise LegalAidException("DOCUMENT_GENERATION_FAILURE", f"Document generation failed: {e}")

    return {
        "classification": classification.model_dump(),
        "explanation": explanation.model_dump(),
        "verified_sections": verified_secs,
        "remedy": remedy_text,
        "rendered_document": rendered_doc,
        "missing_facts": intake.missing_facts,
        "clarifying_questions": intake.clarifying_questions,
        "contradictions": [c.model_dump() for c in contradictions],
        "risk_level": safety.risk_level,
        "safety_alert": safety.safety_alert,
        "professional_review_recommended": (safety.professional_review_recommended or confidence_level == "professional_review_recommended"),
        "helplines": safety.helplines,
        "jurisdiction": jurisdiction.model_dump(),
        "legal_regime": temporal.legal_regime,
        "temporal_notes": temporal.notes,
        "evidence_needed": evidence_info.get("must_have", []),
        "evidence_nice_to_have": evidence_info.get("nice_to_have", []),
        "confidence_level": confidence_level,
        "confidence_reason": confidence_reason,
        "disclaimer": settings.DISCLAIMER,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /analyze/intake  [Stateless pre-flight check]
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/analyze/intake", response_model=IntakeCheckResponse)
async def intake_check(request: IntakeCheckRequest):
    user_input = _guard_input(request.user_input)

    safety = assess_safety(user_input)
    if safety.is_high_risk and safety.risk_level == "critical":
        return IntakeCheckResponse(
            is_ready_for_analysis=False,
            missing_facts=[],
            clarifying_questions=[],
            safety_alert=safety.safety_alert,
            risk_level=safety.risk_level,
        )

    classification = await _run_classification_llm(user_input)
    if classification.domain in ("unsupported",):
        return IntakeCheckResponse(
            is_ready_for_analysis=False,
            missing_facts=["supported_domain"],
            clarifying_questions=[
                "This issue does not fall within our supported domains. "
                "LegalAId currently covers: consumer disputes, unpaid wages/salary, "
                "and tenant/rental disputes. Please describe your issue in one of these areas."
            ],
            safety_alert=safety.safety_alert if safety.is_high_risk else None,
            risk_level=safety.risk_level,
        )

    extracted_details = classification.extracted_details.model_dump(exclude_none=True)
    extra = extracted_details.get("extra_details", {}) or {}

    intake_result = check_missing_facts(
        domain=classification.domain,
        issue=classification.issue,
        extracted_details={**extracted_details, **extra},
    )

    return IntakeCheckResponse(
        is_ready_for_analysis=intake_result.is_ready_for_analysis,
        missing_facts=intake_result.missing_facts,
        clarifying_questions=intake_result.clarifying_questions,
        safety_alert=safety.safety_alert if safety.is_high_risk else None,
        risk_level=safety.risk_level,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /draft
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/draft", response_model=DraftResponse)
async def generate_notice_draft(request: DraftRequest):
    template_id = request.template_id.strip()

    if template_id.startswith("consumer"):
        template_type = "consumer"
    elif template_id.startswith("labour"):
        template_type = "labour"
    elif template_id.startswith("tenant"):
        template_type = "tenant"
    else:
        raise LegalAidException("INVALID_INPUT", f"Invalid template_id '{template_id}'.")

    try:
        context = {
            "date": request.date,
            "sender": request.sender,
            "recipient": request.recipient,
            "relevant_facts": request.relevant_facts,
            "issue_description": request.issue_description,
            "applicable_sections": request.applicable_sections,
            "remedy": request.remedy,
            "extra_details": request.extra_details,
        }

        rendered_doc = render_document(template_type, context)
        rendered_doc = await _translate_if_hindi(rendered_doc, request.language)

        return DraftResponse(rendered_document=rendered_doc)

    except Exception as e:
        logger.error("Draft generation failed: %s", e)
        raise LegalAidException("DOCUMENT_GENERATION_FAILURE", f"Drafting failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /export-pdf
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/export-pdf")
def export_notice_pdf(request: ExportPdfRequest):
    text_content, err = sanitize_input(request.text_content, max_chars=50_000)
    if err or not text_content:
        raise LegalAidException("INVALID_INPUT", "Text content cannot be empty.")

    try:
        pdf_bytes = generate_pdf(text_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=legal_notice.pdf",
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        raise LegalAidException("DOCUMENT_GENERATION_FAILURE", f"PDF generation failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/health/detailed")
def health_detailed():
    import os as _os
    kb_path = _os.path.abspath(
        _os.path.join(_os.path.dirname(__file__), "data", "legal_kb.json")
    )
    font_path = settings.FONT_PATH

    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_MODEL,
        "kb_exists": _os.path.exists(kb_path),
        "devanagari_font_available": _os.path.exists(font_path),
        "timestamp": datetime.utcnow().isoformat(),
    }
