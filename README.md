# ⚖️ LegalAId

**LegalAId** is an AI-powered legal assistance tool that helps everyday users in India understand their consumer, labour, and tenant rights — in **English or Hindi** — and generate professional legal notices in seconds.

> ⚠️ This tool is for informational purposes only. It does not constitute legal advice. Always consult a qualified lawyer before taking legal action.

---

## ✨ Features

- 🧠 **AI-powered issue classification** — understands your problem in plain language
- 📚 **Knowledge Base lookup** — maps your issue to verified Indian statutes (Consumer Protection Act 2019, Code on Wages 2019, Model Tenancy Act 2021)
- ✅ **Citation verification** — every legal section is cross-checked against the KB; fabricated sections are automatically filtered out
- 🌐 **Bilingual support** — English and Hindi (Act names and section numbers always stay in English)
- 📝 **Legal notice generator** — fills professional Jinja2 templates with your details
- ✏️ **Editable draft** — review and edit the notice before downloading
- 📄 **PDF export** — download a clean PDF with one click
- 🚫 **Unsupported issue detection** — gracefully rejects topics outside the three supported domains

---

## 🗂️ Project Structure

```
LegalAId/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── legal_kb.json          # Knowledge base (do not modify)
│   │   ├── services/
│   │   │   ├── classify.py            # LLM classification
│   │   │   ├── kb_lookup.py           # Pure Python KB lookup
│   │   │   ├── explain.py             # LLM rights explanation
│   │   │   ├── verify.py              # Pure Python citation verifier
│   │   │   ├── translate.py           # Hindi translation helper
│   │   │   └── pdf_gen.py             # PDF generation (ReportLab)
│   │   ├── templates/
│   │   │   ├── consumer_notice.txt    # Consumer legal notice template
│   │   │   ├── labour_notice.txt      # Labour legal notice template
│   │   │   └── tenant_notice.txt      # Tenant legal notice template
│   │   ├── utils/
│   │   │   └── template_renderer.py   # Jinja2 renderer
│   │   └── main.py                    # FastAPI app (routes: /analyze, /draft, /export-pdf)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx               # Problem intake screen
│   │   │   ├── Result.tsx             # Rights analysis screen
│   │   │   └── DraftEditor.tsx        # Notice editor + PDF download
│   │   └── App.tsx                    # App state controller
│   ├── package.json
│   └── vite.config.ts
├── legal_kb.json                      # Root-level symlink / copy (reference)
└── .env                               # API keys (never commit this)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/LegalAId.git
cd LegalAId
```

---

### 2. Set up the backend

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r backend/requirements.txt
```

#### Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> 💡 If you are on the free tier (20 requests/day), use `GEMINI_MODEL=gemini-2.0-flash-lite` to stay within quota.

#### Start the FastAPI server

```bash
uvicorn backend.app.main:app --port 8000 --reload
```

The API will be available at **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

---

### 3. Set up the frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔁 Complete Flow

```
User types problem (English / Hindi)
        ↓
   POST /analyze
        ↓
  LLM Classification  →  KB Lookup  →  LLM Explanation  →  Citation Verification
        ↓
   Result page (rights, verified sections, remedy)
        ↓
   POST /draft
        ↓
  Editable legal notice (Jinja2 template)
        ↓
   POST /export-pdf
        ↓
  Downloadable PDF
```

---

## 🌍 Supported Domains

| Domain | Example Issues |
|--------|---------------|
| **Consumer** | Defective product, refund refused, overcharging, misleading advertising |
| **Labour** | Unpaid salary, overtime unpaid, wrongful termination, illegal wage deduction |
| **Tenant** | Security deposit not returned, illegal eviction, landlord refuses repairs |

Queries outside these domains (e.g. criminal law, trademark, tax) are safely rejected with a clear message.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/analyze` | Full analysis pipeline (classify → lookup → explain → verify) |
| `POST` | `/draft` | Generate / regenerate a legal notice document |
| `POST` | `/export-pdf` | Convert notice text to a downloadable PDF |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Uvicorn |
| AI / LLM | Google Gemini (via `google-genai`) |
| Templates | Jinja2 |
| PDF | ReportLab |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Knowledge Base | Static JSON (`legal_kb.json`) |

---

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `GEMINI_MODEL` | Optional | Model name (default: `gemini-2.5-flash`) |

---

## 🛡️ Legal Disclaimer

LegalAId is an informational tool only. All legal notices generated are drafts for reference. The application:
- Does **not** provide legal advice
- Does **not** represent you in any legal proceeding
- Does **not** guarantee the accuracy or completeness of any legal information

Please consult a qualified advocate before issuing any legal notice.
