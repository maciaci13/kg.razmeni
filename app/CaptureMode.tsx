"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-capture-mode-style";

function isCaptureMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("capture") === "1" || params.get("screenshot") === "1";
  } catch {
    return false;
  }
}

function injectCaptureStyles() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html.mzm-capture-mode,
    html.mzm-capture-mode body {
      height: auto !important;
      min-height: 100% !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      touch-action: pan-y !important;
      overscroll-behavior-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }

    html.mzm-capture-mode body {
      position: static !important;
    }

    html.mzm-capture-mode main,
    html.mzm-capture-mode main > div,
    html.mzm-capture-mode .mx-auto.max-w-md,
    html.mzm-capture-mode .mzm-final-tab-shell,
    html.mzm-capture-mode .mzm-final-chat-shell,
    html.mzm-capture-mode .mzm-profile-subscreen {
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      transform: none !important;
      transition: none !important;
      margin-top: 0 !important;
    }

    html.mzm-capture-mode main:has(nav.fixed.bottom-4),
    html.mzm-capture-mode main:has(nav.fixed.bottom-4) > div {
      padding-top: .75rem !important;
      padding-bottom: 1.5rem !important;
    }

    html.mzm-capture-mode nav.fixed.bottom-4 {
      position: static !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: min(100%, 28rem) !important;
      margin: 1.25rem auto 0 !important;
      transform: none !important;
      z-index: 1 !important;
    }

    html.mzm-capture-mode [data-mzm-share-popup='true'],
    html.mzm-capture-mode #mzm-radar-fixed-modal,
    html.mzm-capture-mode .mzm-share-popup,
    html.mzm-capture-mode .mzm-radar-fixed {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

export default function CaptureMode() {
  useEffect(() => {
    if (!isCaptureMode()) return;
    document.documentElement.classList.add("mzm-capture-mode");
    document.body.classList.remove("mzm-modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("touch-action");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("height");
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("touch-action");
    document.documentElement.style.removeProperty("position");
    document.documentElement.style.removeProperty("height");
    injectCaptureStyles();

    return () => {
      document.documentElement.classList.remove("mzm-capture-mode");
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  return null;
}
