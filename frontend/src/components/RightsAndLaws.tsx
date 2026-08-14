import React, { useState } from "react";
import { Scale, BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

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
  rightsExplanation,
  verifiedSections,
  riskStatus,
  riskReason,
  onProceed,
  onBack,
  language
}) => {
  const isHindi = language.toLowerCase() === "hindi";

  const [detailsOpen, setDetailsOpen] = useState(false);

  const getRiskStyles = () => {
    switch (riskStatus) {
      case "Strongly Supported":
        return {
          bg: "bg-emerald-50 border-emerald-300 text-emerald-950",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          iconColor: "text-emerald-600"
        };
      case "Needs Verification":
        return {
          bg: "bg-amber-50 border-amber-300 text-amber-950",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          iconColor: "text-amber-600"
        };
      case "Professional Review Recommended":
      default:
        return {
          bg: "bg-rose-50 border-rose-300 text-rose-950",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          iconColor: "text-rose-600"
        };
    }
  };

  const riskStyles = getRiskStyles();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isHindi ? "पीछे जाएं" : "Back to Summary"}
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Risk / Supported UI */}
        <div className={`border rounded-xl p-5 ${riskStyles.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${riskStyles.badge}`}>
                {isHindi 
                  ? (riskStatus === "Strongly Supported" ? "🟢 पूर्ण समर्थित" : riskStatus === "Needs Verification" ? "🟡 सत्यापन की आवश्यकता" : "🔴 पेशेवर समीक्षा अनुशंसित")
                  : riskStatus
                }
              </span>
            </div>
            <h3 className="text-sm font-bold mt-2">
              {isHindi ? "यह स्थिति क्यों है?" : "Why this status?"}
            </h3>
            <p className="text-xs opacity-90 leading-relaxed max-w-lg">{riskReason}</p>
          </div>
        </div>

        {/* 1. Rights Explanation in Plain Language */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" />
            {isHindi ? "आपके संभावित कानूनी अधिकार" : "Your Possible Rights"}
          </h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-700 leading-relaxed font-semibold">
              {isHindi 
                ? "आपको मजदूरी के भुगतान, उपभोक्ता संरक्षण या किरायेदारी नियमों के तहत कानूनी राहत के अधिकार मिल सकते हैं।" 
                : "You may have rights relating to payment of wages, consumer protection, or tenancy terms."}
            </p>

            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="mt-4 flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              {isHindi ? "कानूनी विवरण" : "Legal details"} 
              {detailsOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>

            {detailsOpen && (
              <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {rightsExplanation}
              </div>
            )}
          </div>
        </section>

        {/* 2. Verified Legal Provision Cards */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              {isHindi ? "सत्यापित कानूनी धाराएं" : "Verified Legal Provisions"}
            </h3>
            <span className="text-xs text-slate-400">
              Only verified references are displayed
            </span>
          </div>

          <div className="space-y-4">
            {verifiedSections.filter(sec => sec.verified).map((sec, idx) => (
              <div key={idx} className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-max">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ VERIFIED LEGAL PROVISION</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800">{sec.section}</h4>
                  <p className="text-xs font-semibold text-slate-500">{sec.act}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Why this may apply</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{sec.meaning}</p>
                </div>

                {sec.source_url && (
                  <a
                    href={sec.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors pt-1 cursor-pointer"
                  >
                    {isHindi ? "आधिकारिक स्रोत देखें →" : "View Official Source →"}
                  </a>
                )}
              </div>
            ))}

            {verifiedSections.filter(sec => sec.verified).length === 0 && (
              <p className="text-sm text-slate-500 italic">No verified citations applicable to this case.</p>
            )}
          </div>
        </section>

        {/* Navigation */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            onClick={onProceed}
            className="flex items-center py-3 px-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-2 cursor-pointer"
          >
            {isHindi ? "आवश्यक साक्ष्य देखें" : "Proceed to Evidence & Next Steps"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
