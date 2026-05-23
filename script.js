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
const editorTargets = ".portfolio-gallery, .masonry, .project-grid";

const getEditorKey = () => `portfolio-editor:${location.pathname || "/index.html"}`;

const getItemData = (item) => {
  if (item.matches(".gallery-item")) {
    return {
      kind: "album",
      tag: "a",
      href: item.getAttribute("href") || "#",
      title: item.querySelector("span")?.textContent?.trim() || "Album",
      src: item.querySelector("img")?.getAttribute("src") || "",
      alt: item.querySelector("img")?.getAttribute("alt") || "",
      className: item.className,
      hidden: item.hidden,
    };
  }

  if (item.matches("img")) {
    return {
      kind: "photo",
      tag: "img",
      src: item.getAttribute("src") || "",
      alt: item.getAttribute("alt") || "",
      hidden: item.hidden,
    };
  }

  return {
    kind: "card",
    tag: "article",
    title: item.querySelector("h3")?.textContent?.trim() || "Item",
    text: item.querySelector("p")?.textContent?.trim() || "",
    hidden: item.hidden,
  };
};

const createItemElement = (data) => {
  if (data.tag === "a") {
    const anchor = document.createElement("a");
    anchor.className = data.className || "gallery-item wide";
    anchor.href = data.href || "#";
    anchor.hidden = Boolean(data.hidden);
    anchor.innerHTML = `
      <img src="${data.src}" alt="${data.alt || data.title || "Album"}" />
      <span>${data.title || "Album"}</span>
    `;
    return anchor;
  }

  if (data.tag === "img") {
    const image = document.createElement("img");
    image.src = data.src;
    image.alt = data.alt || "Foto";
    image.hidden = Boolean(data.hidden);
    return image;
  }

  const article = document.createElement("article");
  article.hidden = Boolean(data.hidden);
  article.innerHTML = `
    <h3>${data.title || "Item"}</h3>
    <p>${data.text || ""}</p>
  `;
  return article;
};

const getContainerItems = (container) => {
  if (container.matches(".portfolio-gallery")) {
    return [...container.querySelectorAll(":scope > .gallery-item")];
  }

  if (container.matches(".masonry")) {
    return [...container.querySelectorAll(":scope > img")];
  }

  return [...container.children];
};

const readEditorState = () => {
  try {
    return JSON.parse(localStorage.getItem(getEditorKey()) || "{}");
  } catch {
    return {};
  }
};

const writeEditorState = (state) => {
  localStorage.setItem(getEditorKey(), JSON.stringify(state));
};

const applyEditorState = () => {
  const state = readEditorState();

  document.querySelectorAll(editorTargets).forEach((container, index) => {
    const key = container.dataset.editorKey || `section-${index}`;
    container.dataset.editorKey = key;
    const items = state[key];
    if (!Array.isArray(items)) return;

    container.replaceChildren(...items.map(createItemElement));
  });
};

const buildCurrentEditorState = () => {
  const state = {};
  document.querySelectorAll(editorTargets).forEach((container, index) => {
    const key = container.dataset.editorKey || `section-${index}`;
    container.dataset.editorKey = key;
    state[key] = getContainerItems(container).map(getItemData);
  });
  return state;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });

const renderMockEditor = (adminShell) => {
  const existing = adminShell.querySelector("[data-mock-editor]");
  existing?.remove();

  const containers = [...document.querySelectorAll(editorTargets)];
  if (!containers.length) return;

  const state = buildCurrentEditorState();
  const editor = document.createElement("div");
  editor.className = "mock-editor";
  editor.dataset.mockEditor = "";
  editor.innerHTML = `<h3>Editor mock</h3>`;

  containers.forEach((container, sectionIndex) => {
    const key = container.dataset.editorKey || `section-${sectionIndex}`;
    container.dataset.editorKey = key;
    const section = document.createElement("section");
    const sectionName = container.getAttribute("aria-label") || container.className || `Seção ${sectionIndex + 1}`;
    section.className = "mock-editor-section";
    section.innerHTML = `
      <div class="mock-editor-head">
        <strong>${sectionName}</strong>
        <label class="mock-upload">
          Upload
          <input type="file" accept="image/*" data-upload="${key}" />
        </label>
      </div>
      <div class="mock-editor-list" data-editor-list="${key}"></div>
    `;

    const list = section.querySelector("[data-editor-list]");
    state[key].forEach((item, itemIndex) => {
      const row = document.createElement("div");
      row.className = "mock-editor-row";
      row.innerHTML = `
        <span>${item.title || item.alt || `Foto ${itemIndex + 1}`}</span>
        <button type="button" data-action="toggle" data-key="${key}" data-index="${itemIndex}">
          ${item.hidden ? "Mostrar" : "Ocultar"}
        </button>
        <button type="button" data-action="up" data-key="${key}" data-index="${itemIndex}">↑</button>
        <button type="button" data-action="down" data-key="${key}" data-index="${itemIndex}">↓</button>
        <button type="button" data-action="remove" data-key="${key}" data-index="${itemIndex}">Remover</button>
      `;
      list.append(row);
    });

    editor.append(section);
  });

  const reset = document.createElement("button");
  reset.className = "mock-editor-reset";
  reset.type = "button";
  reset.textContent = "Resetar mock desta página";
  reset.addEventListener("click", () => {
    localStorage.removeItem(getEditorKey());
    location.reload();
  });
  editor.append(reset);

  editor.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const key = button.dataset.key;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    const items = state[key];
    if (!items) return;

    if (action === "toggle") {
      items[index].hidden = !items[index].hidden;
    }

    if (action === "remove") {
      items.splice(index, 1);
    }

    if (action === "up" && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    }

    if (action === "down" && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
    }

    writeEditorState(state);
    applyEditorState();
    renderMockEditor(adminShell);
  });

  editor.addEventListener("change", async (event) => {
    const input = event.target.closest("input[type='file'][data-upload]");
    if (!input?.files?.length) return;

    const key = input.dataset.upload;
    const file = input.files[0];
    const src = await fileToDataUrl(file);
    const container = containers.find((item) => item.dataset.editorKey === key);
    const isAlbumSection = container?.matches(".portfolio-gallery");
    const title = isAlbumSection ? prompt("Nome do album:", file.name.replace(/\.[^.]+$/, "")) : "";

    state[key].push(
      isAlbumSection
        ? {
            kind: "album",
            tag: "a",
            href: "#",
            title: title || "Novo album",
            src,
            alt: title || "Novo album",
            className: "gallery-item wide",
            hidden: false,
          }
        : {
            kind: "photo",
            tag: "img",
            src,
            alt: file.name,
            hidden: false,
          }
    );

    writeEditorState(state);
    applyEditorState();
    renderMockEditor(adminShell);
  });

  adminShell.querySelector("[data-admin-panel]")?.append(editor);
};

applyEditorState();

if (siteFooter) {
  const adminShell = document.createElement("section");
  adminShell.className = "admin-access";
  adminShell.setAttribute("aria-label", "Admin");
  adminShell.innerHTML = `
    <details>
      <summary>Admin login</summary>
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
      renderMockEditor(adminShell);
    } else {
      localStorage.removeItem("portfolio-admin");
      adminShell.querySelector("[data-mock-editor]")?.remove();
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
