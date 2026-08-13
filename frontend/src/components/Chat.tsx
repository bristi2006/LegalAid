import React, { useState } from "react";
import { MessageSquare, ShieldAlert, Loader, ArrowLeft } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";

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
    text: "My name is Jane Doe, contact +91-9876543210, living at Flat 101, Sunny Apartments, Sector 45, Gurgaon. I purchased a SuperTech Pro washing machine on 2026-07-01 for Rs. 35,000 from SuperTech Electronics Pvt. Ltd., Noida. Upon delivery on 2026-07-03, it was defective and failed to spin. I raised a complaint but they refused to help. I want a refund of my Rs. 35,000."
  },
  {
    label: "Labour Case",
    text: "My name is Amit Sharma (employee ID EMP-4091), a Senior Software Engineer residing at C-12, Green Park Extension, New Delhi. I worked at WebScale Solutions Pvt. Ltd., Cyber City, Gurgaon. My director Vijay Shekhar did not pay my June 2026 salary of Rs. 1,80,000 after I resigned and completed my notice period on 2026-06-30. Please issue a notice demanding payment of Rs. 1,80,000."
  },
  {
    label: "Tenant Case",
    text: "My name is Rohan Verma. I was a tenant at Flat 304, Maple Heights, HSR Layout, Bengaluru under a rent agreement dated 2025-06-01. I vacated the flat on 2026-05-31 and handed over the keys. My landlord K. R. Murthy (Jayanagar, Bengaluru) has refused to return my security deposit of Rs. 1,00,000. I paid a monthly rent of Rs. 25,000."
  }
];

const EXAMPLES_HI = [
  {
    label: "उपभोक्ता मामला (Consumer)",
    text: "मेरा नाम जेना डो है, संपर्क +91-9876543210, फ्लैट 101, सनी अपार्टमेंट्स, सेक्टर 45, गुड़गांव में रहती हूँ। मैंने 2026-07-01 को सुपरटेक इलेक्ट्रॉनिक्स प्राइवेट लिमिटेड, नोएडा से 35,000 रुपये में सुपरटेक प्रो वॉशिंग मशीन खरीदी थी। 2026-07-03 को डिलीवरी पर यह खराब निकली और स्पिन नहीं हो रही थी। मैंने शिकायत की लेकिन उन्होंने मदद करने से इनकार कर दिया। मुझे मेरे 35,000 रुपये का रिफंड चाहिए।"
  },
  {
    label: "श्रम मामला (Labour)",
    text: "मेरा नाम अमित शर्मा है (कर्मचारी आईडी EMP-4091), सी-12, ग्रीन पार्क एक्सटेंशन, नई दिल्ली का रहने वाला सॉफ्टवेयर इंजीनियर हूँ। मैंने वेबस्केल सॉल्यूशंस प्राइवेट लिमिटेड, साइबर सिटी, गुड़गांव में काम किया। मेरे डायरेक्टर विजय शेखर ने 2026-06-30 को मेरे इस्तीफा देने और नोटिस पीरियड पूरा करने के बाद भी मेरी जून 2026 की सैलरी 1,80,000 रुपये नहीं दी। कृपया 1,80,000 रुपये के भुगतान की मांग करते हुए एक नोटिस जारी करें।"
  },
  {
    label: "किरायेदार मामला (Tenant)",
    text: "मेरा नाम रोहन वर्मा है। मैं किराया समझौते दिनांक 2025-06-01 के तहत फ्लैट 304, मेपल हाइट्स, एचएसआर लेआउट, बेंगलुरु में किराएदार था। मैंने 2026-05-31 को फ्लैट खाली कर दिया और चाबियां सौंप दीं। मेरे मकान मालिक के. आर. मूर्ति (जayanagar, बेंगलुरु) ने मेरे सुरक्षा जमा 1,00,000 रुपये वापस करने से इनकार कर दिया है। मैं 25,000 रुपये मासिक किराया देता था।"
  }
];

const EXAMPLES_HINGLISH = [
  {
    label: "Consumer (Hinglish)",
    text: "Mera naam Jane Doe hai, contact number +91-9876543210, Flat 101, Sunny Apartments, Sector 45, Gurgaon me rehti hu. Maine 2026-07-01 ko SuperTech Electronics Noida se 35,000 Rupees me ek washing machine kharidi thi. Delivery ke baad pata chala ki machine defective hai aur spin nahi kar rahi. Maine unse replacement manga par unhone refuse kar diya. Please help me get a refund of my Rs. 35,000."
  },
  {
    label: "Labour (Hinglish)",
    text: "Mera naam Amit Sharma hai, employee id EMP-4091. Main WebScale Solutions Pvt. Ltd., Gurgaon me software engineer tha. Mera director Vijay Shekhar ne mera June 2026 ka salary Rs 1,80,000 hold kar diya hai. Maine 2026-06-30 ko apna notice period serve karke resign kar diya tha par unhone salary nahi di. Please issue a legal notice."
  },
  {
    label: "Tenant (Hinglish)",
    text: "Mera naam Rohan Verma hai. Main Flat 304, Maple Heights, HSR Layout, Bengaluru me rent pe rehta tha. Rent agreement date 2025-06-01 thi. Maine 2026-05-31 ko flat vacate kar diya aur keys hand over kar di. Mera landlord K. R. Murthy mera security deposit Rs 1,00,000 wapas nahi de raha hai. Mera monthly rent 25,000 tha."
  }
];

export const Chat: React.FC<ChatProps> = ({ onSubmit, onBack, loading, error, language }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  const isHindi = language.trim().toLowerCase() === "hindi";
  const isHinglish = language.trim().toLowerCase() === "hinglish";
  
  const getExamples = () => {
    if (isHindi) return EXAMPLES_HI;
    if (isHinglish) return EXAMPLES_HINGLISH;
    return EXAMPLES_EN;
  };
  
  const examples = getExamples();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Back to Home Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isHindi ? "मुख्य पृष्ठ पर वापस जाएं" : isHinglish ? "Home page par wapas" : "Back to Home"}
      </button>
      
      {/* Disclaimer Box at the Very Top */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-8 flex gap-3 text-amber-800 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">MANDATORY DISCLAIMER:</span> This application is auto-generated for informational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. Please consult a qualified lawyer before taking any legal action.
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <MessageSquare className="w-10 h-10 text-indigo-600" />
          {isHindi ? "लीगलएड शिकायत पंजीकरण" : isHinglish ? "LegalAId Grievance Intake" : "LegalAId Grievance Intake"}
        </h1>
        <p className="mt-2 text-base text-slate-600 leading-relaxed">
          {isHindi 
            ? "अपनी कानूनी समस्या को सरल शब्दों में लिखें। हमारा विश्लेषण पाइपलाइन आपके अधिकारों की पहचान करेगा, लागू धाराओं का सत्यापन करेगा और एक पेशेवर कानूनी नोटिस का मसौदा तैयार करेगा।"
            : isHinglish 
            ? "Apni legal problem ko simple words me likhe. Humara system aapke rights identify karega, sections verify karega aur legal notice draft karega." 
            : "Describe your legal issue in simple words. Our analysis pipeline will identify your rights, verify applicable sections from our knowledge base, and draft a professional legal notice."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor="grievance" className="text-sm font-semibold text-slate-700">
              {isHindi ? "आपकी शिकायत का विवरण (Tell us what happened)" : isHinglish ? "Apki Grievance Description" : "Tell us what happened"}
            </label>
            <VoiceRecorder
              language={language}
              disabled={loading}
              onTranscript={(spokenText) => setQuery((prev) => (prev ? `${prev} ${spokenText}` : spokenText))}
            />
          </div>
          <textarea
            id="grievance"
            rows={6}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-white placeholder-slate-400 text-base shadow-sm resize-y"
            placeholder={isHindi 
              ? "अपनी समस्या यहाँ लिखें... (खाली सबमिशन की अनुमति नहीं है)"
              : isHinglish 
              ? "Apni problem yahan likhe... (Khali submission allowed nahi hai)" 
              : "Describe your legal problem here... (e.g. unpaid salary, tenant security deposit, defective product)"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            {isHindi 
              ? "* केवल उपभोक्ता शिकायतें, वेतन भुगतान दावे और किरायेदार सुरक्षा जमा विवाद समर्थित हैं।"
              : isHinglish 
              ? "* Sirf consumer complaints, unpaid employee wages, aur tenant security deposit disputes supported hain." 
              : "* Only consumer complaints, employee unpaid wages, and landlord tenant security deposit disputes are currently supported."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                {isHindi ? "विश्लेषण त्रुटि" : "Analysis Error"}
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader className="animate-spin w-5 h-5 mr-3" />
              {isHindi ? "विश्लेषण पाइपलाइन चल रही है..." : "Running Analysis Pipeline..."}
            </>
          ) : (
            isHindi ? "शिकायत का विश्लेषण करें" : isHinglish ? "Grievance Analyze karein" : "Analyze Grievance"
          )}
        </button>
      </form>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          {isHindi ? "या एक नमूना परिदृश्य आज़माएं:" : isHinglish ? "Ya koi sample try karein:" : "Or try a sample scenario:"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {examples.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => setQuery(ex.text)}
              className="py-2.5 px-4 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors border border-indigo-100 cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
