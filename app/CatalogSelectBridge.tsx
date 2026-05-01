"use client";

import { useEffect } from "react";

function makeCatalogOptionSelectable(option: HTMLOptionElement) {
  if (!option.value.startsWith("unavailable:")) return;
  const catalogId = option.value.replace("unavailable:", "");
  option.value = `catalog:${catalogId}`;
  option.disabled = false;
  option.textContent = (option.textContent || "")
    .replace(" · още не е в базата", "")
    .replace(" · синхронизирай каталога", "")
    .trim();
}

function getKgNativeSelects(section: HTMLElement) {
  return Array.from(section.querySelectorAll<HTMLSelectElement>("select:not([data-mzm-enhanced])"))
    .filter((select) => Array.from(select.options).some((option) => (option.textContent || "").includes("·")));
}

function ensureNativeOption(select: HTMLSelectElement | undefined, value: string, label: string) {
  if (!select || !value.startsWith("catalog:")) return;
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (exists) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function bridgeCatalogSelections(section: HTMLElement) {
  const enhancedSelects = Array.from(section.querySelectorAll<HTMLSelectElement>("select[data-mzm-enhanced='true']"));
  const institutionSelects = enhancedSelects.slice(-2);
  const nativeSelects = getKgNativeSelects(section);

  institutionSelects.forEach((select, index) => {
    Array.from(select.options).forEach(makeCatalogOptionSelectable);
    if (select.dataset.mzmCatalogBridge === "true") return;
    select.dataset.mzmCatalogBridge = "true";

    select.addEventListener(
      "change",
      () => {
        const selected = select.selectedOptions[0];
        if (!selected) return;
        ensureNativeOption(nativeSelects[index], selected.value, selected.textContent || selected.value);
      },
      true
    );
  });
}

function runBridge() {
  Array.from(document.querySelectorAll<HTMLElement>("section:has(.mzm-enhanced-request-panel)")).forEach(bridgeCatalogSelections);
}

export default function CatalogSelectBridge() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        runBridge();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
