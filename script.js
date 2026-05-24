import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const CONTENT_DOC_PATH = ["portfolio", "content"];

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

const appState = {
  firebaseReady: false,
  auth: null,
  db: null,
  storage: null,
  contentRef: null,
  content: { albums: structuredClone(defaultAlbums) },
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value && !String(value).includes("COLE_AQUI"));

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  appState.firebaseReady = true;
  appState.auth = getAuth(app);
  appState.db = getFirestore(app);
  appState.storage = getStorage(app);
  appState.contentRef = doc(appState.db, ...CONTENT_DOC_PATH);
}

const cloneDefaults = () => structuredClone(defaultAlbums);

const normalizeContent = (content) => ({
  albums: Array.isArray(content?.albums) && content.albums.length ? content.albums : cloneDefaults(),
});

const currentSlug = () => location.pathname.replace(/^\/|\.html$/g, "") || "index";

const albumCard = (album, index) => {
  const item = document.createElement("a");
  item.className = `gallery-item ${index % 2 ? "wide" : "tall"}`;
  item.href = album.href || "#";
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
  const content = appState.content;

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

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const updateContent = async (updater) => {
  if (!appState.firebaseReady) {
    alert("Configure o Firebase em firebase-config.js antes de editar.");
    return;
  }

  const nextContent = structuredClone(appState.content);
  await updater(nextContent);
  appState.content = normalizeContent(nextContent);
  await setDoc(appState.contentRef, appState.content, { merge: false });
  applyContent();
};

const uploadImage = async (file, folder) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `portfolio/${folder}/${Date.now()}-${safeName}`;
  const imageRef = ref(appState.storage, path);
  await uploadBytes(imageRef, file, { contentType: file.type });
  return {
    src: await getDownloadURL(imageRef),
    storagePath: path,
  };
};

const deleteStoredImage = async (item) => {
  if (!item?.storagePath || !appState.firebaseReady) return;

  try {
    await deleteObject(ref(appState.storage, item.storagePath));
  } catch (error) {
    console.warn("Nao foi possivel remover a imagem do Storage.", error);
  }
};

const renderInlineAdmin = () => {
  document.querySelectorAll("[data-inline-admin]").forEach((item) => item.remove());
  const content = appState.content;

  document.querySelectorAll(".portfolio-gallery").forEach((gallery) => {
    gallery.classList.add("inline-admin-scope");

    const bar = document.createElement("div");
    bar.className = "inline-admin-bar";
    bar.dataset.inlineAdmin = "";
    bar.innerHTML = `
      <span>Albuns do portfolio</span>
      <label>
        Enviar album
        <input type="file" accept="image/*" data-upload-album />
      </label>
      <button type="button" data-seed-content>Publicar padrao</button>
    `;
    gallery.before(bar);

    gallery.querySelectorAll(".gallery-item").forEach((card, visibleIndex) => {
      const realIndex = visibleIndexToRealIndex(content.albums, visibleIndex);
      if (realIndex < 0) return;
      const controls = document.createElement("div");
      controls.className = "inline-admin-card";
      controls.dataset.inlineAdmin = "";
      controls.innerHTML = `
        <button type="button" data-album-action="toggle" data-index="${realIndex}">Ocultar</button>
        <button type="button" data-album-action="up" data-index="${realIndex}">Subir</button>
        <button type="button" data-album-action="down" data-index="${realIndex}">Descer</button>
        <button type="button" data-album-action="remove" data-index="${realIndex}">Remover</button>
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
      <span>Fotos de ${activeAlbum.title}</span>
      <label>
        Enviar foto
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
        <button type="button" data-photo-action="toggle" data-index="${realIndex}">Ocultar</button>
        <button type="button" data-photo-action="up" data-index="${realIndex}">Subir</button>
        <button type="button" data-photo-action="down" data-index="${realIndex}">Descer</button>
        <button type="button" data-photo-action="remove" data-index="${realIndex}">Remover</button>
      `;
      item.append(controls);
    });
  }
};

document.addEventListener("click", async (event) => {
  if (!document.body.classList.contains("admin-editing")) return;

  const albumButton = event.target.closest("[data-album-action]");
  const photoButton = event.target.closest("[data-photo-action]");
  const seedButton = event.target.closest("[data-seed-content]");

  if (albumButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(albumButton.dataset.index);
    const action = albumButton.dataset.albumAction;
    await updateContent(async (content) => {
      if (!content.albums[index]) return;
      if (action === "toggle") content.albums[index].hidden = !content.albums[index].hidden;
      if (action === "remove") {
        const [album] = content.albums.splice(index, 1);
        await Promise.all([deleteStoredImage(album), ...(album.photos || []).map(deleteStoredImage)]);
      }
      if (action === "up") moveItem(content.albums, index, index - 1);
      if (action === "down") moveItem(content.albums, index, index + 1);
    });
  }

  if (photoButton) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(photoButton.dataset.index);
    const action = photoButton.dataset.photoAction;
    await updateContent(async (content) => {
      const album = content.albums.find((item) => item.slug === currentSlug());
      if (!album?.photos[index]) return;
      if (action === "toggle") album.photos[index].hidden = !album.photos[index].hidden;
      if (action === "remove") {
        const [photo] = album.photos.splice(index, 1);
        await deleteStoredImage(photo);
        if (album.cover === photo.src) album.cover = album.photos.find((item) => !item.hidden)?.src || album.photos[0]?.src || "";
      }
      if (action === "up") moveItem(album.photos, index, index - 1);
      if (action === "down") moveItem(album.photos, index, index + 1);
    });
  }

  if (seedButton) {
    event.preventDefault();
    await updateContent((content) => {
      content.albums = cloneDefaults();
    });
  }
});

document.addEventListener("change", async (event) => {
  if (!document.body.classList.contains("admin-editing")) return;

  const albumInput = event.target.closest("[data-upload-album]");
  const photoInput = event.target.closest("[data-upload-photo]");

  if (albumInput?.files?.length) {
    const file = albumInput.files[0];
    const title = prompt("Nome do album:", file.name.replace(/\.[^.]+$/, "")) || "Novo album";
    const slug = slugify(title) || `album-${Date.now()}`;
    const uploaded = await uploadImage(file, slug);
    await updateContent((content) => {
      content.albums.push({
        slug,
        title,
        href: "#",
        cover: uploaded.src,
        storagePath: uploaded.storagePath,
        hidden: false,
        photos: [{ src: uploaded.src, storagePath: uploaded.storagePath, alt: title, hidden: false }],
      });
    });
  }

  if (photoInput?.files?.length) {
    const album = appState.content.albums.find((item) => item.slug === currentSlug());
    if (!album) return;
    const file = photoInput.files[0];
    const uploaded = await uploadImage(file, album.slug);
    await updateContent((content) => {
      const nextAlbum = content.albums.find((item) => item.slug === currentSlug());
      nextAlbum.photos.push({ src: uploaded.src, storagePath: uploaded.storagePath, alt: file.name, hidden: false });
      if (!nextAlbum.cover) nextAlbum.cover = uploaded.src;
    });
  }

  event.target.value = "";
});

const renderAdminWorkspace = (adminShell) => {
  adminShell.querySelector("[data-admin-workspace]")?.remove();

  const workspace = document.createElement("div");
  workspace.className = "mock-editor";
  workspace.dataset.adminWorkspace = "";
  workspace.innerHTML = `
    <div class="mock-editor-title">
      <div>
        <h3>Edicao inline ativada</h3>
        <p>Feche este painel e use os controles diretamente nos albuns e fotos.</p>
      </div>
      <span>Firebase conectado</span>
    </div>
  `;
  adminShell.querySelector("[data-admin-panel]")?.append(workspace);
};

const initializeContent = async () => {
  if (!appState.firebaseReady) {
    applyContent();
    return;
  }

  const snapshot = await getDoc(appState.contentRef);
  if (!snapshot.exists()) {
    await setDoc(appState.contentRef, { albums: cloneDefaults() });
  }

  onSnapshot(appState.contentRef, (docSnapshot) => {
    appState.content = normalizeContent(docSnapshot.data());
    applyContent();
  });
};

await initializeContent();

const siteFooter = document.querySelector(".site-footer");

if (siteFooter) {
  const existingAdminShell = document.querySelector("[data-admin-static]");
  const adminShell = existingAdminShell || document.createElement("section");
  if (!existingAdminShell) {
    adminShell.className = "admin-access";
    adminShell.setAttribute("aria-label", "Administracao");
    adminShell.innerHTML = `
      <details>
        <summary>Login administrativo</summary>
        <form class="admin-form" data-admin-login>
          <label>
            Email
            <input name="login" type="email" autocomplete="username" />
          </label>
          <label>
            Senha
            <input name="password" type="password" autocomplete="current-password" />
          </label>
          <button type="submit">Entrar</button>
          <p class="admin-message" data-admin-message></p>
        </form>
        <div class="admin-panel" data-admin-panel hidden>
          <div class="admin-panel-top">
            <strong>Edicao do site</strong>
            <span>Biblioteca de albuns conectada ao Firebase.</span>
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
  adminLauncher.setAttribute("aria-label", "Abrir login administrativo");
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
      if (adminToggle) adminToggle.checked = false;
      adminShell.classList.remove("is-open");
      renderAdminWorkspace(adminShell);
      renderInlineAdmin();
    } else {
      adminShell.querySelector("[data-admin-workspace]")?.remove();
      document.querySelectorAll("[data-inline-admin]").forEach((item) => item.remove());
      document.querySelectorAll(".inline-admin-scope").forEach((item) => item.classList.remove("inline-admin-scope"));
    }
  };

  if (appState.firebaseReady) {
    onAuthStateChanged(appState.auth, (user) => setAdminState(Boolean(user)));
  } else {
    setAdminState(false);
    adminMessage.textContent = "Configure firebase-config.js para habilitar o login.";
  }

  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!appState.firebaseReady) {
      adminMessage.textContent = "Configure firebase-config.js para habilitar o login.";
      return;
    }

    const formData = new FormData(adminForm);
    const email = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      await signInWithEmailAndPassword(appState.auth, email, password);
      adminForm.reset();
    } catch {
      adminMessage.textContent = "Login invalido.";
    }
  });

  adminLogout.addEventListener("click", async () => {
    if (appState.firebaseReady) await signOut(appState.auth);
    if (adminToggle) adminToggle.checked = false;
    adminShell.classList.remove("is-open");
  });
}
