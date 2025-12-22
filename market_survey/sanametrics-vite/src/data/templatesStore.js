// src/data/templatesStore.js
import TemplatesData from "./TemplatesData"; 

const LS_KEY = "sana_templates_v1";

/* DEFAULTS : on récupère depuis TemplatesData.TEMPLATES */
const DEFAULTS = (TemplatesData && TemplatesData.TEMPLATES) || [];

/* -------------------------
   Helpers de persistence
   ------------------------- */
function readStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("templatesStore: lecture localStorage failed", e);
    return null;
  }
}

function writeStorage(arr) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("templatesStore: write localStorage failed", e);
  }
}

/* -------------------------
   API du store
   ------------------------- */
export function getTemplates() {
  const stored = readStorage();
  if (Array.isArray(stored) && stored.length) return stored;
  // we clone to avoid accidental mutation
  return DEFAULTS.map((t) => ({ ...t }));
}

export function getTemplate(id) {
  const all = getTemplates();
  return all.find((t) => t.id === id) || null;
}

/**
 * createTemplate(template)
 * - template { id?, title, description, image (URL or dataURL), category, questions }
 */
export function createTemplate(template) {
  const all = getTemplates();
  const baseId =
    template.id ||
    (template.title
      ? template.title.toLowerCase().replace(/\s+/g, "-").slice(0, 50)
      : "tpl-" + Date.now());
  // ensure unique by appending timestamp
  const id = `${baseId}-${Date.now()}`;
  const newTpl = { ...template, id };
  all.unshift(newTpl);
  writeStorage(all);
  return newTpl;
}

export function updateTemplate(id, patch) {
  const all = getTemplates();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Template introuvable");
  all[idx] = { ...all[idx], ...patch, id };
  writeStorage(all);
  return all[idx];
}

export function deleteTemplate(id) {
  let all = getTemplates();
  const prevLen = all.length;
  all = all.filter((t) => t.id !== id);
  if (all.length === prevLen) throw new Error("Template introuvable");
  writeStorage(all);
  return true;
}

/* Optional : reset to defaults for dev */
export function resetToDefaults() {
  writeStorage(DEFAULTS.map((t) => ({ ...t })));
}
