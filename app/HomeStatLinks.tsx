"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-home-stat-links-style";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-stat-clickable {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform .14s ease, box-shadow .14s ease;
    }
    .mzm-stat-clickable:active { transform: scale(.985); }
    .mzm-map-action-hidden { display: none !important; }
    .mzm-home-radar-pill {
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      box-shadow: 0 14px 30px rgba(249,94,8,.28) !important;
      border-radius: 999px !important;
      min-width: 0 !important;
      justify-content: center !important;
      gap: .45rem !important;
      font-weight: 900 !important;
    }
    .mzm-home-radar-pill span { color: #fff !important; }
    .mzm-home-radar-icon {
      display: grid !important;
      place-items: center !important;
      width: 1.75rem !important;
      height: 1.75rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.2) !important;
      color: #fff !important;
      font-size: 1rem !important;
      line-height: 1 !important;
      flex: 0 0 auto !important;
    }
  `;
  document.head.appendChild(style);
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function openRadar() {
  window.dispatchEvent(new CustomEvent("mzm:open-radar"));
}

function clickNav(targetTab: "requests" | "matches") {
  if (targetTab === "matches") {
    openRadar();
    return;
  }

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button"));
  const target = buttons.find((button) => normalize(button.textContent || "").includes("заявка"));
  target?.click();
}

function bindClick(el: HTMLElement, target: "requests" | "matches") {
  el.classList.add("mzm-stat-clickable");
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.dataset.mzmStatTarget = target;
  if (el.dataset.mzmClickBound === "true") return;
  el.dataset.mzmClickBound = "true";
  const handler = () => clickNav(target);
  el.addEventListener("click", handler);
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  });
}

function findHomeHero() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h1"));
  const heading = headings.find((item) => {
    const text = normalize(item.textContent || "");
    return text.includes("намери място") || text.includes("намери размяна");
  });
  return heading?.closest("section") as HTMLElement | null;
}

function enhanceHeroActions() {
  const oldInjected = document.getElementById("mzm-home-radar-button");
  oldInjected?.remove();

  const hero = findHomeHero();
  if (!hero) return;
  const buttons = Array.from(hero.querySelectorAll<HTMLButtonElement>("button"));

  buttons.forEach((button) => {
    const text = normalize(button.textContent || "");
    if (text === "⌖" || text.includes("карта")) button.classList.add("mzm-map-action-hidden");
  });

  const radarButton = buttons.find((button) => {
    const text = normalize(button.textContent || "");
    return text.includes("радар") || text === "⌕";
  });

  if (radarButton && radarButton.dataset.mzmRadarEnhanced !== "true") {
    radarButton.dataset.mzmRadarEnhanced = "true";
    radarButton.classList.add("mzm-home-radar-pill", "mzm-stat-clickable");
    radarButton.innerHTML = `<span class="mzm-home-radar-icon">⌁</span><span>Радар за шанс</span>`;
    radarButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openRadar();
    });
  }
}

function makeHomeStatsClickable() {
  injectStyles();
  enhanceHeroActions();
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h3"));

  headings.forEach((heading) => {
    const text = normalize(heading.textContent || "");
    const card = heading.closest("div");
    if (!card || !(card instanceof HTMLElement)) return;

    if (text === "активна заявка" || text === "активни заявки" || text.includes("активна заявка")) {
      bindClick(card, "requests");
    }

    if (
      text === "потенциални маршрута" ||
      text === "потенциални маршрути" ||
      text === "съвпадения" ||
      text.includes("потенциални маршрут") ||
      text.includes("съвпад")
    ) {
      bindClick(card, "matches");
    }
  });

  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    if (button.closest("nav.fixed.bottom-4")) return;
    const text = normalize(button.textContent || "");
    if (text.includes("пусни заявка")) bindClick(button, "requests");
    if (text.includes("виж всички") || text.includes("съвпад")) bindClick(button, "matches");
  });
}

export default function HomeStatLinks() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        makeHomeStatsClickable();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
