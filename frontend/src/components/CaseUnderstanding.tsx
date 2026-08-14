import React, { useState } from "react";
import { Edit3, CheckCircle2, ArrowRight, ArrowLeft, User, Briefcase, MapPin, Tag, FileText } from "lucide-react";

interface CaseUnderstandingProps {
  classification: {
    domain: string;
    issue: string;
    extracted_details: any;
  };
  onUpdateFacts: (updatedDetails: any) => void;
  onProceed: () => void;
  onBack: () => void;
  language: string;
}

export const CaseUnderstanding: React.FC<CaseUnderstandingProps> = ({ classification, onUpdateFacts, onProceed, onBack, language }) => {
  const isHindi = language.toLowerCase() === "hindi";
  const [isEditing, setIsEditing] = useState(false);

  const [domain, setDomain] = useState(classification.domain);
  const [issue, setIssue] = useState(classification.issue);
  const [senderName, setSenderName] = useState(classification.extracted_details.sender?.name || "");
  const [recipientName, setRecipientName] = useState(classification.extracted_details.recipient?.name || "");
  const [location, setLocation] = useState(
    classification.extracted_details.extra_details?.premises_address ||
    classification.extracted_details.sender?.address ||
    "Not Specified"
  );
  const [facts, setFacts] = useState<string[]>(classification.extracted_details.relevant_facts || []);

  const handleFactChange = (index: number, val: string) => {
    const updated = [...facts];
    updated[index] = val;
    setFacts(updated);
  };

  const handleUpdate = () => {
    const updatedDetails = {
      ...classification.extracted_details,
      sender: { ...classification.extracted_details.sender, name: senderName, address: location },
      recipient: { ...classification.extracted_details.recipient, name: recipientName },
      relevant_facts: facts.filter(f => f.trim() !== "")
    };
    onUpdateFacts(updatedDetails);
    setIsEditing(false);
  };

  const domainColors: Record<string, { bg: string; text: string; border: string }> = {
    consumer: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
    labour: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
    tenant: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  };
  const domStyle = domainColors[domain] || domainColors.consumer;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 12,
    fontWeight: 600,
    color: "#1e293b",
    background: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 65px)", background: "#f8fafc", padding: "32px 16px 48px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          {isHindi ? "पीछे जाएं" : "Back to Intake"}
        </button>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "5px 14px", marginBottom: 10 }}>
              <FileText style={{ width: 13, height: 13, color: "#4f46e5" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>
                {isHindi ? "केस विश्लेषण" : "Case Analysis"}
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
              {isHindi ? "केस की समझ" : "Case Understanding"}
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              {isHindi ? "हमारी AI ने आपकी शिकायत से निम्नलिखित विवरण की पहचान की है।" : "Our AI identified the following key parameters from your grievance."}
            </p>
          </div>
          <button
            onClick={() => { if (isEditing) handleUpdate(); else setIsEditing(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              border: `1.5px solid ${isEditing ? "transparent" : "#e2e8f0"}`,
              background: isEditing ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#ffffff",
              color: isEditing ? "#ffffff" : "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isEditing ? "0 4px 12px rgba(79,70,229,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isEditing ? (
              <><CheckCircle2 style={{ width: 14, height: 14 }} />{isHindi ? "सहेजें" : "Save Details"}</>
            ) : (
              <><Edit3 style={{ width: 14, height: 14 }} />{isHindi ? "सुधारें" : "That's not correct?"}</>
            )}
          </button>
        </div>

        {/* Main card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)" }}>

          {/* Parameters grid */}
          <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              {isHindi ? "मामले के विवरण" : "Case Parameters"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {/* Domain */}
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase style={{ width: 12, height: 12, color: "#4f46e5" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isHindi ? "Domain" : "Domain"}
                  </span>
                </div>
                {isEditing ? (
                  <select value={domain} onChange={e => setDomain(e.target.value)} style={{ ...{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#fff", outline: "none" } }}>
                    <option value="consumer">Consumer</option>
                    <option value="labour">Labour</option>
                    <option value="tenant">Tenant</option>
                  </select>
                ) : (
                  <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: domStyle.bg, color: domStyle.text, border: `1px solid ${domStyle.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {domain}
                  </span>
                )}
              </div>

              {/* Issue */}
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Tag style={{ width: 12, height: 12, color: "#7c3aed" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isHindi ? "Issue" : "Issue"}
                  </span>
                </div>
                {isEditing ? (
                  <input type="text" value={issue} onChange={e => setIssue(e.target.value)} style={{ ...{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" as const } }} />
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0, textTransform: "capitalize" }}>{issue.replace(/_/g, " ")}</p>
                )}
              </div>

              {/* Sender */}
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User style={{ width: 12, height: 12, color: "#059669" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isHindi ? "Sender" : "Sender"}
                  </span>
                </div>
                {isEditing ? (
                  <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" }} />
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{senderName || "Not Specified"}</p>
                )}
              </div>

              {/* Opposing Party */}
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase style={{ width: 12, height: 12, color: "#ea580c" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isHindi ? "Opposing Party" : "Opposing Party"}
                  </span>
                </div>
                {isEditing ? (
                  <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" }} />
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{recipientName || "Not Specified"}</p>
                )}
              </div>

              {/* Location - full width */}
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px", gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin style={{ width: 12, height: 12, color: "#e11d48" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isHindi ? "Location / Jurisdiction" : "Location / Jurisdiction"}
                  </span>
                </div>
                {isEditing ? (
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} style={{ ...inputStyle }} />
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fact Timeline */}
          <div style={{ padding: "24px 28px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 18px" }}>
              {isHindi ? "तथ्यों की समयरेखा" : "Chronological Facts"}
            </h2>
            <div style={{ position: "relative", paddingLeft: 32 }}>
              {/* Vertical connector line */}
              <div style={{ position: "absolute", left: 11, top: 16, bottom: 16, width: 2, background: "linear-gradient(180deg, #4f46e5, #e0e7ff)", borderRadius: 2 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {facts.map((fact, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ position: "absolute", left: 3, width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={fact}
                          onChange={e => handleFactChange(idx, e.target.value)}
                          style={{ ...inputStyle }}
                        />
                      ) : (
                        <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "10px 14px" }}>
                          <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.6 }}>{fact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          {!isEditing && (
            <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
              <button
                id="case-understanding-proceed-btn"
                onClick={onProceed}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(79,70,229,0.3)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
              >
                {isHindi ? "अधिकारों का विश्लेषण देखें" : "Proceed to My Rights"}
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
