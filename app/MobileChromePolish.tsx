"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-mobile-chrome-polish-style";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Match status select arrow only. Do not touch bottom navigation layout here. */
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
  `;

  document.head.appendChild(style);
}

export default function MobileChromePolish() {
  useEffect(() => {
    injectStyles();
  }, []);

  return null;
}
