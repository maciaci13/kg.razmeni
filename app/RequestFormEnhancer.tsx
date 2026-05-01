"use client";

import { useEffect } from "react";

const PREF_KEY = "mzm.profile.defaults.v2";
const COLLAPSE_KEY = "mzm.request.form.collapsed.v1";

const FALLBACK_DISTRICTS = [
  "Банкя",
  "Витоша",
  "Връбница",
  "Възраждане",
  "Изгрев",
  "Илинден",
  "Искър",
  "Красна поляна",
  "Красно село",
  "Кремиковци",
  "Лозенец",
  "Люлин",
  "Младост",
  "Надежда",
  "Нови Искър",
  "Оборище",
  "Овча купел",
  "Панчарево",
  "Подуяне",
  "Сердика",
  "Слатина",
  "Средец",
  "Студентски",
  "Триадица"
];

const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

type Catalog = {
  generatedAt: string;
  districts: string[];
  years: string[];
  sources: Array<{ id: string; label: string; status: "ok" | "error" | "fallback"; checkedAt: string; detail?: string }>;
};

let catalogCache: Catalog | null = null;
let catalogPromise: Promise<Catalog | null> | null = null;

function getFallbackYears() {
  const currentYear = new Date().getFullYear();
  const preparatoryYear = currentYear - 6;
  const years: string[] = [];
  for (let year = currentYear; year >= preparatoryYear; year -= 1) years.push(String(year));
  return years;
}

async function loadCatalog() {
  if (catalogCache) return catalogCache;
  if (catalogPromise) return catalogPromise;

  catalogPromise = fetch("/api/catalog", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data || !Array.isArray(data.districts) || !Array.isArray(data.years)) return null;
      catalogCache = data as Catalog;
      return catalogCache;
    })
    .catch(() => null);

  return catalogPromise;
}

function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "null") as { district?: string; ageGroup?: string; placeType?: string } | null;
  } catch {
    return null;
  }
}

function savePrefs(data: { district?: string; ageGroup?: string; placeType?: string }) {
  localStorage.setItem(PREF_KEY, JSON.stringify(data));
}

function setNativeValue(element: HTMLInputElement | HTMLSelectElement | null, value: string) {
  if (!element) return;
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function getDistrict(option: HTMLOptionElement) {
  const text = (option.textContent || "").trim();
  const parts = text.split("·");
  return (parts[1] || "").trim();
}

function makeOption(value: string, label: string) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function makeLabel(text: string) {
  const label = document.createElement("label");
  label.className = "mzm-enhanced-label";
  label.textContent = text;
  return label;
}

function makeSelect() {
  const wrap = document.createElement("div");
  wrap.className = "mzm-enhanced-select-wrap";
  const select = document.createElement("select");
  select.className = "mzm-enhanced-select";
  select.dataset.mzmEnhanced = "true";
  wrap.appendChild(select);
  return [wrap, select] as const;
}

function findOriginalFields(section: Element) {
  const selects = Array.from(section.querySelectorAll<HTMLSelectElement>("select:not([data-mzm-enhanced])"));
  const kgSelects = selects.filter((select) => Array.from(select.options).some((option) => (option.textContent || "").includes("·")));
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>("button"));

  return {
    fromSelect: kgSelects[0] || null,
    wantedSelect: kgSelects[1] || null,
    ageInput: section.querySelector<HTMLInputElement>("input:not([data-mzm-enhanced])"),
    submitButton: buttons.find((button) => /Активирай заявка|Добави заявка/.test(button.textContent || "")) || null
  };
}

function hideOriginalFields(section: Element, fields: ReturnType<typeof findOriginalFields>) {
  Array.from(section.querySelectorAll<HTMLElement>("label")).forEach((label) => {
    const text = label.textContent || "";
    if (/Имаме място|Желана градина|Набор/.test(text)) {
      label.style.display = "none";
      const next = label.nextElementSibling as HTMLElement | null;
      if (next && (next.matches(".relative") || next.matches("input"))) next.style.display = "none";
    }
  });

  if (fields.ageInput) fields.ageInput.style.display = "none";

  Array.from(section.querySelectorAll<HTMLElement>("div"))
    .filter((node) => (node.textContent || "").includes("Тип място") && node.querySelector("button"))
    .forEach((node) => { node.style.display = "none"; });
}

function collapseIfNeeded(section: HTMLElement) {
  const hasRequestNearby = document.body.textContent?.includes("Моите заявки") || document.body.textContent?.includes("Моите активни заявки");
  if (localStorage.getItem(COLLAPSE_KEY) !== "true" || !hasRequestNearby) return;
  if (section.dataset.mzmCollapsed === "true") return;

  section.dataset.mzmCollapsed = "true";
  const collapsed = document.createElement("button");
  collapsed.type = "button";
  collapsed.className = "mzm-collapsed-request-button";
  collapsed.innerHTML = '<span><b>Нова заявка</b><small>Формата е прибрана, за да виждаш активната заявка.</small></span><i>⌄</i>';
  section.parentNode?.insertBefore(collapsed, section);
  section.style.display = "none";

  collapsed.addEventListener("click", () => {
    section.style.display = "";
    section.dataset.mzmCollapsed = "false";
    collapsed.remove();
    localStorage.setItem(COLLAPSE_KEY, "false");
  });
}

function buildCatalogStatus(catalog: Catalog | null) {
  const status = document.createElement("div");
  status.className = "mzm-catalog-status";

  if (!catalog) {
    status.textContent = "Данните се зареждат от локален резервен списък. Официалните източници ще се проверят отново автоматично.";
    return status;
  }

  const okCount = catalog.sources.filter((source) => source.status === "ok").length;
  const fallback = catalog.sources.some((source) => source.status === "fallback");
  const date = new Date(catalog.generatedAt).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short" });
  status.textContent = fallback
    ? `Източници проверени: ${date}. Някои данни са fallback, докато официалният формат се нормализира.`
    : `Източници проверени: ${date}. Активни източници: ${okCount}.`;
  return status;
}

async function enhanceSection(section: HTMLElement) {
  if (section.dataset.mzmEnhancedRequest === "true") return;
  const text = section.textContent || "";
  if (!text.includes("Имаме място") || !text.includes("Желана градина")) return;

  const fields = findOriginalFields(section);
  if (!fields.fromSelect || !fields.wantedSelect) return;

  section.dataset.mzmEnhancedRequest = "true";

  const catalog = await loadCatalog();
  const prefs = getPrefs();
  const years = catalog?.years?.length ? catalog.years : getFallbackYears();
  const districts = catalog?.districts?.length ? catalog.districts : FALLBACK_DISTRICTS;
  const kgOptions = Array.from(fields.fromSelect.options)
    .filter((option) => option.value)
    .map((option) => ({ value: option.value, label: option.textContent || "", district: getDistrict(option) }));

  const panel = document.createElement("div");
  panel.className = "mzm-enhanced-request-panel";

  const [districtWrap, districtSelect] = makeSelect();
  districtSelect.appendChild(makeOption("", "Избери район"));
  districts.forEach((district) => districtSelect.appendChild(makeOption(district, district)));
  panel.appendChild(makeLabel("Район"));
  panel.appendChild(districtWrap);

  const [yearWrap, yearSelect] = makeSelect();
  yearSelect.appendChild(makeOption("", "Избери година"));
  years.forEach((year) => yearSelect.appendChild(makeOption(year, year)));
  panel.appendChild(makeLabel("Година"));
  panel.appendChild(yearWrap);

  const typeGrid = document.createElement("div");
  typeGrid.className = "mzm-enhanced-type-grid";
  let selectedType = prefs?.placeType || "Общ ред";
  const originalTypeButtons = Array.from(section.querySelectorAll<HTMLButtonElement>("button")).filter((button) => PLACE_TYPES.includes((button.textContent || "").trim()));

  function syncTypeButtons() {
    Array.from(typeGrid.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === selectedType);
    });
    const original = originalTypeButtons.find((button) => (button.textContent || "").trim() === selectedType);
    original?.click();
  }

  PLACE_TYPES.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = type;
    button.textContent = type;
    button.addEventListener("click", () => { selectedType = type; syncTypeButtons(); maybeSavePrefs(); });
    typeGrid.appendChild(button);
  });

  panel.appendChild(makeLabel("Тип място"));
  panel.appendChild(typeGrid);

  const saveRow = document.createElement("label");
  saveRow.className = "mzm-enhanced-save-row";
  const saveCheckbox = document.createElement("input");
  saveCheckbox.type = "checkbox";
  saveCheckbox.checked = !prefs;
  saveCheckbox.dataset.mzmEnhanced = "true";
  const saveText = document.createElement("span");
  saveText.textContent = "Запази тези данни в профила ми";
  saveRow.appendChild(saveCheckbox);
  saveRow.appendChild(saveText);
  panel.appendChild(saveRow);

  const [fromWrap, fromVisible] = makeSelect();
  const [wantedWrap, wantedVisible] = makeSelect();
  panel.appendChild(makeLabel("Сегашна детска градина"));
  panel.appendChild(fromWrap);
  panel.appendChild(makeLabel("Желана детска градина"));
  panel.appendChild(wantedWrap);
  panel.appendChild(buildCatalogStatus(catalog));

  section.insertBefore(panel, section.firstChild);
  hideOriginalFields(section, fields);

  function currentData() { return { district: districtSelect.value, ageGroup: yearSelect.value, placeType: selectedType }; }
  function maybeSavePrefs() {
    if (!saveCheckbox.checked) return;
    const data = currentData();
    if (data.district || data.ageGroup || data.placeType) savePrefs(data);
  }
  function syncYear() { if (yearSelect.value) setNativeValue(fields.ageInput, yearSelect.value); maybeSavePrefs(); }
  function rebuildKgSelect(visibleSelect: HTMLSelectElement, originalSelect: HTMLSelectElement, placeholder: string) {
    const previous = visibleSelect.value || originalSelect.value;
    visibleSelect.innerHTML = "";
    visibleSelect.appendChild(makeOption("", placeholder));
    const district = districtSelect.value;
    kgOptions.filter((option) => !district || option.district === district).forEach((option) => visibleSelect.appendChild(makeOption(option.value, option.label)));
    visibleSelect.value = previous && Array.from(visibleSelect.options).some((option) => option.value === previous) ? previous : "";
    setNativeValue(originalSelect, visibleSelect.value);
  }
  function rebuildAllKg() {
    rebuildKgSelect(fromVisible, fields.fromSelect!, "Избери сегашна градина");
    rebuildKgSelect(wantedVisible, fields.wantedSelect!, "Избери желана градина");
    maybeSavePrefs();
  }

  districtSelect.addEventListener("change", rebuildAllKg);
  yearSelect.addEventListener("change", syncYear);
  fromVisible.addEventListener("change", () => setNativeValue(fields.fromSelect, fromVisible.value));
  wantedVisible.addEventListener("change", () => setNativeValue(fields.wantedSelect, wantedVisible.value));
  saveCheckbox.addEventListener("change", maybeSavePrefs);

  if (prefs?.district && districts.includes(prefs.district)) districtSelect.value = prefs.district;
  if (prefs?.ageGroup && years.includes(prefs.ageGroup)) yearSelect.value = prefs.ageGroup;

  syncTypeButtons();
  syncYear();
  rebuildAllKg();

  fields.submitButton?.addEventListener("click", () => {
    maybeSavePrefs();
    localStorage.setItem(COLLAPSE_KEY, "true");
    setTimeout(() => collapseIfNeeded(section), 700);
  });

  collapseIfNeeded(section);
}

function injectStyles() {
  if (document.getElementById("mzm-request-enhancer-styles")) return;
  const style = document.createElement("style");
  style.id = "mzm-request-enhancer-styles";
  style.textContent = `
    .mzm-enhanced-request-panel { display: grid !important; gap: .72rem; margin-bottom: 1rem; border-radius: 1.75rem; padding: 1rem; background: rgba(247,245,239,.92); box-shadow: inset 0 0 0 1px rgba(28,27,25,.025); }
    .mzm-enhanced-label { margin-top: .35rem; font-size: .64rem; font-weight: 900; text-transform: uppercase; letter-spacing: .18em; color: rgba(28,27,25,.42); }
    .mzm-enhanced-select-wrap { position: relative; }
    .mzm-enhanced-select { width: 100%; appearance: none; border: 0; outline: 0; border-radius: 1.35rem; background: rgba(255,255,255,.82); padding: 1rem 3rem 1rem 1rem; font-size: .88rem; font-weight: 800; color: #1c1b19; }
    .mzm-enhanced-select-wrap::after { content: ''; position: absolute; right: 1.15rem; top: 50%; width: 18px; height: 18px; transform: translateY(-50%); background: rgba(28,27,25,.58); mask: url('/icons/angle-down.svg') center/contain no-repeat; -webkit-mask: url('/icons/angle-down.svg') center/contain no-repeat; pointer-events: none; }
    .mzm-enhanced-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .mzm-enhanced-type-grid button { border: 0; border-radius: 1.05rem; padding: .85rem .75rem; background: rgba(255,255,255,.75); color: #1c1b19; text-align: left; font-weight: 900; font-size: .75rem; }
    .mzm-enhanced-type-grid button.is-active { background: var(--study-orange); color: white; }
    .mzm-enhanced-save-row { display: flex; gap: .6rem; align-items: center; border-radius: 1.25rem; background: rgba(255,255,255,.62); padding: .85rem .9rem; color: rgba(28,27,25,.65); font-size: .76rem; font-weight: 800; }
    .mzm-enhanced-save-row input { width: 1rem; height: 1rem; accent-color: var(--study-orange); }
    .mzm-catalog-status { border-radius: 1.1rem; padding: .78rem .9rem; background: rgba(255,255,255,.62); color: rgba(28,27,25,.5); font-size: .72rem; line-height: 1.35; font-weight: 800; }
    .mzm-collapsed-request-button { width: 100%; border: 0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-radius: 1.6rem; padding: 1rem 1.1rem; background: rgba(255,255,255,.9); color: #1c1b19; text-align: left; box-shadow: 0 14px 36px rgba(40,34,20,.05); }
    .mzm-collapsed-request-button b { display: block; font-size: 1rem; }
    .mzm-collapsed-request-button small { display: block; margin-top: .22rem; color: rgba(28,27,25,.48); font-weight: 700; line-height: 1.3; }
    .mzm-collapsed-request-button i { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: 999px; background: var(--study-orange); color: white; font-style: normal; font-weight: 900; }
  `;
  document.head.appendChild(style);
}

function runEnhancer() {
  injectStyles();
  Array.from(document.querySelectorAll<HTMLElement>("section")).forEach((section) => { void enhanceSection(section); });
}

export default function RequestFormEnhancer() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { scheduled = false; runEnhancer(); });
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
