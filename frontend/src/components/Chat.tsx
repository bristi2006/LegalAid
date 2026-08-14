import React, { useState } from "react";
import { MessageSquare, ShieldAlert, Loader, ArrowLeft, ChevronRight } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { DocumentUploader } from "./DocumentUploader";

interface ChatProps {
  onSubmit: (query: string) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  language: string;
}

const EXAMPLES_EN = [
  {
    label: "Consumer Case",
    icon: "🛒",
    text: "My name is Jane Doe, contact +91-9876543210, living at Flat 101, Sunny Apartments, Sector 45, Gurgaon. I purchased a SuperTech Pro washing machine on 2026-07-01 for Rs. 35,000 from SuperTech Electronics Pvt. Ltd., Noida. Upon delivery on 2026-07-03, it was defective and failed to spin. I raised a complaint but they refused to help. I want a refund of my Rs. 35,000."
  },
  {
    label: "Labour Case",
    icon: "💼",
    text: "My name is Amit Sharma (employee ID EMP-4091), a Senior Software Engineer residing at C-12, Green Park Extension, New Delhi. I worked at WebScale Solutions Pvt. Ltd., Cyber City, Gurgaon. My director Vijay Shekhar did not pay my June 2026 salary of Rs. 1,80,000 after I resigned and completed my notice period on 2026-06-30. Please issue a notice demanding payment of Rs. 1,80,000."
  },
  {
    label: "Tenant Case",
    icon: "🏠",
    text: "My name is Rohan Verma. I was a tenant at Flat 304, Maple Heights, HSR Layout, Bengaluru under a rent agreement dated 2025-06-01. I vacated the flat on 2026-05-31 and handed over the keys. My landlord K. R. Murthy (Jayanagar, Bengaluru) has refused to return my security deposit of Rs. 1,00,000. I paid a monthly rent of Rs. 25,000."
  }
];

const EXAMPLES_HI = [
  {
    label: "उपभोक्ता मामला",
    icon: "🛒",
    text: "मेरा नाम जेना डो है, संपर्क +91-9876543210, फ्लैट 101, सनी अपार्टमेंट्स, सेक्टर 45, गुड़गांव में रहती हूँ। मैंने 2026-07-01 को सुपरटेक इलेक्ट्रॉनिक्स प्राइवेट लिमिटेड, नोएडा से 35,000 रुपये में सुपरटेक प्रो वॉशिंग मशीन खरीदी थी। 2026-07-03 को डिलीवरी पर यह खराब निकली और स्पिन नहीं हो रही थी। मैंने शिकायत की लेकिन उन्होंने मदद करने से इनकार कर दिया। मुझे मेरे 35,000 रुपये का रिफंड चाहिए।"
  },
  {
    label: "श्रम मामला",
    icon: "💼",
    text: "मेरा नाम अमित शर्मा है (कर्मचारी आईडी EMP-4091), सी-12, ग्रीन पार्क एक्सटेंशन, नई दिल्ली का रहने वाला सॉफ्टवेयर इंजीनियर हूँ। मैंने वेबस्केल सॉल्यूशंस प्राइवेट लिमिटेड, साइबर सिटी, गुड़गांव में काम किया। मेरे डायरेक्टर विजय शेखर ने 2026-06-30 को मेरे इस्तीफा देने और नोटिस पीरियड पूरा करने के बाद भी मेरी जून 2026 की सैलरी 1,80,000 रुपये नहीं दी।"
  },
  {
    label: "किरायेदार मामला",
    icon: "🏠",
    text: "मेरा नाम रोहन वर्मा है। मैं किराया समझौते दिनांक 2025-06-01 के तहत फ्लैट 304, मेपल हाइट्स, एचएसआर लेआउट, बेंगलुरु में किराएदार था। मैंने 2026-05-31 को फ्लैट खाली कर दिया और चाबियां सौंप दीं। मेरे मकान मालिक के. आर. मूर्ति ने मेरे सुरक्षा जमा 1,00,000 रुपये वापस करने से इनकार कर दिया है।"
  }
];

const EXAMPLES_HINGLISH = [
  {
    label: "Consumer",
    icon: "🛒",
    text: "Mera naam Jane Doe hai, contact number +91-9876543210, Flat 101, Sunny Apartments, Sector 45, Gurgaon me rehti hu. Maine 2026-07-01 ko SuperTech Electronics Noida se 35,000 Rupees me ek washing machine kharidi thi. Delivery ke baad pata chala ki machine defective hai aur spin nahi kar rahi. Maine unse replacement manga par unhone refuse kar diya. Please help me get a refund of my Rs. 35,000."
  },
  {
    label: "Labour",
    icon: "💼",
    text: "Mera naam Amit Sharma hai, employee id EMP-4091. Main WebScale Solutions Pvt. Ltd., Gurgaon me software engineer tha. Mera director Vijay Shekhar ne mera June 2026 ka salary Rs 1,80,000 hold kar diya hai. Maine 2026-06-30 ko apna notice period serve karke resign kar diya tha par unhone salary nahi di. Please issue a legal notice."
  },
  {
    label: "Tenant",
    icon: "🏠",
    text: "Mera naam Rohan Verma hai. Main Flat 304, Maple Heights, HSR Layout, Bengaluru me rent pe rehta tha. Rent agreement date 2025-06-01 thi. Maine 2026-05-31 ko flat vacate kar diya aur keys hand over kar di. Mera landlord K. R. Murthy mera security deposit Rs 1,00,000 wapas nahi de raha hai."
  }
];

export const Chat: React.FC<ChatProps> = ({ onSubmit, onBack, loading, error, language }) => {
  const [query, setQuery] = useState("");
  const [focusedArea, setFocusedArea] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSubmit(query);
  };

  const isHindi = language.trim().toLowerCase() === "hindi";
  const isHinglish = language.trim().toLowerCase() === "hinglish";

  const getExamples = () => {
    if (isHindi) return EXAMPLES_HI;
    if (isHinglish) return EXAMPLES_HINGLISH;
    return EXAMPLES_EN;
  };

  const examples = getExamples();

  // Inline styles for the premium theme
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(79,70,229,0.05), 0 1px 4px rgba(0,0,0,0.04)",
    padding: "32px",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 65px)", background: "#f8fafc", padding: "32px 16px 48px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Breadcrumb back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b", padding: 0, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          {isHindi ? "मुख्य पृष्ठ पर वापस" : isHinglish ? "Home par wapas" : "Back to Home"}
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 100, padding: "6px 16px", marginBottom: 16 }}>
            <MessageSquare style={{ width: 14, height: 14, color: "#4f46e5" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4338ca" }}>
              {isHindi ? "शिकायत दर्ज करें" : isHinglish ? "Grievance Intake" : "Grievance Intake"}
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {isHindi ? "अपनी कानूनी समस्या बताएं"
              : isHinglish ? "Apni Legal Problem Batayein"
              : "Describe Your Legal Issue"}
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            {isHindi
              ? "सरल शब्दों में लिखें। हमारा AI पाइपलाइन आपके अधिकारों की पहचान करेगा और पेशेवर कानूनी नोटिस तैयार करेगा।"
              : isHinglish
              ? "Simple words me likhe. Humara AI system aapke rights identify karega aur legal notice draft karega."
              : "Write in plain language. Our AI pipeline will identify your rights, verify applicable statutes, and draft a professional legal notice."}
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "14px 16px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <ShieldAlert style={{ width: 18, height: 18, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
            <strong>MANDATORY DISCLAIMER: </strong>
            This application is auto-generated for informational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. Please consult a qualified lawyer before taking any legal action.
          </div>
        </div>

        {/* Main card */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit}>

            {/* Label + tools row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <label htmlFor="grievance" style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                {isHindi ? "आपकी शिकायत का विवरण" : isHinglish ? "Apki Grievance Description" : "Tell us what happened"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <VoiceRecorder language={language} disabled={loading} onTranscript={(t) => setQuery(p => p ? `${p} ${t}` : t)} />
                <DocumentUploader language={language} disabled={loading} onDocumentExtracted={(t) => setQuery(p => p ? `${p}\n\n${t}` : t)} />
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="grievance"
              rows={7}
              disabled={loading}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocusedArea(true)}
              onBlur={() => setFocusedArea(false)}
              placeholder={
                isHindi ? "अपनी समस्या यहाँ लिखें... जैसे: अवैतनिक वेतन, किरायेदार की सुरक्षा जमा, दोषपूर्ण उत्पाद"
                : isHinglish ? "Apni problem yahan likhe... jaise: unpaid salary, security deposit, defective product"
                : "Describe your legal problem here... (e.g. unpaid salary, tenant security deposit, defective product)"
              }
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1.5px solid ${focusedArea ? "#4f46e5" : "#e2e8f0"}`,
                boxShadow: focusedArea ? "0 0 0 3px rgba(79,70,229,0.1)" : "none",
                fontSize: 14,
                color: "#1e293b",
                background: "#f8fafc",
                fontFamily: "'Inter', system-ui, sans-serif",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
              {isHindi ? "* केवल उपभोक्ता शिकायतें, वेतन दावे और किरायेदार विवाद समर्थित हैं।"
                : isHinglish ? "* Sirf consumer complaints, unpaid wages, aur tenant security deposit disputes supported hain."
                : "* Only consumer complaints, employee unpaid wages, and landlord-tenant security deposit disputes are currently supported."}
            </p>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: 10, padding: "12px 16px", marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <ShieldAlert style={{ width: 16, height: 16, color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", margin: "0 0 4px" }}>
                    {isHindi ? "विश्लेषण त्रुटि" : "Analysis Error"}
                  </p>
                  <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>{error}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              id="chat-submit-btn"
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "15px 24px",
                borderRadius: 14,
                border: "none",
                background: loading || !query.trim()
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: loading || !query.trim() ? "#94a3b8" : "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: loading || !query.trim() ? "none" : "0 6px 20px rgba(79,70,229,0.3)",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { if (!loading && query.trim()) { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.4)"; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = loading || !query.trim() ? "none" : "0 6px 20px rgba(79,70,229,0.3)"; }}
            >
              {loading ? (
                <>
                  <Loader style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                  {isHindi ? "विश्लेषण चल रहा है..." : "Running Analysis Pipeline..."}
                </>
              ) : (
                <>
                  {isHindi ? "शिकायत का विश्लेषण करें" : isHinglish ? "Grievance Analyze karein" : "Analyze Grievance"}
                  <ChevronRight style={{ width: 18, height: 18 }} />
                </>
              )}
            </button>
          </form>

          {/* Sample scenarios */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              {isHindi ? "या एक नमूना परिदृश्य आज़माएं:" : isHinglish ? "Ya koi sample try karein:" : "Or try a sample scenario:"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {examples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => setQuery(ex.text)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #e0e7ff",
                    background: "#f5f3ff",
                    color: "#4f46e5",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#ede9fe"; e.currentTarget.style.borderColor = "#a5b4fc"; }}}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.borderColor = "#e0e7ff"; }}
                >
                  <span style={{ fontSize: 16 }}>{ex.icon}</span>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
