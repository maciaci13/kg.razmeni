"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-hard-request-reset-styles";
const ROOT_ID = "mzm-hard-request-reset-root";
const PREF_KEY = "mzm.profile.defaults.v4";
const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

type CatalogInstitution = { id: string; name: string; district?: string | null; address?: string | null };
type Catalog = { generatedAt: string; districts: string[]; years: string[]; institutions?: CatalogInstitution[] };
type Snapshot = { users?: Array<{ id: string; display_name: string }>; kindergartens?: CatalogInstitution[] };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string };

function getPrefs(): Prefs {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(prefs: Prefs) { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
function option(value: string, label: string) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}
function label(text: string) {
  const item = document.createElement("label");
  item.className = "mzm-hard-label";
  item.textContent = text;
  return item;
}
function select(placeholder: string) {
  const wrap = document.createElement("div");
  wrap.className = "mzm-hard-select-wrap";
  const item = document.createElement("select");
  item.className = "mzm-hard-select";
  item.appendChild(option("", placeholder));
  wrap.appendChild(item);
  return [wrap, item] as const;
}
function valueOf(item: CatalogInstitution) { return item.id.startsWith("catalog:") ? item.id : `catalog:${item.id}`; }
function labelOf(item: CatalogInstitution) { return `${item.name}${item.district ? ` · ${item.district}` : ""}${item.address ? ` · ${item.address}` : ""}`; }
function shortName(label: string) { return label.split(" · ")[0]?.trim() || label; }
function sortItems(items: CatalogInstitution[]) { return [...items].sort((a, b) => `${a.district ?? ""}-${a.name}-${a.address ?? ""}`.localeCompare(`${b.district ?? ""}-${b.name}-${b.address ?? ""}`, "bg")); }
function currentYearOptions() { const y = new Date().getFullYear(); return Array.from({ length: 7 }, (_, i) => String(y - i)); }

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function findRequestsSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
    const text = section.textContent || "";
    return text.includes("Имаме място") && text.includes("Желана градина") && text.includes("Активирай заявка");
  }) || null;
}

function findMyRequestsSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
    const heading = section.querySelector("h2");
    return heading?.textContent?.trim() === "Моите заявки";
  }) || null;
}

function findInviteCard(myRequestsSection: HTMLElement) {
  return Array.from(myRequestsSection.children).find((child) => child.textContent?.includes("Покани други родители")) as HTMLElement | undefined;
}

function findSelectedUserId(snapshot: Snapshot | null) {
  const users = snapshot?.users || [];
  return users[0]?.id || "";
}

function renderActiveRequestCard(params: {
  fromText: string;
  wantedText: string;
  ageGroup: string;
  placeType: string;
  requestId?: string;
}) {
  const card = document.createElement("div");
  card.className = "mzm-hard-active-card";
  card.dataset.mzmHardActiveRequest = "true";
  card.innerHTML = `
    <div class="mzm-hard-active-head">
      <div>
        <p>Активна · ${params.placeType}</p>
        <h3><span>${params.fromText}</span><b>→</b><span>${params.wantedText}</span></h3>
        <em>Набор ${params.ageGroup}</em>
      </div>
      <strong>ON</strong>
    </div>
    <div class="mzm-hard-active-actions">
      <button type="button" data-action="deactivate">Деактивирай</button>
      <button type="button" data-action="delete">Изтрий</button>
    </div>
  `;

  const deactivate = card.querySelector<HTMLButtonElement>("[data-action='deactivate']");
  const remove = card.querySelector<HTMLButtonElement>("[data-action='delete']");
  deactivate?.addEventListener("click", async () => {
    if (!params.requestId) return;
    deactivate.disabled = true;
    await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deactivateRequest", requestId: params.requestId }) });
    card.classList.add("is-inactive");
    card.querySelector(".mzm-hard-active-head > strong")!.textContent = "OFF";
  });
  remove?.addEventListener("click", async () => {
    if (!params.requestId) return;
    remove.disabled = true;
    await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteRequest", requestId: params.requestId }) });
    card.remove();
  });

  return card;
}

function updateMyRequestsDom(params: {
  fromText: string;
  wantedText: string;
  ageGroup: string;
  placeType: string;
  requestId?: string;
}) {
  const myRequestsSection = findMyRequestsSection();
  if (!myRequestsSection) return;

  myRequestsSection.querySelectorAll("[data-mzm-hard-active-request='true']").forEach((item) => item.remove());

  const emptyCard = Array.from(myRequestsSection.children).find((child) => child.textContent?.includes("Няма активна заявка"));
  emptyCard?.remove();

  const card = renderActiveRequestCard(params);
  const inviteCard = findInviteCard(myRequestsSection);
  if (inviteCard) {
    myRequestsSection.insertBefore(card, inviteCard);
  } else {
    myRequestsSection.appendChild(card);
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{display:block}
    .mzm-hard-card{border-radius:2.2rem;background:rgba(255,255,255,.9);padding:1rem;box-shadow:0 18px 48px rgba(40,34,20,.08);backdrop-filter:blur(10px)}
    .mzm-hard-inner{display:grid;gap:.72rem;border-radius:1.8rem;background:#f7f5ef;padding:1rem}
    .mzm-hard-label{margin-top:.35rem;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:rgba(28,27,25,.42)}
    .mzm-hard-select-wrap{position:relative}.mzm-hard-select{width:100%;appearance:none;border:0;outline:0;border-radius:1.35rem;background:rgba(255,255,255,.86);padding:1rem 3rem 1rem 1rem;font-size:.88rem;font-weight:800;color:#1c1b19}.mzm-hard-select-wrap:after{content:'⌄';position:absolute;right:1.15rem;top:50%;transform:translateY(-54%);font-weight:900;color:rgba(28,27,25,.58);pointer-events:none}
    .mzm-hard-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.mzm-hard-type-grid button{border:0;border-radius:1.05rem;padding:.85rem .75rem;background:rgba(255,255,255,.76);color:#1c1b19;text-align:left;font-weight:900;font-size:.75rem}.mzm-hard-type-grid button.is-active{background:var(--study-orange,#ff5a14);color:white}
    .mzm-hard-save{display:flex;gap:.65rem;align-items:center;border-radius:1.25rem;background:rgba(255,255,255,.66);padding:.85rem .9rem;color:rgba(28,27,25,.65);font-size:.76rem;font-weight:800}.mzm-hard-save input{width:1rem;height:1rem;accent-color:var(--study-orange,#ff5a14)}
    .mzm-hard-submit{margin-top:1rem;width:100%;border:0;border-radius:999px;background:var(--study-orange,#ff5a14);padding:1rem 1.25rem;color:white;font-weight:900;font-size:.9rem;box-shadow:0 16px 34px rgba(255,90,20,.24)}.mzm-hard-submit:disabled{opacity:.42;background:#ffc0aa}
    .mzm-hard-note{margin-top:.75rem;text-align:center;color:rgba(28,27,25,.45);font-size:.78rem;font-weight:700;line-height:1.45}.mzm-hard-status{border-radius:1.1rem;padding:.78rem .9rem;background:rgba(255,255,255,.62);color:rgba(28,27,25,.55);font-size:.72rem;line-height:1.35;font-weight:800}
    .mzm-hard-collapsed{display:none;margin-top:.2rem;border-radius:1.8rem;background:#f7f5ef;padding:1rem}.mzm-hard-collapsed p{margin:0;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:rgba(28,27,25,.42)}.mzm-hard-collapsed h3{margin:.4rem 0 0;font-size:1.05rem;line-height:1.15;font-weight:900;color:#1c1b19}
    .mzm-hard-card.is-collapsed .mzm-hard-inner,.mzm-hard-card.is-collapsed .mzm-hard-submit,.mzm-hard-card.is-collapsed .mzm-hard-note{display:none}.mzm-hard-card.is-collapsed .mzm-hard-collapsed{display:block}
    .mzm-hard-active-card{order:-1;border-radius:2rem;background:#ECECC7;padding:1.25rem;box-shadow:0 16px 40px rgba(40,34,20,.055)}.mzm-hard-active-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.mzm-hard-active-head p{margin:0;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.2em;color:rgba(28,27,25,.42)}.mzm-hard-active-head h3{margin:.55rem 0 0;display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;font-size:1.12rem;line-height:1.15;font-weight:900;color:#1c1b19}.mzm-hard-active-head h3 b{font-size:1.25rem}.mzm-hard-active-head em{display:block;margin-top:.75rem;font-style:normal;font-size:.9rem;font-weight:800;color:rgba(28,27,25,.55)}.mzm-hard-active-head strong{border-radius:999px;background:rgba(255,255,255,.68);padding:.65rem .9rem;font-size:.78rem;font-weight:900}.mzm-hard-active-actions{margin-top:1.2rem;display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.mzm-hard-active-actions button{border:0;border-radius:999px;padding:.9rem 1rem;font-size:.78rem;font-weight:900}.mzm-hard-active-actions button:first-child{background:rgba(255,255,255,.68);color:#1c1b19}.mzm-hard-active-actions button:last-child{background:var(--study-orange,#ff5a14);color:white}.mzm-hard-active-card.is-inactive{opacity:.72}
  `;
  document.head.appendChild(style);
}

async function mount() {
  injectStyles();
  const section = findRequestsSection();
  if (!section || section.dataset.mzmHardReset === "true") return;

  const [catalog, snapshot] = await Promise.all([getJson<Catalog>("/api/catalog"), getJson<Snapshot>("/api/playground")]);
  const prefs = getPrefs();
  const institutions = sortItems(catalog?.institutions?.length ? catalog.institutions : snapshot?.kindergartens || []);
  const districts = catalog?.districts?.length ? catalog.districts : Array.from(new Set(institutions.map((i) => i.district).filter(Boolean) as string[]));
  const years = catalog?.years?.length ? catalog.years : currentYearOptions();

  section.dataset.mzmHardReset = "true";
  section.innerHTML = "";
  section.className = "mzm-hard-card";

  const root = document.createElement("div");
  root.id = ROOT_ID;
  const inner = document.createElement("div");
  inner.className = "mzm-hard-inner";

  const [districtWrap, districtSelect] = select("Избери район");
  districts.forEach((d) => districtSelect.appendChild(option(d, d)));
  if (prefs.district && districts.includes(prefs.district)) districtSelect.value = prefs.district;

  const [yearWrap, yearSelect] = select("Избери набор / група");
  years.forEach((y) => yearSelect.appendChild(option(y, y)));
  if (prefs.year && years.includes(prefs.year)) yearSelect.value = prefs.year;

  const typeGrid = document.createElement("div");
  typeGrid.className = "mzm-hard-type-grid";
  let selectedType = prefs.placeType || PLACE_TYPES[0];
  function paintTypes() { typeGrid.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.classList.toggle("is-active", b.dataset.value === selectedType)); }
  PLACE_TYPES.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = type;
    button.textContent = type;
    button.onclick = () => { selectedType = type; paintTypes(); maybeSave(); };
    typeGrid.appendChild(button);
  });
  paintTypes();

  const saveRow = document.createElement("label");
  saveRow.className = "mzm-hard-save";
  const save = document.createElement("input");
  save.type = "checkbox";
  save.checked = true;
  const saveText = document.createElement("span");
  saveText.textContent = "Запази тези данни в профила ми";
  saveRow.append(save, saveText);

  const [fromWrap, fromSelect] = select("Избери сегашна градина");
  const [wantedWrap, wantedSelect] = select("Избери желана градина");
  const status = document.createElement("div");
  status.className = "mzm-hard-status";

  function filtered() { return institutions.filter((i) => !districtSelect.value || i.district === districtSelect.value); }
  function rebuild(preferredFrom?: string, preferredWanted?: string) {
    const fill = (target: HTMLSelectElement, placeholder: string, preferred?: string) => {
      target.innerHTML = "";
      target.appendChild(option("", placeholder));
      filtered().forEach((item) => target.appendChild(option(valueOf(item), labelOf(item))));
      if (preferred && Array.from(target.options).some((o) => o.value === preferred)) target.value = preferred;
    };
    fill(fromSelect, "Избери сегашна градина", preferredFrom ?? fromSelect.value);
    fill(wantedSelect, "Избери желана градина", preferredWanted ?? wantedSelect.value);
    status.textContent = catalog ? `PDF каталог: ${new Date(catalog.generatedAt).toLocaleDateString("bg-BG")}. В района: ${filtered().length}. Общо: ${institutions.length}.` : `Каталогът не се зареди. Показани записи: ${institutions.length}.`;
    maybeSave();
    updateSubmit();
  }
  function maybeSave() { if (save.checked) savePrefs({ district: districtSelect.value, year: yearSelect.value, placeType: selectedType, from: fromSelect.value, wanted: wantedSelect.value }); }
  function updateSubmit() { submit.disabled = !districtSelect.value || !yearSelect.value || !fromSelect.value || !wantedSelect.value || fromSelect.value === wantedSelect.value; }

  inner.append(label("Район"), districtWrap, label("Набор / група"), yearWrap, label("Тип място"), typeGrid, saveRow, label("Сегашна градина"), fromWrap, label("Желана градина"), wantedWrap, status);

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "mzm-hard-submit";
  submit.textContent = "Активирай заявка";
  const note = document.createElement("p");
  note.className = "mzm-hard-note";
  note.textContent = "Заявката ще се скрие автоматично при потенциален цикъл.";
  const collapsed = document.createElement("div");
  collapsed.className = "mzm-hard-collapsed";

  districtSelect.onchange = () => rebuild();
  yearSelect.onchange = () => { maybeSave(); updateSubmit(); };
  fromSelect.onchange = () => { maybeSave(); updateSubmit(); };
  wantedSelect.onchange = () => { maybeSave(); updateSubmit(); };
  save.onchange = maybeSave;

  submit.onclick = async () => {
    updateSubmit();
    if (submit.disabled) return;
    const userId = findSelectedUserId(snapshot);
    if (!userId) { status.textContent = "Няма избран тестов потребител. Отвори профила и избери потребител."; return; }

    const fromText = shortName(fromSelect.options[fromSelect.selectedIndex]?.textContent || "—");
    const wantedText = shortName(wantedSelect.options[wantedSelect.selectedIndex]?.textContent || "—");
    const ageGroup = yearSelect.value;
    const payload = { action: "createRequest", userId, fromKindergartenId: fromSelect.value, wantedKindergartenId: wantedSelect.value, ageGroup };

    submit.disabled = true;
    submit.textContent = "Записвам...";
    const response = await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null) as { requests?: Array<{ id: string; user_id: string; from_kindergarten_id: string; child_group_year_or_age_group: string }> ; error?: string } | null;

    if (!response.ok) {
      status.textContent = data?.error || "Не успях да създам заявката.";
      submit.textContent = "Активирай заявка";
      updateSubmit();
      return;
    }

    const createdRequest = data?.requests?.find((request) => request.user_id === userId && request.child_group_year_or_age_group === ageGroup) ?? data?.requests?.find((request) => request.user_id === userId);
    savePrefs({ district: districtSelect.value, year: ageGroup, placeType: selectedType, from: fromSelect.value, wanted: wantedSelect.value });

    collapsed.innerHTML = `<p>Активна заявка</p><h3>${fromText} → ${wantedText}</h3>`;
    section.classList.add("is-collapsed");
    updateMyRequestsDom({ fromText, wantedText, ageGroup, placeType: selectedType, requestId: createdRequest?.id });
    submit.textContent = "Активирай заявка";
  };

  root.append(inner, submit, note, collapsed);
  section.appendChild(root);
  rebuild(prefs.from, prefs.wanted);
}

function run() { void mount(); }

export default function RequestFormHardReset() {
  useEffect(() => {
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
