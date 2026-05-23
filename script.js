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
  item.innerHTML = `
    <img src="${album.cover}" alt="${album.title}" />
    <span>${album.title}</span>
  `;
  return item;
};

const photoNode = (photo) => {
  const image = document.createElement("img");
  image.src = photo.src;
  image.alt = photo.alt || "Foto";
  return image;
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

const renderAdminWorkspace = (adminShell) => {
  adminShell.querySelector("[data-admin-workspace]")?.remove();

  const content = readContent();
  const activeAlbum = content.albums.find((album) => album.slug === currentSlug()) || content.albums[0];
  const workspace = document.createElement("div");
  workspace.className = "mock-editor";
  workspace.dataset.adminWorkspace = "";
  workspace.innerHTML = `
    <div class="mock-editor-title">
      <div>
        <h3>Site Content Manager</h3>
        <p>Albums power the home portfolio grid and their matching section pages.</p>
      </div>
      <span>Local draft saved</span>
    </div>

    <nav class="mock-page-jump" aria-label="Edit pages">
      <a href="index.html">Home</a>
      <a href="portfolio.html">Portfolio</a>
      ${content.albums.map((album) => `<a href="${album.href}">${album.title}</a>`).join("")}
    </nav>

    <section class="mock-editor-section">
      <div class="mock-editor-head">
        <div>
          <strong>Albums</strong>
          <span>${content.albums.filter((album) => !album.hidden).length} visible / ${content.albums.length} total</span>
        </div>
        <label class="mock-upload">
          Add album
          <input type="file" accept="image/*" data-upload-album />
        </label>
      </div>
      <div class="mock-editor-list" data-album-list></div>
    </section>

    <section class="mock-editor-section">
      <div class="mock-editor-head">
        <div>
          <strong>Photos in ${activeAlbum?.title || "album"}</strong>
          <span>${activeAlbum?.photos.filter((photo) => !photo.hidden).length || 0} visible / ${activeAlbum?.photos.length || 0} total</span>
        </div>
        <label class="mock-upload">
          Add photo
          <input type="file" accept="image/*" data-upload-photo="${activeAlbum?.slug || ""}" />
        </label>
      </div>
      <div class="mock-editor-list" data-photo-list></div>
    </section>

    <button type="button" class="mock-editor-reset" data-reset-content>Reset all local content</button>
  `;

  const albumList = workspace.querySelector("[data-album-list]");
  content.albums.forEach((album, index) => {
    const row = document.createElement("div");
    row.className = `mock-editor-row${album.hidden ? " is-hidden" : ""}`;
    row.innerHTML = `
      <div class="mock-thumb"><img src="${album.cover}" alt="" /></div>
      <div class="mock-item-copy">
        <strong>${album.title}</strong>
        <span>${album.hidden ? "Hidden from portfolio" : "Shown in portfolio"} - ${album.photos.length} photos</span>
      </div>
      <div class="mock-actions">
        <button type="button" data-album-action="toggle" data-index="${index}">${album.hidden ? "Show" : "Hide"}</button>
        <button type="button" data-album-action="up" data-index="${index}">Move up</button>
        <button type="button" data-album-action="down" data-index="${index}">Move down</button>
        <button type="button" data-album-action="remove" data-index="${index}">Remove</button>
      </div>
    `;
    albumList.append(row);
  });

  const photoList = workspace.querySelector("[data-photo-list]");
  if (!activeAlbum?.photos.length) {
    const empty = document.createElement("p");
    empty.className = "mock-empty";
    empty.textContent = "No photos in this album yet.";
    photoList.append(empty);
  }

  activeAlbum?.photos.forEach((photo, index) => {
    const row = document.createElement("div");
    row.className = `mock-editor-row${photo.hidden ? " is-hidden" : ""}`;
    row.innerHTML = `
      <div class="mock-thumb"><img src="${photo.src}" alt="" /></div>
      <div class="mock-item-copy">
        <strong>${photo.alt || `Photo ${index + 1}`}</strong>
        <span>${photo.hidden ? "Hidden from album page" : "Shown on album page"}</span>
      </div>
      <div class="mock-actions">
        <button type="button" data-photo-action="toggle" data-index="${index}">${photo.hidden ? "Show" : "Hide"}</button>
        <button type="button" data-photo-action="up" data-index="${index}">Move up</button>
        <button type="button" data-photo-action="down" data-index="${index}">Move down</button>
        <button type="button" data-photo-action="remove" data-index="${index}">Remove</button>
      </div>
    `;
    photoList.append(row);
  });

  workspace.addEventListener("click", (event) => {
    const albumButton = event.target.closest("[data-album-action]");
    const photoButton = event.target.closest("[data-photo-action]");

    if (albumButton) {
      const index = Number(albumButton.dataset.index);
      const action = albumButton.dataset.albumAction;
      if (action === "toggle") content.albums[index].hidden = !content.albums[index].hidden;
      if (action === "remove") content.albums.splice(index, 1);
      if (action === "up") moveItem(content.albums, index, index - 1);
      if (action === "down") moveItem(content.albums, index, index + 1);
      saveContent(content);
      applyContent();
      renderAdminWorkspace(adminShell);
    }

    if (photoButton && activeAlbum) {
      const index = Number(photoButton.dataset.index);
      const action = photoButton.dataset.photoAction;
      if (action === "toggle") activeAlbum.photos[index].hidden = !activeAlbum.photos[index].hidden;
      if (action === "remove") activeAlbum.photos.splice(index, 1);
      if (action === "up") moveItem(activeAlbum.photos, index, index - 1);
      if (action === "down") moveItem(activeAlbum.photos, index, index + 1);
      saveContent(content);
      applyContent();
      renderAdminWorkspace(adminShell);
    }

    if (event.target.closest("[data-reset-content]")) {
      localStorage.removeItem(GLOBAL_CONTENT_KEY);
      applyContent();
      renderAdminWorkspace(adminShell);
    }
  });

  workspace.addEventListener("change", async (event) => {
    const albumInput = event.target.closest("[data-upload-album]");
    const photoInput = event.target.closest("[data-upload-photo]");

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
    }

    if (photoInput?.files?.length && activeAlbum) {
      const file = photoInput.files[0];
      const src = await fileToDataUrl(file);
      activeAlbum.photos.push({ src, alt: file.name, hidden: false });
      if (!activeAlbum.cover) activeAlbum.cover = src;
    }

    saveContent(content);
    applyContent();
    renderAdminWorkspace(adminShell);
  });

  adminShell.querySelector("[data-admin-panel]")?.append(workspace);
};

applyContent();

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
        <div class="admin-panel-top">
          <strong>Admin workspace</strong>
          <span>Global album library. Local mock mode.</span>
        </div>
        <button type="button" data-admin-logout>Sair</button>
      </div>
    </details>
  `;

  siteFooter.insertAdjacentElement("afterend", adminShell);

  const adminLauncher = document.querySelector("[data-admin-launcher]") || document.createElement("button");
  adminLauncher.className = "admin-launcher";
  adminLauncher.type = "button";
  adminLauncher.textContent = "Admin";
  adminLauncher.dataset.adminLauncher = "";
  adminLauncher.setAttribute("aria-label", "Open admin login");
  if (!adminLauncher.isConnected) document.body.append(adminLauncher);

  const adminForm = adminShell.querySelector("[data-admin-login]");
  const adminPanel = adminShell.querySelector("[data-admin-panel]");
  const adminMessage = adminShell.querySelector("[data-admin-message]");
  const adminLogout = adminShell.querySelector("[data-admin-logout]");
  const adminDetails = adminShell.querySelector("details");

  adminLauncher.addEventListener("click", () => {
    adminDetails.open = true;
    adminShell.scrollIntoView({ behavior: "smooth", block: "center" });
    adminShell.querySelector("input")?.focus();
  });

  const setAdminState = (isLoggedIn) => {
    adminForm.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
    document.body.classList.toggle("admin-editing", isLoggedIn);

    if (isLoggedIn) {
      adminMessage.textContent = "";
      localStorage.setItem("portfolio-admin", "1");
      renderAdminWorkspace(adminShell);
    } else {
      localStorage.removeItem("portfolio-admin");
      adminShell.querySelector("[data-admin-workspace]")?.remove();
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
  });
}
