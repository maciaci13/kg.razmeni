"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-nav-emergency-fix-style";

function injectStyles() {
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Final bottom navigation reset. This file must be mounted last. */
    html,
    body {
      min-height: 100% !important;
      height: auto !important;
      overflow-y: auto !important;
      overscroll-behavior-y: contain !important;
      -webkit-overflow-scrolling: touch !important;
    }

    main:has(nav.fixed.bottom-4) {
      min-height: 100dvh !important;
      overflow: visible !important;
      padding-bottom: calc(6.25rem + env(safe-area-inset-bottom, 0px)) !important;
      scroll-padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) > div {
      padding-bottom: calc(6.25rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) .mzm-request-form-card,
    main:has(nav.fixed.bottom-4) section:has(#mzm-request-polish-root) {
      margin-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px)) !important;
      scroll-margin-top: .5rem !important;
      scroll-margin-bottom: calc(7rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) .mzm-submit {
      margin-bottom: 1rem !important;
    }

    main nav.fixed.bottom-4 {
      position: fixed !important;
      left: 1rem !important;
      right: 1rem !important;
      bottom: calc(.85rem + env(safe-area-inset-bottom, 0px)) !important;
      z-index: 80 !important;
      width: auto !important;
      min-width: 0 !important;
      height: 5.2rem !important;
      min-height: 5.2rem !important;
      max-height: 5.2rem !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: .28rem !important;
      padding: .45rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.82) !important;
      border: 1px solid rgba(255,255,255,.96) !important;
      box-shadow:
        0 -10px 34px rgba(28,27,25,.08),
        0 18px 52px rgba(28,27,25,.2),
        inset 0 1px 0 rgba(255,255,255,.94) !important;
      backdrop-filter: blur(26px) saturate(1.22) !important;
      -webkit-backdrop-filter: blur(26px) saturate(1.22) !important;
      overflow: hidden !important;
      transform: none !important;
    }

    main nav.fixed.bottom-4::before,
    main nav.fixed.bottom-4::after {
      display: none !important;
      content: none !important;
    }

    main nav.fixed.bottom-4 > button {
      position: relative !important;
      flex: 1 1 0 !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      height: 4.25rem !important;
      min-height: 4.25rem !important;
      max-height: 4.25rem !important;
      aspect-ratio: auto !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .28rem !important;
      margin: 0 !important;
      padding: .42rem .12rem !important;
      border: 0 !important;
      border-radius: 1.7rem !important;
      background: transparent !important;
      box-shadow: none !important;
      color: rgba(28,27,25,.56) !important;
      text-align: center !important;
      line-height: 1 !important;
      overflow: hidden !important;
      transform: none !important;
      opacity: 1 !important;
    }

    main nav.fixed.bottom-4 > button.bg-orange,
    main nav.fixed.bottom-4 > button[aria-current='page'],
    main nav.fixed.bottom-4 > button[data-active='true'] {
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      box-shadow: 0 12px 28px rgba(249,94,8,.24) !important;
    }

    main nav.fixed.bottom-4 > button > * {
      position: static !important;
      inset: auto !important;
      display: block !important;
      flex: 0 0 auto !important;
      margin: 0 auto !important;
      padding: 0 !important;
      max-width: 100% !important;
      text-align: center !important;
      align-self: center !important;
      justify-self: center !important;
      transform: none !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    main nav.fixed.bottom-4 > button svg {
      width: 1.32rem !important;
      height: 1.32rem !important;
      min-width: 1.32rem !important;
      min-height: 1.32rem !important;
      color: currentColor !important;
      stroke: currentColor !important;
    }

    main nav.fixed.bottom-4 > button span,
    main nav.fixed.bottom-4 > button small,
    main nav.fixed.bottom-4 > button p,
    main nav.fixed.bottom-4 > button div:not(:has(svg)) {
      width: 100% !important;
      font-size: .72rem !important;
      line-height: 1.05 !important;
      font-weight: 800 !important;
      letter-spacing: -.035em !important;
      white-space: nowrap !important;
      color: currentColor !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    main nav.fixed.bottom-4 > button.bg-orange span,
    main nav.fixed.bottom-4 > button.bg-orange small,
    main nav.fixed.bottom-4 > button.bg-orange p,
    main nav.fixed.bottom-4 > button.bg-orange div:not(:has(svg)) {
      color: #fff !important;
    }
  `;

  document.head.appendChild(style);
}

function disableRequestFormAutoScroll() {
  const proto = Element.prototype as ElementPrototypeWithMzmPatch;
  if (proto.__mzmOriginalScrollIntoView) return;

  proto.__mzmOriginalScrollIntoView = proto.scrollIntoView;
  proto.scrollIntoView = function patchedScrollIntoView(this: Element, arg?: boolean | ScrollIntoViewOptions) {
    if (this instanceof HTMLElement && this.classList.contains("mzm-form-inner")) return;
    return proto.__mzmOriginalScrollIntoView?.call(this, arg);
  };
}

function restoreRequestFormAutoScroll() {
  const proto = Element.prototype as ElementPrototypeWithMzmPatch;
  if (!proto.__mzmOriginalScrollIntoView) return;
  proto.scrollIntoView = proto.__mzmOriginalScrollIntoView;
  delete proto.__mzmOriginalScrollIntoView;
}

function removeGlobalSafetyNotes() {
  const needles = [
    "Независима платформа за потенциални съвпадения",
    "Не е официална услуга",
    "не гарантира прием"
  ];

  Array.from(document.querySelectorAll<HTMLElement>("section, article, div")).forEach((node) => {
    if (node.dataset.mzmSafetyRemoved === "true") return;
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 260) return;
    if (needles.some((needle) => text.includes(needle))) {
      node.dataset.mzmSafetyRemoved = "true";
      node.style.display = "none";
      node.setAttribute("aria-hidden", "true");
    }
  });
}

type ElementPrototypeWithMzmPatch = typeof Element.prototype & {
  __mzmOriginalScrollIntoView?: Element["scrollIntoView"];
};

export default function NavEmergencyFix() {
  useEffect(() => {
    injectStyles();
    disableRequestFormAutoScroll();
    removeGlobalSafetyNotes();

    const observer = new MutationObserver(removeGlobalSafetyNotes);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    const t1 = window.setTimeout(() => { injectStyles(); removeGlobalSafetyNotes(); }, 120);
    const t2 = window.setTimeout(() => { injectStyles(); removeGlobalSafetyNotes(); }, 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer.disconnect();
      restoreRequestFormAutoScroll();
    };
  }, []);

  return null;
}
