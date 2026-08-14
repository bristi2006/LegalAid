import React, { useState } from "react";
import { FileCheck2, Compass, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface EvidenceAndActionsProps {
  evidenceChecklist: string[];
  actionPlan: string[];
  onProceed: () => void;
  onBack: () => void;
  language: string;
}

export const EvidenceAndActions: React.FC<EvidenceAndActionsProps> = ({
  evidenceChecklist, actionPlan, onProceed, onBack, language
}) => {
  const isHindi = language.toLowerCase() === "hindi";
  const [checkedEvidence, setCheckedEvidence] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedEvidence({ ...checkedEvidence, [idx]: !checkedEvidence[idx] });
  };

  const checkedCount = Object.values(checkedEvidence).filter(Boolean).length;
  const totalCount = evidenceChecklist.length;

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
          {isHindi ? "पीछे जाएं" : "Back to Laws"}
        </button>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 100, padding: "5px 14px", marginBottom: 10 }}>
            <FileCheck2 style={{ width: 13, height: 13, color: "#16a34a" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>
              {isHindi ? "साक्ष्य एवं कार्ययोजना" : "Evidence & Action Plan"}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            {isHindi ? "साक्ष्य और अगले कदम" : "Evidence & Next Steps"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            {isHindi ? "इन दस्तावेजों को इकट्ठा करें और कार्य योजना का पालन करें।" : "Gather these documents and follow the action plan below."}
          </p>
        </div>

        {/* Evidence Checklist card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", marginBottom: 20 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileCheck2 style={{ width: 18, height: 18, color: "#16a34a" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {isHindi ? "संभावित साक्ष्य जिनकी आपको आवश्यकता होगी" : "Evidence You May Need"}
                </h2>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Reference checklist — gather to strengthen your claim</p>
              </div>
            </div>
            {/* Progress indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 100, padding: "5px 12px" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{checkedCount}</span>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>/ {totalCount}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#f1f5f9" }}>
            <div style={{ height: "100%", width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`, background: "linear-gradient(90deg, #16a34a, #4ade80)", transition: "width 0.4s ease", borderRadius: 2 }} />
          </div>

          <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {evidenceChecklist.map((item, idx) => (
              <button
                key={idx}
                onClick={() => toggleCheck(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `2px solid ${checkedEvidence[idx] ? "#86efac" : "#e2e8f0"}`,
                  background: checkedEvidence[idx] ? "#f0fdf4" : "#f8fafc",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: checkedEvidence[idx] ? "#16a34a" : "#ffffff",
                  border: `2px solid ${checkedEvidence[idx] ? "#16a34a" : "#d1d5db"}`,
                  transition: "all 0.2s",
                }}>
                  {checkedEvidence[idx] && <CheckCircle2 style={{ width: 14, height: 14, color: "#fff" }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: checkedEvidence[idx] ? "#15803d" : "#334155", lineHeight: 1.4 }}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Plan card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", marginBottom: 20 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Compass style={{ width: 18, height: 18, color: "#4f46e5" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {isHindi ? "आगे की कार्ययोजना" : "What You Can Do Next"}
              </h2>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Step-by-step recommended actions</p>
            </div>
          </div>

          <div style={{ padding: "24px 28px", position: "relative" }}>
            {/* Vertical timeline line */}
            <div style={{ position: "absolute", left: 48, top: 40, bottom: 40, width: 2, background: "linear-gradient(180deg, #4f46e5, #e0e7ff)", borderRadius: 2 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {actionPlan.map((step, idx) => (
                <div key={idx} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                    zIndex: 1,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "12px 16px", flex: 1 }}>
                    <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
            <strong>IMPORTANT LEGAL DISCLAIMER: </strong>
            LegalAid provides general legal information, not legal advice. Laws and procedures may vary based on your facts and jurisdiction. Consult a lawyer before acting.
          </div>
        </div>

        {/* Proceed */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            id="evidence-proceed-btn"
            onClick={onProceed}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(79,70,229,0.3)", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
          >
            {isHindi ? "कानूनी दस्तावेज तैयार करें" : "Create Legal Notice Draft"}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
};
