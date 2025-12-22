import React, { useState } from "react";
import { API_BASE } from "../api/useApi";
import { useAuth } from "../api/useAuth";
import { useNavigate } from "react-router-dom";

export default function OpenAIChat() {
  const { access } = useAuth();
  const nav = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);

  async function send() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/openai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Tu génères un modèle d’enquête en JSON avec title, description, image et questions.",
            },
            { role: "user", content: input },
          ],
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Erreur IA");
      }

      // ✅ CAS MOCK → template
      if (json.template) {
        setTemplate(json.template);
      } else {
        throw new Error("Aucun template retourné par l’IA");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function injectIntoEditor() {
    if (!template) return;

    // 🔥 ON INJECTE DIRECTEMENT LE FORMAT COMPATIBLE ÉDITEUR
    sessionStorage.setItem(
      "ai_editor_draft",
      JSON.stringify(template)
    );

    nav("/editor");
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">
        Générateur IA de questionnaires
      </h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-4 border rounded"
        rows={4}
        placeholder="Ex : Crée un questionnaire de satisfaction client pour une banque"
      />

      <button
        onClick={send}
        disabled={loading}
        className="mt-4 px-6 py-3 rounded bg-indigo-600 text-white font-semibold"
      >
        {loading ? "Génération..." : "Envoyer à l’IA"}
      </button>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {template && (
        <div className="mt-8 p-6 border rounded bg-white">
          <h2 className="text-xl font-bold">{template.title}</h2>
          <p className="text-slate-600 mt-1">{template.description}</p>

          <div className="mt-4 space-y-2">
            {(template.questions || []).map((q, i) => (
              <div key={i} className="text-sm">
                {i + 1}. {q.text}
              </div>
            ))}
          </div>

          <button
            onClick={injectIntoEditor}
            className="mt-6 px-5 py-2 rounded bg-emerald-600 text-white font-semibold"
          >
            Utiliser ce modèle dans l’éditeur
          </button>
        </div>
      )}
    </div>
  );
}
