import React, { useState, useRef } from "react";
import { FileText, Loader, CheckCircle, AlertCircle } from "lucide-react";
import api from "../services/api";

interface DocumentUploaderProps {
  onDocumentExtracted: (formattedText: string) => void;
  language: string;
  disabled?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentExtracted,
  language,
  disabled = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHindi = language.trim().toLowerCase() === "hindi";
  const isHinglish = language.trim().toLowerCase() === "hinglish";

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    // File validation: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(
        isHindi
          ? "फ़ाइल का आकार बहुत बड़ा है (अधिकतम 10MB)।"
          : "File size too large. Maximum allowed size is 10MB."
      );
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res: any = await api.uploadDocumentOCR(file, language);
      
      // Build comprehensive structured text block
      const parts: string[] = [];
      parts.push(`📄 [DOCUMENT OCR SCAN & LEGAL OBSERVATIONS]`);
      if (res.document_type) {
        parts.push(`• Document Type: ${res.document_type.replace(/_/g, " ").toUpperCase()}`);
      }
      if (res.sender_name || res.recipient_name) {
        parts.push(`• Parties: ${res.sender_name || "Applicant"} vs ${res.recipient_name || "Opposing Party"}`);
      }
      if (res.amount) {
        parts.push(`• Mentioned Amount: ${res.amount}`);
      }
      if (res.date) {
        parts.push(`• Effective Date: ${res.date}`);
      }

      if (res.summary) {
        parts.push(`\n📌 Document Summary:\n${res.summary}`);
      }

      if (res.observations && Array.isArray(res.observations) && res.observations.length > 0) {
        parts.push(`\n🔍 Key Legal Observations:`);
        res.observations.forEach((obs: string, idx: number) => {
          parts.push(`  ${idx + 1}. ${obs}`);
        });
      }

      if (res.extracted_text && res.extracted_text !== res.summary) {
        parts.push(`\n📋 Factual Details:\n${res.extracted_text}`);
      }

      if (res.verbatim_transcription) {
        parts.push(`\n📝 Verbatim Document Transcript:\n${res.verbatim_transcription}`);
      }

      const formatted = parts.join("\n");
      onDocumentExtracted(formatted);

      const engineName = res.engine_used === "groq_vision" ? "Groq Vision API" : "Gemini Vision";
      setSuccessMsg(
        isHindi
          ? `दस्तावेज़ स्कैन सफल (${engineName})!`
          : `Document scanned successfully (${engineName})!`
      );

      // Clear success badge after 4 seconds
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Document OCR failed:", err);
      setErrorMsg(
        isHindi
          ? "दस्तावेज़ स्कैन विफल रहा। कृपया स्पष्ट छवि अपलोड करें।"
          : "Document scan failed. Please upload a clear image of your document."
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isScanning}
        title={
          isHindi
            ? "दस्तावेज़ / रसीद की फोटो अपलोड करें"
            : "Upload photo/scan of agreement, contract, receipt or pay stub"
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
          isScanning
            ? "bg-amber-100 text-amber-800 border border-amber-300"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isScanning ? (
          <>
            <Loader className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{isHindi ? "स्कैनिंग (Groq Vision)..." : "Scanning Doc (Groq Vision)..."}</span>
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isHindi
                ? "📄 दस्तावेज़/रसीद अपलोड करें"
                : isHinglish
                ? "📄 Document upload karein"
                : "📄 Scan Document/Receipt"}
            </span>
          </>
        )}
      </button>

      {successMsg && (
        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-fade-in">
          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          {successMsg}
        </span>
      )}

      {errorMsg && (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          {errorMsg}
        </span>
      )}
    </div>
  );
};
