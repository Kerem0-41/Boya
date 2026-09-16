import { API, fileUrl, h, icon, placeholderArt } from "./common.js";

const $ = (id) => document.getElementById(id);
const TOKEN_KEY = "boyaci_token";
const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", pdf: "application/pdf" };

let token = read(TOKEN_KEY);
let data = { settings: {}, products: [], catalogs: [], gallery: [] };
let tab = "boya";

function read(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }
function write(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} }

function toast(msg, err = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = err ? "toast hata" : "toast";
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 3500);
}

async function api(path, method = "GET", body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/login") { logout(); throw new Error(out.error || "Tekrar giriş yapın"); }
  if (!res.ok) throw new Error(out.error || "İşlem başarısız");
  return out;
}

function upload(file, kind) {
  const type = file.type || TYPES[file.name.split(".").pop().toLowerCase()] || "";
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${API}/api/upload?kind=${kind}&name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("content-type", type);
    xhr.upload.onprogress = (e) => e.lengthComputable && toast(`Yükleniyor: %${Math.round((e.loaded / e.total) * 100)}`);
    xhr.onload = () => {
      let out = {};
      try { out = JSON.parse(xhr.responseText); } catch {}
      xhr.status < 300 ? resolve(out) : reject(new Error(out.error || "Yükleme başarısız"));
    };
    xhr.onerror = () => reject(new Error("Bağlantı hatası"));
    xhr.send(file);
  });
}

/* ---------- Giriş ---------- */
start();
async function start() {
  if (token) {
    try { await api("/api/me"); return showPanel(); } catch {}
  }
  $("giris").hidden = false;
}

$("girisForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("girisHata").textContent = "";
  try {
    const out = await api("/api/login", "POST", { password: $("sifre").value });
    token = out.token;
    write(TOKEN_KEY, token);
    $("giris").hidden = true;
    showPanel();
  } catch (err) {
    $("girisHata").textContent = err.message;
  }
});

function logout() {
  token = "";
  write(TOKEN_KEY, "");
  $("panel").hidden = true;
  $("giris").hidden = false;
}

async function showPanel() {
  $("panel").hidden = false;
  $("siteyiAc").replaceChildren(icon("eye"), "Siteyi aç");
  $("cikis").replaceChildren(icon("logout"), "Çıkış");
  $("cikis").onclick = logout;
  await reload();
}

async function reload() {
  data = await (await fetch(`${API}/api/public`)).json();
  $("pMarkaAd").textContent = data.settings.site_name || "Yönetim";
  renderTabs();
  renderTab();
}

const TABS = [
  ["boya", "Boyalar"],
  ["makine", "Makineler"],
  ["katalog", "Kataloglar"],
  ["isler", "Fotoğraf ve videolar"],
  ["iletisim", "İletişim bilgileri"],
];

function renderTabs() {
  $("sekmeler").replaceChildren(
    ...TABS.map(([id, label]) =>
      h("button", { type: "button", "aria-current": tab === id ? "page" : null, onclick: () => { tab = id; renderTabs(); renderTab(); } }, label),
    ),
  );
}

function renderTab() {
  const box = $("icerik");
  if (tab === "boya" || tab === "makine") box.replaceChildren(...productsView(tab));
  if (tab === "katalog") box.replaceChildren(...catalogsView());
  if (tab === "isler") box.replaceChildren(...galleryView());
  if (tab === "iletisim") box.replaceChildren(contactView());
}

function row(thumb, title, sub, onEdit, onDelete) {
  return h(
    "li",
    { class: "p-satir" },
    h("div", { class: "p-kucuk" }, thumb),
    h("div", null, h("p", { class: "p-satir-ad" }, title), h("p", { class: "p-satir-alt" }, sub)),
    h(
      "div",
      { class: "p-satir-eylem" },
      onEdit ? h("button", { type: "button", class: "btn btn-cizgi btn-kucuk", onclick: onEdit }, icon("edit"), "Düzenle") : null,
      h("button", { type: "button", class: "btn btn-cizgi btn-kucuk btn-sil", onclick: onDelete }, icon("trash"), "Sil"),
    ),
  );
}

async function remove(path, name) {
  if (!confirm(`"${name}" silinsin mi?`)) return;
  try { await api(path, "DELETE"); toast("Silindi"); await reload(); } catch (err) { toast(err.message, true); }
}

/* ---------- Boya / makine ---------- */
function productsView(type) {
  const items = data.products.filter((p) => p.type === type);
  const label = type === "boya" ? "boya" : "makine";
  return [
    h("div", { class: "p-bas" }, h("h1", { class: "display" }, type === "boya" ? "Boyalar" : "Makineler"),
      h("button", { type: "button", class: "btn btn-sari", onclick: () => productForm(type) }, icon("plus"), `Yeni ${label} ekle`)),
    items.length
      ? h("ul", { class: "p-liste" }, items.map((p) =>
          row(p.images[0] ? h("img", { src: fileUrl(p.images[0]), alt: "" }) : placeholderArt(p.type, p.name), p.name,
            `${[p.brand, p.category].filter(Boolean).join(", ")} ${p.specs.length} özellik, ${p.images.length} fotoğraf`,
            () => productForm(type, p), () => remove(`/api/products/${p.id}`, p.name))))
      : h("p", { class: "p-bos" }, `Henüz ${label} eklenmedi.`),
  ];
}

function field(label, input, help) {
  return h("label", { class: "alan" }, h("span", null, label), input, help ? h("small", { class: "yardim" }, help) : null);
}

function openEditor(title, body, onSave) {
  const dlg = $("editor");
  const err = h("p", { class: "form-hata" });
  const form = h("form", { class: "editor-form" },
    h("div", { class: "editor-bas" }, h("h2", null, title), h("button", { type: "button", "aria-label": "Kapat", onclick: () => dlg.close() }, icon("close"))),
    h("div", { class: "editor-govde" }, body),
    h("div", { class: "editor-alt" }, err, h("button", { type: "button", class: "btn btn-cizgi", onclick: () => dlg.close() }, "Vazgeç"), h("button", { type: "submit", class: "btn btn-sari" }, "Kaydet")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    try { await onSave(); dlg.close(); toast("Kaydedildi"); await reload(); } catch (ex) { err.textContent = ex.message; }
  });
  dlg.replaceChildren(form);
  dlg.showModal();
}

function productForm(type, p = {}) {
  const images = [...(p.images || [])];
  let catalogKey = p.catalog_key || null;
  const name = h("input", { value: p.name || "", required: true });
  const brand = h("input", { value: p.brand || "" });
  const category = h("input", { value: p.category || "" });
  const summary = h("input", { value: p.summary || "" });
  const description = h("textarea", { value: p.description || "" });
  const specs = h("textarea", { value: (p.specs || []).map((s) => `${s.k}: ${s.v}`).join("\n"), rows: 8 });
  const photos = h("div", { class: "gorsel-liste" });
  const pdfInfo = h("span", { class: "yardim" });

  const drawPhotos = () => {
    photos.replaceChildren(...images.map((key, i) =>
      h("div", { class: "gorsel-oge" }, h("img", { src: fileUrl(key), alt: "" }),
        h("div", { class: "gorsel-eylem" }, h("button", { type: "button", "aria-label": "Kaldır", onclick: () => { images.splice(i, 1); drawPhotos(); } }, icon("trash"))))));
    pdfInfo.textContent = catalogKey ? "Katalog yüklü." : "Katalog yok.";
  };
  drawPhotos();

  const photoInput = h("input", { type: "file", accept: "image/*", multiple: true, onchange: async (e) => {
    for (const f of e.target.files) {
      try { images.push((await upload(f, "image")).key); drawPhotos(); } catch (err) { toast(err.message, true); }
    }
    toast("Fotoğraflar yüklendi");
  } });
  const pdfInput = h("input", { type: "file", accept: "application/pdf", onchange: async (e) => {
    try { catalogKey = (await upload(e.target.files[0], "pdf")).key; drawPhotos(); toast("Katalog yüklendi"); } catch (err) { toast(err.message, true); }
  } });

  openEditor(p.id ? "Düzenle" : type === "boya" ? "Yeni boya" : "Yeni makine", [
    field("Ürün adı", name),
    h("div", { class: "editor-iki" }, field("Marka", brand), field("Kategori", category, type === "boya" ? "Örn: İç cephe, Dış cephe, Sanayi" : "Örn: Airless makine, Pompa")),
    field("Kısa açıklama", summary),
    field("Detaylı açıklama", description),
    field("Özellikler", specs, "Her satıra bir özellik: Ad: Değer (örn. Ambalaj: 2,5 L / 15 L). Tedarikçi sitesinden kopyalayıp yapıştırabilirsiniz."),
    field("Fotoğraflar", photoInput), photos,
    field("PDF katalog (isteğe bağlı)", pdfInput), pdfInfo,
    catalogKey || p.catalog_key ? h("button", { type: "button", class: "btn btn-cizgi btn-kucuk btn-sil", onclick: () => { catalogKey = null; drawPhotos(); } }, "Kataloğu kaldır") : null,
  ], async () => {
    const body = {
      type, name: name.value, brand: brand.value, category: category.value, summary: summary.value, description: description.value,
      specs: specs.value.split("\n").map((l) => l.match(/^\s*([^:\t]+?)\s*[:\t]\s*(.+)$/)).filter(Boolean).map((m) => ({ k: m[1], v: m[2].trim() })),
      images, catalog_key: catalogKey,
    };
    await api(p.id ? `/api/products/${p.id}` : "/api/products", p.id ? "PUT" : "POST", body);
  });
}

/* ---------- Kataloglar ---------- */
function catalogsView() {
  return [
    h("div", { class: "p-bas" }, h("h1", { class: "display" }, "Kataloglar"),
      h("button", { type: "button", class: "btn btn-sari", onclick: catalogForm }, icon("plus"), "Katalog yükle")),
    data.catalogs.length
      ? h("ul", { class: "p-liste" }, data.catalogs.map((c) =>
          row(icon("file"), c.title, { boya: "Boya kataloğu", makine: "Makine kataloğu", genel: "Genel" }[c.type], null, () => remove(`/api/catalogs/${c.id}`, c.title))))
      : h("p", { class: "p-bos" }, "Henüz katalog yüklenmedi."),
  ];
}

function catalogForm() {
  let file = null;
  const title = h("input", { required: true });
  const type = h("select", null, h("option", { value: "boya" }, "Boya kataloğu"), h("option", { value: "makine" }, "Makine kataloğu"), h("option", { value: "genel" }, "Genel"));
  const brand = h("input");
  const input = h("input", { type: "file", accept: "application/pdf", onchange: async (e) => {
    const f = e.target.files[0];
    try { file = { ...(await upload(f, "pdf")) }; if (!title.value) title.value = f.name.replace(/\.pdf$/i, ""); toast("PDF yüklendi"); } catch (err) { toast(err.message, true); }
  } });
  openEditor("Katalog yükle", [field("PDF dosyası", input), field("Katalog adı", title), h("div", { class: "editor-iki" }, field("Tür", type), field("Marka", brand))], async () => {
    if (!file) throw new Error("Önce PDF dosyasını seçin");
    await api("/api/catalogs", "POST", { type: type.value, title: title.value, brand: brand.value, file_key: file.key, file_size: file.size });
  });
}

/* ---------- Fotoğraf ve videolar ---------- */
function galleryView() {
  const input = h("input", { type: "file", accept: "image/*,video/mp4,video/webm,video/quicktime", multiple: true, hidden: true, onchange: async (e) => {
    for (const f of e.target.files) {
      const isVideo = (f.type || TYPES[f.name.split(".").pop().toLowerCase()] || "").startsWith("video");
      try {
        const up = await upload(f, isVideo ? "video" : "image");
        await api("/api/gallery", "POST", { kind: isVideo ? "video" : "foto", file_key: up.key, title: "" });
      } catch (err) { toast(err.message, true); }
    }
    toast("Yüklendi");
    await reload();
  } });
  return [
    h("div", { class: "p-bas" }, h("h1", { class: "display" }, "Fotoğraf ve videolar"),
      h("button", { type: "button", class: "btn btn-sari", onclick: () => input.click() }, icon("upload"), "Fotoğraf / video yükle"), input),
    data.gallery.length
      ? h("div", { class: "p-izgara" }, data.gallery.map((g) =>
          h("div", { class: "p-kart" },
            h("div", { class: "p-kart-gorsel" }, g.kind === "foto" ? h("img", { src: fileUrl(g.file_key), alt: "" }) : h("video", { src: `${fileUrl(g.file_key)}#t=0.5`, preload: "metadata", muted: true })),
            h("div", { class: "p-kart-govde" }, h("button", { type: "button", class: "btn btn-cizgi btn-kucuk btn-sil", onclick: () => remove(`/api/gallery/${g.id}`, g.kind === "foto" ? "Fotoğraf" : "Video") }, icon("trash"), "Sil")))))
      : h("p", { class: "p-bos" }, "Henüz fotoğraf veya video yüklenmedi."),
  ];
}

/* ---------- İletişim ---------- */
function contactView() {
  const s = data.settings;
  const keys = [
    ["site_name", "Firma adı"], ["phone", "Telefon"], ["whatsapp", "WhatsApp numarası"], ["email", "E-posta"],
    ["address", "Adres"], ["instagram", "Instagram"], ["hours", "Çalışma saatleri"],
  ];
  const inputs = Object.fromEntries(keys.map(([k]) => [k, h("input", { value: s[k] || "" })]));
  const form = h("form", { class: "ayar-form" },
    h("div", { class: "p-bas" }, h("h1", { class: "display" }, "İletişim bilgileri")),
    h("fieldset", { class: "ayar-grup" }, keys.map(([k, label]) => field(label, inputs[k]))),
    h("div", { class: "kaydet-cubugu" }, h("button", { type: "submit", class: "btn btn-sari" }, "Kaydet")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("/api/settings", "PUT", Object.fromEntries(keys.map(([k]) => [k, inputs[k].value]))); toast("Kaydedildi"); await reload(); } catch (err) { toast(err.message, true); }
  });
  return form;
}
