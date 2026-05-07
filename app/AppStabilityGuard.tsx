"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-app-stability-guard-style";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isVisible(el: Element | null) {
  if (!(el instanceof HTMLElement)) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
}

function isActiveBottomTab(label: string) {
  return Boolean(Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((button) => {
    const text = normalize(button.textContent);
    const isActive =
      button.className.includes("bg-orange") ||
      button.getAttribute("aria-current") === "page" ||
      button.dataset.active === "true";
    return isActive && text.includes(label);
  }));
}

function injectStyles() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    body.mzm-modal-open {
      overflow: hidden !important;
    }

    body:not(.mzm-modal-open) {
      overflow-y: auto !important;
      touch-action: auto !important;
    }

    [data-mzm-share-popup='true'] {
      z-index: 12000 !important;
      touch-action: auto !important;
    }

    #mzm-radar-fixed-modal {
      z-index: 11000 !important;
      touch-action: auto !important;
    }
  `;
  document.head.appendChild(style);
}

function cleanupModalState() {
  const sharePopups = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-share-popup='true']"));
  const radarModals = Array.from(document.querySelectorAll<HTMLElement>("#mzm-radar-fixed-modal"));

  if (sharePopups.length > 1) {
    sharePopups.slice(0, -1).forEach((node) => node.remove());
  }

  if (radarModals.length > 1) {
    radarModals.slice(0, -1).forEach((node) => node.remove());
  }

  const visibleShare = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-share-popup='true']")).find(isVisible);
  if (visibleShare) {
    document.querySelectorAll("#mzm-radar-fixed-modal").forEach((node) => node.remove());
  }

  const hasVisibleModal = Boolean(
    Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-share-popup='true'], #mzm-radar-fixed-modal")).find(isVisible)
  );

  document.body.classList.toggle("mzm-modal-open", hasVisibleModal);
  if (!hasVisibleModal) {
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("touch-action");
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("touch-action");
  }

  if (!isActiveBottomTab("Чат")) {
    document.querySelectorAll<HTMLElement>(".mzm-final-chat-shell").forEach((node) => node.remove());
  }
}

function bindGlobalSafetyClicks() {
  if (document.documentElement.dataset.mzmStabilityGuardBound === "true") return;
  document.documentElement.dataset.mzmStabilityGuardBound = "true";

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const shareOpener = target?.closest("[data-mzm-open-share], [data-mzm-share-card='true'], .mzm-safe-share-cta");
    if (shareOpener) {
      window.setTimeout(cleanupModalState, 0);
      window.setTimeout(cleanupModalState, 80);
      return;
    }

    const closeButton = target?.closest(".mzm-share-popup__close, .mzm-radar-fixed-close");
    if (closeButton) {
      window.setTimeout(cleanupModalState, 0);
      window.setTimeout(cleanupModalState, 80);
      window.setTimeout(cleanupModalState, 220);
      return;
    }

    if (target?.closest("nav.fixed.bottom-4 button")) {
      window.setTimeout(cleanupModalState, 0);
      window.setTimeout(cleanupModalState, 120);
      window.setTimeout(cleanupModalState, 300);
    }
  }, true);

  window.addEventListener("mzm:open-share-popup", () => {
    document.querySelectorAll("#mzm-radar-fixed-modal").forEach((node) => node.remove());
    window.setTimeout(cleanupModalState, 0);
    window.setTimeout(cleanupModalState, 80);
  });

  window.addEventListener("mzm:open-radar", () => {
    if (Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-share-popup='true']")).find(isVisible)) {
      window.setTimeout(cleanupModalState, 0);
    }
  });

  window.addEventListener("touchmove", () => {
    if (!document.querySelector("[data-mzm-share-popup='true'], #mzm-radar-fixed-modal")) cleanupModalState();
  }, { passive: true });
}

export default function AppStabilityGuard() {
  useEffect(() => {
    injectStyles();
    bindGlobalSafetyClicks();
    cleanupModalState();

    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        cleanupModalState();
      });
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-active", "aria-current", "style"] });

    const interval = window.setInterval(cleanupModalState, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      document.body.classList.remove("mzm-modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("touch-action");
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("touch-action");
    };
  }, []);

  return null;
}
