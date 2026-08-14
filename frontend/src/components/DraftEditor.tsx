import React, { useState } from "react";
import { ArrowLeft, Download, FileText, RefreshCw, Loader, AlertTriangle, User, Briefcase, List, Target } from "lucide-react";

interface DraftEditorProps {
  initialText: string;
  templateId: string;
  sender: any;
  recipient: any;
  relevantFacts: string[];
  remedy: string;
  applicableSections: any[];
  extraDetails: any;
  onBack: () => void;
  onDraft: (payload: any) => Promise<string>;
  onExportPdf: (text: string) => Promise<Blob>;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  initialText, templateId, sender: initialSender, recipient: initialRecipient,
  relevantFacts: initialFacts, remedy: initialRemedy, applicableSections, extraDetails,
  onBack, onDraft, onExportPdf
}) => {
  const [draftText, setDraftText] = useState(initialText);
  const [senderName, setSenderName] = useState(initialSender?.name || "");
  const [senderAddress, setSenderAddress] = useState(initialSender?.address || "");
  const [senderContact, setSenderContact] = useState(initialSender?.contact || "");
  const [senderDesignation, setSenderDesignation] = useState(initialSender?.designation || "");
  const [senderEmpId, setSenderEmpId] = useState(initialSender?.employee_id || "");
  const [recipientName, setRecipientName] = useState(initialRecipient?.name || "");
  const [recipientAddress, setRecipientAddress] = useState(initialRecipient?.address || "");
  const [recipientContact, setRecipientContact] = useState(initialRecipient?.contact || "");
  const [recipientCompany, setRecipientCompany] = useState(initialRecipient?.company_name || "");
  const [recipientDesignation, setRecipientDesignation] = useState(initialRecipient?.designation || "");
  const [facts, setFacts] = useState(initialFacts.join("\n"));
  const [remedyText, setRemedyText] = useState(initialRemedy);
  const [drafting, setDrafting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCitationEdited = applicableSections && applicableSections.some(
    sec => sec.verified && (!draftText.includes(sec.section) || !draftText.includes(sec.act))
  );

  const handleRegenerate = async () => {
    setDrafting(true);
    setError(null);
    try {
      const payload = {
        template_id: templateId,
        date: new Date().toISOString().split("T")[0],
        sender: { name: senderName, address: senderAddress, contact: senderContact, designation: senderDesignation, employee_id: senderEmpId },
        recipient: { name: recipientName, address: recipientAddress, contact: recipientContact, company_name: recipientCompany, designation: recipientDesignation },
        relevant_facts: facts.split("\n").filter(f => f.trim() !== ""),
        issue_description: initialText.match(/SUBJECT: Legal Notice regarding (.*)/)?.[1] || "Grievance Description",
        applicable_sections: applicableSections,
        remedy: remedyText,
        extra_details: extraDetails
      };
      const newText = await onDraft(payload);
      setDraftText(newText);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate draft notice.");
    } finally {
      setDrafting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await onExportPdf(draftText);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legal_notice_${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 12,
    fontWeight: 500,
    color: "#1e293b",
    background: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 10,
  };

  return (
    <div style={{ minHeight: "calc(100vh - 65px)", background: "#f8fafc", padding: "32px 16px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to Next Steps
        </button>

        {/* Page title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "5px 14px", marginBottom: 8 }}>
              <FileText style={{ width: 13, height: 13, color: "#4f46e5" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>Notice Draft Editor</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>Legal Notice Draft</h1>
          </div>
          {/* Export PDF button */}
          <button
            id="draft-export-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={exporting || !draftText.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 12, border: "none",
              background: exporting || !draftText.trim() ? "#e2e8f0" : "linear-gradient(135deg, #059669, #10b981)",
              color: exporting || !draftText.trim() ? "#94a3b8" : "#ffffff",
              fontSize: 13, fontWeight: 700, cursor: exporting || !draftText.trim() ? "not-allowed" : "pointer",
              boxShadow: exporting || !draftText.trim() ? "none" : "0 4px 14px rgba(16,185,129,0.3)",
              transition: "all 0.2s",
            }}
          >
            {exporting ? (
              <><Loader style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />Generating PDF...</>
            ) : (
              <><Download style={{ width: 16, height: 16 }} />Download PDF Notice</>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertTriangle style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
            <strong>MANDATORY LEGAL WARNING: </strong>
            This drafted document is auto-generated for informational purposes only. It is not legal advice and should be reviewed, edited, and approved by a qualified lawyer before signature or official delivery.
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>

          {/* LEFT: Parameters Panel */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", maxHeight: "82vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Panel header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText style={{ width: 16, height: 16, color: "#4f46e5" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Notice Parameters</h2>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Edit fields and regenerate</p>
              </div>
            </div>

            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
              {error && (
                <div style={{ background: "#fef2f2", borderLeft: "3px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b91c1c" }}>{error}</div>
              )}

              {/* SENDER */}
              <div>
                <div style={sectionHeaderStyle}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User style={{ width: 11, height: 11, color: "#4f46e5" }} />
                  </div>
                  Sender / Applicant
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { val: senderName, set: setSenderName, ph: "Full Name" },
                    { val: senderAddress, set: setSenderAddress, ph: "Address" },
                    { val: senderContact, set: setSenderContact, ph: "Contact (Phone / Email)" },
                  ].map((f, i) => (
                    <input key={i} type="text" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    />
                  ))}
                  {templateId.includes("labour") && (
                    <>
                      <input type="text" placeholder="Designation" value={senderDesignation} onChange={e => setSenderDesignation(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                      <input type="text" placeholder="Employee ID" value={senderEmpId} onChange={e => setSenderEmpId(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </>
                  )}
                </div>
              </div>

              {/* RECIPIENT */}
              <div>
                <div style={sectionHeaderStyle}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase style={{ width: 11, height: 11, color: "#ea580c" }} />
                  </div>
                  Recipient / Opposing Party
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { val: recipientName, set: setRecipientName, ph: "Recipient Name" },
                    { val: recipientAddress, set: setRecipientAddress, ph: "Address" },
                    { val: recipientContact, set: setRecipientContact, ph: "Contact" },
                  ].map((f, i) => (
                    <input key={i} type="text" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                      onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                    />
                  ))}
                  {templateId.includes("labour") && (
                    <>
                      <input type="text" placeholder="Company Name" value={recipientCompany} onChange={e => setRecipientCompany(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                      <input type="text" placeholder="Representative Designation" value={recipientDesignation} onChange={e => setRecipientDesignation(e.target.value)} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    </>
                  )}
                </div>
              </div>

              {/* FACTS */}
              <div>
                <div style={sectionHeaderStyle}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <List style={{ width: 11, height: 11, color: "#16a34a" }} />
                  </div>
                  Facts (one per line)
                </div>
                <textarea
                  rows={4}
                  placeholder="Enter timeline / facts..."
                  value={facts}
                  onChange={e => setFacts(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                  onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              {/* REMEDY */}
              <div>
                <div style={sectionHeaderStyle}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Target style={{ width: 11, height: 11, color: "#7c3aed" }} />
                  </div>
                  Demand / Remedy
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter remedy..."
                  value={remedyText}
                  onChange={e => setRemedyText(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                  onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              {/* Regenerate button */}
              <button
                id="draft-regenerate-btn"
                onClick={handleRegenerate}
                disabled={drafting}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: drafting ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: drafting ? "#94a3b8" : "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: drafting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: drafting ? "none" : "0 4px 14px rgba(79,70,229,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {drafting ? (
                  <><Loader style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />Regenerating...</>
                ) : (
                  <><RefreshCw style={{ width: 15, height: 15 }} />Regenerate Draft</>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Document Editor Panel */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Notice Document Draft</h2>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Click to edit text directly in the editor below</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                  {templateId}
                </span>
              </div>
            </div>

            {/* Citation warning */}
            {isCitationEdited && (
              <div style={{ background: "#fffbeb", borderBottom: "1px solid #fcd34d", padding: "10px 22px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertTriangle style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11, color: "#92400e" }}>
                  <strong>⚠️ Warning:</strong> A verified legal citation appears to have been modified. This may affect legal accuracy.
                </div>
              </div>
            )}

            {/* The document editor */}
            <div style={{ flex: 1, padding: "0 22px 22px", display: "flex", flexDirection: "column" }}>
              {/* Document letterhead styling */}
              <div style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", padding: "14px 18px", margin: "16px 0 0", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: 14, height: 14, color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>LEGAL NOTICE DOCUMENT</span>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <textarea
                id="draft-editor-textarea"
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: "60vh",
                  padding: "18px",
                  border: "1.5px solid #e2e8f0",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  fontSize: 12,
                  fontFamily: "'Courier New', 'Courier', monospace",
                  color: "#1e293b",
                  background: "#fdfdfe",
                  lineHeight: 1.8,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  width: "100%",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
