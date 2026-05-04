"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-home-hero-copy-polish-style";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-radar-hero-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .55rem !important;
      width: auto !important;
      min-width: 8.7rem !important;
      height: 3rem !important;
      padding: 0 1rem !important;
      border-radius: 999px !important;
      background: #f7f5ef !important;
      color: #1c1b19 !important;
      font-size: .82rem !important;
      font-weight: 900 !important;
      letter-spacing: -.015em !important;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.025) !important;
      white-space: nowrap !important;
    }

    .mzm-radar-hero-icon {
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 999px;
      background: rgba(249,94,8,.12);
      color: var(--study-orange,#f95e08);
      font-size: 1.05rem;
      line-height: 1;
      flex: 0 0 auto;
    }

    .mzm-hero-search-row {
      gap: .45rem !important;
    }

    .mzm-hero-search-row > button:last-child {
      min-width: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function findHeroSection() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((item) => normalize(item.textContent).includes("Намери място"));
  return heading?.closest("section") as HTMLElement | null;
}

function polishStats(hero: HTMLElement) {
  Array.from(hero.querySelectorAll<HTMLElement>("h3")).forEach((title) => {
    if (normalize(title.textContent).includes("Потенциални маршрута")) {
      title.textContent = "Съвпадения";
    }
  });

  Array.from(hero.querySelectorAll<HTMLElement>("p")).forEach((paragraph) => {
    if (normalize(paragraph.textContent).includes("2/3/4-странни цикли")) {
      paragraph.textContent = "";
      paragraph.style.display = "none";
    }
  });
}

function polishRadarButton(hero: HTMLElement) {
  const row = Array.from(hero.querySelectorAll<HTMLElement>("div")).find((item) => {
    const text = normalize(item.textContent);
    return text.includes("Пусни заявка") && (text.includes("⌕") || text.includes("Радар за шанс"));
  });
  row?.classList.add("mzm-hero-search-row");

  const button = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((item) => {
    const text = normalize(item.textContent);
    return text === "⌕" || text.includes("Радар за шанс") || item.getAttribute("aria-label") === "Отвори радар за шанс";
  });

  if (!button) return;
  button.classList.add("mzm-radar-hero-button");
  button.setAttribute("aria-label", "Отвори радар за шанс");
  button.setAttribute("title", "Радар за шанс");

  if (button.dataset.mzmRadarVisualDone === "true") return;
  button.dataset.mzmRadarVisualDone = "true";
  button.innerHTML = `<span class="mzm-radar-hero-icon" aria-hidden="true">⌁</span><span>Радар за шанс</span>`;
}

function run() {
  injectStyles();
  const hero = findHeroSection();
  if (!hero) return;
  polishStats(hero);
  polishRadarButton(hero);
}

export default function HomeHeroCopyPolish() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        run();
      });
    };
    run();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(run, 800);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
  return null;
}
