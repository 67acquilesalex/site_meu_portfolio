import { firebaseConfig } from "./firebase-config.js";

const contact = {
  brand: "Mari Lopes Fotografia",
  logo: "assets/marilopes/mari-lopes-logo.png",
  email: "marilopesfotografia@gmail.com",
  location: "Florianópolis - SC",
  whatsapp: "5592999999999",
};

const albums = [
  {
    slug: "gestante",
    title: "Ensaio de gestante",
    description: "Ensaios delicados para registrar a espera com beleza, calma e direção cuidadosa.",
    href: "gestante.html",
    cover: "assets/marilopes/gestante.jpg",
    cta: "Pedir orçamento gestante",
    photos: [
      ["assets/marilopes/gestante.jpg", "Ensaio de gestante"],
      ["assets/marilopes/feminino.jpg", "Retrato feminino"],
      ["assets/marilopes/casal.jpg", "Ensaio externo"],
    ],
  },
  {
    slug: "familia",
    title: "Ensaio de família",
    description: "Registros naturais para guardar afeto, rotina e os detalhes de cada fase.",
    href: "familia.html",
    cover: "assets/marilopes/familia.jpg",
    cta: "Pedir orçamento de família",
    photos: [
      ["assets/marilopes/familia.jpg", "Ensaio de família"],
      ["assets/marilopes/casal.jpg", "Família em ambiente natural"],
      ["assets/marilopes/gestante.jpg", "Retrato familiar"],
    ],
  },
  {
    slug: "casal",
    title: "Ensaio de casal",
    description: "Ensaios para registrar conexão, presença e histórias compartilhadas com direção leve.",
    href: "casal.html",
    cover: "assets/marilopes/casal.jpg",
    cta: "Pedir orçamento casal",
    photos: [
      ["assets/marilopes/casal.jpg", "Ensaio de casal"],
      ["assets/marilopes/familia.jpg", "Casal em ambiente natural"],
      ["assets/marilopes/feminino.jpg", "Retrato em ensaio externo"],
    ],
  },
  {
    slug: "feminino",
    title: "Ensaio feminino",
    description: "Retratos femininos com naturalidade, direção cuidadosa e estética limpa.",
    href: "feminino.html",
    cover: "assets/marilopes/feminino.jpg",
    cta: "Pedir orçamento feminino",
    photos: [
      ["assets/marilopes/feminino.jpg", "Ensaio feminino"],
      ["assets/marilopes/gestante.jpg", "Retrato feminino em praia"],
      ["assets/marilopes/empresarial.jpg", "Retrato feminino profissional"],
    ],
  },
  {
    slug: "empresarial",
    title: "Ensaio empresarial",
    description: "Fotos profissionais para marca pessoal, equipes, clínicas, escritórios e conteúdo institucional.",
    href: "empresarial.html",
    cover: "assets/marilopes/empresarial.jpg",
    cta: "Pedir orçamento empresarial",
    photos: [
      ["assets/marilopes/empresarial.jpg", "Ensaio empresarial"],
      ["assets/marilopes/feminino.jpg", "Retrato profissional"],
      ["assets/marilopes/imoveis.jpg", "Ambiente comercial"],
    ],
  },
  {
    slug: "imoveis",
    title: "Fotografia de imóveis",
    description: "Fotografia de interiores e espaços com composição limpa, luz natural e atenção aos detalhes.",
    href: "imoveis.html",
    cover: "assets/marilopes/imoveis.jpg",
    cta: "Pedir orçamento imóveis",
    photos: [
      ["assets/marilopes/imoveis.jpg", "Fotografia de imóvel"],
      ["assets/marilopes/casal.jpg", "Detalhe de ambiente externo"],
      ["assets/marilopes/familia.jpg", "Ambiente natural fotografado"],
    ],
  },
  {
    slug: "eventos",
    title: "Eventos",
    description: "Cobertura de aniversários, celebrações, encontros corporativos e momentos especiais.",
    href: "eventos.html",
    cover: "assets/marilopes/empresarial.jpg",
    cta: "Pedir orçamento de evento",
    photos: [
      ["https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85", "Mesa decorada de evento"],
      ["https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=85", "Pessoas celebrando em evento"],
      ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85", "Show com luzes e plateia"],
    ],
  },
];

const appState = {
  auth: null,
  db: null,
  firebaseReady: false,
  firebaseError: "",
  modules: {},
  photographers: [],
  profile: null,
  user: null,
};

const DEFAULT_ACCOUNT_ROLE = "fotografo";
const albumBySlug = new Map(albums.map((album) => [album.slug, album]));
const currentSlug = () => location.pathname.split("/").pop().replace(".html", "") || "index";
const cleanText = (value, fallback = "") => String(value || fallback).trim();
const normalizeEmail = (value) => {
  let email = cleanText(value)
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
  if (email.startsWith("mailto:")) email = email.slice(7);
  if (email && !email.includes("@")) email = `${email}@gmail.com`;
  if (email.endsWith("@gmail")) email = `${email}.com`;
  return email;
};
const emailForAuth = (value) => {
  const email = normalizeEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { code: "local/invalid-email" };
  }
  return email;
};
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
  const messages = {
    "auth/email-already-in-use": "Este email já está cadastrado.",
    "auth/invalid-email": "Confira o email. Remova espacos ou caracteres extras e tente novamente.",
    "local/invalid-email": "Digite o email completo, exemplo: nome@gmail.com.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/user-not-found": "Nao existe conta com este email.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/missing-password": "Digite a senha.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/network-request-failed": "Nao foi possivel conectar ao Firebase. Verifique sua internet e tente de novo.",
    "auth/account-exists-with-different-credential": "Ja existe uma conta com este email usando outro tipo de login.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups para este site.",
    "auth/cancelled-popup-request": "A janela de login do Google ja estava aberta.",
    "auth/operation-not-allowed": "Email/senha ainda não está ativado no Firebase Authentication.",
    "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "A chave do Firebase é inválida. Copie novamente a configuração Web App do seu projeto Firebase.",
    "auth/invalid-api-key": "A chave do Firebase é inválida. Copie novamente a configuração Web App do seu projeto Firebase.",
    "auth/operation-not-allowed": "Este tipo de login ainda nao esta ativado no Firebase Authentication.",
    "auth/app-not-authorized": "Este dominio nao esta autorizado para usar esta chave do Firebase.",
    "permission-denied": "O Firestore negou a escrita. Publique as regras do banco de dados no Firebase.",
  };
  if (String(error?.message || "").includes("Missing or insufficient permissions")) {
    return "O Firestore negou a escrita. Publique as regras do banco de dados no Firebase.";
  }

  return messages[error?.code] || error?.message || "Não foi possível concluir a operação.";
};

const hasFirebaseConfig = Object.values(firebaseConfig || {}).every((value) => value && !String(value).includes("COLE_AQUI"));

const navItem = (href, label, slugs) => {
  const active = slugs.includes(currentSlug()) ? ' class="active"' : "";
  return `<a${active} href="${href}">${label}</a>`;
};

const renderLayout = () => {
  document.querySelectorAll("[data-site-header], .site-header").forEach((header) => {
    const isServicePage = albumBySlug.has(currentSlug());
    header.className = "site-header";
    header.dataset.siteHeader = "";
    header.innerHTML = `
      <div class="site-frame header-frame">
        <a class="brand" href="index.html" aria-label="${contact.brand}">
          <img src="${contact.logo}" alt="${contact.brand}" width="239" height="82" />
        </a>
        <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="main-nav" aria-label="Site">
          ${navItem("index.html", "Home", ["index"])}
          ${navItem("portfolio.html", "Portfólio", ["portfolio"])}
          <div class="menu-group${isServicePage ? " active" : ""}">
            <button type="button" aria-expanded="false">Serviços</button>
            <div class="submenu" aria-label="Serviços">
              ${albums.map((album) => `<a href="${album.href}">${album.title}</a>`).join("")}
            </div>
          </div>
          ${navItem("projetos.html", "Projetos", ["projetos"])}
          ${navItem("orcamento.html", "Orçamento", ["orcamento"])}
          ${navItem("contato.html", "Contato", ["contato"])}
        </nav>
      </div>
    `;
  });

  document.querySelectorAll("[data-site-footer], .site-footer").forEach((footer) => {
    footer.className = "site-footer";
    footer.dataset.siteFooter = "";
    footer.innerHTML = `
      <div class="site-frame footer-frame">
        <p>${contact.brand}</p>
        <p>${contact.location} | ${contact.email}</p>
      </div>
    `;
  });
};

const initializeMenus = () => {
  document.querySelectorAll(".nav-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const header = button.closest(".site-header");
      const expanded = header?.classList.toggle("nav-open") || false;
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  });

  document.querySelectorAll(".menu-group > button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const group = button.closest(".menu-group");
      const expanded = group?.classList.toggle("open") || false;
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll(".menu-group.open").forEach((group) => {
      if (!group.contains(event.target)) {
        group.classList.remove("open");
        group.querySelector("button")?.setAttribute("aria-expanded", "false");
      }
    });
  });
};

const albumCard = (album, index) => {
  const item = document.createElement("a");
  item.className = `gallery-item ${index % 3 === 1 ? "wide" : "tall"}`;
  item.href = album.href;
  item.innerHTML = `
    <img src="${escapeHtml(album.cover)}" alt="${escapeHtml(album.title)}" loading="lazy" />
    <span>${escapeHtml(album.title)}</span>
  `;
  return item;
};

const photoNode = ([src, alt]) => {
  const item = document.createElement("figure");
  item.className = "photo-item";
  item.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  return item;
};

const emptyState = (message) => {
  const item = document.createElement("article");
  item.className = "platform-empty";
  item.innerHTML = `<p>${escapeHtml(message)}</p>`;
  return item;
};

const renderDefaultPortfolio = () => {
  document.querySelectorAll("[data-album-grid]").forEach((gallery) => {
    gallery.classList.remove("photographer-directory", "photographer-detail-grid");
    gallery.replaceChildren(...albums.map(albumCard));
  });
};

const renderCategoryPages = () => {
  document.querySelectorAll("[data-category-page]").forEach((page) => {
    const album = albumBySlug.get(page.dataset.categoryPage || currentSlug());
    if (!album) return;

    page.innerHTML = `
      <section class="category-hero section-wrap">
        <a href="portfolio.html">Voltar ao portfólio</a>
        <h1>${escapeHtml(album.title)}</h1>
        <p>${escapeHtml(album.description)}</p>
      </section>
      <section class="masonry section-wrap category-gallery" aria-label="Fotos de ${escapeHtml(album.title)}"></section>
      <section class="gallery-cta section-wrap">
        <a class="text-button" href="orcamento.html">${escapeHtml(album.cta)}</a>
      </section>
    `;
  });

  document.querySelectorAll(".category-gallery").forEach((gallery) => {
    const album = albumBySlug.get(currentSlug());
    if (album) gallery.replaceChildren(...album.photos.map(photoNode));
  });
};

const renderPhotographerCards = () => {
  if (currentSlug() !== "portfolio") {
    renderDefaultPortfolio();
    return;
  }

  const gallery = document.querySelector("[data-album-grid]");
  if (!gallery) return;

  const params = new URLSearchParams(location.search);
  const selectedId = params.get("fotografo");
  const publicPhotographers = appState.photographers.filter((item) => item.published);

  if (selectedId) {
    renderPhotographerDetail(gallery, publicPhotographers.find((item) => item.uid === selectedId));
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
      <img src="${escapeHtml(photographer.coverUrl || photographer.photos?.[0]?.url || "assets/marilopes/empresarial.jpg")}" alt="${escapeHtml(photographer.displayName || "Fotógrafo")}" loading="lazy" />
      <div>
        <strong>${escapeHtml(photographer.displayName || "Fotógrafo")}</strong>
        <span>${escapeHtml(photographer.city || "Portfólio online")}</span>
        <p>${escapeHtml(photographer.bio || "Conheça o trabalho deste fotógrafo.")}</p>
      </div>
    `;
    return card;
  }));
};

const renderPhotographerDetail = (gallery, photographer) => {
  gallery.classList.add("photographer-detail-grid");
  gallery.classList.remove("photographer-directory");

  if (!photographer) {
    gallery.replaceChildren(emptyState("Esse fotógrafo ainda não publicou o perfil ou o link está incorreto."));
    return;
  }

  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];
  const header = document.createElement("article");
  header.className = "photographer-profile-head";
  header.innerHTML = `
    <a href="portfolio.html">Voltar aos fotógrafos</a>
    <h2>${escapeHtml(photographer.displayName || "Fotógrafo")}</h2>
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
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || photographer.displayName || "Foto")}" loading="lazy" />
      ${photo.title ? `<figcaption>${escapeHtml(photo.title)}</figcaption>` : ""}
    `;
    return figure;
  });

  gallery.replaceChildren(header, ...(nodes.length ? nodes : [emptyState("Este fotógrafo ainda não publicou fotos.")]));
};

const initializeBudgetForm = () => {
  const budgetForm = document.querySelector("[data-budget-form]");
  if (!budgetForm) return;

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

    window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });
};

const connectFirebase = async () => {
  if (!hasFirebaseConfig) return false;

  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    appState.auth = authModule.getAuth(app);
    appState.db = firestoreModule.getFirestore(app);
    appState.modules = { auth: authModule, firestore: firestoreModule };
    appState.firebaseReady = true;
  } catch (error) {
    appState.firebaseError = authErrorMessage(error);
    console.warn("Firebase indisponível:", error);
  }

  return appState.firebaseReady;
};

const userDoc = (uid) => appState.modules.firestore.doc(appState.db, "users", uid);
const photographerDoc = (uid) => appState.modules.firestore.doc(appState.db, "photographers", uid);
const directoryDoc = () => appState.modules.firestore.doc(appState.db, "platform", "directory");
const timestamp = () => appState.modules.firestore.serverTimestamp();

const setAccountMessage = (root, message) => {
  const node = root.querySelector("[data-account-message]");
  if (node) node.textContent = message || "";
};

const setFormBusy = (form, busy, label = "Aguarde...") => {
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.textContent = busy ? label : button.dataset.defaultText;
  }

  form.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = busy;
  });
};

const watchPhotographers = () => {
  if (!appState.firebaseReady) {
    renderDefaultPortfolio();
    return;
  }

  appState.modules.firestore.onSnapshot(directoryDoc(), (snapshot) => {
    const data = snapshot.data();
    appState.photographers = Array.isArray(data?.photographers) ? data.photographers : [];
    renderPhotographerCards();
  }, () => renderDefaultPortfolio());
};

const saveDirectoryProfile = async (uid, profile) => {
  const snapshot = await appState.modules.firestore.getDoc(directoryDoc());
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

  await appState.modules.firestore.setDoc(
    directoryDoc(),
    { photographers: [publicProfile, ...current.filter((item) => item.uid !== uid)], updatedAt: timestamp() },
    { merge: true },
  );
};

const readOwnProfile = async (user) => {
  const snapshot = await appState.modules.firestore.getDoc(userDoc(user.uid));
  const savedProfile = snapshot.exists() ? snapshot.data() : {};
  appState.profile = {
    ...savedProfile,
    uid: user.uid,
    name: cleanText(savedProfile.name, user.displayName || user.email || ""),
    email: savedProfile.email || user.email || "",
    role: DEFAULT_ACCOUNT_ROLE,
  };

  if (!snapshot.exists() || savedProfile.role !== DEFAULT_ACCOUNT_ROLE || !savedProfile.email || !savedProfile.name) {
    const profilePatch = {
      uid: user.uid,
      name: appState.profile.name,
      email: appState.profile.email,
      role: DEFAULT_ACCOUNT_ROLE,
    };

    if (!snapshot.exists()) profilePatch.createdAt = timestamp();
    await appState.modules.firestore.setDoc(userDoc(user.uid), profilePatch, { merge: true });
  }

  if (appState.profile.role === DEFAULT_ACCOUNT_ROLE) {
    const photographerSnapshot = await appState.modules.firestore.getDoc(photographerDoc(user.uid));
    appState.profile.photographer = photographerSnapshot.exists()
      ? photographerSnapshot.data()
      : {
          displayName: appState.profile.name || "",
          city: "",
          bio: "",
          whatsapp: "",
          instagram: "",
          coverUrl: "",
          categories: [],
          photos: [],
          published: false,
        };
  }
};

const createDefaultProfile = async (user) => {
  const profile = {
    uid: user.uid,
    name: cleanText(user.displayName, user.email),
    email: user.email || "",
    role: DEFAULT_ACCOUNT_ROLE,
    createdAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(userDoc(user.uid), profile, { merge: true });

  if (profile.role === DEFAULT_ACCOUNT_ROLE) {
    const photographerSnapshot = await appState.modules.firestore.getDoc(photographerDoc(user.uid));
    const photographerProfile = photographerSnapshot.exists()
      ? photographerSnapshot.data()
      : {
          displayName: profile.name,
          city: "",
          bio: "",
          whatsapp: "",
          instagram: "",
          coverUrl: "",
          categories: [],
          photos: [],
          published: false,
          createdAt: timestamp(),
        };

    await appState.modules.firestore.setDoc(photographerDoc(user.uid), photographerProfile, { merge: true });
    profile.photographer = photographerProfile;
  }

  appState.profile = profile;
};

const readOrCreateProfile = async (user) => {
  const snapshot = await appState.modules.firestore.getDoc(userDoc(user.uid));
  if (!snapshot.exists()) {
    await createDefaultProfile(user);
    return;
  }

  await readOwnProfile(user);
};

const savePhotographerProfile = async (form) => {
  const formData = new FormData(form);
  const currentPhotos = appState.profile?.photographer?.photos || [];
  const nextProfile = {
    ...appState.profile.photographer,
    displayName: cleanText(formData.get("displayName")),
    city: cleanText(formData.get("city")),
    bio: cleanText(formData.get("bio")),
    whatsapp: cleanText(formData.get("whatsapp")),
    instagram: cleanText(formData.get("instagram")),
    coverUrl: cleanText(formData.get("coverUrl")),
    categories: splitList(formData.get("categories")),
    published: formData.get("published") === "on",
    photos: currentPhotos,
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
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
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
  form.reset();
};

const removePhoto = async (index) => {
  const current = appState.profile?.photographer || {};
  const photos = Array.isArray(current.photos) ? [...current.photos] : [];
  const removed = photos.splice(index, 1)[0];
  const coverWasRemoved = removed?.url && current.coverUrl === removed.url;
  const nextProfile = {
    ...current,
    photos,
    coverUrl: coverWasRemoved ? photos[0]?.url || "" : current.coverUrl || photos[0]?.url || "",
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const buildAccountShell = () => {
  let shell = document.querySelector("[data-account-shell]");
  if (!shell) {
    shell = document.createElement("section");
    shell.className = "admin-access";
    shell.dataset.accountShell = "";
    shell.setAttribute("aria-label", "Conta");
    shell.innerHTML = `<div class="account-modal" data-account-root></div>`;
    document.body.append(shell);
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
  launcher.hidden = false;
  launcher.setAttribute("aria-label", "Abrir conta");
  launcher.addEventListener("click", () => {
    shell.classList.add("is-open");
    shell.querySelector("input, button, textarea")?.focus();
  });

  shell.addEventListener("click", (event) => {
    if (event.target === shell) shell.classList.remove("is-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") shell.classList.remove("is-open");
  });

  return shell;
};

const renderAuthForms = (root, message = "") => {
  root.innerHTML = `
    <div class="auth-intro">
      <span>Acesso do site</span>
      <h1>Entre ou crie sua conta para publicar portfólios</h1>
      <p>Use sua conta para publicar fotos e dados do perfil no site.</p>
    </div>
    <div class="account-grid">
      <form class="account-form" data-login-form>
        <h3>Entrar</h3>
        <label>Email<input name="email" type="email" inputmode="email" autocomplete="username" placeholder="nome@gmail.com" required /></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required /></label>
        <button type="submit">Entrar</button>
      </form>
      <form class="account-form" data-register-form>
        <h3>Criar conta</h3>
        <label>Nome<input name="name" autocomplete="name" required /></label>
        <label>Email<input name="email" type="email" inputmode="email" autocomplete="email" placeholder="nome@gmail.com" required /></label>
        <label>Senha<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
    <div class="google-access">
      <button type="button" data-google-login>Continuar com Google</button>
    </div>
    <p class="admin-message" data-account-message>${escapeHtml(message)}</p>
  `;
};

const renderDashboard = (root, message = "") => {
  const profile = appState.profile || {};
  const photographer = profile.photographer || {};
  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];

  root.innerHTML = `
    <div class="account-panel">
      <div class="admin-panel-top">
        <strong>Área do fotógrafo</strong>
        <span>${escapeHtml(profile.email || "")}</span>
      </div>
      <form class="account-form" data-photographer-form>
        <label>Nome público<input name="displayName" value="${escapeHtml(photographer.displayName || profile.name || "")}" required /></label>
        <label>Cidade<input name="city" value="${escapeHtml(photographer.city || "")}" placeholder="Manaus - AM" /></label>
        <label>Bio<textarea name="bio" rows="3" placeholder="Fale sobre seu estilo e atendimento">${escapeHtml(photographer.bio || "")}</textarea></label>
        <label>WhatsApp<input name="whatsapp" value="${escapeHtml(photographer.whatsapp || "")}" placeholder="5592999999999" /></label>
        <label>Instagram<input name="instagram" value="${escapeHtml(photographer.instagram || "")}" placeholder="https://instagram.com/seuperfil" /></label>
        <label>Categorias<input name="categories" value="${escapeHtml((photographer.categories || []).join(", "))}" placeholder="Casamento, gestante, eventos" /></label>
        <label>Foto de capa por URL<input name="coverUrl" value="${escapeHtml(photographer.coverUrl || "")}" placeholder="https://..." /></label>
        <label class="account-check"><input name="published" type="checkbox" ${photographer.published ? "checked" : ""} /> Publicar meu portfólio</label>
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
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || "Foto")}" loading="lazy" />
            <span>${escapeHtml(photo.title || "Foto")}</span>
            <button type="button" data-remove-photo="${index}">Remover</button>
          </article>
        `).join("") || `<p class="mock-empty">Adicione links de fotos para montar seu portfólio.</p>`}
      </div>
      <button type="button" data-account-logout>Sair</button>
      <p class="admin-message" data-account-message>${escapeHtml(message)}</p>
    </div>
  `;
};

const initializeAccount = () => {
  const shell = buildAccountShell();
  const root = shell.querySelector("[data-account-root]");
  let accountSubmitInProgress = false;

  if (!appState.firebaseReady) {
    renderAuthForms(root, appState.firebaseError || "Configure o Firebase em firebase-config.js para ativar cadastro e login.");
    return;
  }

  appState.modules.auth.onAuthStateChanged(appState.auth, async (user) => {
    if (accountSubmitInProgress) return;

    appState.user = user;

    if (!user) {
      appState.profile = null;
      renderAuthForms(root);
      return;
    }

    try {
      await readOwnProfile(user);
      renderDashboard(root);
      shell.classList.remove("is-open");
    } catch (error) {
      renderAuthForms(root, authErrorMessage(error));
      shell.classList.add("is-open");
    }
  });

  root.addEventListener("submit", async (event) => {
    event.preventDefault();
    const loginForm = event.target.closest("[data-login-form]");
    const registerForm = event.target.closest("[data-register-form]");
    const photographerForm = event.target.closest("[data-photographer-form]");
    const photoForm = event.target.closest("[data-photo-form]");
    const activeForm = loginForm || registerForm || photographerForm || photoForm;
    setAccountMessage(root, "");

    try {
      if (loginForm) {
        accountSubmitInProgress = true;
        setFormBusy(loginForm, true, "Entrando...");
        const formData = new FormData(loginForm);
        const credential = await appState.modules.auth.signInWithEmailAndPassword(appState.auth, emailForAuth(formData.get("email")), String(formData.get("password") || ""));
        appState.user = credential.user;
        await readOwnProfile(credential.user);
        renderDashboard(root, "Login realizado.");
        shell.classList.add("is-open");
        loginForm.reset();
      }

      if (registerForm) {
        accountSubmitInProgress = true;
        setFormBusy(registerForm, true, "Criando conta...");
        const formData = new FormData(registerForm);
        const email = emailForAuth(formData.get("email"));
        const credential = await appState.modules.auth.createUserWithEmailAndPassword(
          appState.auth,
          email,
          String(formData.get("password") || ""),
        );
        const profile = {
          uid: credential.user.uid,
          name: cleanText(formData.get("name")),
          email,
          role: DEFAULT_ACCOUNT_ROLE,
          createdAt: timestamp(),
        };
        appState.user = credential.user;
        await appState.modules.firestore.setDoc(userDoc(credential.user.uid), profile);

        if (profile.role === DEFAULT_ACCOUNT_ROLE) {
          const photographerProfile = {
            displayName: profile.name,
            city: "",
            bio: "",
            whatsapp: "",
            instagram: "",
            coverUrl: "",
            categories: [],
            photos: [],
            published: false,
            createdAt: timestamp(),
          };
          await appState.modules.firestore.setDoc(photographerDoc(credential.user.uid), photographerProfile);
          profile.photographer = photographerProfile;
        }

        appState.profile = profile;
        renderDashboard(root, "Cadastro criado.");
        shell.classList.add("is-open");
        registerForm.reset();
      }

      if (photographerForm) {
        setFormBusy(photographerForm, true, "Salvando...");
        await savePhotographerProfile(photographerForm);
        renderDashboard(root, "Perfil salvo.");
      }

      if (photoForm) {
        setFormBusy(photoForm, true, "Adicionando...");
        await addPhoto(photoForm);
        renderDashboard(root, "Foto adicionada.");
      }
    } catch (error) {
      setAccountMessage(root, authErrorMessage(error));
    } finally {
      accountSubmitInProgress = false;
      setFormBusy(activeForm, false);
    }
  });

  root.addEventListener("click", async (event) => {
    const googleLogin = event.target.closest("[data-google-login]");
    const logout = event.target.closest("[data-account-logout]");
    const remove = event.target.closest("[data-remove-photo]");

    if (googleLogin) {
      const defaultText = googleLogin.textContent;
      accountSubmitInProgress = true;
      googleLogin.disabled = true;
      googleLogin.textContent = "Abrindo Google...";
      setAccountMessage(root, "");

      try {
        const provider = new appState.modules.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const credential = await appState.modules.auth.signInWithPopup(appState.auth, provider);
        appState.user = credential.user;
        await readOrCreateProfile(credential.user);
        renderDashboard(root, "Login com Google realizado.");
        shell.classList.add("is-open");
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      } finally {
        accountSubmitInProgress = false;
        googleLogin.disabled = false;
        googleLogin.textContent = defaultText;
      }
    }

    if (logout) {
      await appState.modules.auth.signOut(appState.auth);
      shell.classList.remove("is-open");
    }

    if (remove) {
      await removePhoto(Number(remove.dataset.removePhoto));
      renderDashboard(root);
    }
  });
};

renderLayout();
initializeMenus();
renderDefaultPortfolio();
renderCategoryPages();
initializeBudgetForm();
await connectFirebase();
watchPhotographers();
initializeAccount();
