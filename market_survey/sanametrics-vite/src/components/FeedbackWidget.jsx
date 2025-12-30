import { useState } from "react";

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("idea");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitFeedback = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/feedback/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("access")
              ? { Authorization: `Bearer ${localStorage.getItem("access")}` }
              : {}),
          },
          body: JSON.stringify({
            type,
            message,
            page: window.location.pathname,
          }),
        }
      );

      if (res.ok) {
        setSuccess(true);
        setMessage("");
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Erreur feedback", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#2563eb",
          color: "white",
          padding: "12px 16px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        💬 Donner un avis
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <h3 style={{ marginBottom: "12px" }}>Votre avis</h3>

            {success ? (
              <p style={{ color: "green" }}>
                Merci pour votre retour 🙏
              </p>
            ) : (
              <>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", marginBottom: "8px" }}
                >
                  <option value="bug">🐞 Bug</option>
                  <option value="idea">💡 Suggestion</option>
                  <option value="ux">🤔 Incompréhension</option>
                  <option value="other">📌 Autre</option>
                </select>

                <textarea
                  placeholder="Expliquez votre remarque..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    marginBottom: "12px",
                    padding: "8px",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ marginRight: "8px" }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitFeedback}
                    disabled={loading}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "6px",
                    }}
                  >
                    {loading ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
