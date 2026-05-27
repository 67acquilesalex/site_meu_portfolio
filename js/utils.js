export const currentSlug = () => location.pathname.split("/").pop().replace(".html", "") || "index";

export const cleanText = (value, fallback = "") => String(value || fallback).trim();

export const normalizeEmail = (value) => {
  let email = cleanText(value)
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
  if (email.startsWith("mailto:")) email = email.slice(7);
  if (email && !email.includes("@")) email = `${email}@gmail.com`;
  if (email.endsWith("@gmail")) email = `${email}.com`;
  return email;
};

export const emailForAuth = (value) => {
  const email = normalizeEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { code: "local/invalid-email" };
  }
  return email;
};

export const splitList = (value) => cleanText(value).split(",").map((item) => item.trim()).filter(Boolean);

export const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

export const normalizeHexColor = (value, fallback = "#68745f") => {
  const color = cleanText(value, fallback);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
};

export const makeId = (prefix) => {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
};
