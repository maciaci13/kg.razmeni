"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };
type CatalogInstitution = { id: string; name: string; district?: string | null; address?: string | null };
type Catalog = { institutions?: CatalogInstitution[]; districts?: string[] };
type RequestRow = PlaygroundSnapshot["requests"][number];
type WantedRow = PlaygroundSnapshot["wantedKindergartens"][number];

type RadarItem = {
  id: string;
  name: string;
  district: string;
  address?: string | null;
  wantedBy: number;
  offeredBy: number;
  years: string[];
  score: number;
  isNearMe: boolean;
};

const STYLE_ID = "mzm-home-chance-radar-style";
const MODAL_ATTR = "data-mzm-radar-modal";
const PREF_KEY = "mzm.profile.defaults.v5";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-radar-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .mzm-radar-modal {
      width: min(100%, 30rem);
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      border-radius: 2.2rem;
      background: #fffcfa;
      color: #1c1b19;
      box-shadow: 0 28px 90px rgba(28,27,25,.24);
    }

    .mzm-radar-head {
      position: relative;
      overflow: hidden;
      padding: 1.2rem;
      border-radius: 2.2rem 2.2rem 0 0;
      background: linear-gradient(145deg, rgba(255,240,227,.98), rgba(255,255,255,.94));
    }

    .mzm-radar-head::after {
      content: "";
      position: absolute;
      right: -2.8rem;
      top: -2.6rem;
      width: 10rem;
      height: 10rem;
      border-radius: 999px;
      background: rgba(217,231,203,.85);
      filter: blur(.3px);
      opacity: .8;
    }

    .mzm-radar-top {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .mzm-radar-kicker {
      margin: 0 0 .45rem;
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--study-orange,#f95e08);
    }

    .mzm-radar-head h2 {
      margin: 0;
      font-size: 2rem;
      line-height: .95;
      font-weight: 900;
      letter-spacing: -.065em;
    }

    .mzm-radar-intro {
      position: relative;
      z-index: 2;
      max-width: 20rem;
      margin: .8rem 0 0;
      font-size: .88rem;
      line-height: 1.45;
      font-weight: 750;
      color: rgba(28,27,25,.58);
    }

    .mzm-radar-close {
      position: relative;
      z-index: 3;
      display: grid;
      place-items: center;
      width: 2.8rem;
      height: 2.8rem;
      border: 0;
      border-radius: 999px;
      background: rgba(255,255,255,.86);
      color: #1c1b19;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 12px 26px rgba(33,28,17,.06);
    }

    .mzm-radar-body {
      padding: 1rem;
      display: grid;
      gap: .85rem;
    }

    .mzm-radar-filters {
      display: flex;
      gap: .5rem;
      overflow-x: auto;
      padding-bottom: .1rem;
      -webkit-overflow-scrolling: touch;
    }

    .mzm-radar-filters::-webkit-scrollbar { display: none; }

    .mzm-radar-filter {
      flex: 0 0 auto;
      border: 0;
      border-radius: 999px;
      background: #f7f5ef;
      padding: .72rem .95rem;
      color: rgba(28,27,25,.58);
      font-size: .75rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .mzm-radar-filter.is-active {
      background: var(--study-orange,#f95e08);
      color: #fff;
    }

    .mzm-radar-list {
      display: grid;
      gap: .75rem;
    }

    .mzm-radar-card {
      border-radius: 1.65rem;
      background: #f7f5ef;
      padding: .95rem;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.025);
    }

    .mzm-radar-card:nth-child(2n) { background: #d2e4e2; }
    .mzm-radar-card:nth-child(3n) { background: #ecedc7; }

    .mzm-radar-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .75rem;
    }

    .mzm-radar-score {
      display: grid;
      place-items: center;
      width: 3.15rem;
      height: 3.15rem;
      border-radius: 1.1rem;
      background: rgba(255,255,255,.75);
      font-size: 1.1rem;
      font-weight: 900;
      flex: 0 0 auto;
    }

    .mzm-radar-card h3 {
      margin: 0;
      font-size: 1.08rem;
      line-height: 1.12;
      font-weight: 900;
      letter-spacing: -.035em;
    }

    .mzm-radar-meta {
      margin: .35rem 0 0;
      font-size: .74rem;
      line-height: 1.35;
      font-weight: 750;
      color: rgba(28,27,25,.55);
    }

    .mzm-radar-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .45rem;
      margin-top: .8rem;
    }

    .mzm-radar-stat {
      border-radius: 1.05rem;
      background: rgba(255,255,255,.66);
      padding: .65rem;
      min-height: 4.1rem;
    }

    .mzm-radar-stat strong {
      display: block;
      font-size: 1.05rem;
      line-height: 1;
      font-weight: 900;
    }

    .mzm-radar-stat span {
      display: block;
      margin-top: .35rem;
      font-size: .62rem;
      line-height: 1.15;
      font-weight: 850;
      color: rgba(28,27,25,.52);
    }

    .mzm-radar-action {
      width: 100%;
      margin-top: .85rem;
      border: 0;
      border-radius: 999px;
      background: var(--study-orange,#f95e08);
      color: #fff;
      padding: .88rem 1rem;
      font-size: .78rem;
      font-weight: 900;
      box-shadow: 0 14px 30px rgba(249,94,8,.22);
    }

    .mzm-radar-empty {
      border-radius: 1.65rem;
      background: #f7f5ef;
      padding: 1rem;
    }

    .mzm-radar-empty h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: -.035em;
    }

    .mzm-radar-empty p {
      margin: .45rem 0 0;
      color: rgba(28,27,25,.58);
      font-size: .84rem;
      line-height: 1.45;
      font-weight: 750;
    }
  `;
  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function rawId(id: string) {
  return String(id || "").replace(/^catalog:/, "");
}

function catalogId(id: string) {
  const raw = rawId(id);
  return raw ? `catalog:${raw}` : "";
}

function selectedUserNameFromPage() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const profileButton = buttons.find((button) => /родител\s*[абвгabcd]/i.test(button.textContent || ""));
  return normalize(profileButton?.textContent).toLowerCase();
}

function selectedUserId(snapshot: PlaygroundSnapshot) {
  const label = selectedUserNameFromPage();
  if (label) {
    const found = snapshot.users.find((user) => label.includes(user.display_name.toLowerCase()));
    if (found) return found.id;
  }
  return snapshot.users[0]?.id || "";
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? await response.json() as T : null;
  } catch {
    return null;
  }
}

function byIdMap(institutions: CatalogInstitution[], snapshot: PlaygroundSnapshot) {
  const map = new Map<string, CatalogInstitution>();
  const add = (item: CatalogInstitution) => {
    map.set(item.id, item);
    map.set(rawId(item.id), item);
    map.set(catalogId(item.id), item);
  };
  institutions.forEach(add);
  snapshot.kindergartens.forEach(add);
  return map;
}

function wantedByRequest(snapshot: PlaygroundSnapshot) {
  return new Map<string, WantedRow>(snapshot.wantedKindergartens.map((wanted) => [wanted.request_id, wanted]));
}

function getActiveRequests(snapshot: PlaygroundSnapshot) {
  return snapshot.requests.filter((request) => request.is_active || request.is_locked || request.status === "enrolled");
}

function getRequestWantedId(snapshot: PlaygroundSnapshot, request: RequestRow) {
  const wanted = wantedByRequest(snapshot).get(request.id);
  return wanted?.wanted_kindergarten_id || "";
}

function getMyContext(snapshot: PlaygroundSnapshot, institutionsById: Map<string, CatalogInstitution>) {
  const userId = selectedUserId(snapshot);
  const myRequest = getActiveRequests(snapshot).find((request) => request.user_id === userId);
  const wantedId = myRequest ? getRequestWantedId(snapshot, myRequest) : "";
  const from = myRequest ? institutionsById.get(myRequest.from_kindergarten_id) || institutionsById.get(catalogId(myRequest.from_kindergarten_id)) : undefined;
  const wanted = wantedId ? institutionsById.get(wantedId) || institutionsById.get(catalogId(wantedId)) : undefined;
  const district = wanted?.district || from?.district || "";
  const year = myRequest?.child_group_year_or_age_group || "";
  return { userId, myRequest, district, year };
}

function buildRadar(snapshot: PlaygroundSnapshot, institutions: CatalogInstitution[]) {
  const institutionsById = byIdMap(institutions, snapshot);
  const wantedMap = wantedByRequest(snapshot);
  const activeRequests = getActiveRequests(snapshot);
  const context = getMyContext(snapshot, institutionsById);
  const stats = new Map<string, RadarItem>();

  const ensure = (id: string) => {
    const kg = institutionsById.get(id) || institutionsById.get(catalogId(id));
    const key = catalogId(id);
    if (!kg || !key) return null;
    if (!stats.has(key)) {
      stats.set(key, {
        id: key,
        name: kg.name,
        district: kg.district || "Без район",
        address: kg.address,
        wantedBy: 0,
        offeredBy: 0,
        years: [],
        score: 0,
        isNearMe: Boolean(context.district && kg.district === context.district)
      });
    }
    return stats.get(key) || null;
  };

  activeRequests.forEach((request) => {
    const wanted = wantedMap.get(request.id);
    const fromStat = ensure(request.from_kindergarten_id);
    const wantedStat = wanted ? ensure(wanted.wanted_kindergarten_id) : null;

    if (fromStat) {
      fromStat.offeredBy += 1;
      if (request.child_group_year_or_age_group && !fromStat.years.includes(request.child_group_year_or_age_group)) fromStat.years.push(request.child_group_year_or_age_group);
    }

    if (wantedStat) {
      wantedStat.wantedBy += 1;
      if (request.child_group_year_or_age_group && !wantedStat.years.includes(request.child_group_year_or_age_group)) wantedStat.years.push(request.child_group_year_or_age_group);
    }
  });

  const items = Array.from(stats.values()).map((item) => {
    const yearBoost = context.year && item.years.includes(context.year) ? 2 : 0;
    const nearBoost = item.isNearMe ? 2 : 0;
    const balanceBoost = item.wantedBy > 0 && item.offeredBy > 0 ? 4 : 0;
    const score = item.wantedBy * 2 + item.offeredBy * 2 + balanceBoost + nearBoost + yearBoost;
    return { ...item, score };
  }).filter((item) => item.score > 0);

  return {
    context,
    all: items.sort((a, b) => b.score - a.score || b.wantedBy - a.wantedBy || b.offeredBy - a.offeredBy || a.name.localeCompare(b.name, "bg")),
    near: items.filter((item) => item.isNearMe).sort((a, b) => b.score - a.score),
    balanced: items.filter((item) => item.wantedBy > 0 && item.offeredBy > 0).sort((a, b) => b.score - a.score)
  };
}

function clickNav(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button"));
  buttons.find((button) => normalize(button.textContent).includes(label))?.click();
}

function saveWantedPreference(item: RadarItem, year?: string) {
  try {
    const current = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    localStorage.setItem(PREF_KEY, JSON.stringify({
      ...current,
      district: item.district && item.district !== "Без район" ? item.district : current.district,
      year: year || current.year,
      wanted: item.id
    }));
  } catch {
    // non-critical
  }
}

function renderCards(items: RadarItem[], year?: string) {
  if (!items.length) {
    return `<div class="mzm-radar-empty"><h3>Още няма достатъчно движение</h3><p>Пусни заявка и сподели платформата. Радарът става по-точен, когато повече родители се включат.</p></div>`;
  }

  return items.slice(0, 8).map((item) => `
    <article class="mzm-radar-card" data-radar-id="${escapeHtml(item.id)}">
      <div class="mzm-radar-card-head">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p class="mzm-radar-meta">${escapeHtml(item.district)}${item.address ? ` · ${escapeHtml(item.address)}` : ""}</p>
        </div>
        <div class="mzm-radar-score">${Math.min(99, item.score)}</div>
      </div>
      <div class="mzm-radar-stats">
        <div class="mzm-radar-stat"><strong>${item.wantedBy}</strong><span>родители я търсят</span></div>
        <div class="mzm-radar-stat"><strong>${item.offeredBy}</strong><span>може да я освободят</span></div>
        <div class="mzm-radar-stat"><strong>${item.years.slice(0, 2).join(", ") || year || "—"}</strong><span>активни набори</span></div>
      </div>
      <button type="button" class="mzm-radar-action" data-radar-use="${escapeHtml(item.id)}">Използвай като желана градина</button>
    </article>
  `).join("");
}

function openRadarModal(radar: ReturnType<typeof buildRadar>) {
  document.querySelector(`[${MODAL_ATTR}="true"]`)?.remove();

  let mode: "near" | "balanced" | "all" = radar.near.length ? "near" : radar.balanced.length ? "balanced" : "all";

  const backdrop = document.createElement("div");
  backdrop.className = "mzm-radar-modal-backdrop";
  backdrop.setAttribute(MODAL_ATTR, "true");

  const render = () => {
    const items = mode === "near" ? radar.near : mode === "balanced" ? radar.balanced : radar.all;
    backdrop.innerHTML = `
      <div class="mzm-radar-modal" role="dialog" aria-modal="true">
        <div class="mzm-radar-head">
          <div class="mzm-radar-top">
            <div>
              <p class="mzm-radar-kicker">Радар за шанс</p>
              <h2>Къде има движение?</h2>
            </div>
            <button type="button" class="mzm-radar-close" aria-label="Затвори">×</button>
          </div>
          <p class="mzm-radar-intro">Показваме места с активни заявки и потенциал за бъдещо съвпадение. Без лични данни, без обещания.</p>
        </div>
        <div class="mzm-radar-body">
          <div class="mzm-radar-filters">
            <button type="button" class="mzm-radar-filter ${mode === "near" ? "is-active" : ""}" data-mode="near">Около моя район</button>
            <button type="button" class="mzm-radar-filter ${mode === "balanced" ? "is-active" : ""}" data-mode="balanced">С най-голям шанс</button>
            <button type="button" class="mzm-radar-filter ${mode === "all" ? "is-active" : ""}" data-mode="all">Всички активни</button>
          </div>
          <div class="mzm-radar-list">${renderCards(items, radar.context.year)}</div>
        </div>
      </div>
    `;

    backdrop.querySelector<HTMLButtonElement>(".mzm-radar-close")?.addEventListener("click", () => backdrop.remove());
    backdrop.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        mode = (button.dataset.mode as typeof mode) || "all";
        render();
      });
    });
    backdrop.querySelectorAll<HTMLButtonElement>("[data-radar-use]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = radar.all.find((entry) => entry.id === button.dataset.radarUse);
        if (item) saveWantedPreference(item, radar.context.year);
        backdrop.remove();
        clickNav("Заявка");
      });
    });
  };

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.remove();
  });

  render();
  document.body.appendChild(backdrop);
}

async function openRadar() {
  injectStyles();
  const [snapshot, catalog] = await Promise.all([
    getJson<PlaygroundSnapshot | ApiError>("/api/playground"),
    getJson<Catalog>("/api/catalog")
  ]);

  if (!snapshot || "error" in snapshot) return;
  const institutions = catalog?.institutions?.length ? catalog.institutions : snapshot.kindergartens;
  openRadarModal(buildRadar(snapshot, institutions));
}

function bindHeroSearchButton() {
  injectStyles();
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h1"));
  const homeHeading = headings.find((heading) => normalize(heading.textContent).includes("Намери място"));
  const hero = homeHeading?.closest("section");
  if (!hero) return;

  const searchButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent) === "⌕");
  if (!searchButton || searchButton.dataset.mzmRadarBound === "true") return;

  searchButton.dataset.mzmRadarBound = "true";
  searchButton.setAttribute("aria-label", "Отвори радар за шанс");
  searchButton.setAttribute("title", "Радар за шанс");
  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openRadar();
  });
}

export default function HomeChanceRadar() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        bindHeroSearchButton();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}