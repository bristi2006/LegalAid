import React, { useState } from "react";
import { HelpCircle, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface MissingInfoProps {
  missingFacts: string[];
  contradiction: { field: string; values: string[] } | null;
  onResolve: (resolvedFacts: Record<string, string>, resolvedContradiction: string | null) => void;
  onBack: () => void;
  language: string;
}

export const MissingInfo: React.FC<MissingInfoProps> = ({ missingFacts, contradiction, onResolve, onBack, language }) => {
  const isHindi = language.toLowerCase() === "hindi";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedContradiction, setSelectedContradiction] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve(answers, selectedContradiction);
  };

  const renderFieldQuestion = (field: string) => {
    switch (field) {
      case "employment_status":
        return {
          question: isHindi ? "आपके काम करने की व्यवस्था को सबसे बेहतर क्या दर्शाता है?" : "What best describes your work arrangement?",
          options: [
            { value: "Full-time employee", label: isHindi ? "पूर्णकालिक कर्मचारी" : "Full-time employee", icon: "👔" },
            { value: "Part-time employee", label: isHindi ? "अंशकालिक कर्मचारी" : "Part-time employee", icon: "🕐" },
            { value: "Contract worker", label: isHindi ? "अनुबंध कार्यकर्ता" : "Contract worker", icon: "📄" },
            { value: "Apprentice", label: isHindi ? "प्रशिक्षु" : "Apprentice", icon: "🎓" },
            { value: "Other", label: isHindi ? "अन्य" : "Other", icon: "➕" },
          ]
        };
      case "state":
        return {
          question: isHindi ? "यह मामला किस राज्य में हुआ था?" : "Which state did this matter occur in?",
          options: [
            { value: "Gujarat", label: "Gujarat", icon: "🗺️" },
            { value: "Delhi", label: "Delhi", icon: "🏛️" },
            { value: "Karnataka", label: "Karnataka", icon: "🌿" },
            { value: "Maharashtra", label: "Maharashtra", icon: "🌊" },
            { value: "Other", label: isHindi ? "अन्य राज्य" : "Other State", icon: "📍" },
          ]
        };
      case "premises_address":
        return {
          question: isHindi ? "किराए के परिसर का पूरा पता क्या है?" : "What is the full address of the rented premises?",
          input: true,
          placeholder: "e.g. Flat 304, Maple Heights, HSR Layout, Bengaluru"
        };
      case "purchase_date":
        return {
          question: isHindi ? "खरीदारी या लेनदेन की तारीख क्या थी?" : "What was the date of purchase or transaction?",
          date: true
        };
      default:
        return {
          question: `Please provide details for: ${field.replace(/_/g, " ")}`,
          input: true,
          placeholder: `Enter ${field.replace(/_/g, " ")}`
        };
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 500,
    color: "#1e293b",
    background: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 65px)", background: "#f8fafc", padding: "32px 16px 48px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          {isHindi ? "पीछे जाएं" : "Back to Input"}
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "5px 14px", marginBottom: 14 }}>
            <HelpCircle style={{ width: 13, height: 13, color: "#4f46e5" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>
              {isHindi ? "अतिरिक्त विवरण" : "Additional Details Required"}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            {isHindi ? "कुछ विवरण और चाहिए" : "A few more details needed"}
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            {isHindi
              ? "मामले के सही विश्लेषण के लिए कृपया निम्नलिखित जानकारी प्रदान करें।"
              : "To perform an accurate rights analysis, please complete the fields below."}
          </p>
        </div>

        {/* Main card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(79,70,229,0.05)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Contradiction Section */}
            {contradiction && (
              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle style={{ width: 18, height: 18, color: "#d97706" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>
                      {isHindi ? "⚠️ विरोधाभासी विवरण पाया गया" : "⚠️ Conflicting detail detected"}
                    </h3>
                    <p style={{ fontSize: 12, color: "#b45309", margin: 0, lineHeight: 1.6 }}>
                      {isHindi
                        ? `आपके विवरण में दो अलग-अलग ${contradiction.field} मूल्य मिले। कृपया सही एक चुनें:`
                        : `You referenced two values for ${contradiction.field}. Please confirm the correct one:`}
                    </p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {contradiction.values.map((val) => (
                    <label
                      key={val}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `2px solid ${selectedContradiction === val ? "#4f46e5" : "#e2e8f0"}`,
                        background: selectedContradiction === val ? "#eef2ff" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: selectedContradiction === val ? "#3730a3" : "#475569" }}>{val}</span>
                      <input
                        type="radio"
                        name="contradiction"
                        value={val}
                        checked={selectedContradiction === val}
                        onChange={() => setSelectedContradiction(val)}
                        required
                        style={{ accentColor: "#4f46e5", width: 16, height: 16 }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Facts Questions */}
            {missingFacts.map((field) => {
              const q = renderFieldQuestion(field);
              return (
                <div key={field}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>
                    {q.question}
                  </label>

                  {q.options && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                      {q.options.map((opt: any) => (
                        <label
                          key={opt.value}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: `2px solid ${answers[field] === opt.value ? "#4f46e5" : "#e2e8f0"}`,
                            background: answers[field] === opt.value ? "#eef2ff" : "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{opt.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: answers[field] === opt.value ? "#3730a3" : "#475569", flex: 1 }}>{opt.label}</span>
                          {answers[field] === opt.value && <CheckCircle2 style={{ width: 16, height: 16, color: "#4f46e5", flexShrink: 0 }} />}
                          <input
                            type="radio"
                            name={field}
                            value={opt.value}
                            checked={answers[field] === opt.value}
                            onChange={() => setAnswers({ ...answers, [field]: opt.value })}
                            required
                            style={{ display: "none" }}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {q.input && (
                    <input
                      type="text"
                      required
                      placeholder={q.placeholder}
                      value={answers[field] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field]: e.target.value })}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  )}

                  {q.date && (
                    <input
                      type="date"
                      required
                      value={answers[field] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field]: e.target.value })}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  )}
                </div>
              );
            })}

            {/* Submit */}
            <button
              id="missinginfo-submit-btn"
              type="submit"
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 6px 20px rgba(79,70,229,0.3)",
                letterSpacing: "-0.01em",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
            >
              {isHindi ? "आगे बढ़ें और विश्लेषण करें" : "Proceed with Analysis"}
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
