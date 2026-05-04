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
    .mzm-onboarding-backdrop{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(28,27,25,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .mzm-onboarding{width:min(100%,30rem);max-height:calc(100dvh - 2rem);overflow:auto;border-radius:2.2rem;background:#fffcfa;color:#1c1b19;box-shadow:0 28px 90px rgba(28,27,25,.24)}
    .mzm-onboarding-head{padding:1.2rem;border-radius:2.2rem 2.2rem 0 0;background:linear-gradient(145deg,rgba(255,240,227,.98),rgba(255,255,255,.94))}.mzm-onboarding-k{margin:0 0 .45rem;font-size:.68rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:var(--study-orange,#f95e08)}.mzm-onboarding h2{margin:0;font-size:2rem;line-height:.95;font-weight:900;letter-spacing:-.065em}.mzm-onboarding p{margin:.75rem 0 0;font-size:.88rem;line-height:1.45;font-weight:750;color:rgba(28,27,25,.58)}
    .mzm-onboarding-body{padding:1rem;display:grid;gap:.75rem}.mzm-onboarding-label{display:block;margin:.15rem 0 .35rem;font-size:.62rem;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:rgba(28,27,25,.42)}.mzm-onboarding-select{width:100%;border:0;outline:0;border-radius:1.2rem;background:#f7f5ef;padding:.98rem 1rem;color:#1c1b19;font:inherit;font-size:.86rem;font-weight:850}.mzm-onboarding-actions{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;padding:0 1rem 1rem}.mzm-onboarding-btn{border:0;border-radius:999px;padding:.98rem 1rem;font-size:.82rem;font-weight:900}.mzm-onboarding-primary{background:var(--study-orange,#f95e08);color:#fff;box-shadow:0 14px 30px rgba(249,94,8,.18)}.mzm-onboarding-secondary{background:#f7f5ef;color:#1c1b19}.mzm-onboarding-hint{margin:0 1rem 1rem!important;border-radius:1.15rem;background:#fff0e3;padding:.85rem;font-size:.76rem!important;line-height:1.45!important;font-weight:800!important;color:rgba(28,27,25,.66)!important}
  `;
  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) { return (value || "").replace(/\s+/g, " ").trim(); }
function valueOf(item: CatalogInstitution) { return item.id.startsWith("catalog:") ? item.id : `catalog:${item.id}`; }
function labelOf(item: CatalogInstitution) { return `${item.name}${item.address ? ` · ${item.address}` : ""}`; }
function getPrefs(): Prefs { try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; } }
function savePrefs(next: Prefs) {
  const merged = { ...getPrefs(), ...next, onboardingDone: true };
  localStorage.setItem(PREF_KEY, JSON.stringify(merged));
  localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...merged, updatedAt: Date.now() }));
  window.dispatchEvent(new CustomEvent("mzm:prefs-updated", { detail: merged }));
}
async function getCatalog() {
  try { const response = await fetch("/api/catalog", { cache: "no-store" }); return response.ok ? await response.json() as Catalog : null; } catch { return null; }
}
function isMainApp() { return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => normalize(h1.textContent).includes("Намери място")); }
function shouldShow() {
  const prefs = getPrefs();
  return isMainApp() && !prefs.onboardingDone && (!prefs.district || !prefs.year);
}
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
  modal.innerHTML = `<div class="mzm-onboarding" role="dialog" aria-modal="true"><div class="mzm-onboarding-head"><p class="mzm-onboarding-k">Първа настройка</p><h2>Да настроим твоя контекст</h2><p>Тези данни ще се запазят в профила и ще се попълват автоматично в заявките, радара и бъдещата карта.</p></div><div class="mzm-onboarding-body"><div><label class="mzm-onboarding-label">Район</label><select class="mzm-onboarding-select" data-district><option value="">Избери район</option>${districts.map((d) => makeOption(d, d)).join("")}</select></div><div><label class="mzm-onboarding-label">Набор</label><select class="mzm-onboarding-select" data-year><option value="">Избери набор</option>${years.map((y) => makeOption(y, y)).join("")}</select></div><div><label class="mzm-onboarding-label">Тип място</label><select class="mzm-onboarding-select" data-place-type>${PLACE_TYPES.map((type) => makeOption(type, type)).join("")}</select></div><div><label class="mzm-onboarding-label">Сегашна градина, ако има</label><select class="mzm-onboarding-select" data-from><option value="">Още не посещава / не искам да избера</option></select></div></div><p class="mzm-onboarding-hint">Можеш да редактираш тези данни по-късно от заявката. Сега ги ползваме само като умни стойности по подразбиране.</p><div class="mzm-onboarding-actions"><button type="button" class="mzm-onboarding-btn mzm-onboarding-secondary" data-later>По-късно</button><button type="button" class="mzm-onboarding-btn mzm-onboarding-primary" data-save>Запази</button></div></div>`;
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
  };
  refillFrom();
  districtSelect?.addEventListener("change", refillFrom);
  modal.querySelector("[data-later]")?.addEventListener("click", () => { savePrefs({ onboardingDone: true }); modal.remove(); });
  modal.querySelector("[data-save]")?.addEventListener("click", () => {
    savePrefs({ district: districtSelect?.value || "", year: yearSelect?.value || "", placeType: typeSelect?.value || PLACE_TYPES[0], from: fromSelect?.value || "", wanted: getPrefs().wanted || "" });
    modal.remove();
  });
}

export default function ProfileOnboarding() {
  useEffect(() => {
    let tries = 0;
    const run = () => { tries += 1; void openOnboarding(); if (tries > 20) window.clearInterval(interval); };
    const interval = window.setInterval(run, 500);
    run();
    return () => window.clearInterval(interval);
  }, []);
  return null;
}
