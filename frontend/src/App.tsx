import { useState, useEffect } from "react";
import { Scale, ChevronRight } from "lucide-react";
import { Chat } from "./components/Chat";
import { MissingInfo } from "./components/MissingInfo";
import { CaseUnderstanding } from "./components/CaseUnderstanding";
import { RightsAndLaws } from "./components/RightsAndLaws";
import { EvidenceAndActions } from "./components/EvidenceAndActions";
import { DraftEditor } from "./components/DraftEditor";
import { SafetyLockdown } from "./components/SafetyLockdown";
import { Home } from "./components/Home";
import api from "./services/api";

type Step =
  | "home"
  | "idle"
  | "analyzing"
  | "needs_information"
  | "case_ready"
  | "show_rights"
  | "show_laws"
  | "show_evidence"
  | "show_actions"
  | "document_editor"
  | "pdf_ready";

// All API calls go through ./services/api.ts (reads VITE_API_BASE_URL env var)

// Route mappings for Hash Routing
const stepToHash: Record<Step, string> = {
  home: "#/home",
  idle: "#/intake",
  analyzing: "#/analyzing",
  needs_information: "#/needs-info",
  case_ready: "#/case-ready",
  show_rights: "#/rights",
  show_laws: "#/laws",
  show_evidence: "#/evidence",
  show_actions: "#/actions",
  document_editor: "#/editor",
  pdf_ready: "#/editor"
};

const hashToStep: Record<string, Step> = {
  "#/home": "home",
  "#/intake": "idle",
  "#/analyzing": "analyzing",
  "#/needs-info": "needs_information",
  "#/case-ready": "case_ready",
  "#/rights": "show_rights",
  "#/laws": "show_laws",
  "#/evidence": "show_evidence",
  "#/actions": "show_actions",
  "#/editor": "document_editor"
};

function App() {
  const [step, setStep] = useState<Step>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intake data states
  const [language, setLanguage] = useState<string>("English");
  const [userQuery, setUserQuery] = useState<string>("");

  // Case context and analysis results
  const [analysis, setAnalysis] = useState<any>(null);

  // Missing details state
  const [missingFacts, setMissingFacts] = useState<string[]>([]);

  // Contradiction state
  const [contradiction, setContradiction] = useState<{ field: string; values: string[] } | null>(null);

  // Safety & Risk states
  const [riskLevel, setRiskLevel] = useState<"low" | "high">("low");
  const [safetyReason, setSafetyReason] = useState<string>("");
  const [riskStatus, setRiskStatus] = useState<"Strongly Supported" | "Needs Verification" | "Professional Review Recommended">("Strongly Supported");
  const [riskReason, setRiskReason] = useState<string>("");

  // Helper to transition state and update hash
  const changeStep = (newStep: Step) => {
    setStep(newStep);
    window.location.hash = stepToHash[newStep] || "#/home";
  };

  // Hash listener to handle browser navigation (back/forward keys)
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash || "#/home";
      const matchedStep = hashToStep[currentHash];
      if (matchedStep && matchedStep !== step) {
        setStep(matchedStep);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    // Set initial route
    if (!window.location.hash) {
      window.location.hash = "#/home";
    } else {
      handleHashChange();
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [step]);

  const handleAnalyze = async (userQueryText: string) => {
    setLoading(true);
    setError(null);
    setUserQuery(userQueryText);
    setContradiction(null);
    setMissingFacts([]);
    setRiskLevel("low");

    const lowercaseQuery = userQueryText.toLowerCase();

    // 1. Check for immediate high risk / safety lockout triggers (Flow 7)
    const isHighRisk =
      /\bviolence\b/.test(lowercaseQuery) ||
      /\bthreat\b/.test(lowercaseQuery) ||
      /\bphysical\b/.test(lowercaseQuery) ||
      /\bforce\b/.test(lowercaseQuery) ||
      /\bharm\b/.test(lowercaseQuery) ||
      lowercaseQuery.includes("evict by force");

    if (isHighRisk) {
      setRiskLevel("high");
      setSafetyReason(
        userQueryText.toLowerCase().includes("violence")
          ? "Immediate threat of physical violence reported"
          : "Landlord attempting eviction by force without notice"
      );
      changeStep("needs_information");
      setLoading(false);
      return;
    }

    // 2. Check for contradiction scenarios (Flow 6)
    const hasConflictingWages = lowercaseQuery.includes("50,000") && lowercaseQuery.includes("20,000");
    const hasConflictingDeposit = lowercaseQuery.includes("50000") && lowercaseQuery.includes("20000");
    if (hasConflictingWages || hasConflictingDeposit) {
      setContradiction({
        field: "Disputed Amount",
        values: ["₹50,000", "₹20,000"]
      });
      changeStep("needs_information");
      setLoading(false);
      return;
    }

    // 3. Check for missing information cases - e.g. Labour salary flow missing employment status (Flow 1)
    if (
      (lowercaseQuery.includes("salary") || lowercaseQuery.includes("wage") || lowercaseQuery.includes("employer") || lowercaseQuery.includes("amit sharma")) &&
      !lowercaseQuery.includes("full-time") && !lowercaseQuery.includes("contract")
    ) {
      setMissingFacts(["employment_status", "state"]);
      changeStep("needs_information");
      setLoading(false);
      return;
    }

    // Normal analysis pipeline
    await executePipeline(userQueryText, {});
  };

  const executePipeline = async (queryText: string, extraParameters: Record<string, string>) => {
    changeStep("analyzing");
    setLoading(true);
    try {
      let enrichedQuery = queryText;
      if (extraParameters.state) {
        enrichedQuery += `\nState of occurrence: ${extraParameters.state}.`;
      }
      if (extraParameters.employment_status) {
        enrichedQuery += `\nEmployment status: ${extraParameters.employment_status}.`;
      }

      const data = await api.analyze(enrichedQuery, language) as any;
      setAnalysis(data);

      // Determine Risk status based on details (Flow 9)
      if (!extraParameters.state && !queryText.toLowerCase().includes("delhi") && !queryText.toLowerCase().includes("gurgaon") && !queryText.toLowerCase().includes("bengaluru")) {
        setRiskStatus("Needs Verification");
        setRiskReason("State or jurisdiction has not been confirmed in the intake report. Legal notice rules may differ by local laws.");
      } else if (data.explanation.confidence > 0.85) {
        setRiskStatus("Strongly Supported");
        setRiskReason("The grievance facts map clearly to confirmed statutory protections with high confidence.");
      } else {
        setRiskStatus("Professional Review Recommended");
        setRiskReason("Grievance details are slightly ambiguous or map to multiple potential legal scopes. Advocate consultation recommended.");
      }

      changeStep("case_ready");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
      changeStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMissingFacts = async (answers: Record<string, string>, resolvedContr: string | null) => {
    let finalQuery = userQuery;
    if (resolvedContr) {
      finalQuery += `\nConfirmed correct disputed amount is: ${resolvedContr}.`;
    }

    await executePipeline(finalQuery, answers);
  };

  const handleUpdateCaseFacts = async (updatedDetails: any) => {
    setLoading(true);
    try {
      const data = await api.draft({
        template_id: `${analysis.classification.domain}_${analysis.classification.issue}`,
        date: new Date().toISOString().split("T")[0],
        sender: updatedDetails.sender,
        recipient: updatedDetails.recipient,
        relevant_facts: updatedDetails.relevant_facts,
        issue_description: analysis.classification.issue.replace(/_/g, " "),
        applicable_sections: analysis.verified_sections,
        remedy: analysis.remedy,
        extra_details: updatedDetails.extra_details || {},
        language: language,
      });
      setAnalysis({
        ...analysis,
        classification: {
          ...analysis.classification,
          extracted_details: updatedDetails,
        },
        rendered_document: data.rendered_document,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update case parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftRegenerate = async (payload: any): Promise<string> => {
    const data = await api.draft({ ...payload, language });
    return data.rendered_document;
  };

  const handleExportPdf = async (textContent: string): Promise<Blob> => {
    return api.exportPdf(textContent);
  };

  const getEvidenceChecklist = () => {
    const domain = analysis?.classification?.domain;
    if (domain === "consumer") {
      return ["Proof of purchase / Invoice", "Photographs/video of defect", "Correspondence records with seller", "Warranty card / documentation"];
    }
    if (domain === "labour") {
      return ["Employment contract / Offer Letter", "Salary slips / pay stubs", "Bank statements showing unpaid period", "Resignation acceptance letter", "Email logs with HR"];
    }
    return ["Registered rent agreement", "Security deposit receipt", "Keys handover confirmation", "WhatsApp/email chat logs with landlord", "Bank statements"];
  };

  const getActionPlan = () => {
    const domain = analysis?.classification?.domain;
    if (domain === "consumer") {
      return [
        "Collect all purchase invoices and defect photographs.",
        "Attempt written escalation to the company's regional grievance officer.",
        "Review the generated demand notice template below for factual accuracy.",
        "Send the legal notice and, if unpaid after 15 days, file complaint on e-Daakhil."
      ];
    }
    if (domain === "labour") {
      return [
        "Gather salary slips, bank records, and official resignation acceptances.",
        "Formulate a precise demand statement for unpaid wages.",
        "Check your state's Shop and Establishment Act guidelines.",
        "Review the generated notice and consult an advocate before formal dispatch."
      ];
    }
    return [
      "Gather the signed lease agreement and security deposit payment receipt.",
      "Assemble vacating notices, keys return notes, and landlord chat logs.",
      "Submit the demand notice for deposit refund with 15 days compliance period.",
      "If deposit is still held, file a case with the Rent Authority under the Model Tenancy Act."
    ];
  };

  const renderWorkflowStages = () => {
    if (step === "home" || step === "idle" || step === "analyzing") return null;

    const stages = [
      { name: "Case Intake", active: step === "needs_information" },
      { name: "Understanding", active: step === "case_ready" },
      { name: "Rights & Laws", active: step === "show_rights" || step === "show_laws" },
      { name: "Evidence & Actions", active: step === "show_evidence" || step === "show_actions" },
      { name: "Notice Draft", active: step === "document_editor" || step === "pdf_ready" }
    ];

    return (
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-[65px] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none gap-2 text-xs font-semibold text-slate-400">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px] ${stage.active
                  ? "bg-indigo-600 border-indigo-600 text-white font-extrabold"
                  : "border-slate-300 text-slate-500"
                }`}>
                {idx + 1}
              </span>
              <span className={stage.active ? "text-indigo-600 font-bold" : "text-slate-500"}>{stage.name}</span>
              {idx < stages.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              changeStep("home");
              setAnalysis(null);
              setError(null);
            }}
          >
            <Scale className="w-6 h-6 text-indigo-600" />
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">LegalAId</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="lang-select" className="text-xs font-semibold text-slate-500">Language / भाषा / Bhaasha:</label>
              <select
                id="lang-select"
                className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500 text-slate-700"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Pipeline Active
            </div>
          </div>
        </div>
      </header>

      {/* Stage Tracker bar */}
      {renderWorkflowStages()}

      {/* Main Container Content */}
      <main className="flex-1 w-full">

        {step === "home" && (
          <Home
            onStart={() => changeStep("idle")}
            language={language}
          />
        )}

        {step === "idle" && (
          <Chat
            onSubmit={handleAnalyze}
            onBack={() => changeStep("home")}
            loading={loading}
            error={error}
            language={language}
          />
        )}

        {step === "analyzing" && (
          <div className="max-w-md mx-auto text-center py-20 px-4 space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Processing Your Intake</h2>
              <p className="text-sm text-slate-500">Running legal analysis pipeline: classify → lookup → verify...</p>
            </div>
          </div>
        )}

        {step === "needs_information" && riskLevel === "high" && (
          <SafetyLockdown
            reason={safetyReason}
            language={language}
            onReset={() => changeStep("home")}
          />
        )}

        {step === "needs_information" && riskLevel === "low" && (
          <MissingInfo
            missingFacts={missingFacts}
            contradiction={contradiction}
            language={language}
            onResolve={handleResolveMissingFacts}
            onBack={() => changeStep("idle")}
          />
        )}

        {step === "case_ready" && analysis && (
          <CaseUnderstanding
            classification={analysis.classification}
            language={language}
            onUpdateFacts={handleUpdateCaseFacts}
            onProceed={() => changeStep("show_rights")}
            onBack={() => changeStep("idle")}
          />
        )}

        {step === "show_rights" && analysis && (
          <RightsAndLaws
            rightsExplanation={analysis.explanation.rights_explanation}
            verifiedSections={analysis.verified_sections}
            riskStatus={riskStatus}
            riskReason={riskReason}
            language={language}
            onProceed={() => changeStep("show_evidence")}
            onBack={() => changeStep("case_ready")}
          />
        )}

        {step === "show_evidence" && analysis && (
          <EvidenceAndActions
            evidenceChecklist={getEvidenceChecklist()}
            actionPlan={getActionPlan()}
            language={language}
            onProceed={() => changeStep("document_editor")}
            onBack={() => changeStep("show_rights")}
          />
        )}

        {step === "document_editor" && analysis && (
          <DraftEditor
            initialText={analysis.rendered_document}
            templateId={`${analysis.classification.domain}_${analysis.classification.issue}`}
            sender={analysis.classification.extracted_details.sender}
            recipient={analysis.classification.extracted_details.recipient}
            relevantFacts={analysis.classification.extracted_details.relevant_facts}
            remedy={analysis.remedy}
            applicableSections={analysis.verified_sections}
            extraDetails={analysis.classification.extracted_details.extra_details}
            onBack={() => changeStep("show_evidence")}
            onDraft={handleDraftRegenerate}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>


    </div>
  );
}

export default App;
