/**
 * frontend/src/services/api.ts
 *
 * Centralized API client for LegalAid.
 * Every backend call goes through here — no scattered fetch() in components.
 *
 * Base URL is read from VITE_API_BASE_URL env variable.
 * Falls back to http://localhost:8000 in development.
 */

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

const TIMEOUT_MS = 90_000; // 90 s – LLM calls can be slow

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── Core fetch helpers ───────────────────────────────────────────────────────

async function fetchJSON<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let msg = `Server error ${res.status}`;
      try {
        const err = await res.json();
        msg = err?.error?.message || err?.detail || msg;
      } catch { /* ignore */ }
      throw new ApiError(msg, res.status);
    }

    return (await res.json()) as T;
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError")
      throw new ApiError("Request timed out. Please try again.", 408);
    if (e instanceof TypeError && String(e.message).includes("fetch"))
      throw new ApiError(
        `Cannot reach the backend at ${API_BASE_URL}. Is it running?`,
        503
      );
    throw new ApiError(e instanceof Error ? e.message : "Unexpected error", 500);
  }
}

async function fetchBlob(path: string, body: unknown): Promise<Blob> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let msg = `PDF export failed (${res.status})`;
      try {
        const err = await res.json();
        msg = err?.error?.message || err?.detail || msg;
      } catch { /* ignore */ }
      throw new ApiError(msg, res.status);
    }

    return await res.blob();
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError")
      throw new ApiError("PDF generation timed out.", 408);
    throw new ApiError(e instanceof Error ? e.message : "PDF failed", 500);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const api = {
  /** GET /health */
  health: () =>
    fetchJSON<{ status: string; version: string }>("/health"),

  /**
   * POST /analyze
   * Full 14-stage legal pipeline (stateless).
   */
  analyze: (userInput: string, language = "English") =>
    fetchJSON<Record<string, unknown>>("/analyze", {
      method: "POST",
      body: JSON.stringify({ user_input: userInput, language }),
    }),

  /**
   * POST /draft
   * Regenerate a notice document with updated parameters.
   */
  draft: (payload: Record<string, unknown>) =>
    fetchJSON<{ rendered_document: string }>("/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * POST /export-pdf
   * Returns raw PDF bytes as a Blob.
   */
  exportPdf: (textContent: string): Promise<Blob> =>
    fetchBlob("/export-pdf", { text_content: textContent }),

  /**
   * POST /transcribe
   * Sends audio blob for backend fallback transcription.
   */
  transcribeAudio: async (audioBlob: Blob, language = "English"): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("language", language);

    const res = await fetch(`${API_BASE_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new ApiError(`Transcription failed (${res.status})`, res.status);
    }
    return await res.json();
  },
};

export default api;
