/**
 * app.js — Hash-based router and navigation management.
 * Dispatches URL hash changes to the appropriate page render function.
 */

function router() {
  const hash = window.location.hash || "#/clients";
  updateNavActive(hash);

  // #/clients
  if (hash === "#/clients" || hash === "#/") {
    renderClientList();
    return;
  }

  // #/clients/new
  if (hash === "#/clients/new") {
    renderClientForm(null);
    return;
  }

  // #/clients/:id
  const clientMatch = hash.match(/^#\/clients\/(\d+)$/);
  if (clientMatch) {
    renderClientForm(parseInt(clientMatch[1], 10));
    return;
  }

  // #/contacts
  if (hash === "#/contacts") {
    renderContactList();
    return;
  }

  // #/contacts/new
  if (hash === "#/contacts/new") {
    renderContactForm(null);
    return;
  }

  // #/contacts/:id
  const contactMatch = hash.match(/^#\/contacts\/(\d+)$/);
  if (contactMatch) {
    renderContactForm(parseInt(contactMatch[1], 10));
    return;
  }

  // 404 fallback
  document.getElementById("app").innerHTML = `
    <p class="empty-message">Page not found. <a href="#/clients" class="btn-link">Go to Clients</a></p>
  `;
}

function updateNavActive(hash) {
  document.querySelectorAll(".nav-links a").forEach((a) => a.classList.remove("active"));
  if (hash.startsWith("#/contacts")) {
    document.getElementById("nav-contacts")?.classList.add("active");
  } else {
    document.getElementById("nav-clients")?.classList.add("active");
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
