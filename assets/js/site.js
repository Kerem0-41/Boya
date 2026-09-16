import { API, fileUrl, formatBytes, h, icon, parseVideoLink, placeholderArt, safeHref, telHref, waHref } from "./common.js";

const $ = (id) => document.getElementById(id);
const TYPE_LABEL = { boya: "Boya kataloğu", makine: "Makine kataloğu", genel: "Genel katalog" };

let data = { settings: {}, products: [], catalogs: [], gallery: [] };

setupMenu();
load();

async function load() {
  try {
    const res = await fetch(`${API}/api/public`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
    $("durum").remove();
    render();
  } catch {
    const status = $("durum");
    status.classList.add("hata");
    status.textContent = "Ürünler şu an yüklenemedi. Sayfayı yenileyin ya da bizi arayın.";
  }
}

function render() {
  const s = data.settings;
  renderBrand(s);
  renderHero(s);
  renderServices(s);
  renderProducts("boya");
  renderProducts("makine");
  renderCatalogs();
  renderGallery();
  renderAbout(s);
  renderContact(s);
  syncMenu();
  observeSections();
}

/* ---------- Marka, giriş ---------- */
function renderBrand(s) {
  const name = s.site_name || "Boyacı";
  document.title = s.tagline ? `${name} | ${s.tagline}` : name;
  const desc = document.querySelector('meta[name="description"]');
  if (s.hero_text && desc) desc.setAttribute("content", s.hero_text.slice(0, 160));

  const brand = $("marka");
  if (s.logo_key) {
    brand.replaceChildren(h("img", { src: fileUrl(s.logo_key), alt: name }));
  } else {
    $("markaAd").textContent = name;
  }
  brand.setAttribute("aria-label", `${name} ana sayfa`);
  $("altYazi").textContent = `© ${new Date().getFullYear()} ${name}${s.tagline ? `. ${s.tagline}` : ""}`;

  const call = $("ustAra");
  if (s.phone) {
    call.href = telHref(s.phone);
    call.replaceChildren(icon("phone"), "Hemen arayın");
    call.hidden = false;
  }
}

function renderHero(s) {
  if (s.hero_title) $("heroBaslik").textContent = s.hero_title;
  if (s.hero_text) $("heroYazi").textContent = s.hero_text;

  const firstSection = ["boyalar", "makineler", "kataloglar", "isler"].find((id) => !$(id).hidden || hasContent(id));
  $("heroUrunler").href = `#${firstSection || "iletisim"}`;

  const wa = waHref(s.whatsapp, "Merhaba, ürünleriniz hakkında bilgi almak istiyorum.");
  const write = $("heroYaz");
  if (wa) {
    write.href = wa;
    write.target = "_blank";
    write.rel = "noopener";
    write.replaceChildren(icon("chat"), "WhatsApp'tan yazın");
  }

  const info = $("heroBilgi");
  info.replaceChildren();
  if (s.phone) info.append(h("li", null, icon("phone"), h("a", { href: telHref(s.phone) }, s.phone)));
  if (s.hours) info.append(h("li", null, icon("clock"), s.hours));
}

function hasContent(id) {
  if (id === "boyalar") return data.products.some((p) => p.type === "boya");
  if (id === "makineler") return data.products.some((p) => p.type === "makine");
  if (id === "kataloglar") return data.catalogs.length > 0;
  if (id === "isler") return data.gallery.length > 0;
  return false;
}

function renderServices(s) {
  const rows = (s.services || "")
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([title]) => title);
  $("hizmetler").hidden = rows.length === 0;
  $("hizmetListe").replaceChildren(
    ...rows.map(([title, text]) => h("li", null, h("h3", null, title), text ? h("p", null, text) : null)),
  );
}

/* ---------- Ürünler ---------- */
function renderProducts(type) {
  const section = $(type === "boya" ? "boyalar" : "makineler");
  const list = $(type === "boya" ? "boyaListe" : "makineListe");
  const filterBox = $(type === "boya" ? "boyaFiltre" : "makineFiltre");
  const items = data.products.filter((p) => p.type === type);

  section.hidden = items.length === 0;
  if (!items.length) return;

  const categories = [...new Set(items.map((p) => p.category).filter(Boolean))];
  let active = "";

  const draw = () => {
    const shown = active ? items.filter((p) => p.category === active) : items;
    list.replaceChildren(...shown.map(type === "boya" ? paintCard : machineRow));
    for (const btn of filterBox.children) btn.setAttribute("aria-pressed", String(btn.dataset.kategori === active));
  };

  filterBox.hidden = categories.length < 2;
  filterBox.replaceChildren(
    ...["", ...categories].map((cat) =>
      h(
        "button",
        {
          type: "button",
          dataset: { kategori: cat },
          onclick: () => {
            active = cat;
            draw();
          },
        },
        cat || "Tümü",
      ),
    ),
  );
  draw();
}

function productImage(p, cls = "urun-gorsel") {
  const first = p.images[0];
  return h(
    "button",
    { type: "button", class: cls, "aria-label": `${p.name} özelliklerini gör`, onclick: () => openProduct(p) },
    first ? h("img", { src: fileUrl(first), alt: "", loading: "lazy", decoding: "async" }) : placeholderArt(p.type, p.name),
  );
}

function subline(p) {
  return [p.brand, p.category].filter(Boolean).join(", ");
}

function specList(specs, cls = "ozellikler") {
  return h("dl", { class: cls }, specs.flatMap((s) => [h("dt", null, s.k), h("dd", null, s.v)]));
}

function paintCard(p) {
  return h(
    "article",
    { class: "urun" },
    productImage(p),
    h(
      "div",
      { class: "urun-govde" },
      h("h3", { class: "urun-ad" }, p.name),
      subline(p) ? h("p", { class: "urun-alt" }, subline(p)) : null,
      p.summary ? h("p", { class: "urun-ozet" }, p.summary) : null,
      p.specs.length ? specList(p.specs.slice(0, 2), "mini-ozellik") : h("div", { style: { height: "1rem" } }),
      h("button", { type: "button", class: "btn btn-koyu btn-kucuk urun-detay", onclick: () => openProduct(p) }, "Özellikleri gör"),
    ),
  );
}

function machineRow(p) {
  return h(
    "article",
    { class: "makine" },
    productImage(p),
    h(
      "div",
      { class: "makine-bilgi" },
      h("h3", { class: "urun-ad" }, p.name),
      subline(p) ? h("p", { class: "urun-alt" }, subline(p)) : null,
      p.summary ? h("p", { class: "urun-ozet" }, p.summary) : null,
      h("button", { type: "button", class: "btn btn-koyu btn-kucuk", onclick: () => openProduct(p) }, "Detayları gör"),
    ),
    p.specs.length ? specList(p.specs.slice(0, 6)) : h("div"),
  );
}

function openProduct(p) {
  const dialog = $("urunDialog");
  const s = data.settings;
  const main = h("div", { class: "detay-ana" });
  const thumbs = h("div", { class: "detay-kucukler" });

  const show = (i) => {
    const key = p.images[i];
    main.replaceChildren(key ? h("img", { src: fileUrl(key), alt: p.name }) : placeholderArt(p.type, p.name));
    for (const [j, t] of [...thumbs.children].entries()) t.setAttribute("aria-current", String(i === j));
  };

  if (p.images.length > 1) {
    thumbs.append(
      ...p.images.map((key, i) =>
        h(
          "button",
          { type: "button", "aria-label": `${i + 1}. fotoğraf`, onclick: () => show(i) },
          h("img", { src: fileUrl(key), alt: "", loading: "lazy" }),
        ),
      ),
    );
  }
  show(0);

  const actions = h("div", { class: "detay-eylem" });
  const wa = waHref(s.whatsapp, `Merhaba, "${p.name}" hakkında fiyat ve bilgi almak istiyorum.`);
  if (wa) actions.append(h("a", { class: "btn btn-sari", href: wa, target: "_blank", rel: "noopener" }, icon("chat"), "Fiyat sorun"));
  if (s.phone) actions.append(h("a", { class: "btn btn-koyu", href: telHref(s.phone) }, icon("phone"), "Arayın"));
  if (p.catalog_key) {
    actions.append(
      h("a", { class: "btn btn-cizgi", href: fileUrl(p.catalog_key), target: "_blank", rel: "noopener" }, icon("file"), "Kataloğu aç"),
    );
  }
  const source = safeHref(p.source_url);
  if (source) {
    actions.append(
      h("a", { class: "btn btn-cizgi", href: source, target: "_blank", rel: "noopener" }, icon("external"), "Üretici sayfası"),
    );
  }

  dialog.replaceChildren(
    h(
      "div",
      { class: "dialog-kapat" },
      h("button", { type: "button", "aria-label": "Kapat", onclick: () => dialog.close() }, icon("close")),
    ),
    h(
      "div",
      { class: "detay" },
      h("div", { class: "detay-gorseller" }, main, thumbs),
      h(
        "div",
        { class: "detay-bilgi" },
        h("h2", { class: "display", id: "urunDialogBaslik" }, p.name),
        subline(p) ? h("p", { class: "urun-alt" }, subline(p)) : null,
        p.summary ? h("p", { class: "detay-aciklama" }, p.summary) : null,
        p.description ? h("p", { class: "detay-aciklama" }, p.description) : null,
        p.specs.length ? specList(p.specs) : null,
        actions,
      ),
    ),
  );
  dialog.showModal();
  dialog.scrollTop = 0;
}

$("urunDialog").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.close();
});

/* ---------- Kataloglar ---------- */
function renderCatalogs() {
  const items = data.catalogs;
  $("kataloglar").hidden = items.length === 0;
  $("katalogListe").replaceChildren(
    ...items.map((c) => {
      const url = fileUrl(c.file_key);
      const meta = [TYPE_LABEL[c.type], c.brand, formatBytes(c.file_size)].filter(Boolean).join(", ");
      return h(
        "li",
        { class: "katalog" },
        h("div", { class: "katalog-kapak" }, c.cover_key ? h("img", { src: fileUrl(c.cover_key), alt: "", loading: "lazy" }) : "PDF"),
        h(
          "div",
          null,
          h("p", { class: "katalog-ad" }, c.title),
          h("p", { class: "katalog-alt" }, meta),
          c.description ? h("p", { class: "katalog-alt" }, c.description) : null,
        ),
        h(
          "div",
          { class: "katalog-eylem" },
          h("a", { class: "btn btn-koyu btn-kucuk", href: url, target: "_blank", rel: "noopener" }, icon("eye"), "Aç"),
          h("a", { class: "btn btn-cizgi btn-kucuk", href: url, download: `${c.title}.pdf` }, icon("download"), "İndir"),
        ),
      );
    }),
  );
}

/* ---------- Yaptığımız işler ---------- */
function renderGallery() {
  const items = data.gallery;
  $("isler").hidden = items.length === 0;
  $("isListe").replaceChildren(
    ...items.map((g, i) => {
      let media;
      let playable = false;
      if (g.kind === "foto") {
        media = h("img", { src: fileUrl(g.file_key), alt: g.title || "Yaptığımız işlerden bir fotoğraf", loading: "lazy", decoding: "async" });
      } else if (g.kind === "video") {
        playable = true;
        media = g.thumb_key
          ? h("img", { src: fileUrl(g.thumb_key), alt: g.title || "Video", loading: "lazy" })
          : h("video", { src: `${fileUrl(g.file_key)}#t=0.5`, preload: "metadata", muted: true, playsinline: true });
      } else {
        playable = true;
        const link = parseVideoLink(g.url);
        media = link?.thumb
          ? h("img", { src: link.thumb, alt: g.title || "Video", loading: "lazy" })
          : h("span", { class: "is-bos" }, icon(link?.service === "instagram" ? "instagram" : "video"), link?.service === "instagram" ? "Instagram videosu" : "Video");
      }
      return h(
        "li",
        { class: "is" },
        h(
          "button",
          { type: "button", "aria-label": `${g.title || (playable ? "Video" : "Fotoğraf")}, büyüt`, onclick: () => openLightbox(i) },
          media,
          playable ? h("span", { class: "is-oynat" }, h("span", null, icon("play"))) : null,
        ),
        g.title ? h("p", { class: "is-baslik" }, g.title) : null,
      );
    }),
  );
}

let lightboxIndex = 0;

function openLightbox(index) {
  const box = $("isikKutusu");
  lightboxIndex = index;
  drawLightbox();
  if (!box.open) box.showModal();
}

function drawLightbox() {
  const box = $("isikKutusu");
  const items = data.gallery;
  const g = items[lightboxIndex];
  let media;

  if (g.kind === "foto") {
    media = h("img", { src: fileUrl(g.file_key), alt: g.title || "Fotoğraf" });
  } else if (g.kind === "video") {
    media = h("video", {
      src: fileUrl(g.file_key),
      poster: g.thumb_key ? fileUrl(g.thumb_key) : null,
      controls: true,
      autoplay: true,
      playsinline: true,
    });
  } else {
    const link = parseVideoLink(g.url);
    media = link?.embed
      ? h("iframe", {
          src: link.embed,
          title: g.title || "Video",
          class: link.service === "instagram" ? "dikey" : null,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
          allowfullscreen: true,
          loading: "lazy",
        })
      : h("a", { class: "btn btn-sari", href: safeHref(g.url), target: "_blank", rel: "noopener" }, icon("external"), "Videoyu aç");
  }

  const many = items.length > 1;
  box.replaceChildren(
    h(
      "div",
      { class: "isik-ic" },
      h(
        "div",
        { class: "isik-ust" },
        h("span", { class: "isik-sayac" }, many ? `${lightboxIndex + 1} / ${items.length}` : ""),
        h("button", { type: "button", class: "isik-dugme", "aria-label": "Kapat", onclick: () => box.close() }, icon("close")),
      ),
      h(
        "div",
        { class: "isik-orta" },
        many ? h("button", { type: "button", class: "isik-dugme onceki", "aria-label": "Önceki", onclick: () => step(-1) }, icon("left")) : h("span"),
        h("div", { class: "isik-medya" }, media),
        many ? h("button", { type: "button", class: "isik-dugme sonraki", "aria-label": "Sonraki", onclick: () => step(1) }, icon("right")) : h("span"),
      ),
      h(
        "div",
        { class: "isik-alt" },
        g.title ? h("h3", null, g.title) : null,
        g.description ? h("p", null, g.description) : null,
      ),
    ),
  );
}

function step(delta) {
  const n = data.gallery.length;
  lightboxIndex = (lightboxIndex + delta + n) % n;
  drawLightbox();
}

$("isikKutusu").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
// Kapatınca videonun sesi kesilsin
$("isikKutusu").addEventListener("close", (e) => e.currentTarget.replaceChildren());

/* ---------- Hakkımızda, iletişim ---------- */
function renderAbout(s) {
  const paragraphs = (s.about_text || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  const brands = (s.brands || "").split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  $("hakkimizda").hidden = paragraphs.length === 0 && brands.length === 0;
  $("hakkimizdaMetin").replaceChildren(...paragraphs.map((t) => h("p", null, t)));
  $("markalar").hidden = brands.length === 0;
  $("markaListe").replaceChildren(...brands.map((b) => h("li", null, b)));
}

function socialHref(kind, value) {
  if (!value) return "";
  const direct = safeHref(value);
  if (direct) return direct;
  const handle = value.replace(/^@/, "").trim();
  const base = { instagram: "https://www.instagram.com/", facebook: "https://www.facebook.com/", youtube: "https://www.youtube.com/@" }[kind];
  return /^[\w.-]+$/.test(handle) ? `${base}${handle}` : "";
}

function socialLabel(value) {
  const direct = safeHref(value);
  if (!direct) return value.startsWith("@") ? value : `@${value}`;
  const path = new URL(direct).pathname.replace(/^\/+|\/+$/g, "");
  return path ? `@${path.replace(/^@/, "")}` : direct;
}

function renderContact(s) {
  const tel = $("iletisimTel");
  if (s.phone) {
    tel.href = telHref(s.phone);
    tel.textContent = s.phone;
    tel.hidden = false;
  }

  const actions = $("iletisimEylem");
  const wa = waHref(s.whatsapp, "Merhaba, bilgi almak istiyorum.");
  actions.replaceChildren();
  if (wa) actions.append(h("a", { class: "btn btn-sari", href: wa, target: "_blank", rel: "noopener" }, icon("chat"), "WhatsApp'tan yazın"));
  if (s.email) actions.append(h("a", { class: "btn btn-cizgi", href: `mailto:${s.email}` }, icon("mail"), "E-posta gönderin"));

  const rows = [];
  const row = (iconName, label, ...content) =>
    rows.push(h("div", null, h("dt", null, icon(iconName), h("span", null, label)), h("dd", { class: "etiket", "aria-hidden": "true" }, label), h("dd", null, ...content)));

  if (s.phone2) row("phone", "Diğer telefon", h("a", { href: telHref(s.phone2) }, s.phone2));
  if (s.email) row("mail", "E-posta", h("a", { href: `mailto:${s.email}` }, s.email));
  if (s.address) row("pin", "Adres", s.address);
  if (s.hours) row("clock", "Çalışma saatleri", s.hours);
  for (const kind of ["instagram", "facebook", "youtube"]) {
    const href = socialHref(kind, s[kind]);
    if (href) {
      const label = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" }[kind];
      row(kind, label, h("a", { href, target: "_blank", rel: "noopener" }, socialLabel(s[kind])));
    }
  }
  $("iletisimListe").replaceChildren(...rows);

  const mapQuery = s.maps_query || s.address;
  const map = $("harita");
  map.hidden = !mapQuery;
  if (mapQuery) {
    map.replaceChildren(
      h("iframe", {
        src: `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`,
        title: "Konum haritası",
        loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade",
      }),
    );
  }

  const bar = $("eylemCubugu");
  bar.replaceChildren();
  if (s.phone) bar.append(h("a", { class: "ara", href: telHref(s.phone) }, icon("phone"), "Ara"));
  if (wa) bar.append(h("a", { class: "wa", href: wa, target: "_blank", rel: "noopener" }, icon("chat"), "WhatsApp"));
  bar.hidden = bar.childElementCount === 0;
}

/* ---------- Menü ---------- */
function setupMenu() {
  const menu = $("menu");
  const toggle = $("menuDugme");
  toggle.append(icon("menu"));
  const setOpen = (open) => {
    menu.classList.toggle("acik", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    toggle.replaceChildren(icon(open ? "close" : "menu"));
  };
  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("acik")));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("acik")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

function syncMenu() {
  for (const link of document.querySelectorAll("#menu a[data-bolum]")) {
    link.hidden = $(link.dataset.bolum).hidden;
  }
}

function observeSections() {
  const links = new Map([...document.querySelectorAll("#menu a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links.values()) a.classList.remove("aktif");
        links.get(entry.target.id)?.classList.add("aktif");
      }
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  for (const id of links.keys()) {
    const section = $(id);
    if (section && !section.hidden) observer.observe(section);
  }
}
