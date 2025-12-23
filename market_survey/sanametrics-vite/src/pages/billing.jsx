// src/pages/Billing.jsx
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../api/useApi";
import { useAuth } from "../api/useAuth";
import { Link } from "react-router-dom";

const CREDIT_PACKS = [
  { id: "c1", name: "Pack Découverte", credits: 5000, price: "Coming soon" },
  { id: "c2", name: "Pack Pro", credits: 25000, price: "Coming soon" },
  { id: "c3", name: "Pack Volume", credits: 120000, price: "Coming soon" },
];

export default function Billing() {
  const { access, user, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchBalance = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/billing/balance/`, {
        headers: access ? { Authorization: `Bearer ${access}` } : {},
        signal,
      });
      if (!res.ok) {
        // si 401/403 : inviter à se reconnecter
        if (res.status === 401 || res.status === 403) {
          setError("Veuillez vous connecter pour accéder au solde.");
          setBalance(0);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setBalance(typeof json.balance === "number" ? json.balance : 0);
      setLastUpdate(new Date().toISOString());
    } catch (e) {
      if (e.name !== "AbortError") {
        setError("Impossible de charger le solde. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }, [access]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBalance(controller.signal);
    return () => controller.abort();
  }, [fetchBalance]);

  async function handleBuy(pack) {
    // si pas connecté : proposer de se connecter ou ouvrir mailto
    if (!isAuthenticated) {
      if (
        window.confirm(
          "Vous devez être connecté pour acheter des crédits. Voulez-vous vous connecter maintenant ?"
        )
      ) {
        window.location.href = "/login";
      }
      return;
    }

    setPurchasing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/billing/purchase/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ pack_id: pack.id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // message serveur si présent
        const msg = json?.detail || json?.error || `Erreur HTTP ${res.status}`;
        throw new Error(msg);
      }

      // backend attendu: { ok: true, balance: <new_balance> }
      if (json.ok) {
        if (typeof json.balance === "number") setBalance(json.balance);
        setLastUpdate(new Date().toISOString());
        alert(`Achat réussi — nouveau solde : ${json.balance} crédits`);
      } else {
        throw new Error(json.error || "Achat échoué");
      }
    } catch (e) {
      // fallback : mailto
      const subject = encodeURIComponent(`Achat crédits: ${pack.name}`);
      const body = encodeURIComponent(
        `Bonjour,%0A%0AJe souhaite acheter le pack ${pack.name} (${pack.credits.toLocaleString()} crédits) au prix de ${pack.price}.%0A%0AMon compte: ${user?.username || "(non connecté)"}.%0A%0AMerci.`
      );

      if (
        window.confirm(
          `Achat automatique indisponible (${e.message}). Souhaitez-vous envoyer une demande par email pour acheter ${pack.name}?`
        )
      ) {
        window.location.href = `mailto:contact@sana.app?subject=${subject}&body=${body}`;
      } else {
        setError(e.message);
      }
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container py-12 md:py-16">
        {/* 🔙 BOUTON RETOUR */}
        <Link
          to="/pricing"
          className="inline-flex items-center px-4 py-2 mb-6 rounded-full text-sm font-semibold border border-slate-300 bg-white hover:bg-slate-100 transition"
        >
          ← Retour
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold">Gérer mes crédits IA</h1>
          <p className="text-sm text-slate-600 mt-2">
            Achetez des crédits pour alimenter la génération IA (prompts + réponses).
            Les crédits sont consommés selon la conversion définie côté serveur.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 bg-white rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Solde de crédits</h3>
                <p className="text-sm text-slate-500">Solde disponible pour les générations IA</p>
              </div>
              <div className="text-right">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement…</div>
                ) : (
                  <div className="text-2xl font-bold">{balance ?? "—"} crédits</div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  Dernière mise à jour :{" "}
                  {lastUpdate ? new Date(lastUpdate).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="grid gap-4">
              {CREDIT_PACKS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border rounded-lg p-4 md:p-3"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.credits.toLocaleString()} crédits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{p.price}</div>
                    <button
                      onClick={() => handleBuy(p)}
                      disabled={purchasing || !isAuthenticated}
                      className={`mt-2 inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                        purchasing || !isAuthenticated
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-[#2563eb] text-white"
                      }`}
                    >
                      {purchasing ? "Traitement…" : isAuthenticated ? "Acheter" : "Se connecter"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-slate-500">
              <p>
                Si tu veux une intégration de paiement (Stripe / Paystack / Flutterwave),
                on pourra ajouter une page de checkout et webhooks pour valider automatiquement les achats.
              </p>
            </div>
          </div>

          <aside className="bg-white rounded-2xl border p-6">
            <h4 className="font-semibold mb-2">Comprendre les crédits</h4>
            <p className="text-sm text-slate-600">
              Exemple de conversion (modifiable côté backend) :{" "}
              <strong>1 crédit = 1000 tokens</strong>.
              Les tokens proviennent des prompts et des réponses.
              Limitez <code>max_tokens</code> côté serveur pour maîtriser les coûts.
            </p>

            <div className="mt-6 text-xs text-slate-400">
              Besoin d'aide ?{" "}
              <a href="mailto:contact@sana.app" className="text-[var(--brand,#4f46e5)]">
                contact@sana.app
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
