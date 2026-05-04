"use client";

import { useEffect } from "react";

const HIDDEN_STATUS_VALUES = new Set(["cannot_continue", "dropped_out"]);

function safeFallbackValue(select: HTMLSelectElement) {
  const currentStatus = select.dataset.currentStatus || "";
  if (currentStatus && !HIDDEN_STATUS_VALUES.has(currentStatus)) return currentStatus;
  return "not_started";
}

function cleanupDestructiveStatusOptions() {
  document.querySelectorAll<HTMLSelectElement>(".mzm-match-status-select").forEach((select) => {
    if (HIDDEN_STATUS_VALUES.has(select.value)) {
      select.value = safeFallbackValue(select);
    }

    Array.from(select.options).forEach((option) => {
      if (HIDDEN_STATUS_VALUES.has(option.value)) {
        option.remove();
      }
    });
  });
}

export default function StatusDropdownCleanup() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        cleanupDestructiveStatusOptions();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const interval = window.setInterval(schedule, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
