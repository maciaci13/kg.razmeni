"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-home-hero-action-buttons-final-style";
const ORANGE = "var(--study-orange,#f95e08)";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function important(el: HTMLElement, prop: string, value: string) {
  el.style.setProperty(prop, value, "important");
}

function isShareArea(el: HTMLElement | null) {
  return Boolean(
    el?.closest("[data-mzm-open-share]") ||
    el?.closest("[data-mzm-share-card='true']") ||
    el?.closest("[data-mzm-share-popup='true']") ||
    el?.closest(".mzm-safe-share-card") ||
    el?.closest(".mzm-safe-share-cta") ||
    el?.closest(".mzm-share-popup")
  );
}

function injectStyles() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-hero-actions-final {
      display: grid !important;
      grid-template-columns: minmax(10.8rem, 1fr) minmax(7.3rem, .72fr) !important;
      align-items: center !important;
      gap: .55rem !important;
      width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
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
      box-sizing: border-box !important;
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
      box-sizing: border-box !important;
      color: rgba(28,27,25,.76) !important;
      font-weight: 900 !important;
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
  if (event?.target instanceof HTMLElement && isShareArea(event.target)) return;
  event?.preventDefault();
  event?.stopPropagation();
  window.dispatchEvent(new CustomEvent("mzm:open-radar"));
}

function forceRadarButtonStyle(button: HTMLButtonElement) {
  button.type = "button";
  button.className = "mzm-hero-radar-real";
  button.dataset.mzmRealRadarButton = "true";
  button.setAttribute("aria-label", "Отвори радар за шанс");
  button.tabIndex = 0;
  button.onclick = (event) => openRadar(event);
  button.innerHTML = `${targetIconSvg()}<span>Радар за шанс</span>`;

  important(button, "display", "inline-flex");
  important(button, "align-items", "center");
  important(button, "justify-content", "center");
  important(button, "gap", ".56rem");
  important(button, "width", "100%");
  important(button, "height", "3.35rem");
  important(button, "padding", "0 .95rem");
  important(button, "border", "0");
  important(button, "border-radius", "999px");
  important(button, "background", ORANGE);
  important(button, "color", "#fff");
  important(button, "font-weight", "900");
  important(button, "box-shadow", "0 16px 34px rgba(249,94,8,.28), inset 0 0 0 1px rgba(255,255,255,.18)");

  button.querySelectorAll<HTMLElement>("*").forEach((child) => {
    important(child, "color", "#fff");
    important(child, "stroke", "#fff");
  });
}

function forceRequestButtonStyle(button: HTMLButtonElement) {
  button.classList.add("mzm-hero-request-real");
  button.classList.remove("mzm-hero-action-hidden-force");
  button.removeAttribute("aria-hidden");
  button.tabIndex = 0;
  important(button, "color", "rgba(28,27,25,.76)");
  important(button, "font-weight", "900");
  important(button, "height", "3.35rem");
  important(button, "justify-content", "center");
  important(button, "text-align", "center");
  button.querySelectorAll<HTMLElement>("span, strong").forEach((child) => {
    if (normalize(child.textContent) === "›") important(child, "color", ORANGE);
    else important(child, "color", "rgba(28,27,25,.76)");
  });
}

function makeRadarButton() {
  const button = document.createElement("button");
  forceRadarButtonStyle(button);
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
    if (text.includes("Пусни заявка") && buttons.length >= 1) return node;
    node = node.parentElement;
  }
  return requestButton.parentElement as HTMLElement | null;
}

function hideMapButtons(hero: HTMLElement) {
  Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    const text = normalize(button.textContent);
    if (text === "⌖" || text.includes("карта")) {
      button.className = "mzm-hero-action-hidden-force";
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
      important(button, "display", "none");
    }
  });
}

function polishExistingRadarButtons(hero: HTMLElement) {
  Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    const text = normalize(button.textContent);
    if (button.dataset.mzmRealRadarButton === "true" || text.includes("Радар за шанс") || text === "⌕") {
      forceRadarButtonStyle(button);
    }
  });
}

function polishHeroActions() {
  injectStyles();
  const hero = findHeroSection();
  if (!hero) return;

  hideMapButtons(hero);
  polishExistingRadarButtons(hero);

  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find(isRequestButton);
  if (!requestButton) return;

  const row = findActionsRow(hero, requestButton);
  if (!row) return;

  let radarButton = row.querySelector<HTMLButtonElement>("[data-mzm-real-radar-button='true']");
  if (!radarButton) {
    radarButton = Array.from(row.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      const text = normalize(button.textContent);
      return text.includes("Радар") || text === "⌕";
    }) || makeRadarButton();
  }

  forceRadarButtonStyle(radarButton);
  forceRequestButtonStyle(requestButton);

  const nextRow = document.createElement("div");
  nextRow.className = "mzm-hero-actions-final mzm-hero-search-row";
  nextRow.append(radarButton, requestButton);
  row.replaceWith(nextRow);
}

function bindGlobalRadarFallback() {
  if (document.documentElement.dataset.mzmRadarFallbackBound === "true") return;
  document.documentElement.dataset.mzmRadarFallbackBound = "true";
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (isShareArea(target)) return;
    const button = target?.closest<HTMLButtonElement>("button");
    if (!button || isShareArea(button)) return;
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
    const interval = window.setInterval(schedule, 180);
    const late1 = window.setTimeout(schedule, 900);
    const late2 = window.setTimeout(schedule, 1800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(late1);
      window.clearTimeout(late2);
    };
  }, []);

  return null;
}
