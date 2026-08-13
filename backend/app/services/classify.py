from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
import json
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

# Define nested models to avoid using Dict[str, Any] which generates 'additionalProperties: True'
class SenderDetails(BaseModel):
    name: Optional[str] = Field(None, description="Name of the applicant or sender.")
    address: Optional[str] = Field(None, description="Physical address of the applicant or sender.")
    contact: Optional[str] = Field(None, description="Phone number or email of the applicant or sender.")
    designation: Optional[str] = Field(None, description="Designation of the employee if applicable.")
    employee_id: Optional[str] = Field(None, description="Employee ID of the sender if applicable.")

class RecipientDetails(BaseModel):
    name: Optional[str] = Field(None, description="Name of the landlord, employer, company representative, or opposite party.")
    address: Optional[str] = Field(None, description="Physical address of the opposite party.")
    contact: Optional[str] = Field(None, description="Phone number or email of the opposite party.")
    company_name: Optional[str] = Field(None, description="Company name if the recipient is an employer or business.")
    designation: Optional[str] = Field(None, description="Designation of the recipient if applicable.")

class ExtraDetails(BaseModel):
    purchase_date: Optional[str] = Field(None, description="Date of purchase for consumer issue (e.g. YYYY-MM-DD).")
    product_name: Optional[str] = Field(None, description="Name of the defective product.")
    invoice_number: Optional[str] = Field(None, description="Transaction invoice or receipt number.")
    price: Optional[str] = Field(None, description="Price paid for the product or service.")
    unpaid_amount: Optional[str] = Field(None, description="Amount of unpaid wages/salary.")
    employment_start_date: Optional[str] = Field(None, description="Employment start date.")
    employment_end_date: Optional[str] = Field(None, description="Employment resignation/end date.")
    premises_address: Optional[str] = Field(None, description="Address of the rented premises.")
    agreement_date: Optional[str] = Field(None, description="Rent agreement execution date.")
    monthly_rent: Optional[str] = Field(None, description="Monthly rent amount.")
    security_deposit_amount: Optional[str] = Field(None, description="Security deposit paid.")
    notice_period: Optional[str] = Field(None, description="Notice period given in days.")

class ExtractedDetails(BaseModel):
    sender: Optional[SenderDetails] = Field(None, description="Details of the applicant.")
    recipient: Optional[RecipientDetails] = Field(None, description="Details of the opposite party.")
    relevant_facts: List[str] = Field(default_factory=list, description="List of chronologically ordered facts.")
    extra_details: Optional[ExtraDetails] = Field(None, description="Grievance-specific parameters.")

# Define the final Pydantic schema for structured output validation
class ClassificationOutput(BaseModel):
    domain: str = Field(description="The domain of the legal issue. Must be strictly one of: 'consumer', 'labour', 'tenant', or 'unsupported'.")
    issue: str = Field(description="The specific issue key from legal_kb.json, or 'unsupported' if the grievance is unrelated.")
    extracted_details: ExtractedDetails = Field(description="Structured details extracted from user input.")
    language: str = Field(description="The language of the user input (e.g. 'English', 'Hindi', etc.).")

# Load KB mappings dynamically at module level
KB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "legal_kb.json")
)

def _load_valid_categories() -> Dict[str, List[str]]:
    """Loads valid domain-issue categories from the local KB."""
    try:
        with open(KB_PATH, "r", encoding="utf-8") as f:
            kb = json.load(f)
        categories = {}
        for entry in kb.get("issues", []):
            domain = entry.get("domain")
            issue = entry.get("issue")
            if domain and issue:
                categories.setdefault(domain, []).append(issue)
        return categories
    except Exception as e:
        raise RuntimeError(f"Failed to load legal_kb.json from {KB_PATH}: {e}")

VALID_CATEGORIES = _load_valid_categories()

def classify_user_input(user_input: str) -> ClassificationOutput:
    """
    Classifies the user input using the Gemini LLM into a valid KB domain/issue
    and extracts structured details.
    
    :param user_input: Raw query text from the user.
    :return: An instance of ClassificationOutput.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Environment variable 'GEMINI_API_KEY' is not set.")

    # Initialize Gemini GenAI client
    client = genai.Client(api_key=api_key)
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    # Format the valid categories to instruct the model
    categories_str = json.dumps(VALID_CATEGORIES, indent=2)

    system_instruction = (
        "You are an expert legal intake assistant. Your task is to analyze the user's legal grievance, "
        "classify it into a valid domain and issue key, and extract key facts and details.\n\n"
        "### STRICT RULE ON DOMAIN & ISSUE SELECTION:\n"
        "You must select the 'domain' and 'issue' ONLY from the following valid categories:\n"
        f"{categories_str}\n\n"
        "### CRITICAL RULE ON UNSUPPORTED GRIEVANCES:\n"
        "If the user's query is completely unrelated to the supported categories (consumer product defects, "
        "unpaid labour salary/wages, or tenant security deposit refunds), or if it concerns an unsupported "
        "legal domain (such as criminal law, tax, trademark disputes, personal injury, etc.), you MUST "
        "set domain='unsupported' and issue='unsupported'. Do not force a match.\n\n"
        "### INSTRUCTIONS FOR DETAIL EXTRACTION:\n"
        "You must extract sender details, recipient details, chronologically ordered facts (under 'relevant_facts'), "
        "and any template parameters under 'extra_details' (such as purchase_date, unpaid_amount, agreement_date, etc.).\n\n"
        "Do NOT invent any legal acts, sections, or codes in this classification phase."
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=user_input,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ClassificationOutput,
                temperature=0.0,
            ),
        )
        # Parse the structured response
        return ClassificationOutput.model_validate_json(response.text)
    except Exception as e:
        raise RuntimeError(f"LLM Classification failed: {e}") from e
