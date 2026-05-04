"use client";

import { useEffect } from "react";

const PREF_KEY = "mzm.profile.defaults.v5";

function hasProfileDefaults() {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}") as Record<string, unknown>;
    return Boolean(prefs.district || prefs.year || prefs.placeType || prefs.from || prefs.wanted || prefs.onboardingDone);
  } catch {
    return false;
  }
}

function fixCheckboxDefault() {
  if (!hasProfileDefaults()) return;
  const row = document.querySelector<HTMLElement>(".mzm-save-row");
  const checkbox = row?.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (!checkbox || checkbox.dataset.mzmProfileDefaultFixed === "true") return;
  checkbox.checked = false;
  checkbox.dataset.mzmProfileDefaultFixed = "true";
}

export default function RequestProfileCheckboxFix() {
  useEffect(() => {
    const run = () => fixCheckboxDefault();
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const interval = window.setInterval(run, 600);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
  return null;
}
