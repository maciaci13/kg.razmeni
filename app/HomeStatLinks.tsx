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

function clickNav(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button"));
  const target = buttons.find((button) => (button.textContent || "").includes(label));
  target?.click();
}

function makeHomeStatsClickable() {
  injectStyles();
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h3"));

  headings.forEach((heading) => {
    const text = (heading.textContent || "").replace(/\s+/g, " ").trim();
    const card = heading.closest("div");
    if (!card || !(card instanceof HTMLElement)) return;

    if (text === "Активна заявка" || text === "Активни заявки") {
      card.classList.add("mzm-stat-clickable");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.dataset.mzmStatTarget = "requests";
    }

    if (text === "Потенциални маршрута" || text === "Потенциални маршрути") {
      card.classList.add("mzm-stat-clickable");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.dataset.mzmStatTarget = "matches";
    }
  });

  document.querySelectorAll<HTMLElement>("[data-mzm-stat-target]").forEach((card) => {
    if (card.dataset.mzmClickBound === "true") return;
    card.dataset.mzmClickBound = "true";
    const handler = () => clickNav(card.dataset.mzmStatTarget === "matches" ? "Съвпадение" : "Заявка");
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
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
