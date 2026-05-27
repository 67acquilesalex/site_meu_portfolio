import { DEFAULT_PAGE_SETTINGS, PUBLIC_PAGES } from "./config.js";
import { cleanText, normalizeHexColor } from "./utils.js";

export const normalizePageSettings = (page = {}) => {
  const current = page || {};
  const sectionOrder = Array.isArray(current.sectionOrder) && current.sectionOrder.length
    ? current.sectionOrder.filter((section) => PUBLIC_PAGES.some(([id]) => id === section))
    : DEFAULT_PAGE_SETTINGS.sectionOrder;

  return {
    ...DEFAULT_PAGE_SETTINGS,
    ...current,
    template: ["classico", "editorial", "minimal"].includes(current.template) ? current.template : DEFAULT_PAGE_SETTINGS.template,
    primaryColor: normalizeHexColor(current.primaryColor, DEFAULT_PAGE_SETTINGS.primaryColor),
    showHero: current.showHero !== false,
    showPortfolio: current.showPortfolio !== false,
    showServices: current.showServices !== false,
    showBudget: current.showBudget !== false,
    showContact: current.showContact !== false,
    sectionOrder,
  };
};

export const normalizePhotos = (photos = []) => (Array.isArray(photos) ? photos : [])
  .map((photo, index) => {
    const url = typeof photo === "string" ? photo : photo?.url;
    const title = typeof photo === "string" ? "Foto" : photo?.title;

    return {
      ...(typeof photo === "object" && photo ? photo : {}),
      id: cleanText(photo?.id, `photo-${index}`),
      url: cleanText(url),
      title: cleanText(title, "Foto"),
      order: Number.isFinite(Number(photo?.order)) ? Number(photo.order) : index,
      visible: photo?.visible !== false,
      featured: Boolean(photo?.featured),
      createdAt: photo?.createdAt || Date.now(),
    };
  })
  .filter((photo) => photo.url)
  .sort((first, second) => first.order - second.order);

export const normalizeStoredServices = (services = []) => (Array.isArray(services) ? services : [])
  .map((service, index) => {
    const rawTitle = typeof service === "string" ? service : service?.title;

    return {
      ...(typeof service === "object" && service ? service : {}),
      id: cleanText(service?.id, `service-${index}`),
      title: cleanText(rawTitle),
      description: cleanText(service?.description),
      imageUrl: cleanText(service?.imageUrl),
      order: Number.isFinite(Number(service?.order)) ? Number(service.order) : index,
      visible: service?.visible !== false,
    };
  })
  .filter((service) => service.title)
  .sort((first, second) => first.order - second.order);

export const serviceListForDisplay = (photographer = {}) => {
  const services = normalizeStoredServices(photographer.services);
  if (services.length) return services;

  const categories = Array.isArray(photographer.categories) ? photographer.categories.filter(Boolean) : [];
  return categories.map((category, index) => ({
    id: `category-${index}`,
    title: category,
    description: "Projeto fotografico com direcao, cuidado visual e entrega em pagina de portfolio.",
    imageUrl: "",
    order: index,
    visible: true,
  }));
};

export const normalizeBudget = (photographer = {}) => {
  const budget = photographer.budget || {};
  return {
    title: cleanText(budget.title, "Solicite uma proposta"),
    text: cleanText(budget.text, "Envie uma mensagem direta com as informacoes principais do projeto."),
    whatsapp: cleanText(budget.whatsapp, photographer.whatsapp || ""),
    defaultMessage: cleanText(budget.defaultMessage, "Ola! Gostaria de solicitar um orcamento fotografico."),
  };
};

export const defaultPhotographerProfile = (displayName = "") => ({
  displayName,
  city: "",
  bio: "",
  headline: "",
  whatsapp: "",
  instagram: "",
  publicEmail: "",
  coverUrl: "",
  availability: "",
  categories: [],
  photos: [],
  services: [],
  page: { ...DEFAULT_PAGE_SETTINGS },
  budget: normalizeBudget({}),
  published: false,
});

export const normalizePhotographerProfile = (profile = {}, fallbackName = "") => {
  const current = profile || {};
  return {
    ...current,
    displayName: cleanText(current.displayName, fallbackName),
    city: cleanText(current.city),
    bio: cleanText(current.bio),
    headline: cleanText(current.headline),
    whatsapp: cleanText(current.whatsapp),
    instagram: cleanText(current.instagram),
    publicEmail: cleanText(current.publicEmail),
    coverUrl: cleanText(current.coverUrl),
    availability: cleanText(current.availability),
    categories: Array.isArray(current.categories) ? current.categories.map((item) => cleanText(item)).filter(Boolean) : [],
    photos: normalizePhotos(current.photos),
    services: normalizeStoredServices(current.services),
    page: normalizePageSettings(current.page),
    budget: normalizeBudget(current),
    published: Boolean(current.published),
  };
};

export const visibleProfilePhotos = (photographer = {}) => normalizePhotos(photographer.photos).filter((photo) => photo.visible !== false);
