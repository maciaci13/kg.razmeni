"use client";

import { useEffect } from "react";

function cleanupDuplicateStatusOption() {
  document.querySelectorAll<HTMLSelectElement>(".mzm-match-status-select").forEach((select) => {
    const duplicateOption = Array.from(select.options).find((option) => option.value === "cannot_continue");
    if (!duplicateOption) return;

    if (select.value === "cannot_continue") {
      select.value = select.dataset.currentStatus && select.dataset.currentStatus !== "cannot_continue"
        ? select.dataset.currentStatus
        : "not_started";
    }

    duplicateOption.remove();
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
        cleanupDuplicateStatusOption();
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
