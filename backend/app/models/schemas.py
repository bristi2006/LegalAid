"""
backend/app/models/schemas.py

Strict Pydantic v2 schemas that form the AI output contract.
All internal pipeline results and API responses are typed here.
The frontend consumes a subset of AnalyzeResponse — fields are additive only.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# Sub-models
# ─────────────────────────────────────────────────────────────────────────────

class VerifiedSection(BaseModel):
    """A legal section that has been confirmed against the authoritative KB."""
    act: str
    section: str
    meaning: str
    source: Optional[str] = None
    source_url: Optional[str] = None
    verified: bool = True
    why_applicable: Optional[str] = Field(
        default=None,
        description="Plain-language reason why this section applies to the user's facts."
    )


class JurisdictionResult(BaseModel):
    """Result of the jurisdiction resolution engine."""
    state: Optional[str] = None
    city: Optional[str] = None
    applicable_law: Optional[str] = None
    jurisdiction_note: Optional[str] = None
    status: str = Field(
        description="'resolved' | 'needs_verification' | 'not_applicable'",
        default="needs_verification"
    )


class TemporalResult(BaseModel):
    """Result of the temporal legal engine."""
    incident_date: Optional[str] = None
    legal_regime: Optional[str] = None
    notes: Optional[str] = None


class Contradiction(BaseModel):
    """A detected contradiction in user-supplied facts."""
    field: str = Field(description="Which field/topic has the contradiction.")
    value_a: str = Field(description="First stated value.")
    value_b: str = Field(description="Conflicting stated value.")
    severity: str = Field(description="'high' | 'medium' | 'low'", default="medium")
    message: str = Field(description="Human-readable contradiction description.")


class SafetyAssessment(BaseModel):
    """Output of the safety/risk detection engine."""
    is_high_risk: bool = False
    risk_level: str = Field(
        description="'low' | 'medium' | 'high' | 'critical'",
        default="low"
    )
    safety_alert: Optional[str] = None
    helplines: List[str] = Field(default_factory=list)
    professional_review_recommended: bool = False


class IntakeResult(BaseModel):
    """Output of the missing-fact detection engine."""
    known_facts: Dict[str, Any] = Field(default_factory=dict)
    missing_facts: List[str] = Field(default_factory=list)
    clarifying_questions: List[str] = Field(default_factory=list)
    is_ready_for_analysis: bool = True


class LegalRationale(BaseModel):
    """Structured Fact→Law→Application reasoning unit."""
    fact: str = Field(description="What the user reported.")
    law: str = Field(description="The verified legal provision that may apply.")
    application: str = Field(description="Why the law may apply to the facts.")
    uncertainty: Optional[str] = Field(
        default=None,
        description="What remains unknown or unverified."
    )
    action: Optional[str] = Field(
        default=None,
        description="What the user can consider doing."
    )


# ─────────────────────────────────────────────────────────────────────────────
# API Request schemas
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    user_input: str = Field(description="Raw legal grievance from the user.")
    language: str = Field(default="English", description="'English' or 'Hindi'.")


class IntakeCheckRequest(BaseModel):
    user_input: str = Field(description="User's initial grievance description.")
    language: str = Field(default="English")


class MessageRequest(BaseModel):
    content: str = Field(description="Chat message text content.")


class FactsUpdateRequest(BaseModel):
    facts: List[str] = Field(default_factory=list, description="List of case facts.")
    extra_details: Dict[str, Any] = Field(default_factory=dict, description="Custom parameters overrides.")


class DraftRequest(BaseModel):
    template_id: str
    date: str
    sender: Dict[str, Any]
    recipient: Dict[str, Any]
    relevant_facts: List[str]
    issue_description: str
    applicable_sections: List[Dict[str, Any]]
    remedy: str
    extra_details: Dict[str, Any] = Field(default_factory=dict)
    language: str = Field(default="English")


class ExportPdfRequest(BaseModel):
    text_content: str


# ─────────────────────────────────────────────────────────────────────────────
# API Response schemas
# ─────────────────────────────────────────────────────────────────────────────

class IntakeCheckResponse(BaseModel):
    """Response for the /analyze/intake pre-flight endpoint."""
    is_ready_for_analysis: bool
    missing_facts: List[str]
    clarifying_questions: List[str]
    safety_alert: Optional[str] = None
    risk_level: str = "low"


class AnalyzeResponse(BaseModel):
    """
    Full response for /analyze.
    Backward-compatible with frontend: classification, explanation, verified_sections,
    remedy, rendered_document remain unchanged.
    New fields are additive (optional) so existing frontend still works.
    """
    # ── Existing fields (frontend depends on these) ───────────────────────
    classification: Any  # ClassificationOutput from classify.py
    explanation: Any     # ExplanationOutput from explain.py
    verified_sections: List[Dict[str, Any]]
    remedy: str
    rendered_document: str

    # ── New enrichment fields (additive — frontend may ignore) ────────────
    missing_facts: List[str] = Field(default_factory=list)
    clarifying_questions: List[str] = Field(default_factory=list)
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    risk_level: str = "low"
    safety_alert: Optional[str] = None
    professional_review_recommended: bool = False
    helplines: List[str] = Field(default_factory=list)
    jurisdiction: Optional[Dict[str, Any]] = None
    legal_regime: Optional[str] = None
    evidence_needed: List[str] = Field(default_factory=list)
    confidence_level: str = Field(
        default="needs_verification",
        description="'strongly_supported' | 'needs_verification' | 'professional_review_recommended'"
    )
    confidence_reason: Optional[str] = None
    legal_rationale: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str = (
        "This output is auto-generated for informational purposes only and does NOT "
        "constitute legal advice. Always consult a qualified advocate before taking "
        "legal action."
    )


class DraftResponse(BaseModel):
    rendered_document: str


# ── Structured Error schemas ──────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str
    recoverable: bool = True


class StructuredErrorResponse(BaseModel):
    error: ErrorDetail


# ── Stateful Case schemas (Task 14 integration schema) ─────────────────────────

class CaseResponse(BaseModel):
    case_id: str
    status: str
    language: str
    domain: Optional[str] = None
    issue: Optional[str] = None
    case_summary: Optional[str] = None
    facts: List[str] = Field(default_factory=list)
    missing_facts: List[str] = Field(default_factory=list)
    clarifying_questions: List[str] = Field(default_factory=list)
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    jurisdiction: Dict[str, Any] = Field(default_factory=dict)
    legal_regime: Optional[str] = None
    rights: List[str] = Field(default_factory=list)
    applicable_laws: List[Dict[str, Any]] = Field(default_factory=list)
    legal_rationale: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    evidence_needed: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    risk_level: str = "low"
    professional_review_recommended: bool = False
    confidence_level: str = "needs_verification"
    confidence_reason: Optional[str] = None
    helplines: List[str] = Field(default_factory=list)
    safety_alert: Optional[str] = None
    document_data: Dict[str, Any] = Field(default_factory=dict)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str = (
        "This output is auto-generated for informational purposes only and does NOT "
        "constitute legal advice. Always consult a qualified advocate before taking "
        "legal action."
    )
