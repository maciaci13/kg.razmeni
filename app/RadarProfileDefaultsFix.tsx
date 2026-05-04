"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string; onboardingDone?: boolean };
type ApiError = { error: string };

const PREF_KEY = "mzm.profile.defaults.v5";
const PREFILL_KEY = "mzm.request.prefill.v1";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function rawId(id: string) {
  return String(id || "").replace(/^catalog:/, "");
}

function catalogId(id: string) {
  const raw = rawId(id);
  return raw ? `catalog:${raw}` : "";
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function getPrefs(): Prefs {
  const defaults = readJson<Prefs>(PREF_KEY, {});
  const prefill = readJson<Prefs>(PREFILL_KEY, {});
  return { ...defaults, ...prefill };
}

function savePrefs(next: Prefs) {
  const merged = { ...getPrefs(), ...next };
  localStorage.setItem(PREF_KEY, JSON.stringify(merged));
  localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...merged, updatedAt: Date.now() }));
  window.dispatchEvent(new CustomEvent("mzm:prefs-updated", { detail: merged }));
  return merged;
}

function hasOption(select: HTMLSelectElement, value?: string) {
  return Boolean(value && Array.from(select.options).some((option) => option.value === value));
}

function setSelect(select: HTMLSelectElement | undefined, value?: string) {
  if (!select || !value || !hasOption(select, value)) return false;
  if (select.value === value) return true;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function findRequestForm() {
  return document.querySelector<HTMLElement>(".mzm-request-form-card");
}

function syncRequestForm() {
  const form = findRequestForm();
  if (!form) return;

  const prefs = getPrefs();
  if (!prefs.district && !prefs.year && !prefs.from && !prefs.wanted) return;

  const selects = Array.from(form.querySelectorAll<HTMLSelectElement>("select.mzm-select"));
  const [districtSelect, yearSelect, fromSelect, wantedSelect] = selects;
  if (!districtSelect || !yearSelect || !fromSelect || !wantedSelect) return;

  const apply = () => {
    if (prefs.district) setSelect(districtSelect, prefs.district);
    if (prefs.year) setSelect(yearSelect, prefs.year);

    if (prefs.placeType) {
      const typeButton = Array.from(form.querySelectorAll<HTMLButtonElement>(".mzm-type-grid button")).find((button) => button.dataset.value === prefs.placeType);
      if (typeButton && !typeButton.classList.contains("is-active")) typeButton.click();
    }

    window.requestAnimationFrame(() => {
      if (prefs.from) setSelect(fromSelect, prefs.from);
      if (prefs.wanted) setSelect(wantedSelect, prefs.wanted);
      window.requestAnimationFrame(() => {
        if (prefs.from) setSelect(fromSelect, prefs.from);
        if (prefs.wanted) setSelect(wantedSelect, prefs.wanted);
        savePrefs(prefs);
      });
    });
  };

  apply();
}

async function fetchSnapshot(): Promise<PlaygroundSnapshot | null> {
  try {
    const response = await fetch("/api/playground", { cache: "no-store" });
    const data = (await response.json()) as PlaygroundSnapshot | ApiError;
    if (!response.ok || "error" in data) return null;
    return data;
  } catch {
    return null;
  }
}

function countForYear(snapshot: PlaygroundSnapshot, year: string) {
  const wantedByRequest = new Map(snapshot.wantedKindergartens.map((wanted) => [wanted.request_id, wanted.wanted_kindergarten_id]));
  const counts = new Map<string, number>();
  const bump = (id: string) => {
    const key = catalogId(id);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  snapshot.requests
    .filter((request) => (request.is_active || request.is_locked || request.status === "enrolled") && request.child_group_year_or_age_group === year)
    .forEach((request) => {
      bump(request.from_kindergarten_id);
      const wantedId = wantedByRequest.get(request.id);
      if (wantedId) bump(wantedId);
    });

  return counts;
}

let cachedYear = "";
let cachedCounts = new Map<string, number>();
let countsLoading = false;

async function ensureCounts() {
  const year = getPrefs().year || "";
  if (!year || countsLoading || (cachedYear === year && cachedCounts.size > 0)) return;
  countsLoading = true;
  const snapshot = await fetchSnapshot();
  if (snapshot) {
    cachedYear = year;
    cachedCounts = countForYear(snapshot, year);
  }
  countsLoading = false;
}

function polishRadarStats() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".mzm-radar-card[data-radar-id]"));
  if (!cards.length) return;

  const year = getPrefs().year || "";
  cards.forEach((card) => {
    const stats = Array.from(card.querySelectorAll<HTMLElement>(".mzm-radar-stat"));
    const cohortStat = stats[2];
    if (!cohortStat) return;
    const strong = cohortStat.querySelector<HTMLElement>("strong");
    const span = cohortStat.querySelector<HTMLElement>("span");
    if (span) span.textContent = "Активни за твоя набор";
    if (strong) {
      const id = card.dataset.radarId || "";
      const count = year ? cachedCounts.get(catalogId(id)) : undefined;
      strong.textContent = typeof count === "number" ? String(count).padStart(2, "0") : "—";
    }
  });
}

function districtFromCard(card: HTMLElement) {
  const meta = normalize(card.querySelector<HTMLElement>(".mzm-radar-meta")?.textContent);
  return meta.split(" · ")[0]?.trim() || "";
}

function interceptRadarUse(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>(".mzm-radar-action[data-radar-use]");
  if (!button) return;

  const card = button.closest<HTMLElement>(".mzm-radar-card[data-radar-id]");
  const wanted = button.dataset.radarUse || card?.dataset.radarId || "";
  if (!wanted) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const district = card ? districtFromCard(card) : "";
  savePrefs({
    district: district && district !== "Без район" ? district : getPrefs().district,
    wanted,
    year: getPrefs().year,
    placeType: getPrefs().placeType || "Общ ред"
  });

  document.querySelector<HTMLElement>("[data-mzm-radar-modal='true']")?.remove();
  Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button"))
    .find((navButton) => normalize(navButton.textContent).includes("Заявка"))
    ?.click();

  window.setTimeout(syncRequestForm, 150);
  window.setTimeout(syncRequestForm, 650);
  window.setTimeout(syncRequestForm, 1300);
}

export default function RadarProfileDefaultsFix() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(async () => {
        scheduled = false;
        syncRequestForm();
        await ensureCounts();
        polishRadarStats();
      });
    };

    document.addEventListener("click", interceptRadarUse, true);
    window.addEventListener("mzm:prefs-updated", schedule);
    window.addEventListener("storage", schedule);

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 700);

    return () => {
      document.removeEventListener("click", interceptRadarUse, true);
      window.removeEventListener("mzm:prefs-updated", schedule);
      window.removeEventListener("storage", schedule);
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
