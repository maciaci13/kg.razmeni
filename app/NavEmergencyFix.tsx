"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-nav-emergency-fix-style";

function injectStyles() {
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
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
      padding-top: .75rem !important;
      padding-bottom: calc(6.25rem + env(safe-area-inset-bottom, 0px)) !important;
      scroll-padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) > div {
      padding-top: .35rem !important;
      padding-bottom: calc(6.25rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) > div > .mb-5.flex.items-center.justify-between {
      margin-bottom: .75rem !important;
    }

    main:has(nav.fixed.bottom-4) .mzm-request-form-card,
    main:has(nav.fixed.bottom-4) section:has(#mzm-request-polish-root) {
      margin-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px)) !important;
      scroll-margin-top: .5rem !important;
      scroll-margin-bottom: calc(7rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) .mzm-submit { margin-bottom: 1rem !important; }

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
      box-shadow: 0 -10px 34px rgba(28,27,25,.08), 0 18px 52px rgba(28,27,25,.2), inset 0 1px 0 rgba(255,255,255,.94) !important;
      backdrop-filter: blur(26px) saturate(1.22) !important;
      -webkit-backdrop-filter: blur(26px) saturate(1.22) !important;
      overflow: hidden !important;
      transform: none !important;
    }

    main nav.fixed.bottom-4::before,
    main nav.fixed.bottom-4::after { display: none !important; content: none !important; }

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
    main nav.fixed.bottom-4 > button.bg-orange div:not(:has(svg)) { color: #fff !important; }

    .mzm-chat-empty-card {
      margin-top: 1.1rem;
      border-radius: 2rem;
      background: rgba(255,255,255,.86);
      padding: 1.2rem;
      box-shadow: 0 16px 40px rgba(40,34,20,.055);
    }
    .mzm-chat-empty-card h3 { margin: 0; font-size: 1.22rem; line-height: 1.1; font-weight: 900; letter-spacing: -.04em; }
    .mzm-chat-empty-card p { margin: .55rem 0 0; font-size: .9rem; line-height: 1.55; font-weight: 700; color: rgba(28,27,25,.55); }

    .mzm-request-carousel,
    .mzm-request-card {
      transform: translateZ(0) !important;
      backface-visibility: hidden !important;
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

function disableRadarAutoFocus() {
  const proto = HTMLInputElement.prototype as InputPrototypeWithMzmPatch;
  if (proto.__mzmOriginalFocus) return;
  proto.__mzmOriginalFocus = proto.focus;
  proto.focus = function patchedInputFocus(this: HTMLInputElement, options?: FocusOptions) {
    if (this.closest(".mzm-radar-fixed-search")) return;
    return proto.__mzmOriginalFocus?.call(this, options);
  };
}

function restorePatches() {
  const elementProto = Element.prototype as ElementPrototypeWithMzmPatch;
  if (elementProto.__mzmOriginalScrollIntoView) {
    elementProto.scrollIntoView = elementProto.__mzmOriginalScrollIntoView;
    delete elementProto.__mzmOriginalScrollIntoView;
  }
  const inputProto = HTMLInputElement.prototype as InputPrototypeWithMzmPatch;
  if (inputProto.__mzmOriginalFocus) {
    inputProto.focus = inputProto.__mzmOriginalFocus;
    delete inputProto.__mzmOriginalFocus;
  }
}

function removeGlobalSafetyNotes() {
  const needles = ["Независима платформа за потенциални съвпадения", "Не е официална услуга", "не гарантира прием"];
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

function ensureChatEmptyState() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => {
    const text = (h1.textContent || "").replace(/\s+/g, " ").trim();
    return text === "Още са заключени";
  });
  if (!title) return;
  const titleWrap = title.closest("div");
  const shell = titleWrap?.parentElement;
  if (!shell || shell.querySelector(".mzm-chat-empty-card")) return;
  const card = document.createElement("section");
  card.className = "mzm-chat-empty-card";
  card.innerHTML = `<h3>Чатът ще се отключи след потвърждение</h3><p>Когато всички страни приемат потенциалното съвпадение, тук ще се появи координацията.</p>`;
  titleWrap?.insertAdjacentElement("afterend", card);
}

function stabilizeRequestCards() {
  const shell = document.querySelector<HTMLElement>(".mzm-carousel-shell");
  if (!shell) return;
  const cards = shell.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true']");
  if (!cards.length) return;
  shell.style.minHeight = "17.5rem";
  cards.forEach((card) => {
    card.style.willChange = "transform, opacity";
    card.style.backfaceVisibility = "hidden";
  });
}

function runUiCleanup() {
  injectStyles();
  removeGlobalSafetyNotes();
  ensureChatEmptyState();
  stabilizeRequestCards();
}

type ElementPrototypeWithMzmPatch = typeof Element.prototype & { __mzmOriginalScrollIntoView?: Element["scrollIntoView"] };
type InputPrototypeWithMzmPatch = typeof HTMLInputElement.prototype & { __mzmOriginalFocus?: HTMLInputElement["focus"] };

export default function NavEmergencyFix() {
  useEffect(() => {
    injectStyles();
    disableRequestFormAutoScroll();
    disableRadarAutoFocus();
    runUiCleanup();

    const observer = new MutationObserver(runUiCleanup);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    const t1 = window.setTimeout(runUiCleanup, 120);
    const t2 = window.setTimeout(runUiCleanup, 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer.disconnect();
      restorePatches();
    };
  }, []);

  return null;
}
