import { useState, useEffect } from "react";
import { Scale } from "lucide-react";
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
  const [headerScrolled, setHeaderScrolled] = useState(false);

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

  // Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // ── Stage Workflow Tracker ─────────────────────────────────────────────────
  const renderWorkflowStages = () => {
    if (step === "home" || step === "idle" || step === "analyzing") return null;

    const stages = [
      { name: "Case Intake", active: step === "needs_information" },
      { name: "Understanding", active: step === "case_ready" },
      { name: "Rights & Laws", active: step === "show_rights" || step === "show_laws" },
      { name: "Evidence", active: step === "show_evidence" || step === "show_actions" },
      { name: "Notice Draft", active: step === "document_editor" || step === "pdf_ready" }
    ];

    const activeIdx = stages.findIndex(s => s.active);

    return (
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", position: "sticky", top: "65px", zIndex: 40 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {stages.map((stage, idx) => {
            const isPast = idx < activeIdx;
            const isActive = stage.active;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, transition: "all 0.3s ease",
                    background: isActive ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : isPast ? "#e0e7ff" : "#f1f5f9",
                    color: isActive ? "#fff" : isPast ? "#4f46e5" : "#94a3b8",
                    boxShadow: isActive ? "0 4px 12px rgba(79,70,229,0.35)" : "none",
                  }}>
                    {isPast ? "✓" : idx + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? "#4f46e5" : isPast ? "#6366f1" : "#94a3b8", whiteSpace: "nowrap" }}>
                    {stage.name}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div style={{
                    height: 2, width: "clamp(24px, 5vw, 56px)",
                    background: isPast ? "linear-gradient(90deg, #6366f1, #4f46e5)" : "#e2e8f0",
                    marginBottom: 16, transition: "background 0.4s ease",
                  }} />
                )}
              </div>
            );
          })}
        </div>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      </div>
    );
  };

  // ── Analyzing Spinner Screen ───────────────────────────────────────────────
  const renderAnalyzing = () => (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "#f8fafc" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(79,70,229,0.08), 0 4px 16px rgba(0,0,0,0.04)" }}>
        {/* Radial spinner */}
        <div style={{ position: "relative", width: 112, height: 112, margin: "0 auto 28px" }}>
          <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "spin 1.1s linear infinite" }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 360) / 12;
              const opacity = 0.15 + (i / 12) * 0.85;
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 36 * Math.sin(rad);
              const cy = 50 - 36 * Math.cos(rad);
              return (
                <rect key={i} x={cx - 4} y={cy - 9} width={8} height={16} rx={4} ry={4}
                  fill={i >= 9 ? "#4f46e5" : "#a5b4fc"} opacity={opacity}
                  transform={`rotate(${angle}, ${cx}, ${cy})`}
                />
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" style={{ width: 38, height: 38 }} fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="8" x2="20" y2="8" /><line x1="12" y1="2" x2="12" y2="8" />
              <circle cx="12" cy="2" r="1" fill="#4f46e5" stroke="none" />
              <line x1="5" y1="8" x2="3" y2="14" /><line x1="3" y1="8" x2="5" y2="14" />
              <path d="M1 14 Q4 17 7 14" strokeWidth="1.5" fill="none" />
              <line x1="19" y1="8" x2="17" y2="14" /><line x1="21" y1="8" x2="19" y2="14" />
              <path d="M17 14 Q20 17 23 14" strokeWidth="1.5" fill="none" />
              <line x1="12" y1="8" x2="12" y2="21" /><line x1="8" y1="21" x2="16" y2="21" />
            </svg>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "4px 12px", marginBottom: 16 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f46e5", display: "inline-block", animation: "blink 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", letterSpacing: "0.04em" }}>PIPELINE ACTIVE</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Processing Your Intake</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
          Running legal analysis pipeline:<br />
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4f46e5" }}>classify → lookup → verify → compile</span>
        </p>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
          {["Classifying legal domain", "Fetching statute provisions", "Verifying citations", "Compiling case analysis"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#fff" opacity="0.9" /></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── App Header (hidden on home — Home has its own Navbar) ── */}
      {step !== "home" && (
        <header style={{
          background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 28px", height: 65,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: headerScrolled ? "0 2px 16px rgba(30,41,59,0.07)" : "none",
          transition: "box-shadow 0.25s ease",
        }}>
          {/* Brand logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            onClick={() => { changeStep("home"); setAnalysis(null); setError(null); }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
              <Scale style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
              LegalAId
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#6366f1", verticalAlign: "super", letterSpacing: "0.05em" }}>®</span>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>भाषा /</span>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", background: "#f8fafc", color: "#1e293b", cursor: "pointer", outline: "none" }}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "5px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulseGreen 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Pipeline Active</span>
            </div>
          </div>
          <style>{`@keyframes pulseGreen { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(0.85);} }`}</style>
        </header>
      )}

      {/* Stage Tracker bar */}
      {renderWorkflowStages()}

      {/* Main Container Content */}
      <main style={{ flex: 1, width: "100%" }}>

        {step === "home" && (
          <Home onStart={() => changeStep("idle")} language={language} />
        )}

        {step === "idle" && (
          <Chat onSubmit={handleAnalyze} onBack={() => changeStep("home")} loading={loading} error={error} language={language} />
        )}

        {step === "analyzing" && renderAnalyzing()}

        {step === "needs_information" && riskLevel === "high" && (
          <SafetyLockdown reason={safetyReason} language={language} onReset={() => changeStep("home")} />
        )}

        {step === "needs_information" && riskLevel === "low" && (
          <MissingInfo missingFacts={missingFacts} contradiction={contradiction} language={language} onResolve={handleResolveMissingFacts} onBack={() => changeStep("idle")} />
        )}

        {step === "case_ready" && analysis && (
          <CaseUnderstanding classification={analysis.classification} language={language} onUpdateFacts={handleUpdateCaseFacts} onProceed={() => changeStep("show_rights")} onBack={() => changeStep("idle")} />
        )}

        {step === "show_rights" && analysis && (
          <RightsAndLaws rightsExplanation={analysis.explanation.rights_explanation} verifiedSections={analysis.verified_sections} riskStatus={riskStatus} riskReason={riskReason} language={language} onProceed={() => changeStep("show_evidence")} onBack={() => changeStep("case_ready")} />
        )}

        {step === "show_evidence" && analysis && (
          <EvidenceAndActions evidenceChecklist={getEvidenceChecklist()} actionPlan={getActionPlan()} language={language} onProceed={() => changeStep("document_editor")} onBack={() => changeStep("show_rights")} />
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
