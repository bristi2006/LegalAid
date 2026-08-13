import React, { useState } from "react";
import { Edit3, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

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

export const CaseUnderstanding: React.FC<CaseUnderstandingProps> = ({
  classification,
  onUpdateFacts,
  onProceed,
  onBack,
  language
}) => {
  const isHindi = language.toLowerCase() === "hindi";

  const [isEditing, setIsEditing] = useState(false);
  
  // Editable fields state
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
      sender: {
        ...classification.extracted_details.sender,
        name: senderName,
        address: location
      },
      recipient: {
        ...classification.extracted_details.recipient,
        name: recipientName
      },
      relevant_facts: facts.filter(f => f.trim() !== "")
    };
    onUpdateFacts(updatedDetails);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isHindi ? "पीछे जाएं" : "Back to Intake"}
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {isHindi ? "केस की समझ" : "Case Understanding"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isHindi 
                ? "हमारी एआई ने आपकी शिकायत से निम्नलिखित मुख्य विवरणों की पहचान की है।" 
                : "Our AI identified the following key parameters from your grievance description."}
            </p>
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                handleUpdate();
              } else {
                setIsEditing(true);
              }
            }}
            className={`flex items-center text-xs font-semibold py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
              isEditing
                ? "bg-indigo-600 text-white border-transparent hover:bg-indigo-700"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isEditing ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isHindi ? "विवरण सहेजें" : "Save Details"}
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-1.5" />
                {isHindi ? "यह सही नहीं है?" : "That's not correct?"}
              </>
            )}
          </button>
        </div>

        {/* Fact Sheet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? "कानूनी क्षेत्र (Domain)" : "Domain"}
            </span>
            {isEditing ? (
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="consumer">Consumer</option>
                <option value="labour">Labour</option>
                <option value="tenant">Tenant</option>
              </select>
            ) : (
              <p className="text-sm font-semibold text-slate-700 uppercase">{domain}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? "विवाद का विषय (Issue)" : "Issue"}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={issue}
                onChange={e => setIssue(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700 capitalize">{issue.replace(/_/g, " ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? "भेजने वाला (Sender)" : "Sender"}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700">{senderName || "Not Specified"}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? "विपक्षी दल (Opposing Party)" : "Opposing Party"}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700">{recipientName || "Not Specified"}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? "स्थान (Location / Jurisdiction)" : "Location / Jurisdiction"}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700">{location}</p>
            )}
          </div>
        </div>

        {/* Fact Chronology Timeline */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            {isHindi ? "तथ्यों की समयरेखा (Chronological Facts)" : "Chronological Facts"}
          </h2>
          
          <div className="space-y-3">
            {facts.map((fact, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={fact}
                    onChange={e => handleFactChange(idx, e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">{fact}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        {!isEditing && (
          <div className="border-t border-slate-100 pt-6 flex justify-end">
            <button
              onClick={onProceed}
              className="flex items-center py-3 px-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-2 cursor-pointer"
            >
              {isHindi ? "अधिकारों का विश्लेषण देखें" : "Proceed to My Rights"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
