import React, { useState } from "react";
import { ArrowLeft, Download, FileText, RefreshCw, Loader, AlertTriangle } from "lucide-react";

interface DraftEditorProps {
  initialText: string;
  templateId: string;
  sender: any;
  recipient: any;
  relevantFacts: string[];
  remedy: string;
  applicableSections: any[];
  extraDetails: any;
  onBack: () => void;
  onDraft: (payload: any) => Promise<string>;
  onExportPdf: (text: string) => Promise<Blob>;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  initialText,
  templateId,
  sender: initialSender,
  recipient: initialRecipient,
  relevantFacts: initialFacts,
  remedy: initialRemedy,
  applicableSections,
  extraDetails,
  onBack,
  onDraft,
  onExportPdf
}) => {
  const [draftText, setDraftText] = useState(initialText);
  
  // Form states to support easy regeneration
  const [senderName, setSenderName] = useState(initialSender?.name || "");
  const [senderAddress, setSenderAddress] = useState(initialSender?.address || "");
  const [senderContact, setSenderContact] = useState(initialSender?.contact || "");
  const [senderDesignation, setSenderDesignation] = useState(initialSender?.designation || "");
  const [senderEmpId, setSenderEmpId] = useState(initialSender?.employee_id || "");

  const [recipientName, setRecipientName] = useState(initialRecipient?.name || "");
  const [recipientAddress, setRecipientAddress] = useState(initialRecipient?.address || "");
  const [recipientContact, setRecipientContact] = useState(initialRecipient?.contact || "");
  const [recipientCompany, setRecipientCompany] = useState(initialRecipient?.company_name || "");
  const [recipientDesignation, setRecipientDesignation] = useState(initialRecipient?.designation || "");

  const [facts, setFacts] = useState(initialFacts.join("\n"));
  const [remedyText, setRemedyText] = useState(initialRemedy);

  const [drafting, setDrafting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Citation detection
  const isCitationEdited = applicableSections && applicableSections.some(
    sec => sec.verified && (!draftText.includes(sec.section) || !draftText.includes(sec.act))
  );

  const handleRegenerate = async () => {
    setDrafting(true);
    setError(null);
    try {
      const payload = {
        template_id: templateId,
        date: new Date().toISOString().split("T")[0],
        sender: {
          name: senderName,
          address: senderAddress,
          contact: senderContact,
          designation: senderDesignation,
          employee_id: senderEmpId
        },
        recipient: {
          name: recipientName,
          address: recipientAddress,
          contact: recipientContact,
          company_name: recipientCompany,
          designation: recipientDesignation
        },
        relevant_facts: facts.split("\n").filter(f => f.trim() !== ""),
        issue_description: initialText.match(/SUBJECT: Legal Notice regarding (.*)/)?.[1] || "Grievance Description",
        applicable_sections: applicableSections,
        remedy: remedyText,
        extra_details: extraDetails
      };
      
      const newText = await onDraft(payload);
      setDraftText(newText);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate draft notice.");
    } finally {
      setDrafting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await onExportPdf(draftText);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legal_notice_${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Next Steps
      </button>

      {/* Top Disclaimer Box */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex gap-3 text-amber-800 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">MANDATORY LEGAL WARNING:</span> This drafted document is auto-generated for informational purposes only. It is not legal advice and should be reviewed, edited, and approved by a qualified lawyer before signature or official delivery.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Editor parameters */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              Notice Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Edit the extracted parameter fields and regenerate the notice template draft text on the right.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800">
              {error}
            </div>
          )}

          {/* SENDER INFO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sender / Applicant Info</h3>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Sender Name"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
              />
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Address"
                value={senderAddress}
                onChange={e => setSenderAddress(e.target.value)}
              />
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Contact Details"
                value={senderContact}
                onChange={e => setSenderContact(e.target.value)}
              />
              {templateId.includes("labour") && (
                <>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                    placeholder="Employee Designation"
                    value={senderDesignation}
                    onChange={e => setSenderDesignation(e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                    placeholder="Employee ID"
                    value={senderEmpId}
                    onChange={e => setSenderEmpId(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* RECIPIENT INFO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient / Opposing Party Info</h3>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Recipient Name"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Address"
                value={recipientAddress}
                onChange={e => setRecipientAddress(e.target.value)}
              />
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                placeholder="Contact Details"
                value={recipientContact}
                onChange={e => setRecipientContact(e.target.value)}
              />
              {templateId.includes("labour") && (
                <>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                    placeholder="Company Name"
                    value={recipientCompany}
                    onChange={e => setRecipientCompany(e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                    placeholder="Representative Designation"
                    value={recipientDesignation}
                    onChange={e => setRecipientDesignation(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* FACTS */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Facts (One per line)</h3>
            <textarea
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
              rows={4}
              placeholder="Enter timeline / facts..."
              value={facts}
              onChange={e => setFacts(e.target.value)}
            />
          </div>

          {/* REMEDY */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Demand / Remedy</h3>
            <textarea
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
              rows={3}
              placeholder="Enter remedy..."
              value={remedyText}
              onChange={e => setRemedyText(e.target.value)}
            />
          </div>

          <button
            onClick={handleRegenerate}
            disabled={drafting}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 gap-2 transition-colors cursor-pointer"
          >
            {drafting ? (
              <>
                <Loader className="animate-spin w-4 h-4" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate Draft
              </>
            )}
          </button>
        </div>

        {/* Right Column: Text Document Editor area */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Notice Document Draft</h2>
              <p className="text-xs text-slate-500 mt-1">
                You can type directly into the editor below to make any manual corrections.
              </p>
            </div>
            
            <button
              onClick={handleDownloadPdf}
              disabled={exporting || !draftText.trim()}
              className="flex items-center py-2 px-4 border border-transparent rounded text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 gap-2 transition-colors cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader className="animate-spin w-4 h-4" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Notice
                </>
              )}
            </button>
          </div>

          {/* Citation Edited Warning */}
          {isCitationEdited && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">⚠️ Warning:</span> This is a verified legal citation. Changing it may affect legal accuracy.
              </div>
            </div>
          )}

          <textarea
            className="w-full h-[65vh] p-4 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800 leading-relaxed overflow-y-auto resize-none"
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
          />
        </div>

      </div>
    </div>
  );
};
