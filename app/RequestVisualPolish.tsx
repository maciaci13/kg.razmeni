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
      background: rgba(255,255,255,.78) !important;
      border: 1px solid rgba(255,255,255,.96) !important;
      box-shadow:
        0 -10px 34px rgba(28,27,25,.09),
        0 20px 60px rgba(28,27,25,.22),
        inset 0 1px 0 rgba(255,255,255,.95),
        inset 0 -1px 0 rgba(28,27,25,.05) !important;
      backdrop-filter: blur(26px) saturate(1.25) !important;
      -webkit-backdrop-filter: blur(26px) saturate(1.25) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4::before { display: none !important; }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button { color: rgba(28,27,25,.58) !important; }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      color: #fff !important;
      background: var(--study-orange,#f95e08) !important;
      box-shadow: 0 12px 28px rgba(249,94,8,.26) !important;
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

    .mzm-request-carousel { height: 17.6rem !important; margin-top: .15rem !important; }

    .mzm-request-card { border: 1px solid rgba(255,255,255,.34) !important; overflow: hidden !important; }

    .mzm-request-card::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 16% 12%, rgba(255,255,255,.42), transparent 7.5rem),
        linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,0));
      opacity: .75;
    }

    .mzm-request-card:nth-child(4n+1) { background: #ECECC7 !important; }
    .mzm-request-card:nth-child(4n+2) { background: #D9E7CB !important; }
    .mzm-request-card:nth-child(4n+3) { background: #DED1E8 !important; }
    .mzm-request-card:nth-child(4n+4) { background: #D2E4E2 !important; }

    .mzm-request-card.is-active-card {
      transform: translateX(0) translateY(0) rotate(0deg) scale(1) !important;
      opacity: 1 !important;
      box-shadow: 0 26px 64px rgba(40,34,20,.15) !important;
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

    .mzm-request-card-content { position: relative; z-index: 2; }
    .mzm-card-menu { z-index: 7 !important; }

    .mzm-card-menu-popover button[data-action='edit'] { color: #1c1b19 !important; }

    .mzm-edit-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(28,27,25,.22);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .mzm-edit-modal {
      width: min(100%, 28rem);
      max-height: min(86vh, 46rem);
      overflow: auto;
      border-radius: 2rem;
      background: rgba(255,255,255,.94);
      box-shadow: 0 26px 70px rgba(28,27,25,.24);
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
      background: #f7f5ef;
      font-size: 1.2rem;
      font-weight: 900;
    }

    .mzm-edit-modal-body {
      display: grid;
      gap: .75rem;
      border-radius: 1.65rem;
      background: #f7f5ef;
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
      background: rgba(255,255,255,.88);
      padding: .95rem 1rem;
      font-size: .86rem;
      font-weight: 800;
      color: #1c1b19;
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

    .mzm-edit-cancel { background: #f7f5ef; color: #1c1b19; }
    .mzm-edit-save { background: var(--study-orange,#f95e08); color: white; }
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
