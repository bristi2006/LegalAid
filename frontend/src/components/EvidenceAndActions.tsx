import React, { useState } from "react";
import { FileCheck2, Compass, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface EvidenceAndActionsProps {
  evidenceChecklist: string[];
  actionPlan: string[];
  onProceed: () => void;
  onBack: () => void;
  language: string;
}

export const EvidenceAndActions: React.FC<EvidenceAndActionsProps> = ({
  evidenceChecklist,
  actionPlan,
  onProceed,
  onBack,
  language
}) => {
  const isHindi = language.toLowerCase() === "hindi";

  const [checkedEvidence, setCheckedEvidence] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedEvidence({
      ...checkedEvidence,
      [idx]: !checkedEvidence[idx]
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isHindi ? "पीछे जाएं" : "Back to Laws"}
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* 1. Evidence Checklist */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            {isHindi ? "संभावित साक्ष्य जिनकी आपको आवश्यकता होगी" : "Evidence You May Need"}
          </h2>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            {isHindi 
              ? "यह चेकलिस्ट केवल सूचनात्मक है। इन दस्तावेजों को इकट्ठा करने से आपके मामले को मजबूती मिलती है।" 
              : "This checklist is for reference only. Gathering these items helps support your claim, but does not imply you currently possess them."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {evidenceChecklist.map((item, idx) => (
              <label
                key={idx}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  checkedEvidence[idx]
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{item}</span>
                <input
                  type="checkbox"
                  checked={checkedEvidence[idx] || false}
                  onChange={() => toggleCheck(idx)}
                  className="text-emerald-600 focus:ring-emerald-500 rounded h-4 w-4"
                />
              </label>
            ))}
          </div>
        </section>

        {/* 2. Action Plan */}
        <section className="space-y-4 border-t border-slate-100 pt-6">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-600" />
            {isHindi ? "आगे की कार्ययोजना (Action Plan)" : "What You Can Do Next"}
          </h2>

          <div className="space-y-4">
            {actionPlan.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* General Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">IMPORTANT LEGAL DISCLAIMER:</span> LegalAid provides general legal information, not legal advice. Laws and procedures may vary based on your facts and jurisdiction. Consult a lawyer before acting.
          </div>
        </div>

        {/* Action Button */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            onClick={onProceed}
            className="flex items-center py-3 px-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-2 cursor-pointer"
          >
            {isHindi ? "कानूनी दस्तावेज तैयार करें" : "Create Legal Notice Draft"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
