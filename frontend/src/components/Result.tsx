import React from "react";
import { Scale, BookOpen, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface VerifiedSection {
  act: string;
  section: string;
  meaning: string;
  source?: string;
  source_url?: string;
}

interface AnalysisData {
  classification: {
    domain: string;
    issue: string;
    extracted_details: any;
    language: string;
  };
  explanation: {
    rights_explanation: string;
    cited_sections: string[];
    confidence: number;
  };
  verified_sections: VerifiedSection[];
  remedy: string;
  rendered_document: string;
}

interface ResultProps {
  analysis: AnalysisData;
  onNext: () => void;
  onBack: () => void;
}

export const Result: React.FC<ResultProps> = ({ analysis, onNext, onBack }) => {
  const { explanation, verified_sections, remedy } = analysis;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Input
      </button>

      {/* Mandatory Disclaimer Box at Top */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex gap-3 text-amber-800 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">MANDATORY DISCLAIMER:</span> This report and the generated draft are auto-generated for informational purposes only. This is not legal advice and does not substitute consultation with a qualified advocate. Review all sections before issuing any legal notice.
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-600" />
            Analysis Results
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Intake Domain: <span className="font-semibold text-slate-700 uppercase">{analysis.classification.domain}</span> | 
            Issue: <span className="font-semibold text-slate-700 uppercase">{analysis.classification.issue.replace(/_/g, " ")}</span>
          </p>
        </div>

        {/* 1. Rights Explanation */}
        <section className="border-t border-slate-100 pt-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-indigo-500" />
            1. Rights Explanation
          </h2>
          <div className="prose text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
            {explanation.rights_explanation}
          </div>
        </section>

        {/* 2. Verified Applicable Sections */}
        <section className="border-t border-slate-100 pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              2. Verified Applicable Sections
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Only sections confirmed in official Indian statutes are shown. Unrecognised citations are automatically filtered out.
            </p>
          </div>

          {verified_sections.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No verified legal sections cited.</p>
          ) : (
            <div className="space-y-4">
              {verified_sections.map((sec, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm hover:border-indigo-150 transition-colors">
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <span className="font-bold text-slate-800 text-sm">{sec.section}</span>
                    <span className="text-slate-400 text-xs">|</span>
                    <span className="text-xs font-semibold text-indigo-600 uppercase bg-indigo-50 px-2.5 py-0.5 rounded">
                      {sec.act}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{sec.meaning}</p>
                  {sec.source && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">Official source: </span>
                      {sec.source_url ? (
                        <a
                          href={sec.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-700 font-semibold underline underline-offset-2 hover:text-emerald-900 transition-colors"
                        >
                          {sec.source}
                        </a>
                      ) : (
                        <span className="text-xs text-emerald-700 font-semibold">{sec.source}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Remedy / Suggested Next Steps */}
        <section className="border-t border-slate-100 pt-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-indigo-500" />
            3. Remedy & Next Steps
          </h2>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 prose text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
            {remedy}
          </div>
        </section>

        {/* Navigation to Editor */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            onClick={onNext}
            className="flex items-center py-3 px-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm gap-2 cursor-pointer"
          >
            Draft Notice Document
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
