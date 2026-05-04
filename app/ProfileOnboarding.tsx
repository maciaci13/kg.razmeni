"use client";

import { useEffect } from "react";

type CatalogInstitution = { id: string; name: string; district?: string | null; address?: string | null };
type Catalog = { districts?: string[]; years?: string[]; institutions?: CatalogInstitution[] };
type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string; onboardingDone?: boolean };

const STYLE_ID = "mzm-profile-onboarding-style";
const MODAL_ID = "mzm-profile-onboarding-modal";
const PREF_KEY = "mzm.profile.defaults.v5";
const PREFILL_KEY = "mzm.request.prefill.v1";
const PLACE_TYPES = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-onboarding-backdrop{position:fixed;inset:0;z-index:10001;display:block;padding:0;background:#fffcfa;color:#1c1b19;overflow:auto;overscroll-behavior:contain}.mzm-onboarding{width:min(100%,34rem);min-height:100dvh;margin:0 auto;display:flex;flex-direction:column;background:#fffcfa;color:#1c1b19;box-shadow:none}.mzm-onboarding-head{position:relative;overflow:hidden;padding:clamp(2rem,7dvh,4.4rem) 1.35rem 1.15rem;background:linear-gradient(145deg,rgba(255,240,227,.98),rgba(255,255,255,.94));border-radius:0 0 2.2rem 2.2rem}.mzm-onboarding-head:after{content:"";position:absolute;right:-3.2rem;top:-2.8rem;width:11.5rem;height:11.5rem;border-radius:999px;background:rgba(217,231,203,.86);opacity:.78;pointer-events:none}.mzm-onboarding-head:before{content:"";position:absolute;right:1.2rem;top:clamp(2.2rem,7dvh,4.2rem);width:4.9rem;height:4.9rem;border-radius:1.6rem;background:rgba(255,255,255,.74);box-shadow:0 18px 42px rgba(40,34,20,.07);pointer-events:none}.mzm-onboarding-k{position:relative;z-index:2;margin:0 0 .65rem;font-size:.68rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:var(--study-orange,#f95e08)}.mzm-onboarding h2{position:relative;z-index:2;max-width:20rem;margin:0;font-size:clamp(2.25rem,11vw,3.9rem);line-height:.9;font-weight:900;letter-spacing:-.075em}.mzm-onboarding p{position:relative;z-index:2;max-width:24rem;margin:.95rem 0 0;font-size:1rem;line-height:1.45;font-weight:750;color:rgba(28,27,25,.58)}.mzm-onboarding-body{padding:1.05rem 1.35rem 1rem;display:grid;gap:.85rem;flex:1 1 auto}.mzm-onboarding-field{border-radius:1.65rem;background:#f7f5ef;padding:.9rem;box-shadow:inset 0 0 0 1px rgba(28,27,25,.025)}.mzm-onboarding-label{display:block;margin:0 0 .45rem;font-size:.62rem;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:rgba(28,27,25,.42)}.mzm-onboarding-select{width:100%;border:0;outline:0;border-radius:1.2rem;background:#fff;padding:1rem;color:#1c1b19;font:inherit;font-size:.92rem;font-weight:850;letter-spacing:-.025em;box-shadow:inset 0 0 0 1px rgba(28,27,25,.025)}.mzm-onboarding-hint{margin:.15rem 1.35rem .95rem!important;max-width:none!important;border-radius:1.3rem;background:#fff0e3;padding:.95rem;font-size:.78rem!important;line-height:1.45!important;font-weight:800!important;color:rgba(28,27,25,.66)!important}.mzm-onboarding-actions{position:relative;display:grid;grid-template-columns:.85fr 1.15fr;gap:.65rem;padding:0 1.35rem max(1.4rem,env(safe-area-inset-bottom));background:#fffcfa}.mzm-onboarding-btn{border:0;border-radius:999px;min-height:3.45rem;padding:1rem;font-size:.86rem;font-weight:900;letter-spacing:-.015em}.mzm-onboarding-primary{background:var(--study-orange,#f95e08);color:#fff;box-shadow:0 16px 34px rgba(249,94,8,.22)}.mzm-onboarding-secondary{background:#f7f5ef;color:#1c1b19}@media (min-width:560px){.mzm-onboarding-backdrop{background:linear-gradient(145deg,#fffcfa,#f7f5ef)}.mzm-onboarding{box-shadow:0 24px 90px rgba(28,27,25,.08)}}
  `;
  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function valueOf(item: CatalogInstitution) { return item.id.startsWith("catalog:") ? item.id : `catalog:${item.id}`; }
function labelOf(item: CatalogInstitution) { return `${item.name}${item.address ? ` · ${item.address}` : ""}`; }
function getPrefs(): Prefs { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; } }
function savePrefs(next: Prefs) { const merged = { ...getPrefs(), ...next, onboardingDone: true }; localStorage.setItem(PREF_KEY, JSON.stringify(merged)); localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...merged, updatedAt: Date.now() })); window.dispatchEvent(new CustomEvent("mzm:prefs-updated", { detail: merged })); }
async function getCatalog() { try { const response = await fetch("/api/catalog", { cache: "no-store" }); return response.ok ? await response.json() as Catalog : null; } catch { return null; } }
function isMainApp() { return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => normalize(h1.textContent).includes("Намери размяна") || normalize(h1.textContent).includes("Намери място")); }
function shouldShow() { const prefs = getPrefs(); return isMainApp() && !prefs.onboardingDone && (!prefs.district || !prefs.year); }
function makeOption(value: string, label: string) { return `<option value="${value.replace(/"/g, "&quot;")}">${label.replace(/</g, "&lt;")}</option>`; }

async function openOnboarding() {
  injectStyles();
  if (document.getElementById(MODAL_ID) || !shouldShow()) return;
  const catalog = await getCatalog();
  const districts = catalog?.districts || [];
  const years = catalog?.years || Array.from({ length: 7 }, (_, i) => String(new Date().getFullYear() - i));
  const institutions = catalog?.institutions || [];
  const prefs = getPrefs();
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "mzm-onboarding-backdrop";
  modal.innerHTML = `<main class="mzm-onboarding" role="main" aria-label="Първа настройка на профила"><section class="mzm-onboarding-head"><p class="mzm-onboarding-k">Първа настройка</p><h2>Да настроим твоя профил</h2><p>Данните се запазват и попълват автоматично за по-голямо удобство.</p></section><section class="mzm-onboarding-body"><div class="mzm-onboarding-field"><label class="mzm-onboarding-label">Район</label><select class="mzm-onboarding-select" data-district><option value="">Избери район</option>${districts.map((d) => makeOption(d, d)).join("")}</select></div><div class="mzm-onboarding-field"><label class="mzm-onboarding-label">Набор</label><select class="mzm-onboarding-select" data-year><option value="">Избери набор</option>${years.map((y) => makeOption(y, y)).join("")}</select></div><div class="mzm-onboarding-field"><label class="mzm-onboarding-label">Тип място</label><select class="mzm-onboarding-select" data-place-type>${PLACE_TYPES.map((type) => makeOption(type, type)).join("")}</select></div><div class="mzm-onboarding-field"><label class="mzm-onboarding-label">Сегашна градина, ако има</label><select class="mzm-onboarding-select" data-from><option value="">Още не посещава / не искам да избера</option></select></div></section><p class="mzm-onboarding-hint">Можеш да редактираш данните си по всяко време от профила си или при създаване на нова заявка.</p><section class="mzm-onboarding-actions"><button type="button" class="mzm-onboarding-btn mzm-onboarding-secondary" data-later>По-късно</button><button type="button" class="mzm-onboarding-btn mzm-onboarding-primary" data-save>Запази</button></section></main>`;
  document.body.appendChild(modal);

  const districtSelect = modal.querySelector<HTMLSelectElement>("[data-district]");
  const yearSelect = modal.querySelector<HTMLSelectElement>("[data-year]");
  const typeSelect = modal.querySelector<HTMLSelectElement>("[data-place-type]");
  const fromSelect = modal.querySelector<HTMLSelectElement>("[data-from]");
  if (districtSelect && prefs.district) districtSelect.value = prefs.district;
  if (yearSelect && prefs.year) yearSelect.value = prefs.year;
  if (typeSelect && prefs.placeType) typeSelect.value = prefs.placeType;

  const refillFrom = () => {
    if (!fromSelect) return;
    const district = districtSelect?.value || "";
    fromSelect.innerHTML = `<option value="">Още не посещава / не искам да избера</option>`;
    institutions.filter((item) => !district || item.district === district).forEach((item) => {
      const option = document.createElement("option"); option.value = valueOf(item); option.textContent = labelOf(item); fromSelect.appendChild(option);
    });
    if (prefs.from && Array.from(fromSelect.options).some((option) => option.value === prefs.from)) fromSelect.value = prefs.from;
    fromSelect.dispatchEvent(new Event("change", { bubbles: true }));
  };
  refillFrom();
  districtSelect?.addEventListener("change", refillFrom);
  modal.querySelector("[data-later]")?.addEventListener("click", () => { savePrefs({ onboardingDone: true }); modal.remove(); });
  modal.querySelector("[data-save]")?.addEventListener("click", () => { savePrefs({ district: districtSelect?.value || "", year: yearSelect?.value || "", placeType: typeSelect?.value || PLACE_TYPES[0], from: fromSelect?.value || "", wanted: getPrefs().wanted || "" }); modal.remove(); });
}

export default function ProfileOnboarding() { useEffect(() => { let tries = 0; const run = () => { tries += 1; void openOnboarding(); if (tries > 20) window.clearInterval(interval); }; const interval = window.setInterval(run, 500); run(); return () => window.clearInterval(interval); }, []); return null; }
