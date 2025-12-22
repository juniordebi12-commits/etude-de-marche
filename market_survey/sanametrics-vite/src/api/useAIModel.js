// src/api/useAIModel.js
export function saveAIPreviewToSession(model) {
  sessionStorage.setItem("ai_model_preview", JSON.stringify(model));
}

export function loadAIPreviewFromSession() {
  const raw = sessionStorage.getItem("ai_model_preview");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAIPreview() {
  sessionStorage.removeItem("ai_model_preview");
}
