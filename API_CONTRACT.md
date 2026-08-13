# LegalAid Backend — API Contract Documentation
> Version 2.0 | Bridge document for Teammate 2 (Frontend/UX)

This document describes every endpoint, request schema, response schema, and error code
in the LegalAid v2 backend. Backward compatibility with v1 frontend is fully maintained.

---

## Base URL
```
Development: http://localhost:8000
Production:  (to be configured)
```

---

## Endpoints

### 1. `GET /health`
Simple health probe.

**Response:**
```json
{ "status": "ok", "version": "2.0.0" }
```

---

### 2. `GET /health/detailed` *(NEW)*
Detailed probe — useful for debugging configuration issues.

**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "gemini_api_key_configured": true,
  "gemini_model": "gemini-2.5-flash",
  "kb_exists": true,
  "devanagari_font_available": true,
  "timestamp": "2026-08-13T18:00:00"
}
```

---

### 3. `POST /analyze/intake` *(NEW)*
Pre-flight check before calling `/analyze`. Returns missing mandatory facts and
clarifying questions WITHOUT running the expensive full analysis pipeline.

**When to use:** Call this first to guide the user to provide all necessary information
before running the full analysis. Especially useful for improving UX with a step-by-step
grievance intake form.

**Request:**
```json
{
  "user_input": "string (required)",
  "language": "English | Hindi (default: English)"
}
```

**Response:**
```json
{
  "is_ready_for_analysis": false,
  "missing_facts": ["state", "deposit_amount"],
  "clarifying_questions": [
    "In which state is the rented property located?",
    "What was the security deposit amount you paid (in ₹)?"
  ],
  "safety_alert": null,
  "risk_level": "low"
}
```

**Response — Safety Critical:**
```json
{
  "is_ready_for_analysis": false,
  "missing_facts": [],
  "clarifying_questions": [],
  "safety_alert": "⚠️ Your situation may involve immediate danger...",
  "risk_level": "critical"
}
```

---

### 4. `POST /analyze`
Full 14-stage analysis pipeline.

**Request:**
```json
{
  "user_input": "string (required, max 5000 characters)",
  "language": "English | Hindi (default: English)"
}
```

**Response — Complete Schema:**
```json
{
  "classification": {
    "domain": "consumer | labour | tenant",
    "issue": "defective_product | salary_not_paid | security_deposit_not_returned | ...",
    "extracted_details": {
      "sender": {
        "name": "string | null",
        "address": "string | null",
        "contact": "string | null",
        "designation": "string | null",
        "employee_id": "string | null"
      },
      "recipient": {
        "name": "string | null",
        "address": "string | null",
        "contact": "string | null",
        "company_name": "string | null",
        "designation": "string | null"
      },
      "relevant_facts": ["string", "..."],
      "extra_details": {
        "purchase_date": "YYYY-MM-DD | null",
        "product_name": "string | null",
        "price": "string | null",
        "unpaid_amount": "string | null",
        "state": "string | null",
        "city": "string | null",
        "incident_date": "YYYY-MM-DD | null"
      }
    },
    "language": "English | Hindi | Hinglish"
  },
  "explanation": {
    "rights_explanation": "Structured text:\nWHAT HAPPENED: ...\nYOUR RIGHTS: ...\nAPPLICABLE LAW: ...\nUNCERTAINTY: ...\nNEXT STEPS: ...",
    "cited_sections": ["Section 35", "Section 39"],
    "confidence": 1.0
  },
  "verified_sections": [
    {
      "act": "Consumer Protection Act, 2019",
      "section": "Section 35",
      "meaning": "Consumer can file before District Commission...",
      "source": "India Code",
      "source_url": "https://www.indiacode.nic.in/handle/123456789/15256",
      "verified": true,
      "why_applicable": "This section applies because..."
    }
  ],
  "remedy": "string — practical remedy steps",
  "rendered_document": "string — full text of the legal notice draft",

  "missing_facts": ["state", "deposit_amount"],
  "clarifying_questions": ["In which state?", "What was the deposit amount?"],
  "contradictions": [
    {
      "field": "amount",
      "value_a": "₹50,000",
      "value_b": "₹5,000",
      "severity": "high",
      "message": "Contradictory amounts detected..."
    }
  ],
  "risk_level": "low | medium | high | critical",
  "safety_alert": "string | null",
  "professional_review_recommended": false,
  "helplines": ["Police: 112", "Women Helpline: 181"],
  "jurisdiction": {
    "state": "Karnataka",
    "city": "Bengaluru",
    "applicable_law": "Karnataka Rent Act, 1999",
    "jurisdiction_note": "State-specific; applies to premises in Karnataka.",
    "status": "resolved | needs_verification | not_applicable"
  },
  "legal_regime": "Consumer Protection Act, 2019",
  "temporal_notes": "string | null",
  "evidence_needed": [
    "Original purchase invoice or bill",
    "Product photos/videos showing the defect"
  ],
  "evidence_nice_to_have": ["Warranty card"],
  "confidence_level": "strongly_supported | needs_verification | professional_review_recommended",
  "confidence_reason": "This analysis is strongly supported because...",
  "disclaimer": "This output is auto-generated for informational purposes only..."
}
```

**Error Responses:**
| Status | When |
|---|---|
| 400 | Input empty, too long, unsupported domain, or no KB match |
| 500 | Internal pipeline failure (LLM, rendering, etc.) |

---

### 5. `POST /draft`
Regenerate a notice document with updated parameters.

**Request:**
```json
{
  "template_id": "consumer_defective_product | labour_salary_not_paid | tenant_security_deposit_not_returned | ...",
  "date": "YYYY-MM-DD",
  "language": "English | Hindi",
  "sender": {
    "name": "string",
    "address": "string",
    "contact": "string",
    "designation": "string (labour only)",
    "employee_id": "string (labour only)"
  },
  "recipient": {
    "name": "string",
    "address": "string",
    "contact": "string",
    "company_name": "string (labour only)",
    "designation": "string (labour only)"
  },
  "relevant_facts": ["string", "..."],
  "issue_description": "string",
  "applicable_sections": [{"act": "...", "section": "...", "meaning": "..."}],
  "remedy": "string",
  "extra_details": {}
}
```

**Response:**
```json
{ "rendered_document": "string — full notice text" }
```

**Error:** 400 if `template_id` does not start with a valid domain prefix.

---

### 6. `POST /export-pdf`
Convert notice text to a PDF file.

**Request:**
```json
{ "text_content": "string — notice text to convert" }
```

**Response:**
Binary PDF file with:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename=legal_notice.pdf`

**Hindi/Devanagari support:** Requires `NotoSansDevanagari-Regular.ttf` to be
present in `backend/app/data/`. If the font is missing, Hindi text renders as
blank boxes (Helvetica fallback).

---

## Supported Domains & Issues

| Domain | Issue Key | Template ID |
|---|---|---|
| `consumer` | `defective_product` | `consumer_defective_product` |
| `consumer` | `product_not_delivered` | `consumer_product_not_delivered` |
| `consumer` | `refund_not_given` | `consumer_refund_not_given` |
| `consumer` | `service_deficiency` | `consumer_service_deficiency` |
| `consumer` | `overcharging` | `consumer_overcharging` |
| `consumer` | `false_or_misleading_advertising` | `consumer_misleading_advertising` |
| `consumer` | `unfair_contract_terms` | `consumer_unfair_contract_terms` |
| `consumer` | `product_caused_injury_or_damage` | `consumer_product_injury` |
| `consumer` | `ecommerce_consumer_issue` | `consumer_ecommerce_issue` |
| `labour` | `salary_not_paid` | `labour_salary_not_paid` |
| `labour` | `salary_paid_late` | `labour_salary_paid_late` |
| `labour` | `illegal_wage_deduction` | `labour_illegal_wage_deduction` |
| `labour` | `minimum_wage_violation` | `labour_minimum_wage_violation` |
| `labour` | `overtime_not_paid` | `labour_overtime_not_paid` |
| `labour` | `bonus_not_paid` | `labour_bonus_not_paid` |
| `labour` | `wrongful_termination_or_retrenchment` | `labour_wrongful_termination` |
| `labour` | `workplace_grievance` | `labour_workplace_grievance` |
| `labour` | `employment_terms_or_working_conditions` | `labour_employment_terms` |
| `tenant` | `security_deposit_not_returned` | `tenant_security_deposit_not_returned` |
| `tenant` | `illegal_eviction` | `tenant_illegal_eviction` |
| `tenant` | `rent_increase_dispute` | `tenant_rent_increase_dispute` |
| `tenant` | `landlord_refuses_repairs` | `tenant_landlord_refuses_repairs` |
| `tenant` | `essential_services_withheld` | `tenant_essential_services_withheld` |
| `tenant` | `rent_receipt_not_provided` | `tenant_rent_receipt_not_provided` |
| `tenant` | `landlord_or_tenant_breach` | `tenant_landlord_or_tenant_breach` |
| `tenant` | `unauthorized_entry_by_landlord` | `tenant_unauthorized_entry` |
| `tenant` | `tenancy_agreement_dispute` | `tenant_agreement_dispute` |

---

## New Fields in `/analyze` Response (v2 additions)

These are **additive** — the existing frontend works without using them.
Teammate 2 can optionally display them to enhance UX.

| Field | Type | Usage |
|---|---|---|
| `missing_facts` | `string[]` | Show follow-up questions to the user |
| `clarifying_questions` | `string[]` | Human-readable questions for missing facts |
| `contradictions` | `Contradiction[]` | Warn user about conflicting information |
| `risk_level` | `string` | Show risk badge (`low/medium/high/critical`) |
| `safety_alert` | `string\|null` | Show emergency alert if present |
| `professional_review_recommended` | `boolean` | Show "Consult a lawyer" CTA if true |
| `helplines` | `string[]` | Show emergency helplines if high risk |
| `jurisdiction` | `object` | Show which state law applies |
| `legal_regime` | `string` | Show applicable legal framework |
| `evidence_needed` | `string[]` | Show evidence checklist to user |
| `evidence_nice_to_have` | `string[]` | Optional supporting evidence |
| `confidence_level` | `string` | Show analysis quality badge |
| `confidence_reason` | `string` | Tooltip/detail for confidence badge |
| `disclaimer` | `string` | Mandatory disclaimer (already in UI) |

---

## Security Notes for Frontend

1. **Input Size Limit:** `/analyze` and `/analyze/intake` reject inputs > 5,000 characters with a `400` error. Show a character counter in the UI.

2. **Injection Attempts:** The backend detects and logs injection attempts but does not tell the user (to avoid giving attackers feedback). No UI change needed.

3. **PII in Responses:** The response may contain names/addresses extracted from user input. Ensure PDF downloads are not cached by the browser.

4. **PDF Download:** The `/export-pdf` endpoint streams binary data. Use `window.URL.createObjectURL(blob)` pattern (already implemented in `DraftEditor.tsx`).

5. **Error Handling:** All errors return `{ "detail": "string" }` — never raw Python tracebacks.

---

## Stateful API & Case Management (v3 additions)

The v3 stateful APIs allow the frontend to persist a user's grievance conversation across multiple turns, update extracted details manually, and run a complete 14-stage analysis pipeline statefully.

---

### 1. `POST /case/start`
Initialises a stateful case session. Starts with user's initial intake description.

**Request:**
```json
{
  "user_input": "string (required)",
  "language": "English | Hindi (default: English)"
}
```

**Response (`CaseResponse`):**
```json
{
  "case_id": "8a0c2394-0cf1-456c-8fe8-4447d2f9b2d8",
  "status": "intake | safety_priority | completed",
  "language": "English",
  "domain": "consumer",
  "issue": "defective_product",
  "case_summary": null,
  "facts": [
    "I bought a phone that stopped working after 5 days."
  ],
  "missing_facts": ["state", "purchase_amount"],
  "clarifying_questions": [
    "In which state is the rented property located?",
    "How much did you pay for the product or service (in ₹)?"
  ],
  "contradictions": [],
  "jurisdiction": {
    "state": null,
    "city": null,
    "applicable_law": null,
    "jurisdiction_note": "State/jurisdiction not specified.",
    "status": "needs_verification"
  },
  "legal_regime": null,
  "rights": [],
  "applicable_laws": [],
  "legal_rationale": [],
  "uncertainties": [],
  "evidence_needed": [],
  "next_steps": [],
  "risk_level": "low",
  "professional_review_recommended": false,
  "document_data": {},
  "sources": [],
  "disclaimer": "This output is auto-generated for informational purposes only..."
}
```

---

### 2. `POST /case/{id}/message`
Appends a conversational turn/message to the case history. Re-runs safety and classifications using the transcript.

**Request:**
```json
{
  "content": "string (message text)"
}
```

**Response:** Returns updated `CaseResponse`.

---

### 3. `POST /case/{id}/facts`
Direct manual override of the case facts or extra parameters.

**Request:**
```json
{
  "facts": ["string", "string"],
  "extra_details": {
    "state": "Karnataka",
    "price": "35000",
    "purchase_date": "2026-07-01"
  }
}
```

**Response:** Returns updated `CaseResponse`.

---

### 4. `GET /case/{id}`
Retrieves the current state of a case.

**Response:** Returns `CaseResponse`.

---

### 5. `POST /case/{id}/analyze`
Statefully runs the full 14-stage legal pipeline on the stored case details.

**Response:** Returns the completed `CaseResponse` payload with `status: "completed"` and filled analysis outcomes.

---

### 6. `GET /case/{id}/laws`
Returns list of verified laws / sections matching the case.

**Response:**
```json
[
  {
    "act": "Consumer Protection Act, 2019",
    "section": "Section 35",
    "meaning": "Allows filing complaints...",
    "verified": true
  }
]
```

---

### 7. `GET /case/{id}/evidence`
Returns must-have and nice-to-have evidence lists.

**Response:**
```json
{
  "must_have": [
    "Original purchase invoice or bill"
  ],
  "nice_to_have": []
}
```

---

### 8. `POST /case/{id}/document`
Generates and returns the notice document draft.

**Response:**
```json
{
  "rendered_document": "string — full notice text"
}
```

---

## Structured Error Responses (v3)

All v3 API errors follow a predictable response structure rather than raising raw tracebacks.

**Error Response Schema:**
```json
{
  "error": {
    "code": "INVALID_INPUT | UNSUPPORTED_DOMAIN | MISSING_FACTS | CONTRADICTION_DETECTED | JURISDICTION_REQUIRED | LEGAL_SOURCE_UNAVAILABLE | CITATION_UNVERIFIED | TEMPORAL_UNCERTAINTY | HIGH_RISK_CASE | LLM_FAILURE | DOCUMENT_GENERATION_FAILURE",
    "message": "Human-readable error explanation.",
    "recoverable": true
  }
}
```

**Standard Error Codes:**

| Code | When | Recoverable |
|---|---|---|
| `INVALID_INPUT` | Input empty, whitespace-only, or too long (>5,000 chars) | Yes |
| `UNSUPPORTED_DOMAIN` | Issue is completely unsupported | Yes |
| `JURISDICTION_REQUIRED` | State location required but missing | Yes |
| `CONTRADICTION_DETECTED` | Stated values are contradictory | Yes |
| `LLM_FAILURE` | LLM timeout, API exception, or invalid JSON output | Yes |
| `DOCUMENT_GENERATION_FAILURE` | NOTICE template rendering failed | No |
| `LEGAL_SOURCE_UNAVAILABLE` | Issue not found in local authoritative KB | No |
| `INTERNAL_SERVER_ERROR` | Unhandled backend exception | No |

