"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-request-polish-styles";
const ROOT_ID = "mzm-request-polish-root";
const PREF_KEY = "mzm.profile.defaults.v5";
const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

type CatalogInstitution = { id: string; name: string; district?: string | null; address?: string | null };
type Catalog = { generatedAt: string; districts: string[]; years: string[]; institutions?: CatalogInstitution[] };
type Snapshot = {
  users?: Array<{ id: string; display_name: string }>;
  kindergartens?: CatalogInstitution[];
  requests?: Array<{ id: string; user_id: string; from_kindergarten_id: string; is_active: boolean; is_locked?: boolean; child_group_year_or_age_group: string }>;
  wantedKindergartens?: Array<{ id: string; request_id: string; wanted_kindergarten_id: string; priority_order: number }>;
};
type ApiSnapshot = Snapshot & { error?: string };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string; openRequest?: boolean };
type CardData = { requestId?: string; fromText: string; wantedText: string; ageGroup: string; placeType: string; locked?: boolean };

function getPrefs(): Prefs {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(prefs: Prefs) { localStorage.setItem(PREF_KEY, JSON.stringify({ ...getPrefs(), ...prefs })); }
function option(value: string, labelText: string) { const o = document.createElement("option"); o.value = value; o.textContent = labelText; return o; }
function label(text: string) { const el = document.createElement("label"); el.className = "mzm-form-label"; el.textContent = text; return el; }
function select(placeholder: string) { const wrap = document.createElement("div"); wrap.className = "mzm-select-wrap"; const sel = document.createElement("select"); sel.className = "mzm-select"; sel.appendChild(option("", placeholder)); wrap.appendChild(sel); return [wrap, sel] as const; }
function valueOf(item: CatalogInstitution) { return item.id.startsWith("catalog:") ? item.id : `catalog:${item.id}`; }
function rawId(id: string) { return id.replace(/^catalog:/, ""); }
function labelOf(item: CatalogInstitution) { return `${item.name}${item.district ? ` · ${item.district}` : ""}${item.address ? ` · ${item.address}` : ""}`; }
function shortName(value: string) { return value.split(" · ")[0]?.trim() || value || "—"; }
function sortItems(items: CatalogInstitution[]) { return [...items].sort((a, b) => `${a.district ?? ""}-${a.name}-${a.address ?? ""}`.localeCompare(`${b.district ?? ""}-${b.name}-${b.address ?? ""}`, "bg")); }
function currentYearOptions() { const y = new Date().getFullYear(); return Array.from({ length: 7 }, (_, i) => String(y - i)); }
function escapeHtml(value: string) { return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char)); }

async function getJson<T>(url: string): Promise<T | null> {
  try { const response = await fetch(url, { cache: "no-store" }); return response.ok ? await response.json() : null; } catch { return null; }
}

function findRequestFormSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
    const text = section.textContent || "";
    return text.includes("Имаме място") && text.includes("Желана градина") && text.includes("Активирай заявка");
  }) || null;
}
function findMyRequestsSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Моите заявки") || null;
}
function getSelectedUserId(snapshot: Snapshot | null) { return snapshot?.users?.[0]?.id || ""; }

function removeOldRequestUi(myRequestsSection: HTMLElement) {
  Array.from(myRequestsSection.children).forEach((child) => {
    const item = child as HTMLElement;
    if (item.classList.contains("mzm-carousel-shell") || item.dataset.mzmShareCard) return;
    const text = (item.textContent || "").replace(/\s+/g, " ").trim();
    const isEmpty = text.includes("Няма активна заявка") && text.length < 240;
    const isLegacyCard = text.includes("Активна") && text.includes("Деактивирай") && text.includes("Изтрий");
    if (isEmpty || isLegacyCard) item.remove();
  });
}

function getActiveIndex(shell: HTMLElement) { const index = Number(shell.dataset.activeIndex || "0"); return Number.isFinite(index) ? index : 0; }
function setActiveIndex(shell: HTMLElement, index: number) {
  const cards = Array.from(shell.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true']"));
  if (!cards.length) { shell.dataset.activeIndex = "0"; updateCarouselState(shell); return; }
  const next = ((index % cards.length) + cards.length) % cards.length;
  shell.dataset.activeIndex = String(next);
  updateCarouselState(shell);
}
function moveStack(shell: HTMLElement, direction: number) { setActiveIndex(shell, getActiveIndex(shell) + direction); }

function getOrCreateCarouselShell(myRequestsSection: HTMLElement) {
  let shell = myRequestsSection.querySelector<HTMLElement>(".mzm-carousel-shell");
  if (shell) return shell;
  shell = document.createElement("div");
  shell.className = "mzm-carousel-shell";
  shell.dataset.activeIndex = "0";
  shell.innerHTML = `<div class="mzm-request-carousel" aria-label="Активни заявки"></div><div class="mzm-carousel-dots" aria-label="Навигация по заявки"></div>`;
  myRequestsSection.querySelector("h2")?.insertAdjacentElement("afterend", shell);
  const stage = shell.querySelector<HTMLElement>(".mzm-request-carousel");
  let startX = 0;
  let startY = 0;
  stage?.addEventListener("pointerdown", (event) => { startX = event.clientX; startY = event.clientY; }, { passive: true });
  stage?.addEventListener("pointerup", (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) moveStack(shell as HTMLElement, dx < 0 ? 1 : -1);
  }, { passive: true });
  return shell;
}

function placeShareAfterCarousel() {
  const myRequestsSection = findMyRequestsSection();
  if (!myRequestsSection) return;
  const shell = myRequestsSection.querySelector<HTMLElement>(".mzm-carousel-shell");
  const share = myRequestsSection.querySelector<HTMLElement>("[data-mzm-share-card='true']");
  if (shell && share && share.previousElementSibling !== shell) shell.insertAdjacentElement("afterend", share);
}

function updateCarouselState(shell: HTMLElement) {
  const dots = shell.querySelector<HTMLElement>(".mzm-carousel-dots");
  if (!dots) return;
  const cards = Array.from(shell.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true']"));
  const activeIndex = cards.length ? ((getActiveIndex(shell) % cards.length) + cards.length) % cards.length : 0;
  shell.dataset.activeIndex = String(activeIndex);
  cards.forEach((card, index) => {
    const forward = (index - activeIndex + cards.length) % cards.length;
    const backward = (activeIndex - index + cards.length) % cards.length;
    card.classList.toggle("is-active-card", forward === 0);
    card.classList.toggle("is-next-card", forward === 1);
    card.classList.toggle("is-next-next-card", forward === 2);
    card.classList.toggle("is-prev-card", backward === 1);
    card.classList.toggle("is-hidden-card", forward > 2 && backward > 1);
  });
  dots.innerHTML = "";
  cards.forEach((_card, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = index === activeIndex ? "is-active" : "";
    dot.setAttribute("aria-label", `Заявка ${index + 1}`);
    dot.addEventListener("click", () => setActiveIndex(shell, index));
    dots.appendChild(dot);
  });
  shell.classList.toggle("has-multiple", cards.length > 1);
}

function hasActiveCards() { return Boolean(document.querySelector("[data-mzm-active-request-card='true']")); }
function setFormMode(section: HTMLElement, mode: "expanded" | "collapsed") {
  const hasActive = hasActiveCards();
  section.classList.toggle("has-active-requests", hasActive);
  if (!hasActive) section.classList.remove("is-collapsed");
  else section.classList.toggle("is-collapsed", mode === "collapsed");
}
function forceOpenForm(section: HTMLElement) {
  section.classList.remove("is-collapsed");
  section.classList.add("has-active-requests");
  const inner = section.querySelector<HTMLElement>(".mzm-form-inner");
  inner?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createRequestCard(data: CardData) {
  const card = document.createElement("article");
  card.className = "mzm-request-card";
  card.dataset.mzmActiveRequestCard = "true";
  if (data.requestId) card.dataset.requestId = data.requestId;
  card.innerHTML = `<details class="mzm-card-menu"><summary aria-label="Опции за заявката">•••</summary><div class="mzm-card-menu-popover"><button type="button" data-action="deactivate">Деактивирай</button><button type="button" data-action="delete">Изтрий</button></div></details><div class="mzm-request-card-content"><p>Активна · ${escapeHtml(data.placeType)}</p><h3><span>${escapeHtml(data.fromText)}</span><b>→</b><span>${escapeHtml(data.wantedText)}</span></h3><em>Набор ${escapeHtml(data.ageGroup)}</em>${data.locked ? `<mark>MATCH</mark>` : ``}</div>`;
  const deactivate = card.querySelector<HTMLButtonElement>("[data-action='deactivate']");
  const remove = card.querySelector<HTMLButtonElement>("[data-action='delete']");
  const menu = card.querySelector<HTMLDetailsElement>(".mzm-card-menu");
  deactivate?.addEventListener("click", async () => {
    if (!data.requestId) return;
    deactivate.disabled = true;
    await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deactivateRequest", requestId: data.requestId }) });
    menu?.removeAttribute("open");
    card.classList.add("is-inactive");
  });
  remove?.addEventListener("click", async () => {
    if (!data.requestId) return;
    remove.disabled = true;
    await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteRequest", requestId: data.requestId }) });
    const shell = card.closest<HTMLElement>(".mzm-carousel-shell");
    card.remove();
    if (shell) updateCarouselState(shell);
    const form = document.querySelector<HTMLElement>(".mzm-request-form-card");
    if (form) setFormMode(form, "expanded");
  });
  return card;
}

function upsertCard(data: CardData) {
  const myRequestsSection = findMyRequestsSection();
  if (!myRequestsSection) return;
  removeOldRequestUi(myRequestsSection);
  const shell = getOrCreateCarouselShell(myRequestsSection);
  const stage = shell.querySelector<HTMLElement>(".mzm-request-carousel");
  if (!stage) return;
  if (data.requestId) Array.from(stage.querySelectorAll<HTMLElement>("[data-request-id]")).find((card) => card.dataset.requestId === data.requestId)?.remove();
  const card = createRequestCard(data);
  stage.appendChild(card);
  placeShareAfterCarousel();
  requestAnimationFrame(() => {
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true']"));
    setActiveIndex(shell, Math.max(0, cards.length - 1));
  });
}

function addInstitutionToMap(map: Map<string, CatalogInstitution>, kg: CatalogInstitution) {
  map.set(kg.id, kg);
  map.set(rawId(kg.id), kg);
  map.set(valueOf(kg), kg);
  map.set(`catalog:${rawId(kg.id)}`, kg);
}
function findInstitution(map: Map<string, CatalogInstitution>, id: string) { return map.get(id) || map.get(rawId(id)) || map.get(`catalog:${rawId(id)}`); }

function hydrateExistingCards(snapshot: Snapshot | null, placeType: string, catalogInstitutions: CatalogInstitution[]) {
  const userId = getSelectedUserId(snapshot);
  const requests = (snapshot?.requests || []).filter((request) => request.user_id === userId && request.is_active);
  if (!requests.length) return false;
  const kgById = new Map<string, CatalogInstitution>();
  catalogInstitutions.forEach((kg) => addInstitutionToMap(kgById, kg));
  (snapshot?.kindergartens || []).forEach((kg) => addInstitutionToMap(kgById, kg));
  const wantedByRequest = new Map((snapshot?.wantedKindergartens || []).map((wanted) => [wanted.request_id, wanted]));
  requests.forEach((request) => {
    const wanted = wantedByRequest.get(request.id);
    const from = findInstitution(kgById, request.from_kindergarten_id);
    const wantedKg = wanted ? findInstitution(kgById, wanted.wanted_kindergarten_id) : undefined;
    upsertCard({ requestId: request.id, fromText: from?.name || "Избрана градина", wantedText: wantedKg?.name || "Желана градина", ageGroup: request.child_group_year_or_age_group || "—", placeType, locked: request.is_locked });
  });
  return true;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{display:block}.mzm-request-form-card{border-radius:2.2rem;background:rgba(255,255,255,.92);padding:1rem;box-shadow:0 18px 48px rgba(40,34,20,.08);backdrop-filter:blur(10px);overflow:hidden}.mzm-request-form-card *{box-sizing:border-box}
    .mzm-form-close{display:none;width:100%;border:0;border-radius:1.35rem;background:#fff;margin-bottom:.75rem;padding:.85rem 1rem;text-align:left;align-items:center;justify-content:space-between;gap:1rem;font-size:.78rem;font-weight:900;color:#1c1b19;box-shadow:0 10px 22px rgba(33,28,17,.04)}.mzm-form-close span{display:grid;place-items:center;width:1.9rem;height:1.9rem;border-radius:999px;background:#f7f5ef}.mzm-request-form-card.has-active-requests:not(.is-collapsed) .mzm-form-close{display:flex}
    .mzm-form-inner{display:grid;gap:.72rem;border-radius:1.8rem;background:#f7f5ef;padding:1rem;overflow:hidden}.mzm-form-label{margin-top:.35rem;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:rgba(28,27,25,.42)}
    .mzm-select-wrap{position:relative;width:100%;min-width:0;overflow:hidden}.mzm-select{width:100%;appearance:none;border:0;outline:0;border-radius:1.35rem;background:rgba(255,255,255,.86);padding:1rem 3rem 1rem 1rem;font-size:.88rem;font-weight:800;color:#1c1b19}.mzm-select-wrap:after{content:'⌄';position:absolute;right:1.15rem;top:50%;transform:translateY(-54%);font-weight:900;color:rgba(28,27,25,.58);pointer-events:none}
    .mzm-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.mzm-type-grid button{border:0;border-radius:1.05rem;padding:.85rem .75rem;background:rgba(255,255,255,.76);color:#1c1b19;text-align:left;font-weight:900;font-size:.75rem}.mzm-type-grid button.is-active{background:var(--study-orange,#ff5a14);color:white}
    .mzm-save-row{display:flex;gap:.65rem;align-items:center;border-radius:1.25rem;background:rgba(255,255,255,.66);padding:.85rem .9rem;color:rgba(28,27,25,.65);font-size:.76rem;font-weight:800}.mzm-save-row input{width:1rem;height:1rem;accent-color:var(--study-orange,#ff5a14)}
    .mzm-submit{margin-top:1rem;width:100%;border:0;border-radius:999px;background:var(--study-orange,#ff5a14);padding:1rem 1.25rem;color:white;font-weight:900;font-size:.9rem;box-shadow:0 16px 34px rgba(255,90,20,.24)}.mzm-submit:disabled{opacity:.42;background:#ffc0aa}.mzm-note{margin-top:.75rem;text-align:center;color:rgba(28,27,25,.45);font-size:.78rem;font-weight:700;line-height:1.45}.mzm-status{display:none!important}
    .mzm-collapsed{display:none}.mzm-toggle-open{width:100%;border:0;border-radius:1.8rem;background:#f7f5ef;padding:1rem;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:1rem}.mzm-toggle-open p{margin:0;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:rgba(28,27,25,.42)}.mzm-toggle-open h3{margin:.38rem 0 0;font-size:1.05rem;line-height:1.15;font-weight:900;color:#1c1b19}.mzm-toggle-open span{display:grid;place-items:center;width:2.35rem;height:2.35rem;border-radius:999px;background:white;color:#1c1b19;font-size:1.2rem;font-weight:900;box-shadow:0 10px 22px rgba(33,28,17,.04)}
    .mzm-request-form-card.is-collapsed .mzm-form-close,.mzm-request-form-card.is-collapsed .mzm-form-inner,.mzm-request-form-card.is-collapsed .mzm-submit,.mzm-request-form-card.is-collapsed .mzm-note{display:none}.mzm-request-form-card.is-collapsed .mzm-collapsed{display:block}
    .mzm-carousel-shell{position:relative;margin:.45rem 0 .75rem;padding:.25rem 0 .45rem;overflow:visible;perspective:900px}.mzm-request-carousel{position:relative;height:16.8rem;overflow:visible;touch-action:pan-y;user-select:none}.mzm-request-card{position:absolute;inset:.55rem .85rem 1.05rem;border-radius:2rem;background:#ECECC7;padding:1.25rem;box-shadow:0 18px 42px rgba(40,34,20,.08);opacity:0;pointer-events:none;transform-origin:center center;transition:transform 280ms cubic-bezier(.2,.8,.2,1),opacity 240ms ease,box-shadow 240ms ease;will-change:transform,opacity}.mzm-request-card.is-active-card{z-index:5;opacity:1;pointer-events:auto;transform:translateX(0) translateY(0) rotate(0deg) scale(1);box-shadow:0 24px 60px rgba(40,34,20,.14)}.mzm-request-card.is-next-card{z-index:4;opacity:.72;transform:translateX(.78rem) translateY(.35rem) rotate(3deg) scale(.955)}.mzm-request-card.is-next-next-card{z-index:3;opacity:.42;transform:translateX(1.38rem) translateY(.7rem) rotate(6deg) scale(.91)}.mzm-request-card.is-prev-card{z-index:2;opacity:.26;transform:translateX(-.9rem) translateY(.5rem) rotate(-4deg) scale(.92)}.mzm-request-card.is-hidden-card{z-index:1;opacity:0;transform:translateX(2.2rem) translateY(1rem) rotate(8deg) scale(.86)}.mzm-request-card.is-inactive{opacity:.5}
    .mzm-request-card-content{padding-right:2.8rem}.mzm-request-card-content p{margin:0;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.2em;color:rgba(28,27,25,.42)}.mzm-request-card-content h3{margin:.55rem 0 0;display:grid;gap:.35rem;font-size:1.08rem;line-height:1.12;font-weight:900;color:#1c1b19}.mzm-request-card-content h3 b{font-size:1.25rem}.mzm-request-card-content em{display:block;margin-top:.75rem;font-style:normal;font-size:.9rem;font-weight:800;color:rgba(28,27,25,.55)}.mzm-request-card-content mark{display:inline-block;margin-top:.85rem;border-radius:999px;background:rgba(255,255,255,.7);padding:.5rem .75rem;font-size:.7rem;font-weight:900;color:#1c1b19}
    .mzm-card-menu{position:absolute;top:1rem;right:1rem;z-index:6}.mzm-card-menu summary{list-style:none;width:2.45rem;height:2.45rem;border-radius:999px;background:rgba(255,255,255,.74);display:grid;place-items:center;font-size:1.15rem;font-weight:900;letter-spacing:.04em;color:#1c1b19;cursor:pointer;box-shadow:0 10px 22px rgba(33,28,17,.05)}.mzm-card-menu summary::-webkit-details-marker{display:none}.mzm-card-menu[open] summary{background:#fff}.mzm-card-menu-popover{position:absolute;right:0;top:2.75rem;min-width:10.5rem;border-radius:1.1rem;background:rgba(255,255,255,.96);padding:.35rem;box-shadow:0 18px 38px rgba(33,28,17,.16);backdrop-filter:blur(12px)}.mzm-card-menu-popover button{width:100%;border:0;background:transparent;border-radius:.85rem;padding:.8rem .85rem;text-align:left;font-size:.78rem;font-weight:900;color:#1c1b19}.mzm-card-menu-popover button[data-action='delete']{color:var(--study-orange,#ff5a14)}
    .mzm-carousel-dots{display:flex;justify-content:center;gap:.38rem;margin:.05rem 0 .25rem}.mzm-carousel-dots button{width:.42rem;height:.42rem;border:0;border-radius:999px;background:rgba(28,27,25,.18);padding:0;transition:width 180ms ease,background 180ms ease}.mzm-carousel-dots button.is-active{width:1.15rem;background:var(--study-orange,#ff5a14)}
  `;
  document.head.appendChild(style);
}

async function mount() {
  injectStyles();
  const section = findRequestFormSection();
  if (!section || section.dataset.mzmRequestPolished === "true") return;
  const formSection: HTMLElement = section;
  const [catalog, snapshot] = await Promise.all([getJson<Catalog>("/api/catalog"), getJson<Snapshot>("/api/playground")]);
  const prefs = getPrefs();
  const institutions = sortItems(catalog?.institutions?.length ? catalog.institutions : snapshot?.kindergartens || []);
  const districts = catalog?.districts?.length ? catalog.districts : Array.from(new Set(institutions.map((i) => i.district).filter(Boolean) as string[]));
  const years = catalog?.years?.length ? catalog.years : currentYearOptions();
  formSection.dataset.mzmRequestPolished = "true";
  formSection.innerHTML = "";
  formSection.className = "mzm-request-form-card";
  const root = document.createElement("div"); root.id = ROOT_ID;
  const closeToggle = document.createElement("button"); closeToggle.type = "button"; closeToggle.className = "mzm-form-close"; closeToggle.innerHTML = `Активирай заявка <span>⌃</span>`; closeToggle.addEventListener("click", () => setFormMode(formSection, "collapsed"));
  const inner = document.createElement("div"); inner.className = "mzm-form-inner";
  const [districtWrap, districtSelect] = select("Избери район"); districts.forEach((d) => districtSelect.appendChild(option(d, d))); if (prefs.district && districts.includes(prefs.district)) districtSelect.value = prefs.district;
  const [yearWrap, yearSelect] = select("Избери набор / група"); years.forEach((y) => yearSelect.appendChild(option(y, y))); if (prefs.year && years.includes(prefs.year)) yearSelect.value = prefs.year;
  const typeGrid = document.createElement("div"); typeGrid.className = "mzm-type-grid"; let selectedType = prefs.placeType || PLACE_TYPES[0];
  function paintTypes() { typeGrid.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.classList.toggle("is-active", b.dataset.value === selectedType)); }
  PLACE_TYPES.forEach((type) => { const btn = document.createElement("button"); btn.type = "button"; btn.dataset.value = type; btn.textContent = type; btn.onclick = () => { selectedType = type; paintTypes(); maybeSave(); }; typeGrid.appendChild(btn); }); paintTypes();
  const saveRow = document.createElement("label"); saveRow.className = "mzm-save-row"; const save = document.createElement("input"); save.type = "checkbox"; save.checked = true; const saveText = document.createElement("span"); saveText.textContent = "Запази тези данни в профила ми"; saveRow.append(save, saveText);
  const [fromWrap, fromSelect] = select("Избери сегашна градина");
  const [wantedWrap, wantedSelect] = select("Избери желана градина");
  const status = document.createElement("div"); status.className = "mzm-status";
  function filtered() { return institutions.filter((item) => !districtSelect.value || item.district === districtSelect.value); }
  function fillSelect(target: HTMLSelectElement, placeholder: string, preferred?: string) {
    target.innerHTML = ""; target.appendChild(option("", placeholder));
    const pool = target === wantedSelect && preferred ? institutions : filtered();
    pool.forEach((item) => target.appendChild(option(valueOf(item), labelOf(item))));
    if (preferred && Array.from(target.options).some((o) => o.value === preferred)) target.value = preferred;
  }
  function rebuild(preferredFrom?: string, preferredWanted?: string) { fillSelect(fromSelect, "Избери сегашна градина", preferredFrom ?? fromSelect.value); fillSelect(wantedSelect, "Избери желана градина", preferredWanted ?? wantedSelect.value); maybeSave(); updateSubmit(); }
  function maybeSave() { if (save.checked) savePrefs({ district: districtSelect.value, year: yearSelect.value, placeType: selectedType, from: fromSelect.value, wanted: wantedSelect.value }); }
  function updateSubmit() { submit.disabled = !districtSelect.value || !yearSelect.value || !fromSelect.value || !wantedSelect.value || fromSelect.value === wantedSelect.value; }
  function applyPrefs(next: Prefs, open = false) {
    if (next.district && districts.includes(next.district)) districtSelect.value = next.district;
    if (next.year && years.includes(next.year)) yearSelect.value = next.year;
    if (next.placeType) { selectedType = next.placeType; paintTypes(); }
    rebuild(next.from || fromSelect.value, next.wanted || wantedSelect.value);
    fromSelect.dispatchEvent(new Event("change", { bubbles: true }));
    wantedSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (open || next.openRequest) forceOpenForm(formSection);
  }
  inner.append(label("Район"), districtWrap, label("Набор / група"), yearWrap, label("Тип място"), typeGrid, saveRow, label("Сегашна градина"), fromWrap, label("Желана градина"), wantedWrap, status);
  const submit = document.createElement("button"); submit.type = "button"; submit.className = "mzm-submit"; submit.textContent = "Активирай заявка";
  const note = document.createElement("p"); note.className = "mzm-note"; note.textContent = "Заявката ще се скрие автоматично при потенциален цикъл.";
  const collapsed = document.createElement("div"); collapsed.className = "mzm-collapsed"; collapsed.innerHTML = `<button type="button" class="mzm-toggle-open"><div><p>Нова заявка</p><h3>Активирай заявка</h3></div><span>⌄</span></button>`; collapsed.querySelector("button")?.addEventListener("click", () => setFormMode(formSection, "expanded"));
  districtSelect.onchange = () => rebuild(); yearSelect.onchange = () => { maybeSave(); updateSubmit(); }; fromSelect.onchange = () => { maybeSave(); updateSubmit(); }; wantedSelect.onchange = () => { maybeSave(); updateSubmit(); }; save.onchange = maybeSave;
  window.addEventListener("mzm:prefs-updated", ((event: Event) => { applyPrefs((event as CustomEvent<Prefs>).detail || getPrefs(), Boolean((event as CustomEvent<Prefs>).detail?.openRequest)); }) as EventListener);
  window.addEventListener("mzm:open-request-form", () => forceOpenForm(formSection));
  submit.onclick = async () => {
    updateSubmit(); if (submit.disabled) return;
    const userId = getSelectedUserId(snapshot); if (!userId) return;
    const fromText = shortName(fromSelect.options[fromSelect.selectedIndex]?.textContent || "—");
    const wantedText = shortName(wantedSelect.options[wantedSelect.selectedIndex]?.textContent || "—");
    const ageGroup = yearSelect.value;
    submit.disabled = true; submit.textContent = "Записвам...";
    const response = await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "createRequest", userId, fromKindergartenId: fromSelect.value, wantedKindergartenId: wantedSelect.value, ageGroup }) });
    const data = await response.json().catch(() => null) as ApiSnapshot | null;
    if (!response.ok || !data || data.error) { submit.textContent = "Активирай заявка"; updateSubmit(); return; }
    const created = data.requests?.find((request) => request.user_id === userId && request.child_group_year_or_age_group === ageGroup);
    savePrefs({ district: districtSelect.value, year: ageGroup, placeType: selectedType, from: fromSelect.value, wanted: wantedSelect.value, openRequest: false });
    upsertCard({ requestId: created?.id, fromText, wantedText, ageGroup, placeType: selectedType, locked: created?.is_locked });
    setFormMode(formSection, "collapsed"); submit.textContent = "Активирай заявка";
  };
  root.append(closeToggle, inner, submit, note, collapsed); formSection.appendChild(root); rebuild(prefs.from, prefs.wanted);
  const hasExisting = hydrateExistingCards(snapshot, selectedType, institutions); setFormMode(formSection, hasExisting ? "collapsed" : "expanded"); if (prefs.openRequest) forceOpenForm(formSection); placeShareAfterCarousel();
}
function run() { void mount(); }
export default function RequestFormHardReset() { useEffect(() => { run(); const observer = new MutationObserver(run); observer.observe(document.documentElement, { childList: true, subtree: true }); return () => observer.disconnect(); }, []); return null; }
