import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  createUserWithEmailAndPassword,
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
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

document.querySelectorAll(".menu-group > button").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.closest(".menu-group");
    const expanded = group?.classList.toggle("open");
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
});

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
  user: null,
  profile: null,
  photographers: [],
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value && !String(value).includes("COLE_AQUI"));

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  appState.firebaseReady = true;
  appState.auth = getAuth(app);
  appState.db = getFirestore(app);
}

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

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });
}

const cleanText = (value, fallback = "") => String(value || fallback).trim();
const splitList = (value) => cleanText(value).split(",").map((item) => item.trim()).filter(Boolean);
const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
const authErrorMessage = (error) => {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "Este email ja esta cadastrado.",
    "auth/invalid-email": "Email invalido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/operation-not-allowed": "Email/senha ainda nao esta ativado no Firebase Authentication.",
    "auth/unauthorized-domain": "Este dominio nao esta autorizado no Firebase Authentication.",
    "permission-denied": "O Firestore negou a escrita. Verifique as regras.",
  };
  return messages[code] || error?.message || "Nao foi possivel concluir a operacao.";
};
const userDoc = (uid) => doc(appState.db, "users", uid);
const photographerDoc = (uid) => doc(appState.db, "photographers", uid);

const currentSlug = () => location.pathname.replace(/^\/|\.html$/g, "") || "index";

const albumCard = (album, index) => {
  const item = document.createElement("a");
  item.className = `gallery-item ${index % 2 ? "wide" : "tall"}`;
  item.href = album.href || "#";
  item.innerHTML = `
    <img src="${album.cover}" alt="${album.title}" />
    <span>${album.title}</span>
  `;
  return item;
};

const photoNode = (photo) => {
  const item = document.createElement("figure");
  item.className = "photo-item";
  item.innerHTML = `<img src="${photo.src}" alt="${photo.alt || "Foto"}" />`;
  return item;
};

const renderDefaultPortfolio = () => {
  document.querySelectorAll(".portfolio-gallery").forEach((gallery) => {
    gallery.classList.remove("photographer-directory", "photographer-detail-grid");
    gallery.replaceChildren(...defaultAlbums.filter((album) => !album.hidden).map(albumCard));
  });

  const album = defaultAlbums.find((item) => item.slug === currentSlug());
  const categoryGallery = document.querySelector(".masonry.category-gallery");
  if (album && categoryGallery) {
    categoryGallery.replaceChildren(...album.photos.filter((photo) => !photo.hidden).map(photoNode));
  }
};

const renderPhotographerCards = () => {
  if (currentSlug() !== "portfolio") {
    renderDefaultPortfolio();
    return;
  }

  const gallery = document.querySelector(".portfolio-gallery");
  if (!gallery) return;

  const params = new URLSearchParams(location.search);
  const selectedId = params.get("fotografo");
  const publicPhotographers = appState.photographers.filter((item) => item.published);

  if (selectedId) {
    const photographer = publicPhotographers.find((item) => item.uid === selectedId);
    renderPhotographerDetail(gallery, photographer);
    return;
  }

  if (!publicPhotographers.length) {
    renderDefaultPortfolio();
    return;
  }

  gallery.classList.add("photographer-directory");
  gallery.classList.remove("photographer-detail-grid");
  gallery.replaceChildren(...publicPhotographers.map((photographer) => {
    const card = document.createElement("a");
    card.className = "photographer-card";
    card.href = `portfolio.html?fotografo=${encodeURIComponent(photographer.uid)}`;
    card.innerHTML = `
      <img src="${escapeHtml(photographer.coverUrl || photographer.photos?.[0]?.url || "assets/marilopes/empresarial.jpg")}" alt="${escapeHtml(photographer.displayName || "Fotografo")}" />
      <div>
        <strong>${escapeHtml(photographer.displayName || "Fotografo")}</strong>
        <span>${escapeHtml(photographer.city || "Portfolio online")}</span>
        <p>${escapeHtml(photographer.bio || "Conheca o trabalho deste fotografo.")}</p>
      </div>
    `;
    return card;
  }));
};

const renderPhotographerDetail = (gallery, photographer) => {
  gallery.classList.add("photographer-detail-grid");
  gallery.classList.remove("photographer-directory");

  if (!photographer) {
    gallery.innerHTML = `
      <article class="platform-empty">
        <h2>Portfolio nao encontrado</h2>
        <p>Esse fotografo ainda nao publicou o perfil ou o link esta incorreto.</p>
        <a class="text-button" href="portfolio.html">Ver fotografos</a>
      </article>
    `;
    return;
  }

  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];
  const header = document.createElement("article");
  header.className = "photographer-profile-head";
  header.innerHTML = `
    <a href="portfolio.html">Voltar aos fotografos</a>
    <h2>${escapeHtml(photographer.displayName || "Fotografo")}</h2>
    <p>${escapeHtml(photographer.bio || "")}</p>
    <div class="profile-links">
      ${photographer.city ? `<span>${escapeHtml(photographer.city)}</span>` : ""}
      ${photographer.whatsapp ? `<a href="https://wa.me/${photographer.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
      ${photographer.instagram ? `<a href="${escapeHtml(photographer.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ""}
    </div>
  `;

  const nodes = photos.map((photo) => {
    const figure = document.createElement("figure");
    figure.className = "photographer-photo";
    figure.innerHTML = `
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || photographer.displayName || "Foto")}" />
      ${photo.title ? `<figcaption>${escapeHtml(photo.title)}</figcaption>` : ""}
    `;
    return figure;
  });

  gallery.replaceChildren(header, ...(nodes.length ? nodes : [emptyState("Este fotografo ainda nao publicou fotos.")]));
};

const emptyState = (message) => {
  const item = document.createElement("article");
  item.className = "platform-empty";
  item.innerHTML = `<p>${message}</p>`;
  return item;
};

const watchPhotographers = () => {
  if (!appState.firebaseReady) {
    renderDefaultPortfolio();
    return;
  }

  onSnapshot(doc(appState.db, "platform", "directory"), (snapshot) => {
    const data = snapshot.data();
    appState.photographers = Array.isArray(data?.photographers) ? data.photographers : [];
    renderPhotographerCards();
  });
};

const saveDirectoryProfile = async (uid, profile) => {
  const directoryRef = doc(appState.db, "platform", "directory");
  const snapshot = await getDoc(directoryRef);
  const current = Array.isArray(snapshot.data()?.photographers) ? snapshot.data().photographers : [];
  const publicProfile = {
    uid,
    displayName: profile.displayName || "",
    city: profile.city || "",
    bio: profile.bio || "",
    whatsapp: profile.whatsapp || "",
    instagram: profile.instagram || "",
    coverUrl: profile.coverUrl || "",
    photos: Array.isArray(profile.photos) ? profile.photos : [],
    published: Boolean(profile.published),
  };
  const next = [publicProfile, ...current.filter((item) => item.uid !== uid)];
  await setDoc(directoryRef, { photographers: next, updatedAt: serverTimestamp() }, { merge: true });
};

const readOwnProfile = async (user) => {
  const snapshot = await getDoc(userDoc(user.uid));
  appState.profile = snapshot.exists()
    ? snapshot.data()
    : { uid: user.uid, email: user.email, name: user.email, role: "cliente" };

  if (appState.profile.role === "fotografo") {
    const photographerSnapshot = await getDoc(photographerDoc(user.uid));
    appState.profile.photographer = photographerSnapshot.exists()
      ? photographerSnapshot.data()
      : {
          displayName: appState.profile.name || "",
          city: "",
          bio: "",
          whatsapp: "",
          instagram: "",
          coverUrl: "",
          photos: [],
          published: false,
        };
  }
};

const savePhotographerProfile = async (form) => {
  const formData = new FormData(form);
  const profile = {
    displayName: cleanText(formData.get("displayName")),
    city: cleanText(formData.get("city")),
    bio: cleanText(formData.get("bio")),
    whatsapp: cleanText(formData.get("whatsapp")),
    instagram: cleanText(formData.get("instagram")),
    coverUrl: cleanText(formData.get("coverUrl")),
    categories: splitList(formData.get("categories")),
    published: formData.get("published") === "on",
    updatedAt: serverTimestamp(),
  };

  const currentPhotos = appState.profile?.photographer?.photos || [];
  const nextProfile = { ...appState.profile.photographer, ...profile, photos: currentPhotos };
  await setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const addPhoto = async (form) => {
  const formData = new FormData(form);
  const url = cleanText(formData.get("photoUrl"));
  if (!url) return;

  const current = appState.profile?.photographer || {};
  const photos = Array.isArray(current.photos) ? current.photos : [];
  const nextProfile = {
    ...current,
    coverUrl: current.coverUrl || url,
    photos: [...photos, { url, title: cleanText(formData.get("photoTitle"), "Foto"), createdAt: Date.now() }],
    updatedAt: serverTimestamp(),
  };
  await setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
  form.reset();
};

const removePhoto = async (index) => {
  const current = appState.profile?.photographer || {};
  const photos = Array.isArray(current.photos) ? [...current.photos] : [];
  photos.splice(index, 1);
  const nextProfile = { ...current, photos, coverUrl: current.coverUrl || photos[0]?.url || "", updatedAt: serverTimestamp() };
  await setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const buildAccountShell = () => {
  let shell = document.querySelector("[data-admin-static]");
  const siteFooter = document.querySelector(".site-footer");

  if (!shell) {
    shell = document.createElement("section");
    shell.className = "admin-access";
    shell.dataset.adminStatic = "";
    shell.setAttribute("aria-label", "Conta");
    shell.innerHTML = `
      <details open>
        <summary>Entrar</summary>
        <div data-account-root></div>
      </details>
    `;
    document.body.append(shell);
  } else {
    shell.querySelector("details").innerHTML = `<summary>Entrar</summary><div data-account-root></div>`;
  }

  let launcher = document.querySelector("[data-admin-launcher]");
  if (!launcher) {
    launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "admin-launcher";
    launcher.dataset.adminLauncher = "";
    document.body.append(launcher);
  }

  launcher.textContent = "Conta";
  launcher.setAttribute("aria-label", "Abrir conta");
  launcher.addEventListener("click", (event) => {
    event.preventDefault();
    shell.classList.add("is-open");
    shell.querySelector("details").open = true;
    shell.querySelector("input, button, textarea")?.focus();
  });

  shell.addEventListener("click", (event) => {
    if (event.target === shell) shell.classList.remove("is-open");
  });

  return shell;
};

const renderAuthForms = (root, message = "") => {
  root.innerHTML = `
    <div class="auth-intro">
      <span>Acesso do site</span>
      <h1>Entre ou crie sua conta para publicar portfólios</h1>
      <p>Fotógrafos publicam fotos e dados do perfil. Clientes criam conta para acompanhar o site e futuras interações.</p>
    </div>
    <div class="account-grid">
      <form class="account-form" data-login-form>
        <h3>Entrar</h3>
        <label>Email<input name="email" type="email" autocomplete="username" required /></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required /></label>
        <button type="submit">Entrar</button>
      </form>
      <form class="account-form" data-register-form>
        <h3>Criar conta</h3>
        <label>Nome<input name="name" autocomplete="name" required /></label>
        <label>Email<input name="email" type="email" autocomplete="email" required /></label>
        <label>Senha<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
        <label>Tipo
          <select name="role" required>
            <option value="fotografo">Fotografo</option>
            <option value="cliente">Cliente</option>
          </select>
        </label>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
    <p class="admin-message" data-account-message>${message}</p>
  `;
};

const renderDashboard = (root) => {
  const profile = appState.profile || {};
  const photographer = profile.photographer || {};
  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];

  if (profile.role !== "fotografo") {
    root.innerHTML = `
      <div class="account-panel">
        <div class="admin-panel-top">
          <strong>Conta de cliente</strong>
          <span>${escapeHtml(profile.name || profile.email)}</span>
        </div>
        <p>Seu cadastro esta salvo. A proxima etapa do projeto pode incluir favoritos, pedidos de orcamento e contato direto com fotografos.</p>
        <button type="button" data-account-logout>Sair</button>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="account-panel">
      <div class="admin-panel-top">
        <strong>Area do fotografo</strong>
        <span>${escapeHtml(profile.email || "")}</span>
      </div>
      <form class="account-form" data-photographer-form>
        <label>Nome publico<input name="displayName" value="${escapeHtml(photographer.displayName || profile.name || "")}" required /></label>
        <label>Cidade<input name="city" value="${escapeHtml(photographer.city || "")}" placeholder="Manaus - AM" /></label>
        <label>Bio<textarea name="bio" rows="3" placeholder="Fale sobre seu estilo e atendimento">${escapeHtml(photographer.bio || "")}</textarea></label>
        <label>WhatsApp<input name="whatsapp" value="${escapeHtml(photographer.whatsapp || "")}" placeholder="5592999999999" /></label>
        <label>Instagram<input name="instagram" value="${escapeHtml(photographer.instagram || "")}" placeholder="https://instagram.com/seuperfil" /></label>
        <label>Categorias<input name="categories" value="${escapeHtml((photographer.categories || []).join(", "))}" placeholder="Casamento, gestante, eventos" /></label>
        <label>Foto de capa por URL<input name="coverUrl" value="${escapeHtml(photographer.coverUrl || "")}" placeholder="https://..." /></label>
        <label class="account-check"><input name="published" type="checkbox" ${photographer.published ? "checked" : ""} /> Publicar meu portfolio</label>
        <button type="submit">Salvar perfil</button>
      </form>
      <form class="account-form compact" data-photo-form>
        <h3>Adicionar foto</h3>
        <label>Titulo<input name="photoTitle" placeholder="Ensaio externo" /></label>
        <label>URL da imagem<input name="photoUrl" type="url" placeholder="https://..." required /></label>
        <button type="submit">Adicionar foto</button>
      </form>
      <div class="photo-manager">
        ${photos.map((photo, index) => `
          <article>
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || "Foto")}" />
            <span>${escapeHtml(photo.title || "Foto")}</span>
            <button type="button" data-remove-photo="${index}">Remover</button>
          </article>
        `).join("") || `<p class="mock-empty">Adicione links de fotos para montar seu portfolio.</p>`}
      </div>
      <button type="button" data-account-logout>Sair</button>
      <p class="admin-message" data-account-message></p>
    </div>
  `;
};

const initializeAccount = () => {
  const shell = buildAccountShell();
  const root = shell.querySelector("[data-account-root]");

  if (!appState.firebaseReady) {
    renderAuthForms(root, "Configure o Firebase em firebase-config.js para ativar cadastro e login.");
    return;
  }

  onAuthStateChanged(appState.auth, async (user) => {
    appState.user = user;
    document.body.classList.toggle("auth-gated", !user);
    document.querySelector("[data-admin-launcher]").hidden = !user;

    if (!user) {
      appState.profile = null;
      shell.classList.add("is-open");
      shell.querySelector("details").open = true;
      renderAuthForms(root);
      return;
    }

    await readOwnProfile(user);
    shell.classList.remove("is-open");
    renderDashboard(root);
  });

  root.addEventListener("submit", async (event) => {
    event.preventDefault();
    const loginForm = event.target.closest("[data-login-form]");
    const registerForm = event.target.closest("[data-register-form]");
    const photographerForm = event.target.closest("[data-photographer-form]");
    const photoForm = event.target.closest("[data-photo-form]");
    const message = root.querySelector("[data-account-message]");

    try {
      if (loginForm) {
        const formData = new FormData(loginForm);
        await signInWithEmailAndPassword(appState.auth, cleanText(formData.get("email")), String(formData.get("password") || ""));
        loginForm.reset();
      }

      if (registerForm) {
        const formData = new FormData(registerForm);
        const credential = await createUserWithEmailAndPassword(appState.auth, cleanText(formData.get("email")), String(formData.get("password") || ""));
        const profile = {
          uid: credential.user.uid,
          name: cleanText(formData.get("name")),
          email: cleanText(formData.get("email")),
          role: cleanText(formData.get("role"), "cliente"),
          createdAt: serverTimestamp(),
        };
        await setDoc(userDoc(credential.user.uid), profile);
        if (profile.role === "fotografo") {
          const photographer = {
            displayName: profile.name,
            city: "",
            bio: "",
            whatsapp: "",
            instagram: "",
            coverUrl: "",
            categories: [],
            photos: [],
            published: false,
            createdAt: serverTimestamp(),
          };
          await setDoc(photographerDoc(credential.user.uid), photographer);
        }
        registerForm.reset();
      }

      if (photographerForm) {
        await savePhotographerProfile(photographerForm);
        renderDashboard(root);
      }

      if (photoForm) {
        await addPhoto(photoForm);
        renderDashboard(root);
      }
    } catch (error) {
      if (message) message.textContent = authErrorMessage(error);
    }
  });

  root.addEventListener("click", async (event) => {
    const logout = event.target.closest("[data-account-logout]");
    const remove = event.target.closest("[data-remove-photo]");

    if (logout) {
      await signOut(appState.auth);
      shell.classList.remove("is-open");
    }

    if (remove) {
      await removePhoto(Number(remove.dataset.removePhoto));
      renderDashboard(root);
    }
  });
};

renderDefaultPortfolio();
watchPhotographers();
initializeAccount();
