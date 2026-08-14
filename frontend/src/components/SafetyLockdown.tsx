import React from "react";
import { PhoneCall, Home, AlertOctagon, ShieldX, ArrowLeft } from "lucide-react";

interface SafetyLockdownProps {
  reason: string;
  onReset: () => void;
  language: string;
}

export const SafetyLockdown: React.FC<SafetyLockdownProps> = ({ reason, onReset, language }) => {
  const isHindi = language.toLowerCase() === "hindi";

  const emergencyContacts = [
    { number: "112", label: isHindi ? "पुलिस आपातकाल" : "Police Emergency", icon: "🚔" },
    { number: "1091", label: isHindi ? "महिला हेल्पलाइन" : "Women Helpline", icon: "👩‍⚖️" },
    { number: "181", label: isHindi ? "महिला हेल्पलाइन (2)" : "Women Helpline Alt", icon: "📞" },
    { number: "100", label: isHindi ? "पुलिस हेल्पलाइन" : "Police Helpline", icon: "🚨" },
  ];

  return (
    <div style={{
      minHeight: "calc(100vh - 65px)",
      background: "linear-gradient(135deg, #fff1f2 0%, #fef2f2 50%, #ffe4e6 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
    }}>
      <div style={{ maxWidth: 600, width: "100%" }}>

        {/* Back */}
        <button
          onClick={onReset}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#b91c1c", padding: 0 }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          {isHindi ? "मुख्य स्क्रीन पर वापस जाएं" : "Return to Start Screen"}
        </button>

        {/* Main alert card */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #fca5a5",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(220,38,38,0.15), 0 4px 16px rgba(0,0,0,0.06)",
        }}>
          {/* Red top stripe */}
          <div style={{ height: 6, background: "linear-gradient(90deg, #dc2626, #ef4444, #f87171)" }} />

          <div style={{ padding: "36px 32px 32px", textAlign: "center" }}>
            {/* Animated icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                border: "2px solid #fca5a5",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "safetyPulse 2s ease-in-out infinite",
              }}>
                <AlertOctagon style={{ width: 40, height: 40, color: "#dc2626" }} />
              </div>
            </div>

            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 100, padding: "5px 14px", marginBottom: 16 }}>
              <ShieldX style={{ width: 12, height: 12, color: "#dc2626" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#b91c1c", letterSpacing: "0.04em" }}>SAFETY ALERT TRIGGERED</span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#7f1d1d", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              {isHindi ? "⚠️ तत्काल ध्यान दें" : "⚠️ Immediate Attention Required"}
            </h1>

            {/* Reason card */}
            <div style={{ background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 14, padding: "16px 20px", textAlign: "left", marginBottom: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", margin: "0 0 8px" }}>
                {isHindi ? "यह स्थिति तत्काल सुरक्षा या पेशेवर सहायता की मांग कर सकती है।" : "This situation may require immediate safety or professional assistance."}
              </p>
              <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 8px" }}>
                <strong>{isHindi ? "संकेतित खतरा:" : "Flagged aspect:"}</strong> "{reason}"
              </p>
              <p style={{ fontSize: 12, color: "#9f1239", margin: 0, lineHeight: 1.6 }}>
                {isHindi
                  ? "महत्वपूर्ण सुरक्षा चिंताओं के कारण, कानूनी नोटिस बनाने की सामान्य प्रक्रिया को रोक दिया गया है।"
                  : "For safety and liability reasons, the normal document-generation flow has been paused."}
              </p>
            </div>

            {/* Emergency contacts grid */}
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
              {isHindi ? "आपातकालीन संपर्क" : "Emergency Contacts"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {emergencyContacts.map((c) => (
                <a
                  key={c.number}
                  href={`tel:${c.number}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                    color: "#ffffff",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(220,38,38,0.35)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,0.25)"; }}
                >
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{c.number}</div>
                    <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>{c.label}</div>
                  </div>
                  <PhoneCall style={{ width: 14, height: 14, marginLeft: "auto", opacity: 0.8 }} />
                </a>
              ))}
            </div>

            {/* Return button */}
            <button
              id="safety-return-btn"
              onClick={onReset}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: 12,
                border: "1.5px solid #fca5a5",
                background: "#fff1f2",
                color: "#b91c1c",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff1f2")}
            >
              <Home style={{ width: 16, height: 16 }} />
              {isHindi ? "मुख्य स्क्रीन पर वापस जाएं" : "Return to Start Screen"}
            </button>

            <p style={{ fontSize: 11, color: "#f87171", marginTop: 14, fontWeight: 600, lineHeight: 1.5 }}>
              {isHindi
                ? "यदि आप किसी भी शारीरिक खतरे में हैं, तो कृपया तुरंत स्थानीय अधिकारियों से संपर्क करें।"
                : "If you are in immediate physical danger, please contact local law enforcement authorities immediately."}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes safetyPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
};
