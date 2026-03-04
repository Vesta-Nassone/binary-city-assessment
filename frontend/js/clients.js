/**
 * clients.js — Client list page and client form page rendering.
 */

// Client List
async function renderClientList() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-header">
      <h2>Clients</h2>
      <a href="#/clients/new" class="btn btn-primary">+ New Client</a>
    </div>
    <p class="loading">Loading clients...</p>
  `;

  try {
    const clients = await api.getClients();
    const loading = app.querySelector(".loading");
    loading.remove();

    if (clients.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "No client(s) found.";
      app.appendChild(empty);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th class="left">Name</th>
            <th class="left">Client code</th>
            <th class="center">No. of linked contacts</th>
          </tr>
        </thead>
        <tbody>
          ${clients.map((client) => `
            <tr>
              <td><a href="#/clients/${client.id}" class="btn-link">${escapeHtml(client.name)}</a></td>
              <td>${escapeHtml(client.code)}</td>
              <td class="center">${client.contact_count}</td>
            </tr>`
    )
        .join("")}
        </tbody>
      </table>
    `;
    app.appendChild(wrap);
  } catch (err) {
    app.querySelector(".loading").textContent = "Failed to load clients: " + err.message;
  }
}

// Client Form
async function renderClientForm(clientId) {
  const isNew = clientId === null;
  const app = document.getElementById("app");

  app.innerHTML = `
    <a href="#/clients" class="back-link">← Back to Clients</a>
    <div class="card">
      <div class="tabs">
        <button class="tab-btn active" data-tab="general">General</button>
        ${!isNew ? '<button class="tab-btn" data-tab="contacts">Contacts</button>' : ""}
      </div>
      <div class="tab-panel active" id="tab-general">
        <p class="loading">Loading...</p>
      </div>
      ${!isNew ? '<div class="tab-panel" id="tab-contacts"><p class="loading">Loading contacts...</p></div>' : ""}
    </div>
  `;

  setupTabs(app);

  let client = null;
  if (!isNew) {
    try {
      client = await api.getClient(clientId);
    } catch (err) {
      document.getElementById("tab-general").innerHTML = `<p class="alert alert-error">${err.message}</p>`;
      return;
    }
  }

  renderGeneralTab(client, isNew);

  if (!isNew) {
    renderContactsTab(client);
  }
}

function renderGeneralTab(client, isNew) {
  const panel = document.getElementById("tab-general");
  panel.innerHTML = `
    <form id="client-form" novalidate>
      <div class="form-group">
        <label for="client-name">Name <span style="color:#dc3545">*</span></label>
        <input type="text" id="client-name" name="name" value="${client ? escapeHtml(client.name) : ""}" />
        <span class="field-error" data-error="name"></span>
      </div>
      ${!isNew
      ? `<div class="form-group">
          <label for="client-code">Client Code</label>
          <input type="text" id="client-code" value="${escapeHtml(client.code)}" readonly />
        </div>`
      : ""
    }
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        ${!isNew ? `<button type="button" class="btn btn-danger" id="btn-delete-client">Delete</button>` : ""}
      </div>
    </form>
  `;

  const form = document.getElementById("client-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const name = form.querySelector("#client-name").value.trim();
    let valid = true;

    if (!name) {
      setError(form, "name", "Name is required");
      valid = false;
    }

    if (!valid) return;

    try {
      if (isNew) {
        const created = await api.createClient({ name });
        window.location.hash = `#/clients/${created.id}`;
      } else {
        await api.updateClient(client.id, { name });
        showAlert(document.querySelector(".card"), "Client saved successfully.", "success");
      }
    } catch (err) {
      showAlert(document.querySelector(".card"), err.message, "error");
    }
  });

  if (!isNew) {
    document.getElementById("btn-delete-client").addEventListener("click", async () => {
      if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
      try {
        await api.deleteClient(client.id);
        window.location.hash = "#/clients";
      } catch (err) {
        showAlert(document.querySelector(".card"), err.message, "error");
      }
    });
  }
}

async function renderContactsTab(client) {
  const panel = document.getElementById("tab-contacts");

  async function refresh() {
    panel.innerHTML = `<p class="loading">Loading...</p>`;
    const updated = await api.getClient(client.id);
    const available = await api.getAvailableContacts(client.id);

    const contactRows =
      updated.contacts.length === 0
        ? `<tr><td colspan="3" class="empty-message">No contacts found.</td></tr>`
        : updated.contacts
          .map(
            (c) => `
          <tr>
            <td>${escapeHtml(c.surname)}, ${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>
              <button class="btn-link danger" data-unlink="${c.id}">Unlink</button>
            </td>
          </tr>`
          )
          .join("");

    const selectOptions =
      available.length === 0
        ? `<option value="" disabled>No contacts available to link</option>`
        : `<option value="">— Select a contact —</option>` +
        available
          .map((c) => `<option value="${c.id}">${escapeHtml(c.surname)}, ${escapeHtml(c.name)} (${escapeHtml(c.email)})</option>`)
          .join("");

    panel.innerHTML = `
      <div class="link-row">
        <select id="contact-select" ${available.length === 0 ? "disabled" : ""}>${selectOptions}</select>
        <button class="btn btn-primary" id="btn-link-contact" ${available.length === 0 ? "disabled" : ""}>Link Contact</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${contactRows}</tbody>
        </table>
      </div>
    `;

    panel.querySelectorAll("[data-unlink]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const contactId = parseInt(btn.dataset.unlink, 10);
        try {
          await api.unlinkContact(client.id, contactId);
          await refresh();
        } catch (err) {
          showAlert(document.querySelector(".card"), err.message, "error");
        }
      });
    });

    document.getElementById("btn-link-contact")?.addEventListener("click", async () => {
      const select = document.getElementById("contact-select");
      const contactId = parseInt(select.value, 10);
      if (!contactId) {
        showAlert(document.querySelector(".card"), "Please select a contact to link.", "error");
        return;
      }
      try {
        await api.linkContact(client.id, contactId);
        await refresh();
      } catch (err) {
        showAlert(document.querySelector(".card"), err.message, "error");
      }
    });
  }

  await refresh();
}

// Tab switching
function setupTabs(container) {
  container.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      container.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add("active");
    });
  });
}

// Utility functions
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helpers for alerts and form errors
function showAlert(container, message, type = "error") {
  const el = document.createElement("div");
  el.className = `alert alert-${type}`;
  el.textContent = message;
  container.prepend(el);
  setTimeout(() => el.remove(), 5000);
}

function clearErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function setError(form, fieldName, message) {
  const el = form.querySelector(`[data-error="${fieldName}"]`);
  if (el) el.textContent = message;
}
