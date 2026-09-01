import { API_BASE } from "./useApi";

export async function consumeCredits(token, action, details = {}) {
  const response = await fetch(`${API_BASE}/api/billing/consume/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...details }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error || "Impossible de débiter les crédits pour cet export."
    );
  }

  return data;
}
