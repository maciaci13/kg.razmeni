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
    .mzm-stat-clickable:active {
      transform: scale(.985);
    }
  `;
  document.head.appendChild(style);
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function clickNav(targetTab: "requests" | "matches") {
  if (targetTab === "matches") {
    window.dispatchEvent(new CustomEvent("mzm:open-radar"));
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

function makeHomeStatsClickable() {
  injectStyles();
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
    if (text.includes("пусни заявка")) bindClick(button, "requests");
    if (text.includes("виж всички") || text.includes("радар") || text.includes("съвпад")) bindClick(button, "matches");
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
