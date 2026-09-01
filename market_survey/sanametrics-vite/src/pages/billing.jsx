import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "../api/useApi";
import { useAuth } from "../api/useAuth";

const CREDIT_PACKS = [
  {
    id: "c1",
    name: "Pack Découverte",
    credits: 10,
    priceFcfa: 1000,
    description: "Pour essayer la génération ou une première analyse.",
  },
  {
    id: "c2",
    name: "Pack Terrain",
    credits: 40,
    priceFcfa: 3000,
    description: "Pour les équipes qui utilisent l’IA régulièrement.",
  },
  {
    id: "c3",
    name: "Pack Croissance",
    credits: 100,
    priceFcfa: 6000,
    recommended: true,
    description: "Le meilleur équilibre pour analyser plusieurs enquêtes.",
  },
  {
    id: "c4",
    name: "Pack Organisation",
    credits: 250,
    priceFcfa: 12000,
    description: "Pour les organisations avec un volume important.",
  },
];

const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Billing() {
  const { access, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const initialPackId = useMemo(() => {
    const requestedPackId = searchParams.get("pack");

    return CREDIT_PACKS.some((pack) => pack.id === requestedPackId)
      ? requestedPackId
      : "c3";
  }, [searchParams]);

  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedPackId, setSelectedPackId] = useState(initialPackId);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedPack =
    CREDIT_PACKS.find((pack) => pack.id === selectedPackId) || CREDIT_PACKS[0];

  const fetchBalance = useCallback(
    async (signal) => {
      if (!access) {
        setBalance(0);
        setLoadingBalance(false);
        return;
      }

      setLoadingBalance(true);

      try {
        const response = await fetch(`${API_BASE}/api/billing/balance/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
          signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "Impossible de récupérer votre solde."
          );
        }

        setBalance(typeof data.balance === "number" ? data.balance : 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Impossible de récupérer votre solde.");
        }
      } finally {
        setLoadingBalance(false);
      }
    },
    [access]
  );

  const fetchHistory = useCallback(
    async (signal) => {
      if (!access) {
        setAiHistory([]);
        setTransactions([]);
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);

      try {
        const response = await fetch(`${API_BASE}/api/billing/history/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
          signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "Impossible de récupérer votre historique."
          );
        }

        setAiHistory(Array.isArray(data.ai_history) ? data.ai_history : []);
        setTransactions(
          Array.isArray(data.transactions) ? data.transactions : []
        );

        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Impossible de récupérer votre historique."
          );
        }
      } finally {
        setLoadingHistory(false);
      }
    },
    [access]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchBalance(controller.signal);
    fetchHistory(controller.signal);

    return () => controller.abort();
  }, [fetchBalance, fetchHistory]);

  function refreshBillingData() {
    setError("");
    fetchBalance();
    fetchHistory();
  }

  async function handlePurchaseRequest() {
    if (!isAuthenticated) return;

    setCreatingRequest(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/billing/purchase/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ pack_id: selectedPack.id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Impossible de créer votre demande d’achat."
        );
      }

      setMessage(
        `Demande #${data.purchase_id} créée pour le ${selectedPack.name}. `
          + "Les crédits seront ajoutés uniquement après confirmation du paiement."
      );
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setCreatingRequest(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container py-10 md:py-16">
        <Link
          to="/pricing"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-400 hover:text-white"
        >
          ← Retour aux tarifs
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Espace crédits IA
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Gérez les crédits de votre équipe.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Les crédits servent à générer des questionnaires avec l’IA,
            analyser vos enquêtes et télécharger des exports professionnels.
          </p>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl md:p-8">
            <div className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Solde disponible
                </p>
                <div className="mt-2 text-4xl font-extrabold text-white">
                  {loadingBalance ? "…" : formatNumber(balance)}
                  <span className="ml-2 text-lg font-semibold text-cyan-300">
                    crédits
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={refreshBillingData}
                  disabled={loadingBalance || loadingHistory}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Actualiser
                </button>

                <Link
                  to="/features/ai"
                  className="inline-flex justify-center rounded-xl border border-blue-500/60 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                >
                  Utiliser l’IA →
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold text-white">
                Choisissez un pack
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Plus le pack est important, plus le coût par crédit baisse.
              </p>

              <div className="mt-5 grid gap-3">
                {CREDIT_PACKS.map((pack) => {
                  const isSelected = pack.id === selectedPackId;

                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackId(pack.id);
                        setError("");
                        setMessage("");
                      }}
                      className={`relative w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-950/30"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
                      }`}
                    >
                      {pack.recommended && (
                        <span className="absolute -top-2 right-4 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                          Recommandé
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-white">
                            {pack.name}
                          </div>
                          <p className="mt-1 text-sm text-slate-400">
                            {pack.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-lg font-bold text-cyan-300">
                            {formatNumber(pack.credits)} crédits
                          </div>
                          <div className="mt-1 text-sm font-medium text-white">
                            {formatNumber(pack.priceFcfa)} FCFA
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                {message}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">
                  {selectedPack.name} — {formatNumber(selectedPack.priceFcfa)} FCFA
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatNumber(selectedPack.credits)} crédits seront ajoutés après paiement.
                </p>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handlePurchaseRequest}
                  disabled={creatingRequest}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingRequest
                    ? "Création de la demande…"
                    : "Demander ce pack"}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Se connecter pour acheter
                </Link>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-bold text-white">
                À quoi servent les crédits ?
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <div>
                  <p className="font-semibold text-cyan-300">
                    Génération de questionnaire
                  </p>
                  <p className="mt-1">
                    Créez une première structure de questionnaire à partir de
                    votre besoin. 5 crédits par génération.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-cyan-300">
                    Analyse d’enquête
                  </p>
                  <p className="mt-1">
                    Obtenez une lecture claire des résultats, tendances et
                    points d’attention. 8 crédits par analyse.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-cyan-300">
                    Exports professionnels
                  </p>
                  <p className="mt-1">
                    Téléchargez vos rapports PDF ou Excel. 5 crédits par
                    fichier exporté.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-bold text-white">Important</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Les outils classiques restent accessibles : création,
                collecte, dashboard et consultation. Les crédits servent aux
                fonctionnalités IA et aux exports professionnels PDF ou Excel.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6">
              <p className="text-sm font-semibold text-white">
                Paiement en ligne
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Le paiement sécurisé sera connecté ici. Aucune demande ne
                crédite automatiquement votre compte avant sa confirmation.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Activité IA
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Générations et analyses
                </h2>
              </div>
            </div>

            {loadingHistory && (
              <p className="mt-6 text-sm text-slate-400">
                Chargement de l’historique…
              </p>
            )}

            {!loadingHistory && aiHistory.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
                Aucune opération IA pour le moment. Génère un questionnaire ou
                analyse une enquête pour voir l’activité ici.
              </div>
            )}

            {!loadingHistory && aiHistory.length > 0 && (
              <div className="mt-6 space-y-3">
                {aiHistory.map((item) => (
                  <article
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-rose-300">
                        {item.credits} crédit
                        {Math.abs(item.credits) > 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.status === "completed"
                          ? "Terminé"
                          : item.status || "En cours"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Mouvements du solde
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              Historique des crédits
            </h2>

            {loadingHistory && (
              <p className="mt-6 text-sm text-slate-400">
                Chargement de l’historique…
              </p>
            )}

            {!loadingHistory && transactions.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
                Aucun mouvement de crédits pour le moment.
              </div>
            )}

            {!loadingHistory && transactions.length > 0 && (
              <div className="mt-6 space-y-3">
                {transactions.map((transaction) => {
                  const isDeposit = Number(transaction.amount) > 0;

                  return (
                    <article
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {transaction.note ||
                            (isDeposit
                              ? "Ajout de crédits"
                              : "Utilisation de crédits")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>

                      <p
                        className={`font-bold ${
                          isDeposit ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {isDeposit ? "+" : ""}
                        {transaction.amount} crédit
                        {Math.abs(Number(transaction.amount)) > 1 ? "s" : ""}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
