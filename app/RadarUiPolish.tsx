"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-radar-ui-polish-style";
const MODAL_ATTR = "data-mzm-radar-modal";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-radar-loading-shell {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(28,27,25,.34);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .mzm-radar-loading-card {
      width: min(100%,30rem);
      border-radius: 2.2rem;
      background: #fffcfa;
      padding: 1rem;
      box-shadow: 0 28px 90px rgba(28,27,25,.24);
    }
    .mzm-radar-loading-inner {
      min-height: 14rem;
      display: grid;
      place-items: center;
      border-radius: 1.8rem;
      background: #f7f5ef;
      overflow: hidden;
    }
    .mzm-radar-loading-word {
      margin: 0;
      font-size: clamp(2rem,9vw,3.4rem);
      line-height: .95;
      font-weight: 900;
      letter-spacing: .035em;
      text-transform: uppercase;
      background: linear-gradient(100deg,rgba(28,27,25,.22) 0%,rgba(28,27,25,.22) 34%,rgba(255,255,255,.96) 45%,rgba(249,94,8,.9) 50%,rgba(255,255,255,.96) 55%,rgba(28,27,25,.22) 66%,rgba(28,27,25,.22) 100%);
      background-size: 260% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: mzmRadarImmediateSweep 1.65s cubic-bezier(.4,0,.2,1) infinite;
    }
    @keyframes mzmRadarImmediateSweep {
      0% { background-position: 140% 0; }
      100% { background-position: -140% 0; }
    }
  `;
  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function showImmediateLoader() {
  injectStyles();
  if (document.querySelector(`[${MODAL_ATTR}="true"]`)) return;
  const shell = document.createElement("div");
  shell.className = "mzm-radar-loading-shell";
  shell.setAttribute(MODAL_ATTR, "true");
  shell.innerHTML = `<div class="mzm-radar-loading-card"><div class="mzm-radar-loading-inner"><h2 class="mzm-radar-loading-word">Зареждане</h2></div></div>`;
  document.body.appendChild(shell);
}

function polishRadarCopy() {
  document.querySelectorAll<HTMLElement>(".mzm-radar-stat span").forEach((span) => {
    if (normalize(span.textContent).toLowerCase().includes("активни набор")) {
      span.textContent = "Активни за твоя набор";
    }
  });
}

function bindRadarButton() {
  injectStyles();
  const homeHeading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((heading) => normalize(heading.textContent).includes("Намери място"));
  const hero = homeHeading?.closest("section");
  if (!hero) return;
  const searchButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent) === "⌕");
  if (!searchButton || searchButton.dataset.mzmImmediateRadarLoader === "true") return;
  searchButton.dataset.mzmImmediateRadarLoader = "true";
  searchButton.addEventListener("click", () => showImmediateLoader(), { capture: true });
}

export default function RadarUiPolish() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        bindRadarButton();
        polishRadarCopy();
      });
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
