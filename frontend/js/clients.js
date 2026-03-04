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
