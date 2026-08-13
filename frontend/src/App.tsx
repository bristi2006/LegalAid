import { useState } from "react";
import { Chat } from "./components/Chat";
import { Result } from "./components/Result";
import { DraftEditor } from "./components/DraftEditor";
import { Scale } from "lucide-react";

type Step = "chat" | "result" | "editor";

const API_BASE = "http://localhost:8000";

function App() {
  const [step, setStep] = useState<Step>("chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [language, setLanguage] = useState<string>("English");

  const handleAnalyze = async (userQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_input: userQuery,
          language: language
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis request failed.");
      }
      
      const data = await response.json();
      setAnalysis(data);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async (payload: any): Promise<string> => {
    const response = await fetch(`${API_BASE}/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...payload,
        language: language
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Draft regeneration failed.");
    }
    
    const data = await response.json();
    return data.rendered_document;
  };

  const handleExportPdf = async (textContent: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/export-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_content: textContent }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "PDF generation request failed.");
    }
    
    return await response.blob();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setStep("chat");
              setAnalysis(null);
              setError(null);
            }}
          >
            <Scale className="w-6 h-6 text-indigo-600" />
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">LegalAId</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="lang-select" className="text-xs font-semibold text-slate-500">Language / भाषा:</label>
              <select
                id="lang-select"
                className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500 text-slate-700"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Pipeline Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 w-full">
        {step === "chat" && (
          <Chat 
            onSubmit={handleAnalyze} 
            loading={loading} 
            error={error}
            language={language}
          />
        )}
        
        {step === "result" && analysis && (
          <Result
            analysis={analysis}
            onNext={() => setStep("editor")}
            onBack={() => setStep("chat")}
          />
        )}
        
        {step === "editor" && analysis && (
          <DraftEditor
            initialText={analysis.rendered_document}
            templateId={`${analysis.classification.domain}_${analysis.classification.issue}`}
            sender={analysis.classification.extracted_details.sender}
            recipient={analysis.classification.extracted_details.recipient}
            relevantFacts={analysis.classification.extracted_details.relevant_facts}
            remedy={analysis.remedy}
            applicableSections={analysis.verified_sections}
            extraDetails={analysis.classification.extracted_details.extra_details}
            onBack={() => setStep("result")}
            onDraft={handleDraft}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 LegalAId Project. All rights reserved.</p>
          <p className="mt-1">
            Informational purposes only. Strictly subject to verification under India Code.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;
