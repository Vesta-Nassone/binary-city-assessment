/**
 * api.js — Centralised AJAX wrappers for all backend endpoints.
 * All functions return the parsed JSON response or throw an Error
 * with a friendly message on failure.
 */

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const detail = data.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) {
      const msgs = detail.map((e) => e.msg).join("; ");
      throw new Error(msgs);
    }
    throw new Error("An unexpected error occurred");
  }

  return data;
}

const api = {
  // Clients
  getClients: () => apiFetch("/api/clients"),
  getClient: (id) => apiFetch(`/api/clients/${id}`)
};
