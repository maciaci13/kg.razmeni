"use client";

import { useEffect } from "react";

const PREF_KEY = "mzm.profile.defaults.v3";
const COLLAPSE_KEY = "mzm.request.form.collapsed.v1";
const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

type CatalogInstitution = { id: string; name: string; district?: string; address?: string | null };
type Catalog = { generatedAt: string; districts: string[]; years: string[]; institutions?: CatalogInstitution[] };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string };

let catalogCache: Catalog | null = null;
let catalogPromise: Promise<Catalog | null> | null = null;

function loadCatalog() {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (catalogPromise) return catalogPromise;
  catalogPromise = fetch("/api/catalog", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || !Array.isArray(data.districts) || !Array.isArray(data.years)) return null;
      catalogCache = data as Catalog;
      return catalogCache;
    })
    .catch(() => null);
  return catalogPromise;
}

function fallbackYears() {
  const year = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(year - i));
}

function prefs(): Prefs | null {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "null") as Prefs | null; } catch { return null; }
}
function savePrefs(data: Prefs) { localStorage.setItem(PREF_KEY, JSON.stringify(data)); }

function opt(value: string, label: string, disabled = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.disabled = disabled;
  return option;
}
function label(text: string) {
  const node = document.createElement("label");
  node.className = "mzm-enhanced-label";
  node.textContent = text;
  return node;
}
function selectBox() {
  const wrap = document.createElement("div");
  wrap.className = "mzm-enhanced-select-wrap";
  const select = document.createElement("select");
  select.className = "mzm-enhanced-select";
  select.dataset.mzmEnhanced = "true";
  wrap.appendChild(select);
  return [wrap, select] as const;
}
function setNativeValue(el: HTMLInputElement | HTMLSelectElement | null, value: string) {
  if (!el) return;
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
  if (descriptor?.set) descriptor.set.call(el, value); else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}
function ensureOption(select: HTMLSelectElement | null, value: string, label: string) {
  if (!select || !value) return;
  if (Array.from(select.options).some((o) => o.value === value)) return;
  select.appendChild(opt(value, label));
}
function valueOf(item: CatalogInstitution) { return `catalog:${item.id}`; }
function textOf(item: CatalogInstitution) { return `${item.name}${item.district ? ` · ${item.district}` : ""}${item.address ? ` · ${item.address}` : ""}`; }
function sortItems(items: CatalogInstitution[]) { return [...items].sort((a, b) => `${a.district ?? ""}-${a.name}-${a.address ?? ""}`.localeCompare(`${b.district ?? ""}-${b.name}-${b.address ?? ""}`, "bg")); }

function findFields(section: HTMLElement) {
  const selects = Array.from(section.querySelectorAll<HTMLSelectElement>("select:not([data-mzm-enhanced])"));
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>("button"));
  return {
    fromSelect: selects[0] || null,
    wantedSelect: selects[1] || null,
    ageInput: section.querySelector<HTMLInputElement>("input:not([data-mzm-enhanced])"),
    typeButtons: buttons.filter((b) => PLACE_TYPES.includes((b.textContent || "").trim())),
    submitButton: buttons.find((b) => /Активирай заявка|Добави заявка/.test(b.textContent || "")) || null
  };
}
function hideOriginal(section: HTMLElement, fields: ReturnType<typeof findFields>) {
  section.querySelectorAll<HTMLElement>("label").forEach((l) => {
    if (/Имаме място|Желана градина|Набор/.test(l.textContent || "")) {
      l.style.display = "none";
      const next = l.nextElementSibling as HTMLElement | null;
      if (next) next.style.display = "none";
    }
  });
  if (fields.ageInput) fields.ageInput.style.display = "none";
  section.querySelectorAll<HTMLElement>("div").forEach((d) => {
    if ((d.textContent || "").includes("Тип място") && d.querySelector("button")) d.style.display = "none";
  });
}

async function enhance(section: HTMLElement) {
  if (section.dataset.mzmEnhancedRequest === "true") return;
  const text = section.textContent || "";
  if (!text.includes("Имаме място") || !text.includes("Желана градина")) return;
  const fields = findFields(section);
  if (!fields.fromSelect || !fields.wantedSelect) return;
  section.dataset.mzmEnhancedRequest = "true";

  const catalog = await loadCatalog();
  const saved = prefs();
  const items = sortItems(catalog?.institutions?.length ? catalog.institutions : []);
  const districts = catalog?.districts?.length ? catalog.districts : Array.from(new Set(items.map((i) => i.district).filter(Boolean) as string[]));
  const years = catalog?.years?.length ? catalog.years : fallbackYears();

  const panel = document.createElement("div");
  panel.className = "mzm-enhanced-request-panel";

  const [districtWrap, districtSelect] = selectBox();
  districtSelect.appendChild(opt("", "Избери район"));
  districts.forEach((d) => districtSelect.appendChild(opt(d, d)));
  panel.append(label("Район"), districtWrap);

  const [yearWrap, yearSelect] = selectBox();
  yearSelect.appendChild(opt("", "Избери набор / група"));
  years.forEach((y) => yearSelect.appendChild(opt(y, y)));
  panel.append(label("Набор / група"), yearWrap);

  const typeGrid = document.createElement("div");
  typeGrid.className = "mzm-enhanced-type-grid";
  let selectedType = saved?.placeType || "Общ ред";
  const syncType = () => {
    typeGrid.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.classList.toggle("is-active", b.dataset.value === selectedType));
    fields.typeButtons.find((b) => (b.textContent || "").trim() === selectedType)?.click();
  };
  PLACE_TYPES.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = type;
    button.textContent = type;
    button.addEventListener("click", () => { selectedType = type; syncType(); maybeSave(); });
    typeGrid.appendChild(button);
  });
  panel.append(label("Тип място"), typeGrid);

  const saveRow = document.createElement("label");
  saveRow.className = "mzm-enhanced-save-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.dataset.mzmEnhanced = "true";
  const span = document.createElement("span");
  span.textContent = "Запази тези данни в профила ми";
  saveRow.append(checkbox, span);
  panel.appendChild(saveRow);

  const [fromWrap, fromSelect] = selectBox();
  const [wantedWrap, wantedSelect] = selectBox();
  panel.append(label("Сегашна градина"), fromWrap, label("Желана градина"), wantedWrap);

  const status = document.createElement("div");
  status.className = "mzm-catalog-status";
  panel.appendChild(status);

  section.insertBefore(panel, section.firstChild);
  hideOriginal(section, fields);

  const current = (): Prefs => ({ district: districtSelect.value, year: yearSelect.value, placeType: selectedType, from: fromSelect.value, wanted: wantedSelect.value });
  function maybeSave() { if (checkbox.checked) savePrefs(current()); }
  function filtered() { return items.filter((i) => !districtSelect.value || i.district === districtSelect.value); }
  function syncInstitution(native: HTMLSelectElement | null, visible: HTMLSelectElement) {
    const selected = visible.selectedOptions[0];
    ensureOption(native, visible.value, selected?.textContent || visible.value);
    setNativeValue(native, visible.value);
    maybeSave();
  }
  function rebuildOne(visible: HTMLSelectElement, native: HTMLSelectElement | null, placeholder: string, preferred?: string) {
    const old = preferred ?? visible.value;
    visible.innerHTML = "";
    visible.appendChild(opt("", placeholder));
    filtered().forEach((item) => visible.appendChild(opt(valueOf(item), textOf(item))));
    visible.value = old && Array.from(visible.options).some((o) => o.value === old) ? old : "";
    if (visible.value) syncInstitution(native, visible); else setNativeValue(native, "");
  }
  function rebuild(preferredFrom?: string, preferredWanted?: string) {
    rebuildOne(fromSelect, fields.fromSelect, "Избери сегашна градина", preferredFrom);
    rebuildOne(wantedSelect, fields.wantedSelect, "Избери желана градина", preferredWanted);
    const count = filtered().length;
    const date = catalog?.generatedAt ? new Date(catalog.generatedAt).toLocaleDateString("bg-BG") : "PDF";
    status.textContent = catalog ? `PDF каталог: ${date}. В този район: ${count}. Общо: ${items.length}.` : "Каталогът не се зареди. Провери /api/catalog.";
    maybeSave();
  }

  districtSelect.addEventListener("change", () => rebuild());
  yearSelect.addEventListener("change", () => { setNativeValue(fields.ageInput, yearSelect.value); maybeSave(); });
  fromSelect.addEventListener("change", () => syncInstitution(fields.fromSelect, fromSelect));
  wantedSelect.addEventListener("change", () => syncInstitution(fields.wantedSelect, wantedSelect));
  checkbox.addEventListener("change", maybeSave);
  fields.submitButton?.addEventListener("click", () => { maybeSave(); localStorage.setItem(COLLAPSE_KEY, "true"); });

  if (saved?.district && districts.includes(saved.district)) districtSelect.value = saved.district;
  if (saved?.year && years.includes(saved.year)) yearSelect.value = saved.year;
  setNativeValue(fields.ageInput, yearSelect.value || saved?.year || "");
  syncType();
  rebuild(saved?.from, saved?.wanted);
}

function injectStyles() {
  if (document.getElementById("mzm-request-enhancer-styles")) return;
  const style = document.createElement("style");
  style.id = "mzm-request-enhancer-styles";
  style.textContent = `
    .mzm-enhanced-request-panel{display:grid!important;gap:.72rem;margin-bottom:1rem;border-radius:1.75rem;padding:1rem;background:rgba(247,245,239,.92);box-shadow:inset 0 0 0 1px rgba(28,27,25,.025)}
    .mzm-enhanced-label{margin-top:.35rem;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:rgba(28,27,25,.42)}
    .mzm-enhanced-select-wrap{position:relative}.mzm-enhanced-select{width:100%;appearance:none;border:0;outline:0;border-radius:1.35rem;background:rgba(255,255,255,.82);padding:1rem 3rem 1rem 1rem;font-size:.88rem;font-weight:800;color:#1c1b19}.mzm-enhanced-select-wrap:after{content:'⌄';position:absolute;right:1.15rem;top:50%;transform:translateY(-54%);color:rgba(28,27,25,.58);pointer-events:none;font-weight:900}
    .mzm-enhanced-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.mzm-enhanced-type-grid button{border:0;border-radius:1.05rem;padding:.85rem .75rem;background:rgba(255,255,255,.75);color:#1c1b19;text-align:left;font-weight:900;font-size:.75rem}.mzm-enhanced-type-grid button.is-active{background:var(--study-orange);color:white}
    .mzm-enhanced-save-row{display:flex;gap:.6rem;align-items:center;border-radius:1.25rem;background:rgba(255,255,255,.62);padding:.85rem .9rem;color:rgba(28,27,25,.65);font-size:.76rem;font-weight:800}.mzm-enhanced-save-row input{width:1rem;height:1rem;accent-color:var(--study-orange)}
    .mzm-catalog-status{border-radius:1.1rem;padding:.78rem .9rem;background:rgba(255,255,255,.62);color:rgba(28,27,25,.5);font-size:.72rem;line-height:1.35;font-weight:800}
  `;
  document.head.appendChild(style);
}

function run() { injectStyles(); document.querySelectorAll<HTMLElement>("section").forEach((s) => void enhance(s)); }

export default function RequestFormEnhancer() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { scheduled = false; run(); });
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
