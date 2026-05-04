"use client";

import { useEffect } from "react";

const NATIVE_HIDDEN_ATTR = "data-mzm-native-match-hidden";
const BRIDGE_ROOT_ID = "mzm-match-simulator-bridge-root";

function isMatchTitle(text: string) {
  return text.includes("Има потенциален цикъл")
    || text.includes("Координация")
    || text.includes("Още няма цикъл")
    || text.includes("Отказано");
}

function findMatchTitleBlock() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => {
    const text = (h1.textContent || "").replace(/\s+/g, " ").trim();
    return isMatchTitle(text);
  });

  return title?.closest("div") as HTMLElement | null;
}

function resetHiddenNativeSections() {
  document.querySelectorAll<HTMLElement>(`[${NATIVE_HIDDEN_ATTR}="true"]`).forEach((section) => {
    section.style.display = "";
    section.style.visibility = "";
    section.style.pointerEvents = "";
    section.removeAttribute(NATIVE_HIDDEN_ATTR);
  });
}

function hideNativeMatchSection() {
  const titleBlock = findMatchTitleBlock();

  if (!titleBlock) {
    resetHiddenNativeSections();
    document.documentElement.classList.remove("mzm-match-guard-active");
    return;
  }

  document.documentElement.classList.add("mzm-match-guard-active");

  const bridgeRoot = document.getElementById(BRIDGE_ROOT_ID);
  const start = bridgeRoot || titleBlock;
  let next = start.nextElementSibling as HTMLElement | null;

  while (next) {
    if (next.id === BRIDGE_ROOT_ID) {
      next = next.nextElementSibling as HTMLElement | null;
      continue;
    }

    if (next.tagName.toLowerCase() === "section") {
      next.setAttribute(NATIVE_HIDDEN_ATTR, "true");
      next.style.display = "none";
      next.style.visibility = "hidden";
      next.style.pointerEvents = "none";
    }

    next = next.nextElementSibling as HTMLElement | null;
  }
}

export default function MatchFlashGuard() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        hideNativeMatchSection();
      });
    };

    hideNativeMatchSection();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    const interval = window.setInterval(hideNativeMatchSection, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      resetHiddenNativeSections();
      document.documentElement.classList.remove("mzm-match-guard-active");
    };
  }, []);

  return null;
}
