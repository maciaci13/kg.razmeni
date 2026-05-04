"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-home-stat-links-style";
const RADAR_BUTTON_ID = "mzm-home-radar-button";

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
    .mzm-stat-clickable:active {
      transform: scale(.985);
    }
    #${RADAR_BUTTON_ID} {
      width: 100%;
      border: 0;
      border-radius: 1.8rem;
      background: linear-gradient(135deg, #1c1b19 0%, #2c2924 100%);
      color: #fff;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .9rem;
      box-shadow: 0 18px 44px rgba(28,27,25,.16);
      -webkit-tap-highlight-color: transparent;
    }
    #${RADAR_BUTTON_ID} .mzm-radar-copy {
      min-width: 0;
      text-align: left;
    }
    #${RADAR_BUTTON_ID} .mzm-radar-kicker {
      display: block;
      font-size: .62rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: rgba(255,255,255,.48);
    }
    #${RADAR_BUTTON_ID} .mzm-radar-title {
      display: block;
      margin-top: .42rem;
      font-size: 1rem;
      line-height: 1.08;
      font-weight: 900;
      letter-spacing: -.045em;
      color: #fff;
    }
    #${RADAR_BUTTON_ID} .mzm-radar-icon {
      flex: 0 0 auto;
      width: 3.05rem;
      height: 3.05rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: var(--study-orange,#f95e08);
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 12px 26px rgba(249,94,8,.28);
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

function injectRadarButton() {
  const hero = findHomeHero();
  if (!hero || document.getElementById(RADAR_BUTTON_ID)) return;
  const button = document.createElement("button");
  button.type = "button";
  button.id = RADAR_BUTTON_ID;
  button.innerHTML = `<span class="mzm-radar-copy"><span class="mzm-radar-kicker">Радар за шанс</span><span class="mzm-radar-title">Виж къде има движение около теб</span></span><span class="mzm-radar-icon">✦</span>`;
  button.addEventListener("click", openRadar);
  hero.insertAdjacentElement("afterend", button);
}

function makeHomeStatsClickable() {
  injectStyles();
  injectRadarButton();
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
    const text = normalize(button.textContent || "");
    if (button.id === RADAR_BUTTON_ID) return;
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
