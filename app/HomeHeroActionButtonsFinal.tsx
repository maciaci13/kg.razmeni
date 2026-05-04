"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-home-hero-action-buttons-final-style";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-hero-actions-final {
      display: grid !important;
      grid-template-columns: minmax(9.8rem, .95fr) minmax(7.2rem, .85fr) !important;
      align-items: center !important;
      gap: .55rem !important;
    }

    .mzm-hero-action-hidden-force {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      overflow: hidden !important;
      position: absolute !important;
      left: -9999px !important;
    }

    .mzm-hero-radar-real,
    .mzm-hero-radar-real.mzm-radar-hero-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .52rem !important;
      width: 100% !important;
      min-width: 0 !important;
      height: 3.25rem !important;
      padding: 0 .9rem !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      font-size: .78rem !important;
      font-weight: 900 !important;
      letter-spacing: -.015em !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      box-shadow: 0 14px 30px rgba(249,94,8,.24), inset 0 0 0 1px rgba(255,255,255,.16) !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    .mzm-hero-radar-real .mzm-hero-radar-target {
      display: grid !important;
      place-items: center !important;
      width: 1.7rem !important;
      height: 1.7rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.2) !important;
      color: #fff !important;
      flex: 0 0 auto !important;
    }

    .mzm-hero-radar-real svg {
      display: block !important;
      width: 1.03rem !important;
      height: 1.03rem !important;
      stroke: currentColor !important;
    }

    .mzm-hero-actions-final > button:not(.mzm-hero-radar-real):not(.mzm-hero-action-hidden-force) {
      width: 100% !important;
      min-width: 0 !important;
      justify-content: center !important;
      text-align: center !important;
    }
  `;
  document.head.appendChild(style);
}

function findHeroSection() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((item) => {
    const text = normalize(item.textContent);
    return text.includes("Намери място") || text.includes("Намери размяна");
  });
  return heading?.closest("section") as HTMLElement | null;
}

function targetIconSvg() {
  return `
    <span class="mzm-hero-radar-target" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="6.5"></circle>
        <circle cx="12" cy="12" r="1.6"></circle>
        <path d="M12 2.6v3.1M12 18.3v3.1M2.6 12h3.1M18.3 12h3.1"></path>
      </svg>
    </span>`;
}

function openRadar(event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  window.dispatchEvent(new CustomEvent("mzm:open-radar"));
}

function makeRadarButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mzm-hero-radar-real";
  button.dataset.mzmRealRadarButton = "true";
  button.setAttribute("aria-label", "Отвори радар за шанс");
  button.innerHTML = `${targetIconSvg()}<span>Радар за шанс</span>`;
  button.addEventListener("click", openRadar);
  return button;
}

function isRequestButton(button: HTMLButtonElement) {
  return normalize(button.textContent).includes("Пусни заявка");
}

function polishHeroActions() {
  injectStyles();
  const hero = findHeroSection();
  if (!hero) return;

  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find(isRequestButton);
  if (!requestButton) return;

  const row = requestButton.parentElement as HTMLElement | null;
  if (!row) return;
  row.classList.add("mzm-hero-actions-final", "mzm-hero-search-row");

  let radarButton = row.querySelector<HTMLButtonElement>("[data-mzm-real-radar-button='true']");
  if (!radarButton) {
    const oldRadar = Array.from(row.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent).includes("Радар за шанс") || normalize(button.textContent) === "⌕");
    radarButton = oldRadar || makeRadarButton();
    if (!oldRadar) row.insertBefore(radarButton, requestButton);
  }

  radarButton.type = "button";
  radarButton.dataset.mzmRealRadarButton = "true";
  radarButton.classList.add("mzm-hero-radar-real");
  radarButton.classList.remove("mzm-hero-action-hidden-force");
  radarButton.removeAttribute("aria-hidden");
  radarButton.tabIndex = 0;
  radarButton.setAttribute("aria-label", "Отвори радар за шанс");
  radarButton.onclick = (event) => openRadar(event);
  radarButton.innerHTML = `${targetIconSvg()}<span>Радар за шанс</span>`;

  Array.from(row.children).forEach((child) => {
    if (child === radarButton || child === requestButton) return;
    (child as HTMLElement).classList.add("mzm-hero-action-hidden-force");
    (child as HTMLElement).setAttribute("aria-hidden", "true");
  });

  Array.from(row.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    if (button !== radarButton && button !== requestButton) {
      button.classList.add("mzm-hero-action-hidden-force");
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    }
  });
}

export default function HomeHeroActionButtonsFinal() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        polishHeroActions();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 350);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
