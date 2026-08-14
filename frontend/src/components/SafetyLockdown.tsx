import React from "react";
import { PhoneCall, Home, AlertOctagon } from "lucide-react";

interface SafetyLockdownProps {
  reason: string;
  onReset: () => void;
  language: string;
}

export const SafetyLockdown: React.FC<SafetyLockdownProps> = ({ reason, onReset, language }) => {
  const isHindi = language.toLowerCase() === "hindi";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-red-50 border-2 border-red-500 rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 p-4 rounded-full text-red-600 animate-bounce">
            <AlertOctagon className="w-16 h-16" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-red-900 tracking-tight">
          {isHindi ? "⚠️ तत्काल ध्यान दें - सुरक्षा चेतावनी" : "⚠️ Immediate Attention Required"}
        </h1>

        <div className="bg-white border border-red-200 rounded-lg p-5 text-left text-slate-800 text-sm sm:text-base leading-relaxed space-y-3">
          <p className="font-semibold text-red-800">
            {isHindi 
              ? "यह स्थिति तत्काल सुरक्षा या पेशेवर सहायता की मांग कर सकती है।" 
              : "This situation may require immediate safety or professional assistance."}
          </p>
          <p className="text-slate-600">
            {isHindi 
              ? `संकेतित खतरा: "${reason}"` 
              : `Flagged Grievance Aspect: "${reason}"`}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {isHindi 
              ? "महत्वपूर्ण सुरक्षा चिंताओं के कारण, कानूनी नोटिस बनाने की सामान्य प्रक्रिया को रोक दिया गया है।" 
              : "For safety and liability reasons, the normal document-generation flow has been paused."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <a
            href="tel:112"
            className="flex items-center justify-center py-3 px-6 rounded-lg text-white font-bold bg-red-600 hover:bg-red-700 transition-colors shadow-sm gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            {isHindi ? "आपातकालीन हेल्पलाइन (112)" : "Emergency Helpline (112)"}
          </a>
          <button
            onClick={onReset}
            className="flex items-center justify-center py-3 px-6 rounded-lg text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm gap-2"
          >
            <Home className="w-5 h-5" />
            {isHindi ? "मुख्य स्क्रीन पर वापस जाएं" : "Return to Start Screen"}
          </button>
        </div>

        <p className="text-xs text-red-500 pt-2 font-semibold">
          {isHindi 
            ? "यदि आप किसी भी शारीरिक खतरे में हैं, तो कृपया तुरंत स्थानीय अधिकारियों से संपर्क करें।" 
            : "If you are in immediate physical danger, please contact local law enforcement authorities immediately."}
        </p>
      </div>
    </div>
  );
};
