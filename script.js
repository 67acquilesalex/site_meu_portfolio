document.querySelectorAll(".menu-group > button").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.closest(".menu-group");
    const expanded = group?.classList.toggle("open");
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
});

const budgetForm = document.querySelector("[data-budget-form]");
const whatsappNumber = "5592999999999";

if (budgetForm) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(budgetForm);
    const message = [
      "Olá! Gostaria de solicitar um orçamento.",
      "",
      `Nome: ${formData.get("nome") || ""}`,
      `Telefone: ${formData.get("telefone") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Data da sessão: ${formData.get("data") || "A definir"}`,
      `Segmento: ${formData.get("segmento") || ""}`,
      `Mensagem: ${formData.get("mensagem") || ""}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

const siteFooter = document.querySelector(".site-footer");

if (siteFooter) {
  const adminShell = document.createElement("section");
  adminShell.className = "admin-access";
  adminShell.setAttribute("aria-label", "Admin");
  adminShell.innerHTML = `
    <details>
      <summary>Admin</summary>
      <form class="admin-form" data-admin-login>
        <label>
          Login
          <input name="login" type="text" autocomplete="username" />
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="current-password" />
        </label>
        <button type="submit">Entrar</button>
        <p class="admin-message" data-admin-message></p>
      </form>
      <div class="admin-panel" data-admin-panel hidden>
        <span>Admin conectado</span>
        <button type="button" data-admin-logout>Sair</button>
      </div>
    </details>
  `;

  siteFooter.insertAdjacentElement("afterend", adminShell);

  const adminForm = adminShell.querySelector("[data-admin-login]");
  const adminPanel = adminShell.querySelector("[data-admin-panel]");
  const adminMessage = adminShell.querySelector("[data-admin-message]");
  const adminLogout = adminShell.querySelector("[data-admin-logout]");

  const setAdminState = (isLoggedIn) => {
    adminForm.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
    if (isLoggedIn) {
      adminMessage.textContent = "";
      localStorage.setItem("portfolio-admin", "1");
    } else {
      localStorage.removeItem("portfolio-admin");
    }
  };

  setAdminState(localStorage.getItem("portfolio-admin") === "1");

  adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(adminForm);
    const login = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");

    if (login === "admin" && password === "admin123") {
      setAdminState(true);
      adminForm.reset();
      return;
    }

    adminMessage.textContent = "Login inválido.";
  });

  adminLogout.addEventListener("click", () => {
    setAdminState(false);
  });
}
