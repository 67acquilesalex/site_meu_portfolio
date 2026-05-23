const GLOBAL_CONTENT_KEY = "portfolio-editor:global-content";

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
      "Ola! Gostaria de solicitar um orcamento.",
      "",
      `Nome: ${formData.get("nome") || ""}`,
      `Telefone: ${formData.get("telefone") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Data da sessao: ${formData.get("data") || "A definir"}`,
      `Segmento: ${formData.get("segmento") || ""}`,
      `Mensagem: ${formData.get("mensagem") || ""}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

const defaultAlbums = [
  {
    slug: "gestante",
    title: "Ensaio de gestante",
    href: "gestante.html",
    cover: "assets/marilopes/gestante.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/gestante.jpg", alt: "Ensaio de gestante", hidden: false },
      { src: "assets/marilopes/feminino.jpg", alt: "Retrato feminino", hidden: false },
      { src: "assets/marilopes/casal.jpg", alt: "Ensaio externo", hidden: false },
    ],
  },
  {
    slug: "imoveis",
    title: "Fotografia de imoveis",
    href: "imoveis.html",
    cover: "assets/marilopes/imoveis.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/imoveis.jpg", alt: "Fotografia de imoveis", hidden: false },
      { src: "assets/marilopes/familia.jpg", alt: "Ambiente natural", hidden: false },
      { src: "assets/marilopes/casal.jpg", alt: "Detalhe externo", hidden: false },
    ],
  },
  {
    slug: "feminino",
    title: "Ensaio feminino",
    href: "feminino.html",
    cover: "assets/marilopes/feminino.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/feminino.jpg", alt: "Ensaio feminino", hidden: false },
      { src: "assets/marilopes/empresarial.jpg", alt: "Retrato profissional", hidden: false },
      { src: "assets/marilopes/gestante.jpg", alt: "Retrato em praia", hidden: false },
    ],
  },
  {
    slug: "casal",
    title: "Ensaio de casal",
    href: "casal.html",
    cover: "assets/marilopes/casal.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/casal.jpg", alt: "Ensaio de casal", hidden: false },
      { src: "assets/marilopes/familia.jpg", alt: "Casal em natureza", hidden: false },
      { src: "assets/marilopes/feminino.jpg", alt: "Retrato externo", hidden: false },
    ],
  },
  {
    slug: "empresarial",
    title: "Ensaio empresarial",
    href: "empresarial.html",
    cover: "assets/marilopes/empresarial.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/empresarial.jpg", alt: "Ensaio empresarial", hidden: false },
      { src: "assets/marilopes/feminino.jpg", alt: "Retrato profissional", hidden: false },
      { src: "assets/marilopes/imoveis.jpg", alt: "Ambiente comercial", hidden: false },
    ],
  },
  {
    slug: "familia",
    title: "Ensaio de familia",
    href: "familia.html",
    cover: "assets/marilopes/familia.jpg",
    hidden: false,
    photos: [
      { src: "assets/marilopes/familia.jpg", alt: "Ensaio de familia", hidden: false },
      { src: "assets/marilopes/casal.jpg", alt: "Familia em ambiente natural", hidden: false },
      { src: "assets/marilopes/gestante.jpg", alt: "Retrato familiar", hidden: false },
    ],
  },
];

const readContent = () => {
  const cloneDefaults = () => JSON.parse(JSON.stringify(defaultAlbums));

  try {
    const stored = JSON.parse(localStorage.getItem(GLOBAL_CONTENT_KEY) || "null");
    if (stored?.albums?.length) return stored;
  } catch {
    return { albums: cloneDefaults() };
  }

  return { albums: cloneDefaults() };
};

const saveContent = (content) => {
  localStorage.setItem(GLOBAL_CONTENT_KEY, JSON.stringify(content));
};

const currentSlug = () => location.pathname.replace(/^\/|\.html$/g, "") || "index";

const albumCard = (album, index) => {
  const item = document.createElement("a");
  item.className = `gallery-item ${index % 2 ? "wide" : "tall"}`;
  item.href = album.href;
  item.dataset.albumIndex = String(index);
  item.innerHTML = `
    <img src="${album.cover}" alt="${album.title}" />
    <span>${album.title}</span>
  `;
  return item;
};

const photoNode = (photo, index) => {
  const item = document.createElement("figure");
  item.className = "photo-item";
  item.dataset.photoIndex = String(index);
  item.innerHTML = `<img src="${photo.src}" alt="${photo.alt || "Foto"}" />`;
  return item;
};

const applyContent = () => {
  const content = readContent();

  document.querySelectorAll(".portfolio-gallery").forEach((gallery) => {
    gallery.replaceChildren(
      ...content.albums
        .filter((album) => !album.hidden)
        .map((album, index) => albumCard(album, index))
    );
  });

  const slug = currentSlug();
  const album = content.albums.find((item) => item.slug === slug);
  const categoryGallery = document.querySelector(".masonry.category-gallery");
  if (album && categoryGallery) {
    const photos = album.photos.filter((photo) => !photo.hidden);
    categoryGallery.replaceChildren(...photos.map(photoNode));
  }

  if (document.body.classList.contains("admin-editing")) renderInlineAdmin();
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });

const moveItem = (items, from, to) => {
  if (to < 0 || to >= items.length) return;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
};

const visibleIndexToRealIndex = (items, visibleIndex) => {
  const visibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.hidden);
  return visibleItems[visibleIndex]?.index ?? -1;
};

const saveAndRefresh = (content) => {
  saveContent(content);
  applyContent();
};

const renderInlineAdmin = () => {
  document.querySelectorAll("[data-inline-admin]").forEach((item) => item.remove());
  const content = readContent();

  document.querySelectorAll(".portfolio-gallery").forEach((gallery) => {
    gallery.classList.add("inline-admin-scope");

    const bar = document.createElement("div");
    bar.className = "inline-admin-bar";
    bar.dataset.inlineAdmin = "";
    bar.innerHTML = `
      <span>Portfolio albums</span>
      <label>
        Upload album
        <input type="file" accept="image/*" data-upload-album />
      </label>
      <button type="button" data-reset-content>Reset</button>
    `;
    gallery.before(bar);

    gallery.querySelectorAll(".gallery-item").forEach((card, visibleIndex) => {
      const realIndex = visibleIndexToRealIndex(content.albums, visibleIndex);
      if (realIndex < 0) return;
      const controls = document.createElement("div");
      controls.className = "inline-admin-card";
      controls.dataset.inlineAdmin = "";
      controls.innerHTML = `
        <button type="button" data-album-action="toggle" data-index="${realIndex}">Hide</button>
        <button type="button" data-album-action="up" data-index="${realIndex}">Up</button>
        <button type="button" data-album-action="down" data-index="${realIndex}">Down</button>
        <button type="button" data-album-action="remove" data-index="${realIndex}">Remove</button>
      `;
      card.append(controls);
    });
  });

  const slug = currentSlug();
  const activeAlbum = content.albums.find((album) => album.slug === slug);
  const categoryGallery = document.querySelector(".masonry.category-gallery");
  if (activeAlbum && categoryGallery) {
    categoryGallery.classList.add("inline-admin-scope");

    const bar = document.createElement("div");
    bar.className = "inline-admin-bar";
    bar.dataset.inlineAdmin = "";
    bar.innerHTML = `
      <span>${activeAlbum.title} photos</span>
      <label>
        Upload photo
        <input type="file" accept="image/*" data-upload-photo="${activeAlbum.slug}" />
      </label>
    `;
    categoryGallery.before(bar);

    categoryGallery.querySelectorAll(".photo-item").forEach((item, visibleIndex) => {
      const realIndex = visibleIndexToRealIndex(activeAlbum.photos, visibleIndex);
      if (realIndex < 0) return;
      const controls = document.createElement("figcaption");
      controls.className = "inline-admin-card";
      controls.dataset.inlineAdmin = "";
      controls.innerHTML = `
        <button type="button" data-photo-action="toggle" data-index="${realIndex}">Hide</button>
        <button type="button" data-photo-action="up" data-index="${realIndex}">Up</button>
        <button type="button" data-photo-action="down" data-index="${realIndex}">Down</button>
        <button type="button" data-photo-action="remove" data-index="${realIndex}">Remove</button>
      `;
      item.append(controls);
    });
  }
};

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("admin-editing")) return;

  const albumButton = event.target.closest("[data-album-action]");
  const photoButton = event.target.closest("[data-photo-action]");
  const resetButton = event.target.closest("[data-reset-content]");
  const content = readContent();

  if (albumButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(albumButton.dataset.index);
    const action = albumButton.dataset.albumAction;
    if (!content.albums[index]) return;
    if (action === "toggle") content.albums[index].hidden = !content.albums[index].hidden;
    if (action === "remove") content.albums.splice(index, 1);
    if (action === "up") moveItem(content.albums, index, index - 1);
    if (action === "down") moveItem(content.albums, index, index + 1);
    saveAndRefresh(content);
  }

  if (photoButton) {
    event.preventDefault();
    event.stopPropagation();
    const album = content.albums.find((item) => item.slug === currentSlug());
    const index = Number(photoButton.dataset.index);
    const action = photoButton.dataset.photoAction;
    if (!album?.photos[index]) return;
    if (action === "toggle") album.photos[index].hidden = !album.photos[index].hidden;
    if (action === "remove") album.photos.splice(index, 1);
    if (action === "up") moveItem(album.photos, index, index - 1);
    if (action === "down") moveItem(album.photos, index, index + 1);
    saveAndRefresh(content);
  }

  if (resetButton) {
    event.preventDefault();
    localStorage.removeItem(GLOBAL_CONTENT_KEY);
    applyContent();
  }
});

document.addEventListener("change", async (event) => {
  if (!document.body.classList.contains("admin-editing")) return;

  const albumInput = event.target.closest("[data-upload-album]");
  const photoInput = event.target.closest("[data-upload-photo]");
  const content = readContent();

  if (albumInput?.files?.length) {
    const file = albumInput.files[0];
    const title = prompt("Album name:", file.name.replace(/\.[^.]+$/, "")) || "New album";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `album-${Date.now()}`;
    const src = await fileToDataUrl(file);
    content.albums.push({
      slug,
      title,
      href: "#",
      cover: src,
      hidden: false,
      photos: [{ src, alt: title, hidden: false }],
    });
    saveAndRefresh(content);
  }

  if (photoInput?.files?.length) {
    const album = content.albums.find((item) => item.slug === currentSlug());
    if (!album) return;
    const file = photoInput.files[0];
    const src = await fileToDataUrl(file);
    album.photos.push({ src, alt: file.name, hidden: false });
    if (!album.cover) album.cover = src;
    saveAndRefresh(content);
  }
});

const renderAdminWorkspace = (adminShell) => {
  adminShell.querySelector("[data-admin-workspace]")?.remove();

  const workspace = document.createElement("div");
  workspace.className = "mock-editor";
  workspace.dataset.adminWorkspace = "";
  workspace.innerHTML = `
    <div class="mock-editor-title">
      <div>
        <h3>Inline editing enabled</h3>
        <p>Close this panel and use the controls on the albums and photos directly.</p>
      </div>
      <span>Local draft saved</span>
    </div>
  `;
  adminShell.querySelector("[data-admin-panel]")?.append(workspace);
};

applyContent();

const siteFooter = document.querySelector(".site-footer");

if (siteFooter) {
  const existingAdminShell = document.querySelector("[data-admin-static]");
  const adminShell = existingAdminShell || document.createElement("section");
  if (!existingAdminShell) {
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
          <div class="admin-panel-top">
            <strong>Admin workspace</strong>
            <span>Global album library. Local mock mode.</span>
          </div>
          <button type="button" data-admin-logout>Sair</button>
        </div>
      </details>
    `;

    siteFooter.insertAdjacentElement("afterend", adminShell);
  }

  const adminLauncher = document.querySelector("[data-admin-launcher]") || document.createElement("button");
  adminLauncher.className = "admin-launcher";
  if (adminLauncher.tagName === "BUTTON") adminLauncher.type = "button";
  adminLauncher.textContent = "Admin";
  adminLauncher.dataset.adminLauncher = "";
  adminLauncher.setAttribute("aria-label", "Open admin login");
  if (!adminLauncher.isConnected) document.body.append(adminLauncher);

  const adminForm = adminShell.querySelector("[data-admin-login]");
  const adminPanel = adminShell.querySelector("[data-admin-panel]");
  const adminMessage = adminShell.querySelector("[data-admin-message]");
  const adminLogout = adminShell.querySelector("[data-admin-logout]");
  const adminDetails = adminShell.querySelector("details");
  const adminToggle = document.querySelector("#landing-admin-toggle");

  adminLauncher.addEventListener("click", (event) => {
    event.preventDefault();
    if (adminToggle) adminToggle.checked = true;
    adminDetails.open = true;
    adminShell.classList.add("is-open");
    adminShell.querySelector("input")?.focus();
  });

  const setAdminState = (isLoggedIn) => {
    adminForm.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
    document.body.classList.toggle("admin-editing", isLoggedIn);

    if (isLoggedIn) {
      adminMessage.textContent = "";
      localStorage.setItem("portfolio-admin", "1");
      if (adminToggle) adminToggle.checked = false;
      adminShell.classList.remove("is-open");
      renderAdminWorkspace(adminShell);
      renderInlineAdmin();
    } else {
      localStorage.removeItem("portfolio-admin");
      adminShell.querySelector("[data-admin-workspace]")?.remove();
      document.querySelectorAll("[data-inline-admin]").forEach((item) => item.remove());
      document.querySelectorAll(".inline-admin-scope").forEach((item) => item.classList.remove("inline-admin-scope"));
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

    adminMessage.textContent = "Login invalido.";
  });

  adminLogout.addEventListener("click", () => {
    setAdminState(false);
    if (adminToggle) adminToggle.checked = false;
    adminShell.classList.remove("is-open");
  });
}
