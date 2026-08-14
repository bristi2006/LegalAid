import React, { useState } from "react";
import { HelpCircle, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";

interface MissingInfoProps {
  missingFacts: string[];
  contradiction: { field: string; values: string[] } | null;
  onResolve: (resolvedFacts: Record<string, string>, resolvedContradiction: string | null) => void;
  onBack: () => void;
  language: string;
}

export const MissingInfo: React.FC<MissingInfoProps> = ({
  missingFacts,
  contradiction,
  onResolve,
  onBack,
  language
}) => {
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
          question: isHindi 
            ? "आपके काम करने की व्यवस्था को सबसे बेहतर क्या दर्शाता है?" 
            : "What best describes your work arrangement?",
          options: [
            { value: "Full-time employee", label: isHindi ? "पूर्णकालिक कर्मचारी (Full-time)" : "Full-time employee" },
            { value: "Part-time employee", label: isHindi ? "अंशकालिक कर्मचारी (Part-time)" : "Part-time employee" },
            { value: "Contract worker", label: isHindi ? "अनुबंध कार्यकर्ता (Contract worker)" : "Contract worker" },
            { value: "Apprentice", label: isHindi ? "प्रशिक्षु (Apprentice)" : "Apprentice" },
            { value: "Other", label: isHindi ? "अन्य (Other)" : "Other" }
          ]
        };
      case "state":
        return {
          question: isHindi 
            ? "यह मामला किस राज्य में हुआ था?" 
            : "Which state did this matter occur in?",
          options: [
            { value: "Gujarat", label: "Gujarat" },
            { value: "Delhi", label: "Delhi" },
            { value: "Karnataka", label: "Karnataka" },
            { value: "Maharashtra", label: "Maharashtra" },
            { value: "Other", label: isHindi ? "अन्य राज्य" : "Other State" }
          ]
        };
      case "premises_address":
        return {
          question: isHindi 
            ? "किराए के परिसर का पूरा पता क्या है?" 
            : "What is the full address of the rented premises?",
          input: true,
          placeholder: "e.g. Flat 304, Maple Heights, HSR Layout, Bengaluru"
        };
      case "purchase_date":
        return {
          question: isHindi 
            ? "खरीदारी या लेनदेन की तारीख क्या थी?" 
            : "What was the date of purchase or transaction?",
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

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isHindi ? "पीछे जाएं" : "Back to Input"}
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-indigo-600 animate-pulse" />
            {isHindi ? "कुछ अतिरिक्त विवरण आवश्यक हैं" : "A few details are needed"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isHindi 
              ? "मामले के सही विश्लेषण के लिए कृपया निम्नलिखित जानकारी प्रदान करें।" 
              : "To perform an accurate rights analysis, please complete the fields below."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Contradiction Section */}
          {contradiction && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    {isHindi ? "⚠️ विरोधाभासी विवरण पाया गया" : "⚠️ We found a conflicting detail"}
                  </h3>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {isHindi 
                      ? `आपने अपने विवरण में दो अलग-अलग मूल्य प्रदान किए हैं। कृपया पुष्टि करें कि कौन सा सही ${contradiction.field} है:` 
                      : `You have referenced multiple values in your description. Please confirm which is the correct ${contradiction.field}:`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pl-8">
                {contradiction.values.map((val) => (
                  <label
                    key={val}
                    className={`flex items-center justify-between p-3.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                      selectedContradiction === val
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>{val}</span>
                    <input
                      type="radio"
                      name="contradiction"
                      value={val}
                      checked={selectedContradiction === val}
                      onChange={() => setSelectedContradiction(val)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      required
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Missing Facts Questions */}
          {missingFacts.map((field) => {
            const questionData = renderFieldQuestion(field);
            return (
              <div key={field} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-800">
                  {questionData.question}
                </label>

                {questionData.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {questionData.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          answers[field] === opt.value
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <input
                          type="radio"
                          name={field}
                          value={opt.value}
                          checked={answers[field] === opt.value}
                          onChange={() => setAnswers({ ...answers, [field]: opt.value })}
                          className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          required
                        />
                      </label>
                    ))}
                  </div>
                )}

                {questionData.input && (
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
                    placeholder={questionData.placeholder}
                    value={answers[field] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field]: e.target.value })}
                  />
                )}

                {questionData.date && (
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
                    value={answers[field] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field]: e.target.value })}
                  />
                )}
              </div>
            );
          })}

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer gap-2"
          >
            {isHindi ? "आगे बढ़ें" : "Proceed with Analysis"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
