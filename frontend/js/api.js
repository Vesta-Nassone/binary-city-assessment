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
  getClient: (id) => apiFetch(`/api/clients/${id}`),
  createClient: (body) => apiFetch("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id, body) => apiFetch(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteClient: (id) => apiFetch(`/api/clients/${id}`, { method: "DELETE" }),
  getAvailableContacts: (clientId) => apiFetch(`/api/clients/${clientId}/available-contacts`),
  linkContact: (clientId, contactId) => apiFetch(`/api/clients/${clientId}/contacts/${contactId}`, { method: "POST" }),
  unlinkContact: (clientId, contactId) => apiFetch(`/api/clients/${clientId}/contacts/${contactId}`, { method: "DELETE" }),

  // Contacts
  getContacts: () => apiFetch("/api/contacts"),
  getContact: (id) => apiFetch(`/api/contacts/${id}`),
  createContact: (body) => apiFetch("/api/contacts", { method: "POST", body: JSON.stringify(body) }),
  updateContact: (id, body) => apiFetch(`/api/contacts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteContact: (id) => apiFetch(`/api/contacts/${id}`, { method: "DELETE" }),
  getAvailableClients: (contactId) => apiFetch(`/api/contacts/${contactId}/available-clients`),
  linkClient: (contactId, clientId) => apiFetch(`/api/contacts/${contactId}/clients/${clientId}`, { method: "POST" }),
  unlinkClient: (contactId, clientId) => apiFetch(`/api/contacts/${contactId}/clients/${clientId}`, { method: "DELETE" }),
};
