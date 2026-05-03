"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-mobile-chrome-polish-style";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Match status select arrow */
    .mzm-match-status-select {
      appearance: none !important;
      -webkit-appearance: none !important;
      background-color: rgba(255,255,255,.92) !important;
      background-image: url('/icons/angle-down.svg') !important;
      background-repeat: no-repeat !important;
      background-position: right 1rem center !important;
      background-size: 1.05rem 1.05rem !important;
      padding-right: 3rem !important;
    }

    .mzm-match-status-select::-ms-expand {
      display: none !important;
    }

    /* Active bottom-tab centering */
    main nav.fixed.bottom-4 button.bg-orange,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .22rem !important;
      padding: 0 !important;
      text-align: center !important;
      line-height: 1 !important;
      overflow: visible !important;
    }

    main nav.fixed.bottom-4 button.bg-orange *,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange * {
      margin-left: auto !important;
      margin-right: auto !important;
      text-align: center !important;
      align-self: center !important;
      justify-self: center !important;
      transform: none !important;
    }

    main nav.fixed.bottom-4 button.bg-orange svg,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange svg {
      display: block !important;
      margin: 0 auto !important;
      flex: 0 0 auto !important;
    }

    main nav.fixed.bottom-4 button.bg-orange span,
    main nav.fixed.bottom-4 button.bg-orange small,
    main nav.fixed.bottom-4 button.bg-orange p,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange span,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange small,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange p {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      white-space: nowrap !important;
      text-align: center !important;
      letter-spacing: -0.02em !important;
    }
  `;

  document.head.appendChild(style);
}

export default function MobileChromePolish() {
  useEffect(() => {
    injectStyles();
  }, []);

  return null;
}
