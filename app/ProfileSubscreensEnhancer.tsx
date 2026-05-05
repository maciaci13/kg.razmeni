"use client";

import { useEffect } from "react";

type Kg = { id: string; name: string; district?: string | null; address?: string | null; type?: string | null };
type Catalog = { institutions?: Kg[]; districts?: string[] };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string; openRequest?: boolean };

const STYLE_ID = "mzm-profile-subscreens-style";
const PREF_KEY = "mzm.profile.defaults.v5";
const PREFILL_KEY = "mzm.request.prefill.v1";
const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];
const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"];

let catalogCache: Catalog | null = null;

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string | null | undefined) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function rawId(id: string) {
  return String(id || "").replace(/^catalog:/, "");
}

function catalogId(id: string) {
  const raw = rawId(id);
  return raw ? `catalog:${raw}` : "";
}

function readPrefs(): Prefs {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
}

function savePrefs(next: Prefs) {
  const merged = { ...readPrefs(), ...next };
  localStorage.setItem(PREF_KEY, JSON.stringify(merged));
  localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...merged, updatedAt: Date.now() }));
  window.dispatchEvent(new CustomEvent("mzm:prefs-updated", { detail: merged }));
}

async function getCatalog() {
  if (catalogCache) return catalogCache;
  try {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) return { institutions: [], districts: [] };
    catalogCache = await response.json() as Catalog;
    return catalogCache;
  } catch {
    return { institutions: [], districts: [] };
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-profile-clickable-row{cursor:pointer!important;-webkit-tap-highlight-color:transparent!important;transition:transform .14s ease,box-shadow .14s ease!important}.mzm-profile-clickable-row:active{transform:scale(.985)!important}.mzm-profile-subscreen{width:min(100%,28rem)!important;margin-inline:auto!important;padding-bottom:calc(6rem + env(safe-area-inset-bottom,0px))!important}.mzm-profile-subscreen-head{display:flex!important;align-items:center!important;gap:.85rem!important;margin-bottom:1rem!important}.mzm-profile-back{display:grid!important;place-items:center!important;width:3.15rem!important;height:3.15rem!important;border:0!important;border-radius:1.25rem!important;background:rgba(255,255,255,.86)!important;color:#1c1b19!important;font-size:1.55rem!important;font-weight:900!important;box-shadow:0 14px 34px rgba(28,27,25,.07)!important}.mzm-profile-kicker{margin:0!important;color:var(--study-orange,#f95e08)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.23em!important;text-transform:uppercase!important}.mzm-profile-subscreen h1{margin:.25rem 0 0!important;color:#1c1b19!important;font-size:clamp(2.3rem,10vw,3.35rem)!important;line-height:.94!important;font-weight:900!important;letter-spacing:-.07em!important}.mzm-profile-card{border-radius:2.15rem!important;background:rgba(255,255,255,.9)!important;padding:1.25rem!important;box-shadow:0 18px 48px rgba(28,27,25,.08)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}.mzm-profile-card+.mzm-profile-card{margin-top:1rem!important}.mzm-profile-copy{margin:.75rem 0 0!important;color:rgba(28,27,25,.58)!important;font-size:.96rem!important;line-height:1.5!important;font-weight:750!important}.mzm-profile-list{display:grid!important;gap:.7rem!important;margin-top:1rem!important}.mzm-profile-list-item{border-radius:1.35rem!important;background:#f7f5ef!important;padding:.95rem!important;color:rgba(28,27,25,.66)!important;font-size:.87rem!important;line-height:1.38!important;font-weight:800!important}.mzm-profile-form{display:grid!important;gap:.9rem!important}.mzm-profile-label{display:block!important;margin:0 0 .45rem!important;color:rgba(28,27,25,.42)!important;font-size:.68rem!important;font-weight:900!important;letter-spacing:.2em!important;text-transform:uppercase!important}.mzm-profile-select{width:100%!important;min-height:3.55rem!important;border:0!important;border-radius:1.35rem!important;background:#f7f5ef!important;color:#1c1b19!important;padding:0 1rem!important;font-size:.95rem!important;font-weight:900!important;outline:0!important;appearance:none!important}.mzm-profile-select-wrap{position:relative!important}.mzm-profile-select-wrap::after{content:'⌄'!important;position:absolute!important;right:1rem!important;top:50%!important;transform:translateY(-52%)!important;color:rgba(28,27,25,.55)!important;font-size:1.15rem!important;font-weight:900!important;pointer-events:none!important}.mzm-profile-save{width:100%!important;min-height:3.7rem!important;border:0!important;border-radius:999px!important;background:var(--study-orange,#f95e08)!important;color:#fff!important;font-size:.95rem!important;font-weight:900!important;box-shadow:0 16px 34px rgba(249,94,8,.22)!important}.mzm-profile-premium-hero{position:relative!important;overflow:hidden!important;border-radius:2.2rem!important;background:linear-gradient(145deg,rgba(255,240,227,.98),rgba(236,237,199,.9))!important;padding:1.35rem!important;box-shadow:0 22px 60px rgba(28,27,25,.1)!important}.mzm-profile-premium-hero::after{content:''!important;position:absolute!important;right:-2.6rem!important;top:-2.6rem!important;width:10rem!important;height:10rem!important;border-radius:999px!important;background:rgba(217,231,203,.85)!important;pointer-events:none!important}.mzm-profile-premium-hero>*{position:relative!important;z-index:1!important}.mzm-profile-premium-actions{display:grid!important;gap:.7rem!important;margin-top:1rem!important}.mzm-profile-premium-primary,.mzm-profile-premium-secondary{width:100%!important;min-height:3.55rem!important;border:0!important;border-radius:999px!important;padding:0 1rem!important;font-size:.92rem!important;font-weight:900!important}.mzm-profile-premium-primary{background:var(--study-orange,#f95e08)!important;color:#fff!important;box-shadow:0 16px 34px rgba(249,94,8,.22)!important}.mzm-profile-premium-secondary{background:rgba(255,255,255,.78)!important;color:#1c1b19!important}.mzm-profile-toast{position:fixed!important;left:50%!important;bottom:calc(7rem + env(safe-area-inset-bottom,0px))!important;z-index:13000!important;transform:translateX(-50%)!important;border-radius:999px!important;background:rgba(28,27,25,.82)!important;color:#fff!important;padding:.8rem 1rem!important;font-size:.85rem!important;font-weight:800!important;box-shadow:0 18px 42px rgba(28,27,25,.22)!important}
  `;
  document.head.appendChild(style);
}

function isProfileTab() {
  return Boolean(Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((button) => {
    const text = normalize(button.textContent);
    const active = button.className.includes("bg-orange") || button.getAttribute("aria-current") === "page" || button.dataset.active === "true";
    return active && text.includes("Профил");
  }));
}

function findProfileShell() {
  return Array.from(document.querySelectorAll<HTMLElement>(".mx-auto.max-w-md, section, div")).find((node) => {
    if (node.classList.contains("mzm-profile-subscreen")) return false;
    if (node.closest("nav.fixed.bottom-4")) return false;
    const text = normalize(node.textContent);
    return text.includes("Профил") && text.includes("Настройки") && (text.includes("Данни за детето") || text.includes("Данни за профила"));
  }) || null;
}

function removeSubscreen() {
  document.querySelectorAll<HTMLElement>(".mzm-profile-subscreen").forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>("[data-mzm-profile-hidden='true']").forEach((node) => {
    node.style.removeProperty("display");
    delete node.dataset.mzmProfileHidden;
  });
}

function showToast(text: string) {
  document.querySelectorAll(".mzm-profile-toast").forEach((node) => node.remove());
  const toast = document.createElement("div");
  toast.className = "mzm-profile-toast";
  toast.textContent = text;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function getTopBarOrShellAnchor(shell: HTMLElement) {
  const topBar = Array.from(document.querySelectorAll<HTMLElement>("div")).find((node) => {
    const text = normalize(node.textContent).toUpperCase();
    return (text.includes("РОДИТЕЛ") || text.includes("ПРОФИЛ")) && node.querySelectorAll("button").length >= 2;
  });
  return topBar || shell;
}

function openSubscreen(title: string, kicker: string, bodyHtml: string) {
  const shell = findProfileShell();
  if (!shell) return;
  removeSubscreen();
  shell.dataset.mzmProfileHidden = "true";
  shell.style.setProperty("display", "none", "important");

  const screen = document.createElement("div");
  screen.className = "mzm-profile-subscreen";
  screen.innerHTML = `
    <div class="mzm-profile-subscreen-head">
      <button type="button" class="mzm-profile-back" aria-label="Назад">‹</button>
      <div><p class="mzm-profile-kicker">${escapeHtml(kicker)}</p><h1>${title}</h1></div>
    </div>${bodyHtml}`;
  screen.querySelector<HTMLButtonElement>(".mzm-profile-back")?.addEventListener("click", removeSubscreen);
  getTopBarOrShellAnchor(shell).insertAdjacentElement("afterend", screen);
}

function selectMarkup(name: string, label: string, options: { value: string; label: string }[], value = "") {
  return `<label><span class="mzm-profile-label">${escapeHtml(label)}</span><span class="mzm-profile-select-wrap"><select class="mzm-profile-select" name="${escapeHtml(name)}">${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></span></label>`;
}

async function openProfileDataScreen() {
  const catalog = await getCatalog();
  const prefs = readPrefs();
  const institutions = catalog.institutions || [];
  const districts = catalog.districts?.length ? catalog.districts : Array.from(new Set(institutions.map((kg) => kg.district).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "bg"));
  const fromRaw = rawId(prefs.from || "");

  const body = `
    <section class="mzm-profile-card"><p class="mzm-profile-copy" style="margin-top:0!important">Тези данни помагат на системата да предлага по-точни потенциални съвпадения. Можеш да ги редактираш по всяко време.</p><form class="mzm-profile-form" data-mzm-profile-form style="margin-top:1rem!important">
      ${selectMarkup("district", "Район", [{ value: "", label: "Избери район" }, ...districts.map((district) => ({ value: district, label: district }))], prefs.district || "")}
      ${selectMarkup("year", "Набор", [{ value: "", label: "Избери набор" }, ...YEARS.map((year) => ({ value: year, label: year }))], prefs.year || "")}
      ${selectMarkup("placeType", "Тип място", [{ value: "", label: "Избери тип място" }, ...PLACE_TYPES.map((type) => ({ value: type, label: type }))], prefs.placeType || "")}
      ${selectMarkup("from", "Сегашна градина, ако има", [{ value: "", label: "Още не посещава / не искам да избера" }, ...institutions.map((kg) => ({ value: rawId(kg.id), label: `${kg.name}${kg.district ? ` · ${kg.district}` : ""}` }))], fromRaw)}
      <button type="submit" class="mzm-profile-save">Запази данните</button></form></section>`;

  openSubscreen("Данни за профила", "Профил", body);

  document.querySelector<HTMLFormElement>("[data-mzm-profile-form]")?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    savePrefs({
      district: String(data.get("district") || ""),
      year: String(data.get("year") || ""),
      placeType: String(data.get("placeType") || ""),
      from: catalogId(String(data.get("from") || ""))
    });
    showToast("Данните са запазени.");
  });
}

function openPrivacyScreen() {
  openSubscreen("Поверителност", "Сигурност", `<section class="mzm-profile-card"><p class="mzm-profile-copy" style="margin-top:0!important">Място За Място е създадено така, че да показва само информацията, нужна за потенциална координация между родители — не повече.</p><div class="mzm-profile-list"><div class="mzm-profile-list-item">Другите родители не виждат личните ти данни, документи или чувствителна информация.</div><div class="mzm-profile-list-item">Заявката се използва само за търсене на потенциален маршрут между съвместими места.</div><div class="mzm-profile-list-item">Чатовете се отключват само когато всички страни в потенциалния цикъл потвърдят интерес.</div><div class="mzm-profile-list-item">Не публикувай ЕГН, медицински документи, адреси или снимки на деца в чата.</div></div></section>`);
}

function openRulesScreen() {
  openSubscreen("Правила и безопасност", "Важно", `<section class="mzm-profile-card"><p class="mzm-profile-copy" style="margin-top:0!important">Платформата помага на родителите да се открият и координират. Тя не е официална общинска система и не гарантира прием, преместване или размяна.</p><div class="mzm-profile-list"><div class="mzm-profile-list-item">Не се продават места. Не се договарят плащания, услуги или обещания за прием.</div><div class="mzm-profile-list-item">Всяка реална промяна трябва да мине по официалния ред и през съответните институции.</div><div class="mzm-profile-list-item">Потвърждението в app-а означава само интерес за координация, не административно одобрение.</div><div class="mzm-profile-list-item">Ако нещо изглежда съмнително, прекрати разговора и не споделяй допълнителни данни.</div></div></section>`);
}

function openSupportScreen() {
  openSubscreen("Подкрепи проекта", "Каузата", `<section class="mzm-profile-premium-hero"><p class="mzm-profile-copy" style="margin-top:0!important;color:rgba(28,27,25,.68)!important">Място За Място е малък независим проект с голяма цел: повече родители да намират път един към друг, без шум, хаос и безкрайно ровене по групите.</p><div class="mzm-profile-list"><div class="mzm-profile-list-item">Помагаш да поддържаме каталога, търсенето и match логиката актуални.</div><div class="mzm-profile-list-item">Помагаш проектът да остане независим, човешки и без агресивни реклами.</div><div class="mzm-profile-list-item">Колкото повече родители се включат, толкова по-голям шанс има за реални съвпадения.</div></div><div class="mzm-profile-premium-actions"><button type="button" class="mzm-profile-premium-primary" data-mzm-open-share>Сподели с родители</button><button type="button" class="mzm-profile-premium-secondary" data-mzm-support-interest>Искам да подкрепя финансово</button></div></section><section class="mzm-profile-card"><p class="mzm-profile-kicker">Founding support</p><p class="mzm-profile-copy">Скоро ще добавим лесен начин за малка подкрепа — като “кафе за проекта”. Не купуваш предимство в системата, а помагаш тя да съществува.</p></section>`);
  document.querySelector<HTMLButtonElement>("[data-mzm-support-interest]")?.addEventListener("click", () => showToast("Ще добавим опция за подкрепа скоро."));
}

function bindProfileRows() {
  if (!isProfileTab()) { removeSubscreen(); return; }
  const rows = Array.from(document.querySelectorAll<HTMLElement>("section div, section button, article, a"));
  rows.forEach((row) => {
    if (row.closest(".mzm-profile-subscreen") || row.closest("nav.fixed.bottom-4")) return;
    const text = normalize(row.textContent);
    if (!text) return;
    if (text.includes("Данни за детето")) row.innerHTML = row.innerHTML.replace("Данни за детето", "Данни за профила").replace("Набор, район и тип място", "Район, набор, тип място и сегашна градина");
    const updatedText = normalize(row.textContent);
    let action: (() => void) | null = null;
    if (updatedText.includes("Данни за профила")) action = () => void openProfileDataScreen();
    else if (updatedText.includes("Поверителност")) action = openPrivacyScreen;
    else if (updatedText.includes("Правила и безопасност")) action = openRulesScreen;
    else if (updatedText.includes("Подкрепи проекта")) action = openSupportScreen;
    if (!action) return;
    row.classList.add("mzm-profile-clickable-row");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    if (row.dataset.mzmProfileBound === "true") return;
    row.dataset.mzmProfileBound = "true";
    row.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); action?.(); });
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action?.(); } });
  });
}

export default function ProfileSubscreensEnhancer() {
  useEffect(() => {
    injectStyles();
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { scheduled = false; bindProfileRows(); });
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "data-active", "aria-current"] });
    const interval = window.setInterval(schedule, 600);
    return () => { observer.disconnect(); window.clearInterval(interval); removeSubscreen(); };
  }, []);
  return null;
}
