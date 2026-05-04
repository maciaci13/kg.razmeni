"use client";

import { useEffect } from "react";

type Prefs = { district?: string; year?: string; placeType?: string; from?: string; wanted?: string };

const PREF_KEY = "mzm.profile.defaults.v5";
const PREFILL_KEY = "mzm.request.prefill.v1";

function getPrefs(): Prefs {
  try {
    const prefill = JSON.parse(localStorage.getItem(PREFILL_KEY) || "null") as (Prefs & { updatedAt?: number }) | null;
    const defaults = JSON.parse(localStorage.getItem(PREF_KEY) || "{}") as Prefs;
    return { ...defaults, ...(prefill || {}) };
  } catch {
    return {};
  }
}

function hasOption(select: HTMLSelectElement, value?: string) {
  return Boolean(value && Array.from(select.options).some((option) => option.value === value));
}

function change(select: HTMLSelectElement, value?: string) {
  if (!value || !hasOption(select, value) || select.value === value) return false;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function syncFormFromProfile() {
  const prefs = getPrefs();
  const form = document.querySelector<HTMLElement>(".mzm-request-form-card");
  if (!form) return;

  const selects = Array.from(form.querySelectorAll<HTMLSelectElement>("select.mzm-select"));
  const [districtSelect, yearSelect, fromSelect, wantedSelect] = selects;
  if (!districtSelect || !yearSelect || !fromSelect || !wantedSelect) return;

  if (prefs.district) change(districtSelect, prefs.district);
  if (prefs.year) change(yearSelect, prefs.year);

  if (prefs.placeType) {
    const typeButton = Array.from(form.querySelectorAll<HTMLButtonElement>(".mzm-type-grid button")).find((button) => button.dataset.value === prefs.placeType);
    if (typeButton && !typeButton.classList.contains("is-active")) typeButton.click();
  }

  window.requestAnimationFrame(() => {
    if (prefs.from) change(fromSelect, prefs.from);
    if (prefs.wanted) change(wantedSelect, prefs.wanted);

    window.requestAnimationFrame(() => {
      if (prefs.from) change(fromSelect, prefs.from);
      if (prefs.wanted) change(wantedSelect, prefs.wanted);
    });
  });
}

export default function RequestProfileDefaultsSync() {
  useEffect(() => {
    const run = () => syncFormFromProfile();
    window.addEventListener("mzm:prefs-updated", run);
    window.addEventListener("storage", run);
    const t1 = window.setTimeout(run, 250);
    const t2 = window.setTimeout(run, 900);
    return () => {
      window.removeEventListener("mzm:prefs-updated", run);
      window.removeEventListener("storage", run);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
