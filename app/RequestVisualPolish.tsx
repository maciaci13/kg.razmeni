"use client";

import { useEffect } from "react";

type NameMapItem = {
  fromText: string;
  wantedText: string;
  ageGroup: string;
  locked: boolean;
};

type NameMapResponse = {
  requests?: Record<string, NameMapItem>;
  error?: string;
};

type CatalogInstitution = {
  id: string;
  name: string;
  district?: string | null;
  address?: string | null;
};

type CatalogResponse = {
  institutions?: CatalogInstitution[];
};

const STYLE_ID = "mzm-request-visual-polish-styles";
const MODAL_ID = "mzm-edit-request-modal";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 {
      background: rgba(255,255,255,.76) !important;
      border: 1px solid rgba(255,255,255,.96) !important;
      box-shadow:
        0 -10px 34px rgba(28,27,25,.08),
        0 20px 60px rgba(28,27,25,.18),
        inset 0 1px 0 rgba(255,255,255,.95),
        inset 0 -1px 0 rgba(28,27,25,.05) !important;
      backdrop-filter: blur(28px) saturate(1.3) !important;
      -webkit-backdrop-filter: blur(28px) saturate(1.3) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4::before { display: none !important; }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button { color: rgba(28,27,25,.58) !important; }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      color: #fff !important;
      background: linear-gradient(135deg, var(--study-orange,#f95e08), var(--study-orange-2,#ff8a24)) !important;
      box-shadow: 0 14px 32px rgba(249,94,8,.28) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button:not(.bg-orange) {
      background: transparent !important;
      box-shadow: none !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button:not(.bg-orange) > *:first-child,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button:not(.bg-orange) span:first-child {
      background: transparent !important;
      box-shadow: none !important;
    }

    main:has(nav.fixed.bottom-4) section:has(.mzm-request-carousel) {
      background:
        linear-gradient(145deg, rgba(255,255,255,.9), rgba(255,250,246,.68)),
        radial-gradient(circle at 18% 0%, rgba(255,138,36,.12), transparent 10rem),
        radial-gradient(circle at 100% 30%, rgba(210,228,226,.45), transparent 11rem) !important;
      border: 1px solid rgba(255,255,255,.88) !important;
      box-shadow: 0 24px 70px rgba(51,38,22,.12), inset 0 1px 0 rgba(255,255,255,.9) !important;
      backdrop-filter: blur(24px) saturate(1.18) !important;
      -webkit-backdrop-filter: blur(24px) saturate(1.18) !important;
    }

    main:has(nav.fixed.bottom-4) section:has(.mzm-request-carousel) h2,
    main:has(nav.fixed.bottom-4) section:has(.mzm-request-carousel) h3 {
      letter-spacing: -.055em !important;
    }

    .mzm-request-carousel {
      height: 18.9rem !important;
      margin-top: .35rem !important;
      overflow: visible !important;
    }

    .mzm-request-card {
      border: 1px solid rgba(255,255,255,.58) !important;
      overflow: hidden !important;
      border-radius: 2rem !important;
      box-shadow: 0 22px 58px rgba(51,38,22,.13), inset 0 1px 0 rgba(255,255,255,.42) !important;
    }

    .mzm-request-card::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 12% 10%, rgba(255,255,255,.65), transparent 8rem),
        radial-gradient(circle at 92% 0%, rgba(255,255,255,.28), transparent 8rem),
        linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,0));
      opacity: .82;
      z-index: 1;
    }

    .mzm-request-card::after {
      content: "";
      position: absolute;
      right: -2.6rem;
      bottom: -2.7rem;
      width: 8.5rem;
      height: 8.5rem;
      border-radius: 999px;
      pointer-events: none;
      background: rgba(255,255,255,.22);
      opacity: .85;
      z-index: 1;
    }

    .mzm-request-card:nth-child(4n+1) { background: linear-gradient(135deg, #f3eec9, #ececc7) !important; }
    .mzm-request-card:nth-child(4n+2) { background: linear-gradient(135deg, #e9f2dc, #d9e7cb) !important; }
    .mzm-request-card:nth-child(4n+3) { background: linear-gradient(135deg, #efe5f5, #ded1e8) !important; }
    .mzm-request-card:nth-child(4n+4) { background: linear-gradient(135deg, #e5f1ef, #d2e4e2) !important; }

    .mzm-request-card.is-active-card {
      transform: translateX(0) translateY(0) rotate(0deg) scale(1) !important;
      opacity: 1 !important;
      box-shadow: 0 30px 72px rgba(51,38,22,.18), inset 0 1px 0 rgba(255,255,255,.55) !important;
    }

    .mzm-request-card.is-next-card {
      transform: translateX(1.35rem) translateY(.35rem) rotate(5deg) scale(.965) !important;
      opacity: .88 !important;
      filter: saturate(.98) brightness(.99);
    }

    .mzm-request-card.is-next-next-card {
      transform: translateX(2.55rem) translateY(.72rem) rotate(9deg) scale(.925) !important;
      opacity: .68 !important;
      filter: saturate(.92) brightness(.98);
    }

    .mzm-request-card.is-prev-card {
      transform: translateX(-1.55rem) translateY(.52rem) rotate(-7deg) scale(.93) !important;
      opacity: .48 !important;
    }

    .mzm-request-card.is-hidden-card {
      transform: translateX(3.25rem) translateY(1rem) rotate(11deg) scale(.88) !important;
      opacity: 0 !important;
    }

    .mzm-request-card-content {
      position: relative;
      z-index: 2;
    }

    .mzm-request-card-content h3 {
      display: grid !important;
      gap: .52rem !important;
      color: #181512 !important;
      font-weight: 900 !important;
      letter-spacing: -.055em !important;
      line-height: 1.02 !important;
    }

    .mzm-request-card-content h3 b {
      display: grid !important;
      place-items: center !important;
      width: 2.35rem !important;
      height: 2.35rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.56) !important;
      color: var(--study-orange,#f95e08) !important;
      font-size: 1.4rem !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.72) !important;
    }

    .mzm-request-card-content em {
      display: inline-flex !important;
      align-items: center !important;
      width: fit-content !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.52) !important;
      padding: .42rem .72rem !important;
      color: rgba(24,21,18,.62) !important;
      font-style: normal !important;
      font-weight: 900 !important;
      font-size: .72rem !important;
      letter-spacing: .02em !important;
    }

    .mzm-card-menu { z-index: 7 !important; }

    .mzm-card-menu summary {
      background: rgba(255,255,255,.58) !important;
      border: 1px solid rgba(255,255,255,.68) !important;
      box-shadow: 0 12px 26px rgba(51,38,22,.08) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
    }

    .mzm-card-menu-popover {
      border-radius: 1.25rem !important;
      background: rgba(255,255,255,.92) !important;
      border: 1px solid rgba(255,255,255,.86) !important;
      box-shadow: 0 18px 40px rgba(51,38,22,.16) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
    }

    .mzm-card-menu-popover button[data-action='edit'] { color: #1c1b19 !important; }

    .mzm-edit-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(28,27,25,.2);
      backdrop-filter: blur(18px) saturate(1.1);
      -webkit-backdrop-filter: blur(18px) saturate(1.1);
    }

    .mzm-edit-modal {
      width: min(100%, 28rem);
      max-height: min(86vh, 46rem);
      overflow: auto;
      border-radius: 2rem;
      background:
        linear-gradient(145deg, rgba(255,255,255,.96), rgba(255,250,246,.9)),
        radial-gradient(circle at 80% 0%, rgba(255,138,36,.12), transparent 10rem);
      border: 1px solid rgba(255,255,255,.9);
      box-shadow: 0 30px 82px rgba(28,27,25,.24), inset 0 1px 0 rgba(255,255,255,.95);
      padding: 1rem;
    }

    .mzm-edit-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .25rem .25rem 1rem;
    }

    .mzm-edit-modal-header h3 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -.04em;
    }

    .mzm-edit-modal-header button {
      border: 0;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 999px;
      background: #f7f0e8;
      font-size: 1.2rem;
      font-weight: 900;
    }

    .mzm-edit-modal-body {
      display: grid;
      gap: .75rem;
      border-radius: 1.65rem;
      background: rgba(247,240,232,.82);
      padding: 1rem;
    }

    .mzm-edit-modal label {
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-edit-modal select,
    .mzm-edit-modal input {
      width: 100%;
      border: 0;
      outline: 0;
      border-radius: 1.25rem;
      background: rgba(255,255,255,.9);
      padding: .95rem 1rem;
      font-size: .86rem;
      font-weight: 800;
      color: #1c1b19;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.035) !important;
    }

    .mzm-edit-modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .65rem;
      padding-top: 1rem;
    }

    .mzm-edit-modal-actions button {
      border: 0;
      border-radius: 999px;
      padding: 1rem;
      font-size: .82rem;
      font-weight: 900;
    }

    .mzm-edit-cancel { background: #f7f0e8; color: #1c1b19; }
    .mzm-edit-save {
      background: linear-gradient(135deg, var(--study-orange,#f95e08), var(--study-orange-2,#ff8a24));
      color: white;
      box-shadow: 0 14px 32px rgba(249,94,8,.24);
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function shortOptionLabel(value: string) {
  return value.split(" · ")[0]?.trim() || value;
}

function valueOf(item: CatalogInstitution) {
  return item.id.startsWith("catalog:") ? item.id : `catalog:${item.id}`;
}

function labelOf(item: CatalogInstitution) {
  return `${item.name}${item.district ? ` · ${item.district}` : ""}${item.address ? ` · ${item.address}` : ""}`;
}

function option(value: string, text: string) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = text;
  return el;
}

async function fetchNameMap(requestIds: string[]) {
  const response = await fetch(`/api/request-name-map?requestIds=${encodeURIComponent(requestIds.join(","))}`, { cache: "no-store" });
  if (!response.ok) return {};
  const data = await response.json() as NameMapResponse;
  return data.requests || {};
}

async function fetchCatalog() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  if (!response.ok) return [];
  const data = await response.json() as CatalogResponse;
  return (data.institutions || []).slice().sort((a, b) => `${a.district || ""}-${a.name}`.localeCompare(`${b.district || ""}-${b.name}`, "bg"));
}

function requestIdsFromCards() {
  return Array.from(new Set(
    Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true'][data-request-id]"))
      .map((card) => card.dataset.requestId || "")
      .filter(Boolean)
  ));
}

function cardHasPlaceholder(card: HTMLElement) {
  const text = card.textContent || "";
  return text.includes("Избрана градина") || text.includes("Желана градина");
}

async function hydrateNames(force = false) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true'][data-request-id]"));
  const requestIds = requestIdsFromCards();
  if (!requestIds.length) return;
  if (!force && !cards.some(cardHasPlaceholder)) return;

  try {
    const map = await fetchNameMap(requestIds);

    cards.forEach((card) => {
      const id = card.dataset.requestId || "";
      const item = map[id];
      if (!item) return;
      const title = card.querySelector<HTMLElement>(".mzm-request-card-content h3");
      const age = card.querySelector<HTMLElement>(".mzm-request-card-content em");
      if (title) title.innerHTML = `<span>${escapeHtml(item.fromText)}</span><b>→</b><span>${escapeHtml(item.wantedText)}</span>`;
      if (age) age.textContent = `Набор ${item.ageGroup}`;
    });
  } catch {
    // Never block the app for polish.
  }
}

function normalizeHomeStats() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h3"));
  const activeHeading = headings.find((heading) => heading.textContent?.trim() === "Активна заявка");
  if (!activeHeading) return;
  activeHeading.textContent = "Активни заявки";
  const body = activeHeading.parentElement?.querySelector("p.mt-2, p");
  if (body && body.textContent?.includes("→")) body.textContent = "";
}

function ensureEditButtons() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true'][data-request-id]"));
  cards.forEach((card) => {
    const popover = card.querySelector<HTMLElement>(".mzm-card-menu-popover");
    if (!popover || popover.querySelector("[data-action='edit']")) return;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.textContent = "Редактирай";
    edit.addEventListener("click", (event) => {
      event.preventDefault();
      const menu = card.querySelector<HTMLDetailsElement>(".mzm-card-menu");
      menu?.removeAttribute("open");
      void openEditModal(card);
    });
    popover.prepend(edit);
  });
}

function findBestOption(select: HTMLSelectElement, targetName: string) {
  const normalizedTarget = targetName.trim().toLowerCase();
  if (!normalizedTarget) return "";
  const options = Array.from(select.options);
  return options.find((item) => (item.textContent || "").toLowerCase().startsWith(normalizedTarget))?.value || "";
}

async function openEditModal(card: HTMLElement) {
  const requestId = card.dataset.requestId || "";
  if (!requestId) return;

  document.getElementById(MODAL_ID)?.remove();

  const [catalog, map] = await Promise.all([fetchCatalog(), fetchNameMap([requestId])]);
  const current = map[requestId];

  const backdrop = document.createElement("div");
  backdrop.id = MODAL_ID;
  backdrop.className = "mzm-edit-modal-backdrop";
  backdrop.innerHTML = `
    <div class="mzm-edit-modal" role="dialog" aria-modal="true" aria-label="Редактирай заявка">
      <div class="mzm-edit-modal-header">
        <h3>Редактирай заявка</h3>
        <button type="button" data-close="true" aria-label="Затвори">×</button>
      </div>
      <div class="mzm-edit-modal-body">
        <label>Сегашна градина</label>
        <select data-field="from"><option value="">Избери сегашна градина</option></select>
        <label>Желана градина</label>
        <select data-field="wanted"><option value="">Избери желана градина</option></select>
        <label>Набор / група</label>
        <input data-field="age" value="${escapeHtml(current?.ageGroup || "")}" placeholder="Напр. 2020" />
      </div>
      <div class="mzm-edit-modal-actions">
        <button type="button" class="mzm-edit-cancel" data-close="true">Откажи</button>
        <button type="button" class="mzm-edit-save">Запази</button>
      </div>
    </div>
  `;

  const fromSelect = backdrop.querySelector<HTMLSelectElement>("select[data-field='from']");
  const wantedSelect = backdrop.querySelector<HTMLSelectElement>("select[data-field='wanted']");
  const ageInput = backdrop.querySelector<HTMLInputElement>("input[data-field='age']");
  const save = backdrop.querySelector<HTMLButtonElement>(".mzm-edit-save");

  catalog.forEach((item) => {
    fromSelect?.appendChild(option(valueOf(item), labelOf(item)));
    wantedSelect?.appendChild(option(valueOf(item), labelOf(item)));
  });

  if (fromSelect && current?.fromText) fromSelect.value = findBestOption(fromSelect, current.fromText);
  if (wantedSelect && current?.wantedText) wantedSelect.value = findBestOption(wantedSelect, current.wantedText);

  backdrop.querySelectorAll<HTMLElement>("[data-close='true']").forEach((button) => button.addEventListener("click", () => backdrop.remove()));
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.remove();
  });

  save?.addEventListener("click", async () => {
    if (!fromSelect?.value || !wantedSelect?.value || !ageInput?.value.trim()) return;
    save.disabled = true;
    save.textContent = "Записвам...";
    const response = await fetch("/api/edit-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        fromKindergartenId: fromSelect.value,
        wantedKindergartenId: wantedSelect.value,
        ageGroup: ageInput.value.trim()
      })
    });

    if (!response.ok) {
      save.disabled = false;
      save.textContent = "Запази";
      return;
    }

    const title = card.querySelector<HTMLElement>(".mzm-request-card-content h3");
    const age = card.querySelector<HTMLElement>(".mzm-request-card-content em");
    if (title) title.innerHTML = `<span>${escapeHtml(shortOptionLabel(fromSelect.options[fromSelect.selectedIndex]?.textContent || ""))}</span><b>→</b><span>${escapeHtml(shortOptionLabel(wantedSelect.options[wantedSelect.selectedIndex]?.textContent || ""))}</span>`;
    if (age) age.textContent = `Набор ${ageInput.value.trim()}`;
    backdrop.remove();
    setTimeout(() => void hydrateNames(true), 250);
  });

  document.body.appendChild(backdrop);
}

export default function RequestVisualPolish() {
  useEffect(() => {
    let scheduled = false;
    let retryTimer: number | null = null;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        injectStyles();
        normalizeHomeStats();
        ensureEditButtons();
        void hydrateNames(false);

        if (Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true']")).some(cardHasPlaceholder)) {
          if (retryTimer) window.clearTimeout(retryTimer);
          retryTimer = window.setTimeout(() => void hydrateNames(true), 650);
        }
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    return () => {
      observer.disconnect();
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  return null;
}
