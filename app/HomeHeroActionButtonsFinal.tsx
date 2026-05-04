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
      grid-template-columns: minmax(10.8rem, 1fr) minmax(7.3rem, .72fr) !important;
      align-items: center !important;
      gap: .55rem !important;
      width: 100% !important;
    }

    .mzm-hero-actions-final > *:not(.mzm-hero-radar-real):not(.mzm-hero-request-real) {
      display: none !important;
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

    .mzm-hero-radar-real {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .56rem !important;
      width: 100% !important;
      min-width: 0 !important;
      height: 3.35rem !important;
      padding: 0 .95rem !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      font-size: .82rem !important;
      font-weight: 900 !important;
      letter-spacing: -.018em !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      box-shadow: 0 16px 34px rgba(249,94,8,.28), inset 0 0 0 1px rgba(255,255,255,.18) !important;
      -webkit-tap-highlight-color: transparent !important;
      cursor: pointer !important;
    }

    .mzm-hero-radar-real .mzm-hero-radar-target {
      display: grid !important;
      place-items: center !important;
      width: 1.75rem !important;
      height: 1.75rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.22) !important;
      color: #fff !important;
      flex: 0 0 auto !important;
    }

    .mzm-hero-radar-real svg {
      display: block !important;
      width: 1.04rem !important;
      height: 1.04rem !important;
      stroke: currentColor !important;
    }

    .mzm-hero-request-real {
      width: 100% !important;
      min-width: 0 !important;
      height: 3.35rem !important;
      justify-content: center !important;
      text-align: center !important;
      white-space: normal !important;
    }

    .mzm-hero-request-real span,
    .mzm-hero-request-real strong {
      white-space: normal !important;
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
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="6.7"></circle>
        <circle cx="12" cy="12" r="1.7"></circle>
        <path d="M12 2.4v3.2M12 18.4v3.2M2.4 12h3.2M18.4 12h3.2"></path>
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

function findActionsRow(hero: HTMLElement, requestButton: HTMLButtonElement) {
  let node: HTMLElement | null = requestButton.parentElement;
  while (node && node !== hero) {
    const text = normalize(node.textContent);
    const buttons = Array.from(node.querySelectorAll<HTMLButtonElement>("button"));
    if (text.includes("Пусни заявка") && buttons.length >= 2) return node;
    node = node.parentElement;
  }
  return requestButton.parentElement as HTMLElement | null;
}

function polishHeroActions() {
  injectStyles();
  const hero = findHeroSection();
  if (!hero) return;

  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find(isRequestButton);
  if (!requestButton) return;

  const row = findActionsRow(hero, requestButton);
  if (!row) return;

  const existingRadar = row.querySelector<HTMLButtonElement>("[data-mzm-real-radar-button='true']");
  const radarButton = existingRadar || makeRadarButton();

  radarButton.type = "button";
  radarButton.dataset.mzmRealRadarButton = "true";
  radarButton.className = "mzm-hero-radar-real";
  radarButton.removeAttribute("aria-hidden");
  radarButton.tabIndex = 0;
  radarButton.setAttribute("aria-label", "Отвори радар за шанс");
  radarButton.onclick = (event) => openRadar(event);
  radarButton.innerHTML = `${targetIconSvg()}<span>Радар за шанс</span>`;

  requestButton.classList.add("mzm-hero-request-real");
  requestButton.classList.remove("mzm-hero-action-hidden-force");
  requestButton.removeAttribute("aria-hidden");
  requestButton.tabIndex = 0;

  row.classList.add("mzm-hero-actions-final", "mzm-hero-search-row");

  const children = Array.from(row.children);
  children.forEach((child) => {
    if (child === radarButton || child === requestButton) return;
    child.remove();
  });

  if (row.firstElementChild !== radarButton) row.insertBefore(radarButton, row.firstElementChild);
  if (radarButton.nextElementSibling !== requestButton) row.insertBefore(requestButton, radarButton.nextSibling);

  Array.from(row.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    if (button === radarButton || button === requestButton) return;
    button.classList.add("mzm-hero-action-hidden-force");
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
  });
}

function bindGlobalRadarFallback() {
  if (document.documentElement.dataset.mzmRadarFallbackBound === "true") return;
  document.documentElement.dataset.mzmRadarFallbackBound = "true";
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.dataset.mzmRealRadarButton === "true" || normalize(button.textContent).includes("Радар за шанс")) {
      openRadar(event);
    }
  }, true);
}

export default function HomeHeroActionButtonsFinal() {
  useEffect(() => {
    bindGlobalRadarFallback();
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
    const interval = window.setInterval(schedule, 250);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
