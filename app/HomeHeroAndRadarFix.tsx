"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };
type Kg = { id: string; name: string; district?: string | null; address?: string | null };
type Catalog = { institutions?: Kg[]; districts?: string[] };
type RadarItem = { id: string; name: string; district: string; address?: string | null; wantedBy: number; offeredBy: number; score: number; isNearMe: boolean; activeForMyYear: number };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string };

const STYLE_ID = "mzm-home-hero-and-radar-fix-style";
const MODAL_ID = "mzm-radar-fixed-modal";
const PREF_KEY = "mzm.profile.defaults.v5";
const PREFILL_KEY = "mzm.request.prefill.v1";

function normalize(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function escapeHtml(value: string) { return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char)); }
function rawId(id: string) { return String(id || "").replace(/^catalog:/, ""); }
function catalogId(id: string) { const raw = rawId(id); return raw ? `catalog:${raw}` : ""; }
function readPrefs(): Prefs { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; } }
function savePrefs(next: Prefs) {
  const merged = { ...readPrefs(), ...next };
  localStorage.setItem(PREF_KEY, JSON.stringify(merged));
  localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...merged, updatedAt: Date.now() }));
  window.dispatchEvent(new CustomEvent("mzm:prefs-updated", { detail: merged }));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-radar-hero-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.55rem!important;width:auto!important;min-width:9.6rem!important;height:3rem!important;padding:0 1rem!important;border-radius:999px!important;background:#f7f5ef!important;color:#1c1b19!important;font-size:.82rem!important;font-weight:900!important;letter-spacing:-.015em!important;box-shadow:inset 0 0 0 1px rgba(28,27,25,.025)!important;white-space:nowrap!important}.mzm-radar-hero-icon{display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:999px;background:rgba(249,94,8,.12);color:var(--study-orange,#f95e08);font-size:1.05rem;line-height:1;flex:0 0 auto}.mzm-hero-search-row{gap:.45rem!important}.mzm-hero-search-row>button:last-child{min-width:0!important}.mzm-hero-hidden-subcopy{display:none!important}
    .mzm-radar-fixed-backdrop{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(28,27,25,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.mzm-radar-fixed{width:min(100%,30rem);max-height:calc(100dvh - 2rem);overflow:auto;border-radius:2.2rem;background:#fffcfa;color:#1c1b19;box-shadow:0 28px 90px rgba(28,27,25,.24)}.mzm-radar-fixed-head{position:relative;overflow:hidden;padding:1.2rem;border-radius:2.2rem 2.2rem 0 0;background:linear-gradient(145deg,rgba(255,240,227,.98),rgba(255,255,255,.94))}.mzm-radar-fixed-head:after{content:"";position:absolute;right:-2.8rem;top:-2.6rem;width:10rem;height:10rem;border-radius:999px;background:rgba(217,231,203,.85);opacity:.8}.mzm-radar-fixed-top{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.mzm-radar-fixed-k{margin:0 0 .45rem;font-size:.68rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:var(--study-orange,#f95e08)}.mzm-radar-fixed h2{margin:0;font-size:2rem;line-height:.95;font-weight:900;letter-spacing:-.065em}.mzm-radar-fixed-intro{position:relative;z-index:2;max-width:21rem;margin:.8rem 0 0;font-size:.88rem;line-height:1.45;font-weight:750;color:rgba(28,27,25,.58)}.mzm-radar-fixed-close{position:relative;z-index:3;display:grid;place-items:center;width:2.8rem;height:2.8rem;border:0;border-radius:999px;background:rgba(255,255,255,.86);color:#1c1b19;font-size:1.35rem;font-weight:900}.mzm-radar-fixed-body{padding:1rem;display:grid;gap:.85rem}.mzm-radar-fixed-loading{min-height:14rem;display:grid;place-items:center;border-radius:1.65rem;background:#f7f5ef}.mzm-radar-fixed-loading-word{margin:0;font-size:clamp(2rem,9vw,3.4rem);line-height:.95;font-weight:900;letter-spacing:.035em;text-transform:uppercase;background:linear-gradient(100deg,rgba(28,27,25,.22) 0%,rgba(28,27,25,.22) 34%,rgba(255,255,255,.96) 45%,rgba(249,94,8,.9) 50%,rgba(255,255,255,.96) 55%,rgba(28,27,25,.22) 66%,rgba(28,27,25,.22) 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:mzmRadarFixedSweep 1.65s cubic-bezier(.4,0,.2,1) infinite}@keyframes mzmRadarFixedSweep{0%{background-position:140% 0}100%{background-position:-140% 0}}
    .mzm-radar-fixed-filters{display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.1rem}.mzm-radar-fixed-filter{flex:0 0 auto;border:0;border-radius:999px;background:#f7f5ef;padding:.72rem .95rem;color:rgba(28,27,25,.58);font-size:.75rem;font-weight:900;white-space:nowrap}.mzm-radar-fixed-filter.is-active{background:var(--study-orange,#f95e08);color:#fff}.mzm-radar-fixed-list{display:grid;gap:.75rem}.mzm-radar-fixed-card{border-radius:1.65rem;background:#f7f5ef;padding:.95rem;box-shadow:inset 0 0 0 1px rgba(28,27,25,.025)}.mzm-radar-fixed-card:nth-child(2n){background:#d2e4e2}.mzm-radar-fixed-card:nth-child(3n){background:#ecedc7}.mzm-radar-fixed-card h3{margin:0;font-size:1.08rem;line-height:1.12;font-weight:900;letter-spacing:-.035em}.mzm-radar-fixed-meta{margin:.35rem 0 0;font-size:.74rem;line-height:1.35;font-weight:750;color:rgba(28,27,25,.55)}.mzm-radar-fixed-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem;margin-top:.8rem}.mzm-radar-fixed-stat{border-radius:1.05rem;background:rgba(255,255,255,.66);padding:.65rem;min-height:4.1rem}.mzm-radar-fixed-stat strong{display:block;font-size:1.05rem;line-height:1;font-weight:900}.mzm-radar-fixed-stat span{display:block;margin-top:.35rem;font-size:.62rem;line-height:1.15;font-weight:850;color:rgba(28,27,25,.52)}.mzm-radar-fixed-action{width:100%;margin-top:.85rem;border:0;border-radius:999px;background:var(--study-orange,#f95e08);color:#fff;padding:.88rem 1rem;font-size:.78rem;font-weight:900;box-shadow:0 14px 30px rgba(249,94,8,.22)}.mzm-radar-fixed-empty{border-radius:1.65rem;background:#f7f5ef;padding:1rem}.mzm-radar-fixed-empty h3{margin:0;font-size:1.15rem;font-weight:900;letter-spacing:-.035em}.mzm-radar-fixed-empty p{margin:.45rem 0 0;color:rgba(28,27,25,.58);font-size:.84rem;line-height:1.45;font-weight:750}
  `;
  document.head.appendChild(style);
}

function findHeroSection() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((item) => {
    const text = normalize(item.textContent);
    return text.includes("Намери място") || text.includes("Намери размяна");
  });
  return heading?.closest("section") as HTMLElement | null;
}

function polishHero() {
  const hero = findHeroSection();
  if (!hero) return;
  const h1 = hero.querySelector<HTMLElement>("h1");
  if (h1) h1.innerHTML = `Намери<br/><span style="color:var(--study-orange,#f95e08)">размяна</span>`;
  const kicker = Array.from(hero.querySelectorAll<HTMLElement>("p,span,div")).find((item) => normalize(item.textContent) === "Твоят маршрут");
  if (kicker) kicker.textContent = "Място За Място";
  const sub = Array.from(hero.querySelectorAll<HTMLElement>("p")).find((item) => normalize(item.textContent).includes("възможна координация") || normalize(item.textContent).includes("Координирай"));
  if (sub) sub.textContent = "Координирай се с други родители.";
  Array.from(hero.querySelectorAll<HTMLElement>("h3")).forEach((title) => { if (normalize(title.textContent).includes("Потенциални маршрута")) title.textContent = "Съвпадения"; });
  Array.from(hero.querySelectorAll<HTMLElement>("p")).forEach((p) => { if (normalize(p.textContent).includes("2/3/4-странни цикли")) p.classList.add("mzm-hero-hidden-subcopy"); });
  const row = Array.from(hero.querySelectorAll<HTMLElement>("div")).find((item) => normalize(item.textContent).includes("Пусни заявка") && (normalize(item.textContent).includes("⌕") || normalize(item.textContent).includes("Радар за шанс")));
  row?.classList.add("mzm-hero-search-row");
  const radarButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
    const text = normalize(button.textContent);
    return text === "⌕" || text.includes("Радар за шанс") || button.getAttribute("aria-label") === "Отвори радар за шанс";
  });
  if (radarButton) {
    radarButton.classList.add("mzm-radar-hero-button");
    radarButton.setAttribute("aria-label", "Отвори радар за шанс");
    radarButton.innerHTML = `<span class="mzm-radar-hero-icon" aria-hidden="true">⌁</span><span>Радар за шанс</span>`;
  }
}

async function getJson<T>(url: string): Promise<T | null> { try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? await r.json() as T : null; } catch { return null; } }
function selectedUserId(snapshot: PlaygroundSnapshot) { return snapshot.users[0]?.id || ""; }
function catalogMap(institutions: Kg[]) { const map = new Map<string, Kg>(); institutions.forEach((kg) => { map.set(kg.id, kg); map.set(rawId(kg.id), kg); map.set(catalogId(kg.id), kg); }); return map; }
function buildRadar(snapshot: PlaygroundSnapshot, institutions: Kg[]) {
  const prefs = readPrefs();
  const map = catalogMap(institutions);
  const wanted = new Map(snapshot.wantedKindergartens.map((w) => [w.request_id, w.wanted_kindergarten_id]));
  const active = snapshot.requests.filter((r) => r.is_active || r.is_locked || r.status === "enrolled");
  const my = active.find((r) => r.user_id === selectedUserId(snapshot));
  const myFrom = my ? map.get(my.from_kindergarten_id) || map.get(catalogId(my.from_kindergarten_id)) : undefined;
  const myWantedId = my ? wanted.get(my.id) : undefined;
  const myWanted = myWantedId ? map.get(myWantedId) || map.get(catalogId(myWantedId)) : undefined;
  const district = myWanted?.district || myFrom?.district || prefs.district || "";
  const year = my?.child_group_year_or_age_group || prefs.year || "";
  const stats = new Map<string, RadarItem>();
  const ensure = (id: string) => { const kg = map.get(id) || map.get(catalogId(id)); const key = catalogId(id); if (!kg || !key) return null; if (!stats.has(key)) stats.set(key, { id: key, name: kg.name, district: kg.district || "Без район", address: kg.address, wantedBy: 0, offeredBy: 0, score: 0, isNearMe: Boolean(district && kg.district === district), activeForMyYear: 0 }); return stats.get(key) || null; };
  active.forEach((request) => {
    const fromStat = ensure(request.from_kindergarten_id);
    const wantedId = wanted.get(request.id);
    const wantedStat = wantedId ? ensure(wantedId) : null;
    if (fromStat) { fromStat.offeredBy += 1; if (year && request.child_group_year_or_age_group === year) fromStat.activeForMyYear += 1; }
    if (wantedStat) { wantedStat.wantedBy += 1; if (year && request.child_group_year_or_age_group === year) wantedStat.activeForMyYear += 1; }
  });
  const all = Array.from(stats.values()).map((item) => ({ ...item, score: item.wantedBy * 2 + item.offeredBy * 2 + (item.wantedBy && item.offeredBy ? 4 : 0) + (item.isNearMe ? 2 : 0) + (item.activeForMyYear ? 2 : 0) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || b.wantedBy - a.wantedBy || b.offeredBy - a.offeredBy);
  return { year, prefs, all, near: all.filter((i) => i.isNearMe), balanced: all.filter((i) => i.wantedBy > 0 && i.offeredBy > 0) };
}

function openShell() {
  document.getElementById(MODAL_ID)?.remove();
  const shell = document.createElement("div"); shell.id = MODAL_ID; shell.className = "mzm-radar-fixed-backdrop";
  shell.innerHTML = `<div class="mzm-radar-fixed" role="dialog" aria-modal="true"><div class="mzm-radar-fixed-head"><div class="mzm-radar-fixed-top"><div><p class="mzm-radar-fixed-k">Радар за шанс</p><h2>Къде има движение?</h2></div><button type="button" class="mzm-radar-fixed-close" aria-label="Затвори">×</button></div><p class="mzm-radar-fixed-intro">Показваме места с активни заявки и потенциал за бъдещо съвпадение.</p></div><div class="mzm-radar-fixed-body"><div class="mzm-radar-fixed-loading"><h2 class="mzm-radar-fixed-loading-word">Зареждане</h2></div></div></div>`;
  shell.addEventListener("click", (e) => { if (e.target === shell) shell.remove(); }); shell.querySelector(".mzm-radar-fixed-close")?.addEventListener("click", () => shell.remove()); document.body.appendChild(shell); return shell;
}
function renderCards(items: RadarItem[]) { if (!items.length) return `<div class="mzm-radar-fixed-empty"><h3>Още няма достатъчно движение</h3><p>Пусни заявка и сподели платформата. Радарът става по-точен, когато повече родители се включат.</p></div>`; return items.slice(0, 8).map((item) => `<article class="mzm-radar-fixed-card"><h3>${escapeHtml(item.name)}</h3><p class="mzm-radar-fixed-meta">${escapeHtml(item.district)}${item.address ? ` · ${escapeHtml(item.address)}` : ""}</p><div class="mzm-radar-fixed-stats"><div class="mzm-radar-fixed-stat"><strong>${item.wantedBy}</strong><span>родители я търсят</span></div><div class="mzm-radar-fixed-stat"><strong>${item.offeredBy}</strong><span>може да я освободят</span></div><div class="mzm-radar-fixed-stat"><strong>${String(item.activeForMyYear).padStart(2, "0")}</strong><span>Активни за твоя набор</span></div></div><button type="button" class="mzm-radar-fixed-action" data-use="${escapeHtml(item.id)}">Заяви размяна</button></article>`).join(""); }
function renderRadar(shell: HTMLElement, radar: ReturnType<typeof buildRadar>) { let mode: "near" | "balanced" | "all" = radar.near.length ? "near" : radar.balanced.length ? "balanced" : "all"; const body = shell.querySelector<HTMLElement>(".mzm-radar-fixed-body"); if (!body) return; const paint = () => { const items = mode === "near" ? radar.near : mode === "balanced" ? radar.balanced : radar.all; body.innerHTML = `<div class="mzm-radar-fixed-filters"><button type="button" class="mzm-radar-fixed-filter ${mode === "near" ? "is-active" : ""}" data-mode="near">Около мен</button><button type="button" class="mzm-radar-fixed-filter ${mode === "balanced" ? "is-active" : ""}" data-mode="balanced">Най-голям шанс</button><button type="button" class="mzm-radar-fixed-filter ${mode === "all" ? "is-active" : ""}" data-mode="all">Всички</button></div><div class="mzm-radar-fixed-list">${renderCards(items)}</div>`; body.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = (b.dataset.mode as typeof mode) || "all"; paint(); })); body.querySelectorAll<HTMLButtonElement>("[data-use]").forEach((b) => b.addEventListener("click", () => { savePrefs({ wanted: b.dataset.use || "" }); shell.remove(); Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((nav) => normalize(nav.textContent).includes("Заявка"))?.click(); })); }; paint(); }
async function openRadar() { const shell = openShell(); const [snapshot, catalog] = await Promise.all([getJson<PlaygroundSnapshot | ApiError>("/api/playground"), getJson<Catalog>("/api/catalog")]); if (!snapshot || "error" in snapshot) return; renderRadar(shell, buildRadar(snapshot, catalog?.institutions || [])); }

function bindRadarButton() {
  const hero = findHeroSection(); if (!hero) return;
  const button = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((b) => normalize(b.textContent).includes("Радар за шанс") || b.classList.contains("mzm-radar-hero-button") || b.getAttribute("aria-label") === "Отвори радар за шанс");
  if (!button || button.dataset.mzmFixedRadarBound === "true") return;
  button.dataset.mzmFixedRadarBound = "true";
  button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); void openRadar(); }, true);
}

export default function HomeHeroAndRadarFix() {
  useEffect(() => {
    injectStyles();
    let scheduled = false;
    const schedule = () => { if (scheduled) return; scheduled = true; window.requestAnimationFrame(() => { scheduled = false; polishHero(); bindRadarButton(); }); };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 600);
    return () => { observer.disconnect(); window.clearInterval(interval); };
  }, []);
  return null;
}
