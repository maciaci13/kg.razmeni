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

    /* Stable bottom navigation. Keep the app's original sizing; only normalize centering. */
    main nav.fixed.bottom-4,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      align-items: center !important;
      gap: .28rem !important;
    }

    main nav.fixed.bottom-4 button,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button {
      min-width: 0 !important;
      width: 100% !important;
      height: 4.65rem !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .28rem !important;
      padding: .55rem .22rem !important;
      text-align: center !important;
      line-height: 1.05 !important;
      overflow: visible !important;
    }

    main nav.fixed.bottom-4 button.bg-orange,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      width: 100% !important;
      height: 4.65rem !important;
      min-height: 4.65rem !important;
      max-height: 4.65rem !important;
      aspect-ratio: auto !important;
      padding: .52rem .28rem !important;
      border-radius: 1.55rem !important;
      transform: none !important;
    }

    main nav.fixed.bottom-4 button svg,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button svg {
      display: block !important;
      flex: 0 0 auto !important;
      margin: 0 auto !important;
      width: 1.32rem !important;
      height: 1.32rem !important;
      transform: none !important;
    }

    main nav.fixed.bottom-4 button.bg-orange svg,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange svg {
      width: 1.42rem !important;
      height: 1.42rem !important;
    }

    main nav.fixed.bottom-4 button span,
    main nav.fixed.bottom-4 button small,
    main nav.fixed.bottom-4 button p,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button span,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button small,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button p {
      display: block !important;
      width: 100% !important;
      margin: 0 auto !important;
      max-width: 100% !important;
      white-space: nowrap !important;
      text-align: center !important;
      align-self: center !important;
      justify-self: center !important;
      transform: none !important;
      font-size: .76rem !important;
      line-height: 1.05 !important;
      letter-spacing: -0.025em !important;
    }

    main nav.fixed.bottom-4 button.bg-orange span,
    main nav.fixed.bottom-4 button.bg-orange small,
    main nav.fixed.bottom-4 button.bg-orange p,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange span,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange small,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange p {
      color: #fff !important;
      font-size: .72rem !important;
      line-height: 1.02 !important;
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
