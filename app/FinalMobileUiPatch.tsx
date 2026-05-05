"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-final-mobile-ui-patch-style";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function setImportant(el: HTMLElement, prop: string, value: string) {
  el.style.setProperty(prop, value, "important");
}

function injectStyles() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    main:has(nav.fixed.bottom-4) {
      padding-top: 10px !important;
    }

    main:has(nav.fixed.bottom-4) > div {
      padding-top: 0 !important;
    }

    .mzm-final-content-pulled-up {
      margin-top: 0 !important;
    }

    .mzm-final-hero-actions {
      display: grid !important;
      grid-template-columns: minmax(10.5rem, 1fr) minmax(7.2rem, .72fr) !important;
      align-items: center !important;
      gap: .55rem !important;
      width: 100% !important;
      min-width: 0 !important;
      padding: .45rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.86) !important;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.04) !important;
    }

    .mzm-final-radar-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .5rem !important;
      width: 100% !important;
      min-width: 0 !important;
      height: 3.25rem !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      font-size: .82rem !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      letter-spacing: -.02em !important;
      white-space: nowrap !important;
      box-shadow: 0 16px 34px rgba(249,94,8,.28), inset 0 0 0 1px rgba(255,255,255,.18) !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    .mzm-final-radar-icon {
      display: grid !important;
      place-items: center !important;
      width: 1.75rem !important;
      height: 1.75rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.2) !important;
      color: #fff !important;
      flex: 0 0 auto !important;
      font-size: 1rem !important;
      line-height: 1 !important;
    }

    .mzm-final-request-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .38rem !important;
      width: 100% !important;
      min-width: 0 !important;
      height: 3.25rem !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: #f7f5ef !important;
      color: rgba(28,27,25,.78) !important;
      font-size: .82rem !important;
      font-weight: 900 !important;
      line-height: 1.05 !important;
      letter-spacing: -.025em !important;
      text-align: center !important;
      white-space: normal !important;
      box-shadow: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    .mzm-final-request-button span {
      color: var(--study-orange,#f95e08) !important;
      font-size: 1.25rem !important;
      line-height: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

function findHeroSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
    const text = normalize(section.textContent);
    return text.includes("Намери") && text.includes("размяна") && text.includes("Пусни заявка");
  }) || null;
}

function openRadar(event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  window.dispatchEvent(new CustomEvent("mzm:open-radar"));
}

function openRequests(event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  const navButton = Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((button) => normalize(button.textContent).includes("Заявка"));
  navButton?.click();
}

function makeRadarButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mzm-final-radar-button";
  button.setAttribute("aria-label", "Радар за шанс");
  button.innerHTML = `<span class="mzm-final-radar-icon">⌁</span><span>Радар за шанс</span>`;
  button.addEventListener("click", openRadar);
  return button;
}

function makeRequestButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mzm-final-request-button";
  button.innerHTML = `Пусни заявка <span>›</span>`;
  button.addEventListener("click", openRequests);
  return button;
}

function patchHeroActions() {
  const hero = findHeroSection();
  if (!hero) return;

  const existing = hero.querySelector<HTMLElement>(".mzm-final-hero-actions");
  if (existing) return;

  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent).includes("Пусни заявка"));
  if (!requestButton) return;

  let row: HTMLElement | null = requestButton.parentElement;
  while (row && row !== hero) {
    const buttons = row.querySelectorAll("button").length;
    const text = normalize(row.textContent);
    if (buttons >= 1 && text.includes("Пусни заявка")) break;
    row = row.parentElement;
  }
  if (!row || row === hero) return;

  const next = document.createElement("div");
  next.className = "mzm-final-hero-actions";
  next.append(makeRadarButton(), makeRequestButton());
  row.replaceWith(next);
}

function findTopBar() {
  return Array.from(document.querySelectorAll<HTMLElement>("div")).find((node) => {
    const text = normalize(node.textContent).toUpperCase();
    if (!text.includes("РОДИТЕЛ") && !text.includes("ПРОФИЛ")) return false;
    const buttons = node.querySelectorAll("button");
    const hasGridIcon = Boolean(node.querySelector("i"));
    return buttons.length >= 2 && hasGridIcon;
  }) || null;
}

function reduceTopSpace() {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  setImportant(main, "padding-top", "10px");

  const wrapper = main.firstElementChild;
  if (wrapper instanceof HTMLElement) setImportant(wrapper, "padding-top", "0");

  const topBar = findTopBar();
  if (!topBar) return;
  setImportant(topBar, "margin-bottom", ".75rem");
  setImportant(topBar, "padding-top", "0");

  const content = topBar.nextElementSibling;
  if (content instanceof HTMLElement) {
    content.classList.remove("mzm-final-content-pulled-up");
    setImportant(content, "margin-top", "0");
  }
}

function patchMatchesEmptyOrder() {
  const matchTitle = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => normalize(h1.textContent).includes("Още няма съвпадение"));
  if (!matchTitle) return;

  const shell = matchTitle.closest("div")?.parentElement;
  if (!shell || shell.dataset.mzmMatchOrderFixed === "true") return;

  const smallText = Array.from(shell.querySelectorAll<HTMLElement>("p")).find((p) => normalize(p.textContent).includes("При съвпадение тук ще получиш покана"));
  const cta = Array.from(shell.querySelectorAll<HTMLElement>("section, article, div, button")).find((node) => normalize(node.textContent).includes("Увеличи шанса за съвпадение"));

  if (!smallText || !cta) return;

  matchTitle.insertAdjacentElement("afterend", smallText);
  smallText.style.setProperty("margin-top", ".95rem", "important");
  smallText.style.setProperty("margin-bottom", "1.2rem", "important");
  smallText.style.setProperty("font-size", "1rem", "important");
  smallText.style.setProperty("line-height", "1.55", "important");
  smallText.style.setProperty("font-weight", "700", "important");
  smallText.style.setProperty("color", "rgba(28,27,25,.52)", "important");
  smallText.insertAdjacentElement("afterend", cta);
  shell.dataset.mzmMatchOrderFixed = "true";
}

function run() {
  injectStyles();
  reduceTopSpace();
  patchHeroActions();
  patchMatchesEmptyOrder();
}

export default function FinalMobileUiPatch() {
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

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 250);
    const t1 = window.setTimeout(schedule, 900);
    const t2 = window.setTimeout(schedule, 1800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
