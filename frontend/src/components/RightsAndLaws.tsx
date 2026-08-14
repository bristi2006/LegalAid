import React, { useState } from "react";
import { Scale, BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

interface VerifiedSection {
  act: string;
  section: string;
  meaning: string;
  source?: string;
  source_url?: string;
  verified: boolean;
}

interface RightsAndLawsProps {
  rightsExplanation: string;
  verifiedSections: VerifiedSection[];
  riskStatus: "Strongly Supported" | "Needs Verification" | "Professional Review Recommended";
  riskReason: string;
  onProceed: () => void;
  onBack: () => void;
  language: string;
}

export const RightsAndLaws: React.FC<RightsAndLawsProps> = ({
  rightsExplanation, verifiedSections, riskStatus, riskReason, onProceed, onBack, language
}) => {
  const isHindi = language.toLowerCase() === "hindi";
  const [detailsOpen, setDetailsOpen] = useState(false);

  const riskConfig = {
    "Strongly Supported": {
      bg: "#f0fdf4", border: "#86efac", stripe: "#16a34a",
      badge: { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
      icon: <ShieldCheck style={{ width: 20, height: 20, color: "#16a34a" }} />,
      label: isHindi ? "🟢 पूर्ण समर्थित" : "🟢 Strongly Supported",
    },
    "Needs Verification": {
      bg: "#fffbeb", border: "#fcd34d", stripe: "#d97706",
      badge: { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" },
      icon: <AlertTriangle style={{ width: 20, height: 20, color: "#d97706" }} />,
      label: isHindi ? "🟡 सत्यापन की आवश्यकता" : "🟡 Needs Verification",
    },
    "Professional Review Recommended": {
      bg: "#fff1f2", border: "#fca5a5", stripe: "#dc2626",
      badge: { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
      icon: <AlertCircle style={{ width: 20, height: 20, color: "#dc2626" }} />,
      label: isHindi ? "🔴 पेशेवर समीक्षा अनुशंसित" : "🔴 Professional Review Recommended",
    },
  };
  const cfg = riskConfig[riskStatus];

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
          {isHindi ? "पीछे जाएं" : "Back to Summary"}
        </button>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "5px 14px", marginBottom: 10 }}>
            <Scale style={{ width: 13, height: 13, color: "#4f46e5" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>
              {isHindi ? "कानूनी अधिकार" : "Rights & Laws"}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            {isHindi ? "आपके संभावित कानूनी अधिकार" : "Your Possible Legal Rights"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            {isHindi ? "सत्यापित भारतीय कानूनी धाराओं के साथ।" : "With verified Indian statutory provisions."}
          </p>
        </div>

        {/* Risk Status Banner */}
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderLeft: `5px solid ${cfg.stripe}`,
          borderRadius: 16, padding: "20px 24px", marginBottom: 24,
          display: "flex", alignItems: "flex-start", gap: 16,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.badge.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {cfg.icon}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{
              display: "inline-flex", padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800,
              background: cfg.badge.bg, color: cfg.badge.text, border: `1px solid ${cfg.badge.border}`,
              marginBottom: 8, letterSpacing: "0.02em",
            }}>
              {cfg.label}
            </span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
              {isHindi ? "यह स्थिति क्यों है?" : "Why this status?"}
            </h3>
            <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.6 }}>{riskReason}</p>
          </div>
        </div>

        {/* Rights Explanation card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", marginBottom: 20 }}>
          {/* Card header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scale style={{ width: 18, height: 18, color: "#4f46e5" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {isHindi ? "आपके अधिकार (सारांश)" : "Your Rights (Summary)"}
              </h2>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                {isHindi ? "सरल भाषा में" : "In plain language"}
              </p>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 14, color: "#334155", margin: "0 0 16px", lineHeight: 1.7, fontWeight: 500 }}>
              {isHindi
                ? "आपको मजदूरी के भुगतान, उपभोक्ता संरक्षण या किरायेदारी नियमों के तहत कानूनी राहत के अधिकार मिल सकते हैं।"
                : "You may have rights relating to payment of wages, consumer protection, or tenancy terms."}
            </p>

            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#4f46e5", padding: 0 }}
            >
              {isHindi ? "पूर्ण कानूनी विवरण" : "Full legal details"}
              {detailsOpen ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
            </button>

            {detailsOpen && (
              <div style={{ marginTop: 16, padding: "16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 13, color: "#475569", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {rightsExplanation}
              </div>
            )}
          </div>
        </div>

        {/* Verified Provisions */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(79,70,229,0.05)", marginBottom: 24 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen style={{ width: 18, height: 18, color: "#16a34a" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {isHindi ? "सत्यापित कानूनी धाराएं" : "Verified Legal Provisions"}
                </h2>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Only verified references are displayed</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {verifiedSections.filter(sec => sec.verified).map((sec, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Green top accent stripe */}
                <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 800 }}>
                      <CheckCircle2 style={{ width: 11, height: 11 }} />
                      VERIFIED PROVISION
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 3px" }}>{sec.section}</h4>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", margin: 0 }}>{sec.act}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                      Why this may apply
                    </span>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.6 }}>{sec.meaning}</p>
                  </div>
                  {sec.source_url && (
                    <a
                      href={sec.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#eef2ff", color: "#4f46e5", fontSize: 12, fontWeight: 700, textDecoration: "none", width: "fit-content", border: "1px solid #c7d2fe" }}
                    >
                      {isHindi ? "आधिकारिक स्रोत देखें" : "View Official Source"}
                      <ExternalLink style={{ width: 12, height: 12 }} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {verifiedSections.filter(s => s.verified).length === 0 && (
              <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No verified citations applicable to this case.</p>
            )}
          </div>
        </div>

        {/* Proceed */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            id="rights-proceed-btn"
            onClick={onProceed}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(79,70,229,0.3)", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
          >
            {isHindi ? "आवश्यक साक्ष्य देखें" : "Proceed to Evidence & Next Steps"}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
};
