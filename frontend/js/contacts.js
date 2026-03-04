/**
 * contacts.js — Contact list page and contact form page rendering.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contact List
async function renderContactList() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-header">
      <h2>Contacts</h2>
      <a href="#/contacts/new" class="btn btn-primary">+ New Contact</a>
    </div>
    <p class="loading">Loading contacts...</p>
  `;

  try {
    const contacts = await api.getContacts();
    app.querySelector(".loading").remove();

    if (contacts.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "No contact(s) found.";
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
            <th class="left">Surname</th>
            <th class="left">Email Address</th>
            <th class="center">No. of Linked Clients</th>
          </tr>
        </thead>
        <tbody>
          ${contacts
        .map(
          (c) => `
            <tr>
              <td><a href="#/contacts/${c.id}" class="btn-link">${escapeHtml(c.name)}</a></td>
              <td>${escapeHtml(c.surname)}</td>
              <td>${escapeHtml(c.email)}</td>
              <td class="center">${c.client_count}</td>
            </tr>`
        )
        .join("")}
        </tbody>
      </table>
    `;
    app.appendChild(wrap);
  } catch (err) {
    app.querySelector(".loading").textContent = "Failed to load contacts: " + err.message;
  }
}

// Contact Form
async function renderContactForm(contactId) {
  const isNew = contactId === null;
  const app = document.getElementById("app");

  app.innerHTML = `
    <a href="#/contacts" class="back-link">← Back to Contacts</a>
    <div class="card">
      <div class="tabs">
        <button class="tab-btn active" data-tab="general">General</button>
        ${!isNew ? '<button class="tab-btn" data-tab="clients">Clients</button>' : ""}
      </div>
      <div class="tab-panel active" id="tab-general">
        <p class="loading">Loading...</p>
      </div>
      ${!isNew ? '<div class="tab-panel" id="tab-clients"><p class="loading">Loading clients...</p></div>' : ""}
    </div>
  `;

  setupContactTabs(app);

  let contact = null;
  if (!isNew) {
    try {
      contact = await api.getContact(contactId);
    } catch (err) {
      document.getElementById("tab-general").innerHTML = `<p class="alert alert-error">${err.message}</p>`;
      return;
    }
  }

  renderContactGeneralTab(contact, isNew);

  if (!isNew) {
    renderClientsTab(contact);
  }
}

function renderContactGeneralTab(contact, isNew) {
  const panel = document.getElementById("tab-general");
  panel.innerHTML = `
    <form id="contact-form" novalidate>
      <div class="form-group">
        <label for="contact-name">Name <span style="color:#dc3545">*</span></label>
        <input type="text" id="contact-name" name="name" value="${contact ? escapeHtml(contact.name) : ""}" />
        <span class="field-error" data-error="name"></span>
      </div>
      <div class="form-group">
        <label for="contact-surname">Surname <span style="color:#dc3545">*</span></label>
        <input type="text" id="contact-surname" name="surname" value="${contact ? escapeHtml(contact.surname) : ""}" />
        <span class="field-error" data-error="surname"></span>
      </div>
      <div class="form-group">
        <label for="contact-email">Email Address <span style="color:#dc3545">*</span></label>
        <input type="email" id="contact-email" name="email" value="${contact ? escapeHtml(contact.email) : ""}" />
        <span class="field-error" data-error="email"></span>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        ${!isNew ? `<button type="button" class="btn btn-danger" id="btn-delete-contact">Delete</button>` : ""}
      </div>
    </form>
  `;

  const form = document.getElementById("contact-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearContactErrors(form);

    const name = form.querySelector("#contact-name").value.trim();
    const surname = form.querySelector("#contact-surname").value.trim();
    const email = form.querySelector("#contact-email").value.trim();
    let valid = true;

    if (!name) {
      setContactError(form, "name", "Name is required");
      valid = false;
    }
    if (!surname) {
      setContactError(form, "surname", "Surname is required");
      valid = false;
    }
    if (!email) {
      setContactError(form, "email", "Email address is required");
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setContactError(form, "email", "Please enter a valid email address");
      valid = false;
    }

    if (!valid) return;

    try {
      if (isNew) {
        const created = await api.createContact({ name, surname, email });
        if (created) {
          window.location.hash = `#/contacts`;
          showContactAlert(document.querySelector(".card"), "Contact saved successfully.", "success");
        }
      } else {
        await api.updateContact(contact.id, { name, surname, email });
        showContactAlert(document.querySelector(".card"), "Contact saved successfully.", "success");
      }
    } catch (err) {
      showContactAlert(document.querySelector(".card"), err.message, "error");
    }
  });

  if (!isNew) {
    document.getElementById("btn-delete-contact").addEventListener("click", async () => {
      if (!confirm(`Delete contact "${contact.surname}, ${contact.name}"? This cannot be undone.`)) return;
      try {
        await api.deleteContact(contact.id);
        window.location.hash = "#/contacts";
      } catch (err) {
        showContactAlert(document.querySelector(".card"), err.message, "error");
      }
    });
  }
}

async function renderClientsTab(contact) {
  const panel = document.getElementById("tab-clients");

  async function refresh() {
    panel.innerHTML = `<p class="loading">Loading...</p>`;
    const updated = await api.getContact(contact.id);
    const available = await api.getAvailableClients(contact.id);

    const clientRows =
      updated.clients.length === 0
        ? `<tr><td colspan="3" class="empty-message">No contact(s) found.</td></tr>`
        : updated.clients
          .map(
            (c) => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.code)}</td>
            <td>
              <button class="btn-link danger" data-unlink="${c.id}">Unlink</button>
            </td>
          </tr>`
          )
          .join("");

    const selectOptions =
      available.length === 0
        ? `<option value="" disabled>No clients available to link</option>`
        : `<option value="">— Select a client —</option>` +
        available
          .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.code)})</option>`)
          .join("");

    panel.innerHTML = `
      <div class="link-row">
        <select id="client-select" ${available.length === 0 ? "disabled" : ""}>${selectOptions}</select>
        <button class="btn btn-primary" id="btn-link-client" ${available.length === 0 ? "disabled" : ""}>Link Client</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="left">Client Name</th>
              <th class="left">Client Code</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${clientRows}</tbody>
        </table>
      </div>
    `;

    panel.querySelectorAll("[data-unlink]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const clientId = parseInt(btn.dataset.unlink, 10);
        try {
          await api.unlinkClient(contact.id, clientId);
          await refresh();
        } catch (err) {
          showContactAlert(document.querySelector(".card"), err.message, "error");
        }
      });
    });

    document.getElementById("btn-link-client")?.addEventListener("click", async () => {
      const select = document.getElementById("client-select");
      const clientId = parseInt(select.value, 10);
      if (!clientId) {
        showContactAlert(document.querySelector(".card"), "Please select a client to link.", "error");
        return;
      }
      try {
        await api.linkClient(contact.id, clientId);
        await refresh();
      } catch (err) {
        showContactAlert(document.querySelector(".card"), err.message, "error");
      }
    });
  }

  await refresh();
}

// Tab switching
function setupContactTabs(container) {
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

// Helper functions
function showContactAlert(container, message, type = "error") {
  const existing = container.querySelector(".alert");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = `alert alert-${type}`;
  el.textContent = message;
  container.prepend(el);
  setTimeout(() => el.remove(), 5000);
}

function clearContactErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function setContactError(form, fieldName, message) {
  const el = form.querySelector(`[data-error="${fieldName}"]`);
  if (el) el.textContent = message;
}
