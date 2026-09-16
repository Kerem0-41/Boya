import { API_URL } from "./config.js";

export const API = (API_URL || "").replace(/\/+$/, "");

export const fileUrl = (key) => (key ? `${API}/files/${key}` : "");

/** Güvenli DOM oluşturucu: metinler her zaman textContent olarak eklenir. */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "value" || k === "checked" || k === "selected") el[k] = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

const ICONS = {
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chat: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3z"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  upload: '<path d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  can: '<path d="M5 6c0-1.1 3.1-2 7-2s7 .9 7 2v12c0 1.1-3.1 2-7 2s-7-.9-7-2z"/><path d="M5 6c0 1.1 3.1 2 7 2s7-.9 7-2M5 10c0 1.1 3.1 2 7 2s7-.9 7-2"/>',
  machine: '<rect x="4" y="6" width="12" height="9" rx="1.5"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="14" cy="18.5" r="1.8"/><path d="M16 9h3v9M8 6V3h4"/>',
};

export function icon(name, cls = "ikon") {
  const t = document.createElement("template");
  t.innerHTML = `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
  return t.content.firstElementChild;
}

// Fotoğrafı olmayan ürünler için çizim (boya tenekesi / boya makinesi)
const CAN_COLORS = ["#F9A800", "#C1121C", "#0E518D", "#114232", "#CBD0CC", "#E6D2B5", "#383E42"];

export function placeholderArt(type, seed = "") {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const band = CAN_COLORS[hash % CAN_COLORS.length];
  const svg =
    type === "makine"
      ? `<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="34" y="56" width="70" height="52" rx="6" fill="#4A5156"/><rect x="42" y="64" width="30" height="14" rx="2" fill="#F9A800"/><circle cx="92" cy="71" r="6" fill="#2B3033"/><rect x="104" y="44" width="8" height="78" rx="3" fill="#2B3033"/><rect x="98" y="38" width="30" height="8" rx="4" fill="#2B3033"/><circle cx="50" cy="118" r="11" fill="#2B3033"/><circle cx="50" cy="118" r="4" fill="#CBD0CC"/><circle cx="96" cy="118" r="11" fill="#2B3033"/><circle cx="96" cy="118" r="4" fill="#CBD0CC"/><path d="M34 92c-18 0-22 16-10 22s28 2 22 18" fill="none" stroke="#2B3033" stroke-width="4" stroke-linecap="round"/></svg>`
      : `<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M52 44c0-12 56-12 56 0" fill="none" stroke="#5C6469" stroke-width="4"/><ellipse cx="80" cy="50" rx="40" ry="10" fill="#9AA2A6"/><path d="M40 50v66c0 5.5 17.9 10 40 10s40-4.5 40-10V50c0 5.5-17.9 10-40 10s-40-4.5-40-10z" fill="#C4C9CC"/><path d="M40 70c0 5.5 17.9 10 40 10s40-4.5 40-10v30c0 5.5-17.9 10-40 10s-40-4.5-40-10z" fill="${band}"/><ellipse cx="80" cy="50" rx="31" ry="6.5" fill="#B5BBBE"/></svg>`;
  const t = document.createElement("template");
  t.innerHTML = svg;
  return t.content.firstElementChild;
}

/** YouTube / Instagram bağlantısını gömülebilir adrese çevirir. */
export function parseVideoLink(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host.endsWith("youtube.com")) {
    id = url.searchParams.get("v") || (url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/) || [])[1] || null;
  }
  if (id && /^[\w-]{6,}$/.test(id)) {
    return {
      service: "youtube",
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  if (host === "instagram.com") {
    const m = url.pathname.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
    if (m) {
      const kind = m[1] === "reels" ? "reel" : m[1];
      return { service: "instagram", embed: `https://www.instagram.com/${kind}/${m[2]}/embed`, thumb: null };
    }
  }
  return { service: "link", embed: null, thumb: null };
}

export function telHref(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function waHref(number, text = "") {
  let digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatBytes(n) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function safeHref(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}
