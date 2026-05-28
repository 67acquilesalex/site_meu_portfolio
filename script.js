import { firebaseConfig } from "./firebase-config.js";
import {
  contact,
  albums,
  DEFAULT_ACCOUNT_ROLE,
  DEFAULT_PAGE_SETTINGS,
  EDITOR_TABS,
  PUBLIC_PAGES,
} from "./js/config.js";
import {
  normalizePageSettings,
  normalizePhotos,
  normalizeStoredServices,
  serviceListForDisplay,
  normalizeBudget,
  defaultPhotographerProfile,
  normalizePhotographerProfile,
  visibleProfilePhotos,
} from "./js/profile.js";
import {
  currentSlug,
  cleanText,
  emailForAuth,
  splitList,
  escapeHtml,
  makeId,
} from "./js/utils.js";

const appState = {
  auth: null,
  db: null,
  storage: null,
  firebaseReady: false,
  firebaseError: "",
  modules: {},
  photographers: [],
  leads: [],
  unsubscribeLeads: null,
  profile: null,
  user: null,
  accountTab: "inicio",
  directorySearch: "",
  directoryCategory: "",
  directoryResultCount: 0,
  lightbox: {
    items: [],
    index: 0,
  },
};

const albumBySlug = new Map(albums.map((album) => [album.slug, album]));
const directoryFilters = ["Familia", "Gestante", "Casal", "Eventos", "Empresarial", "Imoveis"];

const authErrorMessage = (error) => {
  const messages = {
    "auth/email-already-in-use": "Este email já está cadastrado. Entre com a senha, use Google ou redefina a senha.",
    "auth/invalid-email": "Confira o email. Remova espacos ou caracteres extras e tente novamente.",
    "local/invalid-email": "Digite o email completo, exemplo: nome@gmail.com.",
    "auth/invalid-credential": "Email ou senha incorretos. Se a conta foi criada com Google, use o botão Google. Se esqueceu a senha, redefina abaixo.",
    "auth/user-not-found": "Nao existe conta com este email.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/missing-password": "Digite a senha.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/network-request-failed": "Nao foi possivel conectar ao Firebase. Verifique sua internet e tente de novo.",
    "auth/account-exists-with-different-credential": "Ja existe uma conta com este email usando outro tipo de login. Tente entrar com Google.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups para este site.",
    "auth/cancelled-popup-request": "A janela de login do Google ja estava aberta.",
    "auth/operation-not-allowed": "Email/senha ainda não está ativado no Firebase Authentication.",
    "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "A chave do Firebase é inválida. Copie novamente a configuração Web App do seu projeto Firebase.",
    "auth/invalid-api-key": "A chave do Firebase é inválida. Copie novamente a configuração Web App do seu projeto Firebase.",
    "auth/operation-not-allowed": "Este tipo de login ainda nao esta ativado no Firebase Authentication.",
    "auth/app-not-authorized": "Este dominio nao esta autorizado para usar esta chave do Firebase.",
    "storage/unauthorized": "O Firebase Storage negou o upload. Publique as regras de Storage para fotografos logados.",
    "permission-denied": "O Firestore negou a escrita. Publique as regras do banco de dados no Firebase.",
    "local/invalid-url": "Use uma URL valida, comecando por https:// ou http://.",
    "local/invalid-image": "Envie uma imagem JPG, PNG ou WebP com ate 8 MB.",
    "local/storage-unavailable": "O upload direto precisa do Firebase Storage configurado. Use uma URL de imagem por enquanto.",
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

const navButton = (label, className = "", extraAttributes = "") => `<button class="${className}" type="button" data-open-account ${extraAttributes}>${label}</button>`;

const accountEntryLabel = () => appState.user ? "Minha pagina" : "Entrar";

const refreshAccountLabels = () => {
  document.querySelectorAll("[data-account-label]").forEach((button) => {
    button.textContent = accountEntryLabel();
  });

  document.querySelectorAll("[data-admin-launcher]").forEach((button) => {
    button.textContent = appState.user ? "Minha pagina" : "Conta";
    button.setAttribute("aria-label", appState.user ? "Abrir minha pagina" : "Abrir conta");
  });
};

const renderLayout = () => {
  document.querySelectorAll("[data-site-header], .site-header").forEach((header) => {
    const brandMarkup = contact.logo
      ? `<img src="${contact.logo}" alt="${contact.brand}" width="239" height="82" />`
      : `<span>${escapeHtml(contact.brand)}</span><small>${escapeHtml(contact.tagline)}</small>`;
    header.className = "site-header";
    header.dataset.siteHeader = "";
    header.innerHTML = `
      <div class="site-frame header-frame">
        <a class="brand" href="index.html" aria-label="${contact.brand}">
          ${brandMarkup}
        </a>
        <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="main-nav" aria-label="Site">
          ${navItem("index.html", "Home", ["index"])}
          ${navItem("portfolio.html", "Fotógrafos", ["portfolio"])}
          ${navButton("Criar pagina", "nav-cta")}
          ${navButton(accountEntryLabel(), "", "data-account-label")}
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

  refreshAccountLabels();
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
  item.innerHTML = `
    <button class="lightbox-thumb" type="button" data-lightbox-src="${escapeHtml(src)}" data-lightbox-title="${escapeHtml(alt)}" data-lightbox-group="category-gallery">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
    </button>
  `;
  return item;
};

const emptyState = (message) => {
  const item = document.createElement("article");
  item.className = "platform-empty";
  item.innerHTML = `<p>${escapeHtml(message)}</p>`;
  return item;
};

const normalizeForSearch = (value) => cleanText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const photographerSearchText = (photographer) => {
  const profile = normalizePhotographerProfile(photographer);
  const services = serviceListForDisplay(profile);
  return normalizeForSearch([
    profile.displayName,
    profile.city,
    profile.bio,
    profile.headline,
    profile.availability,
    ...profile.categories,
    ...services.flatMap((service) => [service.title, service.description]),
  ].filter(Boolean).join(" "));
};

const filterDirectoryPhotographers = (photographers) => {
  const search = normalizeForSearch(appState.directorySearch);
  const category = normalizeForSearch(appState.directoryCategory);

  return photographers.filter((photographer) => {
    const haystack = photographerSearchText(photographer);
    return (!search || haystack.includes(search)) && (!category || haystack.includes(category));
  });
};

const syncDirectoryControls = () => {
  document.querySelectorAll("[data-directory-search]").forEach((input) => {
    if (input.value !== appState.directorySearch) input.value = appState.directorySearch;
  });

  document.querySelectorAll("[data-directory-filter]").forEach((button) => {
    const active = normalizeForSearch(button.dataset.directoryFilter) === normalizeForSearch(appState.directoryCategory);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  document.querySelectorAll("[data-directory-count]").forEach((node) => {
    const count = appState.directoryResultCount;
    node.textContent = count === 1 ? "1 fotografo encontrado" : `${count} fotografos encontrados`;
  });
};

const clearDirectoryFilters = () => {
  appState.directorySearch = "";
  appState.directoryCategory = "";
  renderPhotographerCards();
};

const directoryEmptyState = (filtered = false) => {
  const item = document.createElement("article");
  item.className = "platform-empty directory-empty";
  item.innerHTML = filtered
    ? `
      <span>Nenhum resultado</span>
      <h2>Nenhum fotografo encontrado.</h2>
      <p>Tente outro nome, cidade ou categoria para ampliar a busca.</p>
      <button class="text-button" type="button" data-directory-clear>Limpar busca</button>
    `
    : `
      <span>Nenhum fotografo publicado ainda</span>
      <h2>Crie a primeira pagina de portfolio da plataforma.</h2>
      <p>Entre na sua conta, preencha o perfil, adicione fotos e marque a opcao de publicar.</p>
      <button class="text-button" type="button" data-open-account>Criar minha pagina</button>
    `;
  return item;
};

const renderDefaultPortfolio = () => {
  if (currentSlug() === "portfolio") return;

  document.querySelectorAll("[data-album-grid]").forEach((gallery) => {
    gallery.classList.remove("photographer-directory", "photographer-detail-grid");
    gallery.replaceChildren(...albums.map(albumCard));
  });
};

const photographerCard = (photographer) => {
  const card = document.createElement("a");
  const profile = normalizePhotographerProfile(photographer);
  const serviceNames = serviceListForDisplay(profile).map((service) => service.title);
  const categories = (profile.categories.length ? profile.categories : serviceNames).slice(0, 3);
  const photos = visibleProfilePhotos(profile);
  card.className = "photographer-card";
  card.href = `portfolio.html?fotografo=${encodeURIComponent(photographer.uid)}`;
  card.innerHTML = `
    <img src="${escapeHtml(profile.coverUrl || photos[0]?.url || "assets/marilopes/empresarial.jpg")}" alt="${escapeHtml(profile.displayName || "Fotógrafo")}" loading="lazy" />
    <div>
      <strong>${escapeHtml(profile.displayName || "Fotógrafo")}</strong>
      <span>${escapeHtml(profile.city || "Portfólio online")}</span>
      <p>${escapeHtml(profile.bio || "Conheça o trabalho deste fotógrafo.")}</p>
      ${categories.length ? `<small>${categories.map(escapeHtml).join(" • ")}</small>` : ""}
    </div>
  `;
  return card;
};

const renderDirectory = (gallery, publicPhotographers, filtered = false) => {
  gallery.classList.add("photographer-directory");
  gallery.classList.remove("photographer-detail-grid");
  gallery.replaceChildren(
    ...(publicPhotographers.length
      ? publicPhotographers.map(photographerCard)
      : [directoryEmptyState(filtered)]),
  );
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
  const params = new URLSearchParams(location.search);
  const selectedId = params.get("fotografo");
  const publicPhotographers = appState.photographers.filter((item) => item.published);
  const filteredPhotographers = filterDirectoryPhotographers(publicPhotographers);
  const hasActiveDirectoryFilter = Boolean(cleanText(appState.directorySearch) || cleanText(appState.directoryCategory));
  const directoryGalleries = document.querySelectorAll("[data-photographer-directory]");
  document.body.classList.toggle("photographer-site-view", currentSlug() === "portfolio" && Boolean(selectedId));
  appState.directoryResultCount = filteredPhotographers.length;

  document.querySelectorAll("[data-directory-toolbar]").forEach((toolbar) => {
    toolbar.hidden = currentSlug() === "portfolio" && Boolean(selectedId);
  });
  directoryGalleries.forEach((gallery) => renderDirectory(gallery, filteredPhotographers, hasActiveDirectoryFilter));
  syncDirectoryControls();

  if (currentSlug() !== "portfolio") {
    if (!directoryGalleries.length) renderDefaultPortfolio();
    return;
  }

  const gallery = document.querySelector("[data-album-grid]");
  const intro = document.querySelector("[data-portfolio-intro]");
  if (intro) intro.hidden = Boolean(selectedId);
  if (!gallery) return;

  if (selectedId) {
    renderPhotographerSite(gallery, publicPhotographers.find((item) => item.uid === selectedId));
    return;
  }

  renderDirectory(gallery, filteredPhotographers, hasActiveDirectoryFilter);
};

const initializeDirectoryControls = () => {
  const params = new URLSearchParams(location.search);
  appState.directorySearch = cleanText(params.get("busca") || appState.directorySearch);
  appState.directoryCategory = cleanText(params.get("categoria") || appState.directoryCategory);

  document.querySelectorAll("[data-directory-filters]").forEach((container) => {
    if (container.children.length) return;
    container.replaceChildren(...directoryFilters.map((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.directoryFilter = filter;
      button.setAttribute("aria-pressed", "false");
      button.textContent = filter;
      return button;
    }));
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-directory-search]");
    if (!input) return;
    appState.directorySearch = cleanText(input.value);
    renderPhotographerCards();
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-directory-search-form]");
    if (!form) return;
    event.preventDefault();
    appState.directorySearch = cleanText(form.querySelector("[data-directory-search]")?.value);
    renderPhotographerCards();
  });

  document.addEventListener("click", (event) => {
    const filterButton = event.target.closest("[data-directory-filter]");
    const clearButton = event.target.closest("[data-directory-clear]");

    if (filterButton) {
      const nextCategory = cleanText(filterButton.dataset.directoryFilter);
      appState.directoryCategory = normalizeForSearch(appState.directoryCategory) === normalizeForSearch(nextCategory)
        ? ""
        : nextCategory;
      renderPhotographerCards();
    }

    if (clearButton) {
      clearDirectoryFilters();
    }
  });

  syncDirectoryControls();
};

const renderPhotographerDetail = (gallery, photographer) => {
  gallery.classList.add("photographer-detail-grid");
  gallery.classList.remove("photographer-directory");

  if (!photographer) {
    gallery.replaceChildren(emptyState("Esse fotógrafo ainda não publicou o perfil ou o link está incorreto."));
    return;
  }

  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];
  const categories = Array.isArray(photographer.categories) ? photographer.categories.filter(Boolean) : [];
  const services = categories.length ? categories : ["Ensaios fotograficos", "Portfolio profissional", "Atendimento personalizado"];
  const coverUrl = photographer.coverUrl || photos[0]?.url || "assets/marilopes/empresarial.jpg";
  const instagram = instagramUrl(photographer.instagram);
  const whatsapp = whatsappUrl(photographer.whatsapp);
  const publicEmail = cleanText(photographer.publicEmail);
  const displayName = photographer.displayName || "Fotógrafo";
  const headline = photographer.headline || photographer.bio || "Portfolio fotografico com ensaios, projetos e contatos profissionais.";
  const requestedPage = new URLSearchParams(location.search).get("pagina") || "inicio";
  const activePage = ["inicio", "portfolio", "projetos", "orcamento", "contato"].includes(requestedPage)
    ? requestedPage
    : "inicio";
  const pageHref = (page) => publicProfilePath(photographer.uid, page);
  const activeClass = (page) => activePage === page ? ' class="active"' : "";
  const heroSection = `
    <section class="photographer-site-hero" id="inicio">
      <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(displayName)}" loading="eager" />
      <div>
        <span>Portfólio de fotografia</span>
        <h1>${escapeHtml(displayName)}</h1>
        <p>${escapeHtml(headline)}</p>
        <div class="profile-tags">
          ${photographer.city ? `<span>${escapeHtml(photographer.city)}</span>` : ""}
          ${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}
        </div>
        <div class="profile-links">
          <a href="${escapeHtml(pageHref("portfolio"))}">Ver portfólio</a>
          ${whatsapp ? `<a href="${escapeHtml(pageHref("orcamento"))}">Pedir orçamento</a>` : ""}
          ${instagram ? `<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ""}
        </div>
      </div>
    </section>
  `;
  const portfolioSection = `
    <section class="photographer-site-section" id="portfolio">
      <div class="photographer-section-head">
        <span>Portfólio</span>
        <h2>Galeria de trabalhos</h2>
        <p>Uma seleção das fotos publicadas por ${escapeHtml(displayName)}.</p>
      </div>
      <div class="photographer-site-gallery">
        ${photos.length ? photos.map((photo) => `
          <figure>
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || displayName || "Foto")}" loading="lazy" />
            ${photo.title ? `<figcaption>${escapeHtml(photo.title)}</figcaption>` : ""}
          </figure>
        `).join("") : `<p class="mock-empty">Este fotógrafo ainda não publicou fotos.</p>`}
      </div>
    </section>
  `;
  const projectsSection = `
    <section class="photographer-site-section" id="servicos">
      <div class="photographer-section-head">
        <span>Projetos e serviços</span>
        <h2>Especialidades do fotógrafo</h2>
        <p>Estas categorias ajudam clientes a entenderem o tipo de trabalho oferecido.</p>
      </div>
      <div class="service-grid">
        ${services.map((service, index) => `
          <article>
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(service)}</h3>
            <p>Projeto fotográfico com direção, cuidado visual e entrega em página de portfólio.</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
  const budgetSection = `
    <section class="photographer-site-section photographer-budget" id="orcamento">
      <div class="photographer-section-head">
        <span>Orçamento</span>
        <h2>Solicite uma proposta</h2>
        <p>Envie uma mensagem direta para o contato do fotógrafo com as informações principais.</p>
      </div>
      ${whatsapp ? `
        <form class="quote-form" data-profile-budget>
          <label>Nome<input name="nome" required placeholder="Seu nome" /></label>
          <label>WhatsApp<input name="telefone" placeholder="Seu WhatsApp" /></label>
          <label>Tipo de ensaio/serviço<input name="segmento" placeholder="${escapeHtml(services[0] || "Ensaio fotográfico")}" /></label>
          <label>Data desejada<input name="data" type="date" /></label>
          <label class="wide">Mensagem<textarea name="mensagem" rows="4" placeholder="Conte um pouco sobre o que você precisa"></textarea></label>
          <button class="form-button" type="submit">Enviar pelo WhatsApp</button>
        </form>
      ` : `<p class="mock-empty">Este fotógrafo ainda não adicionou WhatsApp para orçamentos.</p>`}
    </section>
  `;
  const contactSection = `
    <section class="photographer-site-section" id="contato">
      <div class="photographer-section-head">
        <span>Contato</span>
        <h2>Fale com ${escapeHtml(displayName)}</h2>
        <p>Use os canais publicados pelo fotógrafo para conversar sobre datas, projetos e disponibilidade.</p>
      </div>
      <div class="contact-links photographer-contact-links">
        ${whatsapp ? `<a href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
        ${instagram ? `<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ""}
        ${publicEmail ? `<a href="mailto:${escapeHtml(publicEmail)}">${escapeHtml(publicEmail)}</a>` : ""}
        ${photographer.city ? `<span>${escapeHtml(photographer.city)}</span>` : ""}
      </div>
    </section>
  `;
  const pageSections = {
    inicio: heroSection,
    portfolio: portfolioSection,
    projetos: projectsSection,
    orcamento: budgetSection,
    contato: contactSection,
  };
  const site = document.createElement("article");
  site.className = "photographer-site";
  site.innerHTML = `
    <header class="photographer-site-header">
      <a class="photographer-site-brand" href="${escapeHtml(pageHref("inicio"))}">
        <strong>${escapeHtml(displayName)}</strong>
        <span>${escapeHtml(photographer.city || "Portfólio fotográfico")}</span>
      </a>
      <nav aria-label="Portfolio de ${escapeHtml(displayName)}">
        <a${activeClass("inicio")} href="${escapeHtml(pageHref("inicio"))}">Início</a>
        <a${activeClass("portfolio")} href="${escapeHtml(pageHref("portfolio"))}">Portfólio</a>
        <a${activeClass("projetos")} href="${escapeHtml(pageHref("projetos"))}">Projetos</a>
        <a${activeClass("orcamento")} href="${escapeHtml(pageHref("orcamento"))}">Orçamento</a>
        <a${activeClass("contato")} href="${escapeHtml(pageHref("contato"))}">Contato</a>
      </nav>
      <a class="profile-back" href="portfolio.html">Voltar aos fotógrafos</a>
    </header>
    ${pageSections[activePage]}

    <footer class="photographer-site-footer">
      <span>${escapeHtml(displayName)}</span>
      <a href="portfolio.html">Ver outros fotógrafos</a>
    </footer>
  `;

  const budgetForm = site.querySelector("[data-profile-budget]");
  if (budgetForm && whatsapp) {
    budgetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(budgetForm);
      const message = [
        `Ola, ${displayName}! Gostaria de solicitar um orcamento.`,
        "",
        `Nome: ${formData.get("nome") || ""}`,
        `WhatsApp: ${formData.get("telefone") || ""}`,
        `Servico: ${formData.get("segmento") || ""}`,
        `Data desejada: ${formData.get("data") || "A definir"}`,
        `Mensagem: ${formData.get("mensagem") || ""}`,
      ].join("\n");

      window.open(`${whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    });
  }

  gallery.replaceChildren(site);
};

const publicPagesInOrder = (page) => {
  const pageById = new Map(PUBLIC_PAGES.map((item) => [item[0], item]));
  const orderedIds = [
    ...page.sectionOrder.filter((id) => pageById.has(id)),
    ...PUBLIC_PAGES.map(([id]) => id).filter((id) => !page.sectionOrder.includes(id)),
  ];

  return orderedIds
    .map((id) => pageById.get(id))
    .filter(([, , visibilityKey]) => page[visibilityKey] !== false);
};

const galleryPhotoMarkup = (photo, displayName, group = "profile-gallery") => {
  const title = cleanText(photo.title || displayName || "Foto");
  return `
    <figure>
      <button class="lightbox-thumb" type="button" data-lightbox-src="${escapeHtml(photo.url)}" data-lightbox-title="${escapeHtml(title)}" data-lightbox-group="${escapeHtml(group)}">
        <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(title)}" loading="lazy" />
      </button>
      ${photo.title ? `<figcaption>${escapeHtml(photo.title)}</figcaption>` : ""}
    </figure>
  `;
};

const renderPhotographerSite = (gallery, photographer) => {
  gallery.classList.add("photographer-detail-grid");
  gallery.classList.remove("photographer-directory");

  if (!photographer) {
    gallery.replaceChildren(emptyState("Esse fotógrafo ainda não publicou o perfil ou o link está incorreto."));
    return;
  }

  const profile = normalizePhotographerProfile(photographer);
  const page = normalizePageSettings(profile.page);
  const photos = visibleProfilePhotos(profile);
  const featuredPhoto = photos.find((photo) => photo.featured) || photos[0];
  const categories = profile.categories;
  const services = serviceListForDisplay(profile).filter((service) => service.visible !== false);
  const budget = normalizeBudget(profile);
  const coverUrl = profile.coverUrl || featuredPhoto?.url || "assets/marilopes/empresarial.jpg";
  const instagram = instagramUrl(profile.instagram);
  const whatsapp = whatsappUrl(profile.whatsapp);
  const budgetWhatsapp = whatsappUrl(budget.whatsapp || profile.whatsapp);
  const publicEmail = cleanText(profile.publicEmail);
  const displayName = profile.displayName || "Fotógrafo";
  const headline = profile.headline || profile.bio || "Portfolio fotografico com ensaios, projetos e contatos profissionais.";
  const availablePages = publicPagesInOrder(page);
  if (!availablePages.length) availablePages.push(PUBLIC_PAGES[0]);

  const requestedPage = new URLSearchParams(location.search).get("pagina") || availablePages[0][0];
  const activePage = availablePages.some(([id]) => id === requestedPage) ? requestedPage : availablePages[0][0];
  const pageHref = (pageId) => publicProfilePath(photographer.uid, pageId);
  const activeClass = (pageId) => activePage === pageId ? ' class="active"' : "";
  const isVisible = (pageId) => availablePages.some(([id]) => id === pageId);
  const navLinks = availablePages.map(([id, label]) => `<a${activeClass(id)} href="${escapeHtml(pageHref(id))}">${label}</a>`).join("");

  const heroSection = `
    <section class="photographer-site-hero" id="inicio">
      <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(displayName)}" loading="eager" />
      <div>
        <span>Portfólio de fotografia</span>
        <h1>${escapeHtml(displayName)}</h1>
        <p>${escapeHtml(headline)}</p>
        <div class="profile-tags">
          ${profile.city ? `<span>${escapeHtml(profile.city)}</span>` : ""}
          ${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}
        </div>
        <div class="profile-links">
          ${isVisible("portfolio") ? `<a href="${escapeHtml(pageHref("portfolio"))}">Ver portfólio</a>` : ""}
          ${budgetWhatsapp && isVisible("orcamento") ? `<a href="${escapeHtml(pageHref("orcamento"))}">Pedir orçamento</a>` : ""}
          ${instagram ? `<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ""}
        </div>
      </div>
    </section>
  `;
  const portfolioSection = `
    <section class="photographer-site-section" id="portfolio">
      <div class="photographer-section-head">
        <span>Portfólio</span>
        <h2>Galeria de trabalhos</h2>
        <p>Uma seleção das fotos publicadas por ${escapeHtml(displayName)}.</p>
      </div>
      <div class="photographer-site-gallery">
        ${photos.length ? photos.map((photo) => galleryPhotoMarkup(photo, displayName)).join("") : `<p class="mock-empty">Este fotógrafo ainda não publicou fotos visíveis.</p>`}
      </div>
    </section>
  `;
  const projectsSection = `
    <section class="photographer-site-section" id="servicos">
      <div class="photographer-section-head">
        <span>Projetos e serviços</span>
        <h2>Especialidades do fotógrafo</h2>
        <p>Serviços cadastrados pelo fotógrafo para orientar o pedido do cliente.</p>
      </div>
      <div class="service-grid">
        ${services.length ? services.map((service, index) => `
          <article>
            ${service.imageUrl ? `<img src="${escapeHtml(service.imageUrl)}" alt="${escapeHtml(service.title)}" loading="lazy" />` : ""}
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(service.title)}</h3>
            <p>${escapeHtml(service.description || "Projeto fotografico com direcao, cuidado visual e entrega em pagina de portfolio.")}</p>
          </article>
        `).join("") : `<p class="mock-empty">Este fotógrafo ainda não cadastrou serviços visíveis.</p>`}
      </div>
    </section>
  `;
  const budgetSection = `
    <section class="photographer-site-section photographer-budget" id="orcamento">
      <div class="photographer-section-head">
        <span>Orçamento</span>
        <h2>${escapeHtml(budget.title)}</h2>
        <p>${escapeHtml(budget.text)}</p>
      </div>
      ${budgetWhatsapp ? `
        <form class="quote-form" data-profile-budget>
          <label>Nome<input name="nome" required placeholder="Seu nome" /></label>
          <label>WhatsApp<input name="telefone" placeholder="Seu WhatsApp" /></label>
          <label>Tipo de ensaio/serviço<input name="segmento" placeholder="${escapeHtml(services[0]?.title || categories[0] || "Ensaio fotográfico")}" /></label>
          <label>Data desejada<input name="data" type="date" /></label>
          <label class="wide">Mensagem<textarea name="mensagem" rows="4" placeholder="Conte um pouco sobre o que você precisa"></textarea></label>
          <button class="form-button" type="submit">Enviar pelo WhatsApp</button>
        </form>
      ` : `<p class="mock-empty">Este fotógrafo ainda não adicionou WhatsApp para orçamentos.</p>`}
    </section>
  `;
  const contactLinks = [
    whatsapp ? `<a href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : "",
    instagram ? `<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : "",
    publicEmail ? `<a href="mailto:${escapeHtml(publicEmail)}">${escapeHtml(publicEmail)}</a>` : "",
    profile.city ? `<span>${escapeHtml(profile.city)}</span>` : "",
  ].filter(Boolean).join("");
  const contactSection = `
    <section class="photographer-site-section" id="contato">
      <div class="photographer-section-head">
        <span>Contato</span>
        <h2>Fale com ${escapeHtml(displayName)}</h2>
        <p>${escapeHtml(profile.availability || "Use os canais publicados pelo fotógrafo para conversar sobre datas, projetos e disponibilidade.")}</p>
      </div>
      <div class="contact-links photographer-contact-links">
        ${contactLinks || `<p class="mock-empty">Este fotógrafo ainda não publicou canais de contato.</p>`}
      </div>
    </section>
  `;
  const pageSections = {
    inicio: heroSection,
    portfolio: portfolioSection,
    projetos: projectsSection,
    orcamento: budgetSection,
    contato: contactSection,
  };
  const site = document.createElement("article");
  site.className = `photographer-site photographer-template-${page.template}`;
  site.style.setProperty("--line", page.primaryColor);
  site.style.setProperty("--sage-dark", page.primaryColor);
  site.innerHTML = `
    <header class="photographer-site-header">
      <a class="photographer-site-brand" href="${escapeHtml(pageHref(availablePages[0][0]))}">
        <strong>${escapeHtml(displayName)}</strong>
        <span>${escapeHtml(profile.city || "Portfólio fotográfico")}</span>
      </a>
      <nav aria-label="Portfolio de ${escapeHtml(displayName)}">
        ${navLinks}
      </nav>
      <a class="profile-back" href="portfolio.html">Voltar aos fotógrafos</a>
    </header>
    ${pageSections[activePage] || pageSections[availablePages[0][0]]}

    <footer class="photographer-site-footer">
      <span>${escapeHtml(displayName)}</span>
      <a href="portfolio.html">Ver outros fotógrafos</a>
    </footer>
  `;

  const budgetForm = site.querySelector("[data-profile-budget]");
  if (budgetForm && budgetWhatsapp) {
    budgetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(budgetForm);
      const submitButton = budgetForm.querySelector('button[type="submit"]');
      const message = [
        budget.defaultMessage || `Ola, ${displayName}! Gostaria de solicitar um orcamento.`,
        "",
        `Nome: ${formData.get("nome") || ""}`,
        `WhatsApp: ${formData.get("telefone") || ""}`,
        `Servico: ${formData.get("segmento") || ""}`,
        `Data desejada: ${formData.get("data") || "A definir"}`,
        `Mensagem: ${formData.get("mensagem") || ""}`,
      ].join("\n");

      setButtonBusy(submitButton, true, "Abrindo WhatsApp...");
      await saveLead({
        photographerId: photographer.uid,
        photographerName: displayName,
        source: "public-profile-budget",
        formData,
      });
      window.open(`${budgetWhatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setButtonBusy(submitButton, false);
    });
  }

  gallery.replaceChildren(site);
};

const lightboxElements = () => {
  let overlay = document.querySelector("[data-lightbox]");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.dataset.lightbox = "";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="lightbox-panel" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <button class="lightbox-close" type="button" data-lightbox-close>Fechar</button>
      <button class="lightbox-nav lightbox-prev" type="button" data-lightbox-prev aria-label="Foto anterior">Anterior</button>
      <figure>
        <img alt="" data-lightbox-image />
        <figcaption data-lightbox-caption></figcaption>
      </figure>
      <button class="lightbox-nav lightbox-next" type="button" data-lightbox-next aria-label="Proxima foto">Proxima</button>
    </div>
  `;
  document.body.append(overlay);
  return overlay;
};

const updateLightbox = () => {
  const overlay = lightboxElements();
  const current = appState.lightbox.items[appState.lightbox.index];
  const image = overlay.querySelector("[data-lightbox-image]");
  const caption = overlay.querySelector("[data-lightbox-caption]");
  const hasMany = appState.lightbox.items.length > 1;

  if (!current || !image || !caption) return;
  image.src = current.src;
  image.alt = current.title || "Foto ampliada";
  caption.textContent = current.title || "";
  overlay.querySelector("[data-lightbox-prev]").hidden = !hasMany;
  overlay.querySelector("[data-lightbox-next]").hidden = !hasMany;
};

const openLightbox = (trigger) => {
  const group = trigger.dataset.lightboxGroup || "gallery";
  const safeGroup = globalThis.CSS?.escape ? CSS.escape(group) : group.replace(/"/g, '\\"');
  const groupItems = [...document.querySelectorAll(`[data-lightbox-src][data-lightbox-group="${safeGroup}"]`)];
  const items = groupItems
    .map((item) => ({
      src: item.dataset.lightboxSrc,
      title: item.dataset.lightboxTitle || item.querySelector("img")?.alt || "",
    }))
    .filter((item) => item.src);
  const index = Math.max(0, groupItems.indexOf(trigger));

  if (!items.length) return;
  appState.lightbox = { items, index };
  const overlay = lightboxElements();
  overlay.hidden = false;
  document.body.classList.add("lightbox-open");
  updateLightbox();
  overlay.querySelector("[data-lightbox-close]")?.focus();
};

const closeLightbox = () => {
  const overlay = document.querySelector("[data-lightbox]");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("lightbox-open");
};

const moveLightbox = (direction) => {
  const total = appState.lightbox.items.length;
  if (!total) return;
  appState.lightbox.index = (appState.lightbox.index + direction + total) % total;
  updateLightbox();
};

const initializeLightbox = () => {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-src]");
    const close = event.target.closest("[data-lightbox-close]");
    const prev = event.target.closest("[data-lightbox-prev]");
    const next = event.target.closest("[data-lightbox-next]");
    const overlay = event.target.closest("[data-lightbox]");

    if (trigger) {
      event.preventDefault();
      openLightbox(trigger);
    } else if (close || (overlay && event.target === overlay)) {
      closeLightbox();
    } else if (prev) {
      moveLightbox(-1);
    } else if (next) {
      moveLightbox(1);
    }
  });

  document.addEventListener("keydown", (event) => {
    const overlay = document.querySelector("[data-lightbox]");
    if (!overlay || overlay.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });
};

const initializeBudgetForm = () => {
  const budgetForm = document.querySelector("[data-budget-form]");
  if (!budgetForm) return;

  budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(budgetForm);
    const submitButton = budgetForm.querySelector('button[type="submit"]');
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

    setButtonBusy(submitButton, true, "Abrindo WhatsApp...");
    await saveLead({
      photographerName: contact.brand,
      source: "site-budget",
      formData,
    });
    window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setButtonBusy(submitButton, false);
  });
};

const connectFirebase = async () => {
  if (!hasFirebaseConfig) return false;

  try {
    const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"),
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    appState.auth = authModule.getAuth(app);
    appState.db = firestoreModule.getFirestore(app);
    appState.storage = storageModule.getStorage(app);
    appState.modules = { auth: authModule, firestore: firestoreModule, storage: storageModule };
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
const publicPhotographerDoc = (uid) => appState.modules.firestore.doc(appState.db, "publicPhotographers", uid);
const publicPhotographersCollection = () => appState.modules.firestore.collection(appState.db, "publicPhotographers");
const timestamp = () => appState.modules.firestore.serverTimestamp();
const saveLead = async ({ photographerId = "", photographerName = "", source = "budget", formData }) => {
  if (!appState.firebaseReady || !formData) return false;

  try {
    await appState.modules.firestore.addDoc(
      appState.modules.firestore.collection(appState.db, "leads"),
      {
        photographerId,
        photographerName,
        source,
        clientName: cleanText(formData.get("nome")),
        clientWhatsapp: cleanText(formData.get("telefone")),
        clientEmail: cleanText(formData.get("email")),
        service: cleanText(formData.get("segmento")),
        desiredDate: cleanText(formData.get("data")),
        message: cleanText(formData.get("mensagem")),
        status: "new",
        createdAt: timestamp(),
      },
    );
    return true;
  } catch (error) {
    console.warn("Lead nao foi salvo no Firestore:", error);
    return false;
  }
};
const publicProfileUrl = (uid, page = "inicio") => {
  const url = new URL("portfolio.html", location.href);
  url.searchParams.set("fotografo", uid);
  if (page && page !== "inicio") url.searchParams.set("pagina", page);
  return url.href;
};
const publicProfilePath = (uid, page = "inicio") => {
  const params = new URLSearchParams({ fotografo: uid });
  if (page && page !== "inicio") params.set("pagina", page);
  return `portfolio.html?${params.toString()}`;
};
const instagramUrl = (value) => {
  const instagram = cleanText(value);
  if (!instagram) return "";
  if (/^https?:\/\//i.test(instagram)) return instagram;
  return `https://instagram.com/${instagram.replace(/^@/, "")}`;
};
const whatsappUrl = (value) => {
  const digits = cleanText(value).replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
};
const normalizePublicImageUrl = (value) => {
  const url = cleanText(value);
  if (!url) return "";
  if (/^(assets\/|\.\/assets\/)/i.test(url)) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    throw { code: "local/invalid-url" };
  }

  throw { code: "local/invalid-url" };
};
const validateImageFile = (file) => {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw { code: "local/invalid-image" };
  }
};

const uploadPhotoFile = async (file, photoId) => {
  validateImageFile(file);
  if (!appState.storage || !appState.modules.storage) throw { code: "local/storage-unavailable" };
  const safeName = cleanText(file.name, "foto").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 80);
  const storageRef = appState.modules.storage.ref(appState.storage, `photographers/${appState.user.uid}/photos/${photoId}-${safeName}`);
  await appState.modules.storage.uploadBytes(storageRef, file, { contentType: file.type });
  return appState.modules.storage.getDownloadURL(storageRef);
};
const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

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

  form.querySelectorAll("button").forEach((control) => {
    control.disabled = busy;
  });
};

const setButtonBusy = (button, busy, label = "Aguarde...") => {
  if (!button) return;
  if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
  button.textContent = busy ? label : button.dataset.defaultText;
  button.disabled = busy;
};

const watchPhotographers = () => {
  if (!appState.firebaseReady) {
    appState.photographers = [];
    renderPhotographerCards();
    return;
  }

  let collectionProfiles = null;
  let directoryProfiles = [];
  const applyProfiles = () => {
    const merged = new Map(directoryProfiles.map((profile) => [profile.uid, profile]));
    (collectionProfiles || []).forEach((profile) => merged.set(profile.uid, profile));
    appState.photographers = [...merged.values()];
    renderPhotographerCards();
  };

  appState.modules.firestore.onSnapshot(publicPhotographersCollection(), (snapshot) => {
    collectionProfiles = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    applyProfiles();
  }, () => {
    collectionProfiles = null;
    applyProfiles();
  });

  appState.modules.firestore.onSnapshot(directoryDoc(), (snapshot) => {
    const data = snapshot.data();
    directoryProfiles = Array.isArray(data?.photographers) ? data.photographers : [];
    applyProfiles();
  }, () => {
    directoryProfiles = [];
    applyProfiles();
  });
};

const stopWatchingLeads = () => {
  if (typeof appState.unsubscribeLeads === "function") appState.unsubscribeLeads();
  appState.unsubscribeLeads = null;
  appState.leads = [];
};

const watchOwnLeads = (uid, root) => {
  stopWatchingLeads();
  if (!appState.firebaseReady || !uid) return;

  try {
    const query = appState.modules.firestore.query(
      appState.modules.firestore.collection(appState.db, "leads"),
      appState.modules.firestore.where("photographerId", "==", uid),
    );
    appState.unsubscribeLeads = appState.modules.firestore.onSnapshot(query, (snapshot) => {
      appState.leads = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((first, second) => {
          const firstDate = first.createdAt?.toMillis?.() || 0;
          const secondDate = second.createdAt?.toMillis?.() || 0;
          return secondDate - firstDate;
        });
      if (root?.querySelector("[data-account-root], [data-photographer-form]")) renderDashboard(root);
    }, () => {
      appState.leads = [];
      if (root?.querySelector("[data-account-root], [data-photographer-form]")) renderDashboard(root);
    });
  } catch (error) {
    console.warn("Caixa de entrada indisponivel:", error);
    appState.leads = [];
  }
};

const saveDirectoryProfile = async (uid, profile) => {
  const snapshot = await appState.modules.firestore.getDoc(directoryDoc());
  const current = Array.isArray(snapshot.data()?.photographers) ? snapshot.data().photographers : [];
  const normalized = normalizePhotographerProfile(profile);
  const publicProfile = {
    uid,
    displayName: normalized.displayName || "",
    city: normalized.city || "",
    bio: normalized.bio || "",
    headline: normalized.headline || "",
    whatsapp: normalized.whatsapp || "",
    instagram: normalized.instagram || "",
    publicEmail: normalized.publicEmail || "",
    availability: normalized.availability || "",
    categories: normalized.categories,
    coverUrl: normalized.coverUrl || "",
    photos: normalized.photos,
    services: normalized.services,
    page: normalized.page,
    budget: normalized.budget,
    published: Boolean(normalized.published),
  };

  await appState.modules.firestore.setDoc(
    directoryDoc(),
    { photographers: [publicProfile, ...current.filter((item) => item.uid !== uid)], updatedAt: timestamp() },
    { merge: true },
  );
  try {
    await appState.modules.firestore.setDoc(
      publicPhotographerDoc(uid),
      { ...publicProfile, updatedAt: timestamp() },
      { merge: true },
    );
  } catch (error) {
    console.warn("publicPhotographers nao foi atualizado:", error);
  }
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
      ? normalizePhotographerProfile(photographerSnapshot.data(), appState.profile.name || "")
      : {
          ...defaultPhotographerProfile(appState.profile.name || ""),
          createdAt: timestamp(),
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
      ? normalizePhotographerProfile(photographerSnapshot.data(), profile.name || "")
      : {
          ...defaultPhotographerProfile(profile.name),
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

const readPhotoEditors = (form, currentPhotos) => {
  const currentById = new Map(normalizePhotos(currentPhotos).map((photo) => [photo.id, photo]));
  const photos = [...form.querySelectorAll("[data-photo-editor]")].map((editor, index) => {
    const id = cleanText(editor.dataset.photoId, makeId("photo"));
    const current = currentById.get(id) || {};

    return {
      ...current,
      id,
      url: normalizePublicImageUrl(editor.dataset.photoUrl || current.url),
      title: cleanText(editor.querySelector("[data-photo-title]")?.value, "Foto"),
      visible: editor.querySelector("[data-photo-visible]")?.checked !== false,
      featured: Boolean(editor.querySelector("[data-photo-featured]")?.checked),
      order: index,
    };
  }).filter((photo) => photo.url);
  const featuredIndex = photos.findIndex((photo) => photo.featured);
  return photos.map((photo, index) => ({
    ...photo,
    featured: featuredIndex >= 0 ? index === featuredIndex : index === 0,
  }));
};

const readServiceEditors = (form, currentServices) => {
  const currentById = new Map(normalizeStoredServices(currentServices).map((service) => [service.id, service]));
  return [...form.querySelectorAll("[data-service-editor]")].map((editor, index) => {
    const id = cleanText(editor.dataset.serviceId, makeId("service"));
    const current = currentById.get(id) || {};

    return {
      ...current,
      id,
      title: cleanText(editor.querySelector("[data-service-title]")?.value),
      description: cleanText(editor.querySelector("[data-service-description]")?.value),
      imageUrl: normalizePublicImageUrl(editor.querySelector("[data-service-image]")?.value),
      visible: editor.querySelector("[data-service-visible]")?.checked !== false,
      order: index,
    };
  }).filter((service) => service.title);
};

const readSectionOrder = (form, fallbackOrder = DEFAULT_PAGE_SETTINGS.sectionOrder) => {
  const ids = [...form.querySelectorAll("[data-section-editor]")]
    .map((editor) => cleanText(editor.dataset.sectionId))
    .filter((id) => PUBLIC_PAGES.some(([pageId]) => pageId === id));
  return ids.length ? ids : fallbackOrder;
};

const savePhotographerProfile = async (form) => {
  const formData = new FormData(form);
  const currentProfile = normalizePhotographerProfile(appState.profile?.photographer || {}, appState.profile?.name || "");
  const page = normalizePageSettings({
    template: cleanText(formData.get("template"), DEFAULT_PAGE_SETTINGS.template),
    primaryColor: cleanText(formData.get("primaryColor"), DEFAULT_PAGE_SETTINGS.primaryColor),
    showHero: formData.get("showHero") === "on",
    showPortfolio: formData.get("showPortfolio") === "on",
    showServices: formData.get("showServices") === "on",
    showBudget: formData.get("showBudget") === "on",
    showContact: formData.get("showContact") === "on",
    sectionOrder: readSectionOrder(form, currentProfile.page.sectionOrder),
  });
  const nextProfile = {
    ...currentProfile,
    displayName: cleanText(formData.get("displayName")),
    city: cleanText(formData.get("city")),
    bio: cleanText(formData.get("bio")),
    headline: cleanText(formData.get("headline")),
    whatsapp: cleanText(formData.get("whatsapp")),
    instagram: cleanText(formData.get("instagram")),
    publicEmail: cleanText(formData.get("publicEmail")),
    coverUrl: normalizePublicImageUrl(formData.get("coverUrl")),
    availability: cleanText(formData.get("availability")),
    categories: splitList(formData.get("categories")),
    page,
    budget: normalizeBudget({
      ...currentProfile,
      whatsapp: cleanText(formData.get("whatsapp")),
      budget: {
        title: cleanText(formData.get("budgetTitle")),
        text: cleanText(formData.get("budgetText")),
        whatsapp: cleanText(formData.get("budgetWhatsapp")),
        defaultMessage: cleanText(formData.get("budgetDefaultMessage")),
      },
    }),
    services: readServiceEditors(form, currentProfile.services),
    published: formData.get("published") === "on",
    photos: readPhotoEditors(form, currentProfile.photos),
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const addPhoto = async (root) => {
  const titleInput = root.querySelector("[data-new-photo-title]");
  const urlInput = root.querySelector("[data-new-photo-url]");
  const fileInput = root.querySelector("[data-new-photo-file]");
  const file = fileInput?.files?.[0];
  const photoId = makeId("photo");
  const url = normalizePublicImageUrl(urlInput?.value) || (file ? await uploadPhotoFile(file, photoId) : "");
  if (!url) return;

  const current = normalizePhotographerProfile(appState.profile?.photographer || {}, appState.profile?.name || "");
  const photos = normalizePhotos(current.photos);
  const nextProfile = {
    ...current,
    coverUrl: current.coverUrl || url,
    photos: [
      ...photos,
      {
        id: photoId,
        url,
        title: cleanText(titleInput?.value, "Foto"),
        order: photos.length,
        visible: true,
        featured: photos.length === 0,
        createdAt: Date.now(),
      },
    ],
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
  if (titleInput) titleInput.value = "";
  if (urlInput) urlInput.value = "";
  if (fileInput) fileInput.value = "";
};

const removePhoto = async (photoId) => {
  const current = normalizePhotographerProfile(appState.profile?.photographer || {}, appState.profile?.name || "");
  const photos = normalizePhotos(current.photos);
  const removed = photos.find((photo) => photo.id === photoId);
  const nextPhotos = photos.filter((photo) => photo.id !== photoId).map((photo, index) => ({ ...photo, order: index }));
  const coverWasRemoved = removed?.url && current.coverUrl === removed.url;
  const nextProfile = {
    ...current,
    photos: nextPhotos,
    coverUrl: coverWasRemoved ? nextPhotos[0]?.url || "" : current.coverUrl || nextPhotos[0]?.url || "",
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const addService = async (root) => {
  const titleInput = root.querySelector("[data-new-service-title]");
  const descriptionInput = root.querySelector("[data-new-service-description]");
  const title = cleanText(titleInput?.value);
  if (!title) return;

  const current = normalizePhotographerProfile(appState.profile?.photographer || {}, appState.profile?.name || "");
  const services = normalizeStoredServices(current.services);
  const nextProfile = {
    ...current,
    services: [
      ...services,
      {
        id: makeId("service"),
        title,
        description: cleanText(descriptionInput?.value),
        imageUrl: "",
        order: services.length,
        visible: true,
      },
    ],
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
};

const removeService = async (serviceId) => {
  const current = normalizePhotographerProfile(appState.profile?.photographer || {}, appState.profile?.name || "");
  const services = normalizeStoredServices(current.services)
    .filter((service) => service.id !== serviceId)
    .map((service, index) => ({ ...service, order: index }));
  const nextProfile = {
    ...current,
    services,
    updatedAt: timestamp(),
  };

  await appState.modules.firestore.setDoc(photographerDoc(appState.user.uid), nextProfile, { merge: true });
  await saveDirectoryProfile(appState.user.uid, nextProfile);
  appState.profile.photographer = nextProfile;
};

const updateEditorOrderLabels = (container, itemSelector, labelSelector, labelPrefix) => {
  container.querySelectorAll(itemSelector).forEach((item, index) => {
    const label = item.querySelector(labelSelector);
    if (label) label.textContent = `${labelPrefix} ${index + 1}`;
  });
};

const moveEditorItem = (button, itemSelector, direction) => {
  const item = button.closest(itemSelector);
  const container = item?.parentElement;
  if (!item || !container) return false;

  if (direction < 0 && item.previousElementSibling) {
    container.insertBefore(item, item.previousElementSibling);
  } else if (direction > 0 && item.nextElementSibling) {
    container.insertBefore(item.nextElementSibling, item);
  } else {
    return false;
  }

  updateEditorOrderLabels(container, "[data-photo-editor]", "[data-photo-position]", "Posicao");
  updateEditorOrderLabels(container, "[data-service-editor]", "[data-service-position]", "Servico");
  updateEditorOrderLabels(container, "[data-section-editor]", "[data-section-position]", "Secao");
  return true;
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

  launcher.hidden = false;
  refreshAccountLabels();
  const openAccount = () => {
    shell.classList.add("is-open");
    shell.querySelector("input, button, textarea")?.focus();
  };
  launcher.addEventListener("click", openAccount);

  if (!document.body.dataset.accountOpenBound) {
    document.body.dataset.accountOpenBound = "true";
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open-account]");
      if (!opener) return;
      event.preventDefault();
      openAccount();
    });
  }

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
        <button class="account-link" type="button" data-password-reset>Esqueci minha senha</button>
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

const renderLegacyDashboard = (root, message = "") => {
  const profile = appState.profile || {};
  const photographer = profile.photographer || {};
  const photos = Array.isArray(photographer.photos) ? photographer.photos : [];
  const isPublished = Boolean(photographer.published);
  const profileUrl = publicProfileUrl(profile.uid || appState.user?.uid || "");
  const missingItems = [
    !cleanText(photographer.displayName || profile.name) && "nome público",
    !cleanText(photographer.city) && "cidade",
    !cleanText(photographer.bio) && "bio",
    !cleanText(photographer.whatsapp) && "WhatsApp",
    !photos.length && "fotos",
  ].filter(Boolean);
  const readinessMessage = missingItems.length
    ? `Faltam: ${missingItems.join(", ")}.`
    : "Seu perfil já tem as informações principais para ser compartilhado.";

  root.innerHTML = `
    <div class="account-panel">
      <div class="account-hero-panel">
        <div>
          <span class="status-badge ${isPublished ? "is-published" : "is-hidden"}">${isPublished ? "Publicado" : "Oculto"}</span>
          <h2>Sua página de portfólio</h2>
          <p>${isPublished ? "Seu perfil está visível para visitantes na página de portfólios." : "Preencha os dados principais, marque a publicação e salve para liberar sua página."}</p>
          <small>${escapeHtml(readinessMessage)}</small>
        </div>
        <div class="account-actions">
          ${isPublished ? `<a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">Ver minha página pública</a>` : `<button type="button" disabled>Ver minha página pública</button>`}
          <button type="button" data-copy-profile-url>Copiar link do portfólio</button>
        </div>
      </div>

      <form class="account-editor" data-photographer-form>
        <section class="account-section">
          <div class="account-section-head">
            <span>Perfil</span>
            <h3>Dados públicos</h3>
            <p>Essas informações aparecem na sua página e nos cards da vitrine.</p>
          </div>
          <div class="account-fields">
            <label>Nome público<input name="displayName" value="${escapeHtml(photographer.displayName || profile.name || "")}" required /></label>
            <label>Cidade<input name="city" value="${escapeHtml(photographer.city || "")}" placeholder="Manaus - AM" /></label>
            <label class="wide">Frase de destaque<input name="headline" value="${escapeHtml(photographer.headline || "")}" placeholder="Fotografia leve para contar historias reais" /></label>
            <label class="wide">Bio<textarea name="bio" rows="4" placeholder="Fale sobre seu estilo, atendimento e tipos de ensaio">${escapeHtml(photographer.bio || "")}</textarea></label>
            <label>WhatsApp<input name="whatsapp" value="${escapeHtml(photographer.whatsapp || "")}" placeholder="5592999999999" /></label>
            <label>Instagram<input name="instagram" value="${escapeHtml(photographer.instagram || "")}" placeholder="@seuperfil ou https://instagram.com/seuperfil" /></label>
            <label>Email público<input name="publicEmail" type="email" value="${escapeHtml(photographer.publicEmail || "")}" placeholder="contato@seudominio.com" /></label>
            <label>Categorias<input name="categories" value="${escapeHtml((photographer.categories || []).join(", "))}" placeholder="Casamento, gestante, eventos" /></label>
            <label class="wide">Foto de capa por URL<input name="coverUrl" value="${escapeHtml(photographer.coverUrl || "")}" placeholder="https://..." /></label>
          </div>
        </section>

        <section class="account-section publish-section">
          <div class="account-section-head">
            <span>Publicação</span>
            <h3>Controle de visibilidade</h3>
            <p>Quando publicado, seu perfil aparece na home e seu link público pode ser compartilhado.</p>
          </div>
          <div class="publish-box">
            <label class="account-check"><input name="published" type="checkbox" ${photographer.published ? "checked" : ""} /> Publicar meu portfólio</label>
            <button type="submit">Salvar perfil</button>
          </div>
        </section>
      </form>

      <section class="account-section">
        <div class="account-section-head">
          <span>Fotos</span>
          <h3>Galeria do portfólio</h3>
          <p>Por enquanto as imagens entram por URL. Depois podemos trocar por upload direto.</p>
        </div>
        <form class="account-form compact account-photo-form" data-photo-form>
          <label>Título<input name="photoTitle" placeholder="Ensaio externo" /></label>
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
      </section>

      <div class="account-footer-actions">
        <button type="button" data-account-logout>Sair da conta</button>
      </div>
      <p class="admin-message" data-account-message>${escapeHtml(message)}</p>
    </div>
  `;
};

const activeAccountTab = () => EDITOR_TABS.some(([id]) => id === appState.accountTab) ? appState.accountTab : "inicio";

const accountTabPanelClass = (tab) => `account-section account-tab-panel${activeAccountTab() === tab ? " is-active" : ""}`;

const accountTabButton = ([id, label]) => `
  <button class="${activeAccountTab() === id ? "is-active" : ""}" type="button" data-account-tab="${id}" aria-selected="${activeAccountTab() === id ? "true" : "false"}">${label}</button>
`;

const photoEditorMarkup = (photo, index) => `
  <article data-photo-editor data-photo-id="${escapeHtml(photo.id)}" data-photo-url="${escapeHtml(photo.url)}">
    <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || "Foto")}" loading="lazy" />
    <label>Titulo<input value="${escapeHtml(photo.title || "")}" data-photo-title /></label>
    <label class="account-check"><input type="checkbox" data-photo-visible ${photo.visible !== false ? "checked" : ""} /> Visivel na pagina</label>
    <label class="account-check"><input type="checkbox" data-photo-featured ${photo.featured ? "checked" : ""} /> Foto de destaque</label>
    <span data-photo-position>Posicao ${index + 1}</span>
    <div class="item-order-actions">
      <button type="button" data-move-photo="-1">Subir</button>
      <button type="button" data-move-photo="1">Descer</button>
      <button type="button" data-remove-photo="${escapeHtml(photo.id)}">Remover</button>
    </div>
  </article>
`;

const serviceEditorMarkup = (service, index) => `
  <article data-service-editor data-service-id="${escapeHtml(service.id)}">
    <span data-service-position>Servico ${index + 1}</span>
    <label>Titulo<input value="${escapeHtml(service.title || "")}" data-service-title /></label>
    <label>Descricao<textarea rows="3" data-service-description>${escapeHtml(service.description || "")}</textarea></label>
    <label>Imagem opcional por URL<input value="${escapeHtml(service.imageUrl || "")}" data-service-image placeholder="https://..." /></label>
    <label class="account-check"><input type="checkbox" data-service-visible ${service.visible !== false ? "checked" : ""} /> Visivel na pagina</label>
    <div class="item-order-actions">
      <button type="button" data-move-service="-1">Subir</button>
      <button type="button" data-move-service="1">Descer</button>
      <button type="button" data-remove-service="${escapeHtml(service.id)}">Remover</button>
    </div>
  </article>
`;

const sectionEditorMarkup = ([id, label], index) => `
  <article data-section-editor data-section-id="${escapeHtml(id)}">
    <span data-section-position>Secao ${index + 1}</span>
    <strong>${escapeHtml(label)}</strong>
    <div class="item-order-actions">
      <button type="button" data-move-section="-1">Subir</button>
      <button type="button" data-move-section="1">Descer</button>
    </div>
  </article>
`;

const formatLeadDate = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const leadCardMarkup = (lead) => {
  const whatsapp = whatsappUrl(lead.clientWhatsapp);
  return `
    <article class="lead-card">
      <span>${escapeHtml(formatLeadDate(lead.createdAt))}</span>
      <h4>${escapeHtml(lead.clientName || "Cliente sem nome")}</h4>
      <p>${escapeHtml(lead.service || "Pedido de orcamento")}</p>
      ${lead.message ? `<blockquote>${escapeHtml(lead.message)}</blockquote>` : ""}
      <div class="lead-card-actions">
        ${lead.clientWhatsapp ? `<small>${escapeHtml(lead.clientWhatsapp)}</small>` : ""}
        ${lead.clientEmail ? `<small>${escapeHtml(lead.clientEmail)}</small>` : ""}
        ${whatsapp ? `<a href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>` : ""}
      </div>
    </article>
  `;
};

const accountPreviewMarkup = (photographer, profileUrl, readinessMessage) => {
  const page = normalizePageSettings(photographer.page);
  const photos = visibleProfilePhotos(photographer);
  const services = serviceListForDisplay(photographer).filter((service) => service.visible !== false);
  const coverUrl = photographer.coverUrl || photos[0]?.url || "assets/marilopes/empresarial.jpg";
  const visibleSections = PUBLIC_PAGES
    .filter(([, , visibilityKey]) => page[visibilityKey] !== false)
    .map(([, label]) => label);

  return `
    <aside class="account-preview" style="--line: ${escapeHtml(page.primaryColor)}; --sage-dark: ${escapeHtml(page.primaryColor)}">
      <span>Previa salva</span>
      <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(photographer.displayName || "Capa do portfolio")}" loading="lazy" />
      <strong>${escapeHtml(photographer.displayName || "Seu nome publico")}</strong>
      <p>${escapeHtml(photographer.headline || photographer.bio || readinessMessage)}</p>
      <div class="account-preview-meta">
        ${photographer.city ? `<small>${escapeHtml(photographer.city)}</small>` : ""}
        <small>${photos.length} foto${photos.length === 1 ? "" : "s"} visiveis</small>
        <small>${services.length} servico${services.length === 1 ? "" : "s"}</small>
      </div>
      <div class="account-preview-sections">
        ${visibleSections.map((section) => `<span>${escapeHtml(section)}</span>`).join("")}
      </div>
      <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">Abrir preview publico</a>
    </aside>
  `;
};

const renderDashboard = (root, message = "") => {
  const profile = appState.profile || {};
  const photographer = normalizePhotographerProfile(profile.photographer || {}, profile.name || "");
  if (!appState.profile) appState.profile = profile;
  appState.profile.photographer = photographer;

  const photos = normalizePhotos(photographer.photos);
  const services = normalizeStoredServices(photographer.services);
  const page = normalizePageSettings(photographer.page);
  const budget = normalizeBudget(photographer);
  const orderedSections = publicPagesInOrder({ ...page, showHero: true, showPortfolio: true, showServices: true, showBudget: true, showContact: true });
  const leads = appState.leads || [];
  const isPublished = Boolean(photographer.published);
  const profileUrl = publicProfileUrl(profile.uid || appState.user?.uid || "");
  const missingItems = [
    !cleanText(photographer.displayName || profile.name) && "nome publico",
    !cleanText(photographer.city) && "cidade",
    !cleanText(photographer.bio) && "bio",
    !cleanText(photographer.whatsapp) && "WhatsApp",
    !photos.length && "fotos",
  ].filter(Boolean);
  const readinessMessage = missingItems.length
    ? `Faltam: ${missingItems.join(", ")}.`
    : "Sua pagina ja tem as informacoes principais para ser compartilhada.";

  root.innerHTML = `
    <div class="account-panel account-editor-panel">
      <div class="account-hero-panel">
        <div>
          <span class="status-badge ${isPublished ? "is-published" : "is-hidden"}">${isPublished ? "Publicado" : "Oculto"}</span>
          <h2>Minha pagina</h2>
          <p>${isPublished ? "Seu perfil esta visivel para visitantes na pagina de fotografos." : "Edite os blocos, salve como rascunho e publique quando estiver pronto."}</p>
          <small>${escapeHtml(readinessMessage)}</small>
        </div>
        <div class="account-actions">
          ${isPublished ? `<a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">Ver pagina publica</a>` : `<button type="button" disabled>Ver pagina publica</button>`}
          <button type="button" data-copy-profile-url>Copiar link</button>
          <button type="button" data-publish-now>Publicar alteracoes</button>
        </div>
      </div>

      <div class="account-editor-layout">
        <aside class="account-sidebar">
          <nav class="account-tabs" aria-label="Blocos do editor">
            ${EDITOR_TABS.map(accountTabButton).join("")}
          </nav>
          ${accountPreviewMarkup(photographer, profileUrl, readinessMessage)}
        </aside>

        <form class="account-editor" data-photographer-form>
          <section class="${accountTabPanelClass("inicio")}" data-account-tab-panel="inicio">
            <div class="account-section-head">
              <span>Inicio / Hero</span>
              <h3>Apresentacao da pagina</h3>
              <p>Dados principais exibidos no topo da pagina publica e na vitrine.</p>
            </div>
            <div class="account-fields">
              <label>Nome publico<input name="displayName" value="${escapeHtml(photographer.displayName || profile.name || "")}" required /></label>
              <label>Cidade<input name="city" value="${escapeHtml(photographer.city || "")}" placeholder="Manaus - AM" /></label>
              <label class="wide">Frase de destaque<input name="headline" value="${escapeHtml(photographer.headline || "")}" placeholder="Fotografia leve para contar historias reais" /></label>
              <label class="wide">Bio<textarea name="bio" rows="4" placeholder="Fale sobre seu estilo, atendimento e tipos de ensaio">${escapeHtml(photographer.bio || "")}</textarea></label>
              <label class="wide">Foto de capa por URL<input name="coverUrl" value="${escapeHtml(photographer.coverUrl || "")}" placeholder="https://..." /></label>
            </div>
          </section>

          <section class="${accountTabPanelClass("portfolio")}" data-account-tab-panel="portfolio">
            <div class="account-section-head">
              <span>Portfolio</span>
              <h3>Fotos publicadas</h3>
              <p>Adicione imagens por URL, ajuste titulos e escolha quais aparecem no site.</p>
            </div>
            <div class="account-inline-form">
              <label>Titulo da nova foto<input data-new-photo-title placeholder="Ensaio externo" /></label>
              <label>URL da imagem<input data-new-photo-url placeholder="https://..." /></label>
              <label>Upload de imagem<input data-new-photo-file type="file" accept="image/jpeg,image/png,image/webp" /></label>
              <button type="button" data-add-photo>Adicionar foto</button>
            </div>
            <div class="photo-manager">
              ${photos.map(photoEditorMarkup).join("") || `<p class="mock-empty">Adicione links de fotos para montar seu portfolio.</p>`}
            </div>
          </section>

          <section class="${accountTabPanelClass("servicos")}" data-account-tab-panel="servicos">
            <div class="account-section-head">
              <span>Projetos / Servicos</span>
              <h3>Servicos dinamicos</h3>
              <p>Cadastre os tipos de trabalho que clientes podem contratar.</p>
            </div>
            <div class="account-fields">
              <label class="wide">Categorias rapidas<input name="categories" value="${escapeHtml((photographer.categories || []).join(", "))}" placeholder="Casamento, gestante, eventos" /></label>
            </div>
            <div class="account-inline-form">
              <label>Novo servico<input data-new-service-title placeholder="Ensaio gestante" /></label>
              <label>Descricao curta<input data-new-service-description placeholder="Direcao leve, externa ou estudio" /></label>
              <button type="button" data-add-service>Adicionar servico</button>
            </div>
            <div class="service-manager">
              ${services.map(serviceEditorMarkup).join("") || `<p class="mock-empty">Crie servicos para substituir as categorias genericas na pagina publica.</p>`}
            </div>
          </section>

          <section class="${accountTabPanelClass("orcamento")}" data-account-tab-panel="orcamento">
            <div class="account-section-head">
              <span>Orcamento</span>
              <h3>Chamada e WhatsApp</h3>
              <p>Texto e numero usados na pagina de pedido de proposta.</p>
            </div>
            <div class="account-fields">
              <label>Titulo<input name="budgetTitle" value="${escapeHtml(budget.title)}" /></label>
              <label>WhatsApp do orcamento<input name="budgetWhatsapp" value="${escapeHtml(budget.whatsapp)}" placeholder="5592999999999" /></label>
              <label class="wide">Texto de chamada<textarea name="budgetText" rows="3">${escapeHtml(budget.text)}</textarea></label>
              <label class="wide">Mensagem padrao do WhatsApp<textarea name="budgetDefaultMessage" rows="3">${escapeHtml(budget.defaultMessage)}</textarea></label>
            </div>
          </section>

          <section class="${accountTabPanelClass("contato")}" data-account-tab-panel="contato">
            <div class="account-section-head">
              <span>Contato</span>
              <h3>Canais publicos</h3>
              <p>Essas informacoes aparecem na pagina de contato e nos botoes principais.</p>
            </div>
            <div class="account-fields">
              <label>WhatsApp<input name="whatsapp" value="${escapeHtml(photographer.whatsapp || "")}" placeholder="5592999999999" /></label>
              <label>Instagram<input name="instagram" value="${escapeHtml(photographer.instagram || "")}" placeholder="@seuperfil ou https://instagram.com/seuperfil" /></label>
              <label>Email publico<input name="publicEmail" type="email" value="${escapeHtml(photographer.publicEmail || "")}" placeholder="contato@seudominio.com" /></label>
              <label class="wide">Disponibilidade<textarea name="availability" rows="3" placeholder="Atendo em Manaus e regiao com agenda sob consulta">${escapeHtml(photographer.availability || "")}</textarea></label>
            </div>
          </section>

          <section class="${accountTabPanelClass("inbox")}" data-account-tab-panel="inbox">
            <div class="account-section-head">
              <span>Caixa</span>
              <h3>Pedidos recebidos</h3>
              <p>Pedidos enviados pelo formulario publico aparecem aqui quando as regras do Firestore permitem leitura.</p>
            </div>
            <div class="lead-list">
              ${leads.length ? leads.map(leadCardMarkup).join("") : `<p class="mock-empty">Nenhum pedido recebido ainda.</p>`}
            </div>
          </section>

          <section class="${accountTabPanelClass("aparencia")}" data-account-tab-panel="aparencia">
            <div class="account-section-head">
              <span>Aparencia</span>
              <h3>Estilo visual</h3>
              <p>Controle simples de template e cor principal sem liberar edicao livre do layout.</p>
            </div>
            <div class="account-fields">
              <label>Template
                <select name="template">
                  <option value="classico" ${page.template === "classico" ? "selected" : ""}>Classico</option>
                  <option value="editorial" ${page.template === "editorial" ? "selected" : ""}>Editorial</option>
                  <option value="minimal" ${page.template === "minimal" ? "selected" : ""}>Minimal</option>
                </select>
              </label>
              <label>Cor principal<input name="primaryColor" type="color" value="${escapeHtml(page.primaryColor)}" /></label>
            </div>
          </section>

          <section class="${accountTabPanelClass("publicacao")}" data-account-tab-panel="publicacao">
            <div class="account-section-head">
              <span>Publicacao</span>
              <h3>Visibilidade da pagina</h3>
              <p>Escolha se o portfolio aparece na vitrine e quais secoes ficam ativas.</p>
            </div>
            <div class="account-toggle-grid">
              <label class="account-check"><input name="published" type="checkbox" ${isPublished ? "checked" : ""} /> Publicar meu portfolio</label>
              <label class="account-check"><input name="showHero" type="checkbox" ${page.showHero ? "checked" : ""} /> Mostrar Inicio</label>
              <label class="account-check"><input name="showPortfolio" type="checkbox" ${page.showPortfolio ? "checked" : ""} /> Mostrar Portfolio</label>
              <label class="account-check"><input name="showServices" type="checkbox" ${page.showServices ? "checked" : ""} /> Mostrar Servicos</label>
              <label class="account-check"><input name="showBudget" type="checkbox" ${page.showBudget ? "checked" : ""} /> Mostrar Orcamento</label>
              <label class="account-check"><input name="showContact" type="checkbox" ${page.showContact ? "checked" : ""} /> Mostrar Contato</label>
            </div>
            <div class="section-order-manager">
              ${orderedSections.map(sectionEditorMarkup).join("")}
            </div>
          </section>

          <div class="account-editor-actions">
            <button type="submit">Salvar rascunho</button>
            <button type="button" data-publish-now>Publicar alteracoes</button>
          </div>
        </form>
      </div>

      <div class="account-footer-actions">
        <button type="button" data-account-logout>Sair da conta</button>
      </div>
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
    refreshAccountLabels();

    if (!user) {
      appState.profile = null;
      stopWatchingLeads();
      renderAuthForms(root);
      return;
    }

    try {
      await readOwnProfile(user);
      watchOwnLeads(user.uid, root);
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
    const activeForm = loginForm || registerForm || photographerForm;
    setAccountMessage(root, "");

    try {
      if (loginForm) {
        accountSubmitInProgress = true;
        setFormBusy(loginForm, true, "Entrando...");
        const formData = new FormData(loginForm);
        const credential = await appState.modules.auth.signInWithEmailAndPassword(appState.auth, emailForAuth(formData.get("email")), String(formData.get("password") || ""));
        appState.user = credential.user;
        refreshAccountLabels();
        await readOwnProfile(credential.user);
        watchOwnLeads(credential.user.uid, root);
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
        refreshAccountLabels();
        await appState.modules.firestore.setDoc(userDoc(credential.user.uid), profile);

        if (profile.role === DEFAULT_ACCOUNT_ROLE) {
          const photographerProfile = {
            ...defaultPhotographerProfile(profile.name),
            createdAt: timestamp(),
          };
          await appState.modules.firestore.setDoc(photographerDoc(credential.user.uid), photographerProfile);
          profile.photographer = photographerProfile;
        }

        appState.profile = profile;
        watchOwnLeads(credential.user.uid, root);
        renderDashboard(root, "Cadastro criado.");
        shell.classList.add("is-open");
        registerForm.reset();
      }

      if (photographerForm) {
        setFormBusy(photographerForm, true, "Salvando...");
        await savePhotographerProfile(photographerForm);
        renderDashboard(root, "Perfil salvo.");
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
    const passwordReset = event.target.closest("[data-password-reset]");
    const copyProfile = event.target.closest("[data-copy-profile-url]");
    const logout = event.target.closest("[data-account-logout]");
    const remove = event.target.closest("[data-remove-photo]");
    const removeServiceButton = event.target.closest("[data-remove-service]");
    const tabButton = event.target.closest("[data-account-tab]");
    const publishNow = event.target.closest("[data-publish-now]");
    const addPhotoButton = event.target.closest("[data-add-photo]");
    const addServiceButton = event.target.closest("[data-add-service]");
    const movePhotoButton = event.target.closest("[data-move-photo]");
    const moveServiceButton = event.target.closest("[data-move-service]");
    const moveSectionButton = event.target.closest("[data-move-section]");

    if (tabButton) {
      appState.accountTab = tabButton.dataset.accountTab || "inicio";
      renderDashboard(root);
      return;
    }

    if (publishNow) {
      const form = root.querySelector("[data-photographer-form]");
      const published = form?.querySelector('input[name="published"]');
      if (published) published.checked = true;
      form?.requestSubmit();
      return;
    }

    if (movePhotoButton) {
      if (moveEditorItem(movePhotoButton, "[data-photo-editor]", Number(movePhotoButton.dataset.movePhoto))) {
        setAccountMessage(root, "Ordem das fotos alterada. Salve o rascunho para publicar a mudanca.");
      }
      return;
    }

    if (moveServiceButton) {
      if (moveEditorItem(moveServiceButton, "[data-service-editor]", Number(moveServiceButton.dataset.moveService))) {
        setAccountMessage(root, "Ordem dos servicos alterada. Salve o rascunho para publicar a mudanca.");
      }
      return;
    }

    if (moveSectionButton) {
      if (moveEditorItem(moveSectionButton, "[data-section-editor]", Number(moveSectionButton.dataset.moveSection))) {
        setAccountMessage(root, "Ordem das secoes alterada. Salve o rascunho para publicar a mudanca.");
      }
      return;
    }

    if (copyProfile) {
      try {
        const url = publicProfileUrl(appState.user.uid);
        await copyText(url);
        setAccountMessage(
          root,
          appState.profile?.photographer?.published
            ? "Link do portfólio copiado."
            : "Link copiado. Marque Publicar meu portfólio e salve para ele aparecer aos visitantes.",
        );
      } catch (error) {
        setAccountMessage(root, "Nao foi possivel copiar o link. Copie direto pela barra do navegador ao abrir a pagina.");
      }
    }

    if (passwordReset) {
      const defaultText = passwordReset.textContent;
      passwordReset.disabled = true;
      passwordReset.textContent = "Enviando...";
      setAccountMessage(root, "");

      try {
        const loginForm = root.querySelector("[data-login-form]");
        const email = emailForAuth(new FormData(loginForm).get("email"));
        await appState.modules.auth.sendPasswordResetEmail(appState.auth, email);
        setAccountMessage(root, `Enviamos um link de redefinição para ${email}.`);
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      } finally {
        passwordReset.disabled = false;
        passwordReset.textContent = defaultText;
      }
    }

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
        refreshAccountLabels();
        await readOrCreateProfile(credential.user);
        watchOwnLeads(credential.user.uid, root);
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
      appState.user = null;
      stopWatchingLeads();
      refreshAccountLabels();
      shell.classList.remove("is-open");
    }

    if (addPhotoButton) {
      const url = cleanText(root.querySelector("[data-new-photo-url]")?.value);
      const file = root.querySelector("[data-new-photo-file]")?.files?.[0];
      if (!url && !file) {
        setAccountMessage(root, "Informe a URL ou escolha um arquivo de imagem antes de adicionar.");
        return;
      }

      try {
        setButtonBusy(addPhotoButton, true, "Adicionando...");
        await addPhoto(root);
        renderDashboard(root, "Foto adicionada.");
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      } finally {
        setButtonBusy(addPhotoButton, false);
      }
    }

    if (addServiceButton) {
      const title = cleanText(root.querySelector("[data-new-service-title]")?.value);
      if (!title) {
        setAccountMessage(root, "Informe o titulo do servico antes de adicionar.");
        return;
      }

      try {
        setButtonBusy(addServiceButton, true, "Adicionando...");
        await addService(root);
        renderDashboard(root, "Servico adicionado.");
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      } finally {
        setButtonBusy(addServiceButton, false);
      }
    }

    if (remove) {
      try {
        setButtonBusy(remove, true, "Removendo...");
        await removePhoto(remove.dataset.removePhoto);
        renderDashboard(root, "Foto removida.");
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      }
    }

    if (removeServiceButton) {
      try {
        setButtonBusy(removeServiceButton, true, "Removendo...");
        await removeService(removeServiceButton.dataset.removeService);
        renderDashboard(root, "Servico removido.");
      } catch (error) {
        setAccountMessage(root, authErrorMessage(error));
      }
    }
  });
};

renderLayout();
initializeMenus();
initializeDirectoryControls();
initializeLightbox();
renderDefaultPortfolio();
renderCategoryPages();
initializeBudgetForm();
await connectFirebase();
watchPhotographers();
initializeAccount();
