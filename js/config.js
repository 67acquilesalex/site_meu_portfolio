export const contact = {
  brand: "Portfólios Fotográficos",
  tagline: "Páginas profissionais para fotógrafos",
  logo: "",
  email: "contato@portfoliofotografico.com",
  location: "Brasil",
  whatsapp: "5592999999999",
};

export const albums = [
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

export const DEFAULT_ACCOUNT_ROLE = "fotografo";

export const DEFAULT_PAGE_SETTINGS = {
  template: "classico",
  primaryColor: "#68745f",
  showHero: true,
  showPortfolio: true,
  showServices: true,
  showBudget: true,
  showContact: true,
  sectionOrder: ["inicio", "portfolio", "projetos", "orcamento", "contato"],
};

export const EDITOR_TABS = [
  ["inicio", "Inicio"],
  ["portfolio", "Portfolio"],
  ["servicos", "Servicos"],
  ["orcamento", "Orcamento"],
  ["contato", "Contato"],
  ["aparencia", "Aparencia"],
  ["publicacao", "Publicacao"],
];

export const PUBLIC_PAGES = [
  ["inicio", "Inicio", "showHero"],
  ["portfolio", "Portfolio", "showPortfolio"],
  ["projetos", "Projetos", "showServices"],
  ["orcamento", "Orcamento", "showBudget"],
  ["contato", "Contato", "showContact"],
];
