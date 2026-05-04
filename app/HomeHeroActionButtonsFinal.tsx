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
      display: flex !important;
      align-items: center !important;
      gap: .55rem !important;
    }

    .mzm-hero-actions-final .mzm-hero-map-action-hidden {
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
    }

    .mzm-hero-radar-final {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .5rem !important;
      width: auto !important;
      min-width: 10.8rem !important;
      height: 3.15rem !important;
      padding: 0 1.05rem !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: var(--study-orange,#f95e08) !important;
      color: #fff !important;
      font-size: .82rem !important;
      font-weight: 900 !important;
      letter-spacing: -.015em !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      box-shadow: 0 14px 30px rgba(249,94,8,.24), inset 0 0 0 1px rgba(255,255,255,.16) !important;
    }

    .mzm-hero-radar-final .mzm-hero-radar-target {
      display: grid !important;
      place-items: center !important;
      width: 1.75rem !important;
      height: 1.75rem !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.18) !important;
      color: #fff !important;
      flex: 0 0 auto !important;
    }

    .mzm-hero-radar-final svg {
      display: block !important;
      width: 1.05rem !important;
      height: 1.05rem !important;
      stroke: currentColor !important;
    }

    .mzm-hero-radar-final + button {
      flex: 1 1 auto !important;
      min-width: 0 !important;
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

function polishHeroActions() {
  injectStyles();
  const hero = findHeroSection();
  if (!hero) return;

  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent).includes("Пусни заявка"));
  if (!requestButton) return;

  const row = requestButton.parentElement as HTMLElement | null;
  if (!row) return;
  row.classList.add("mzm-hero-actions-final", "mzm-hero-search-row");

  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button"));
  const radarButton = buttons.find((button) => {
    const text = normalize(button.textContent);
    return button !== requestButton && (text === "⌕" || text.includes("Радар за шанс") || button.getAttribute("aria-label") === "Отвори радар за шанс" || button.classList.contains("mzm-radar-hero-button"));
  }) || buttons.find((button) => button !== requestButton);

  if (!radarButton) return;

  buttons.forEach((button) => {
    if (button !== requestButton && button !== radarButton) {
      button.classList.add("mzm-hero-map-action-hidden");
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    }
  });

  radarButton.classList.add("mzm-hero-radar-final", "mzm-radar-hero-button");
  radarButton.classList.remove("mzm-hero-map-action-hidden");
  radarButton.removeAttribute("aria-hidden");
  radarButton.tabIndex = 0;
  radarButton.setAttribute("aria-label", "Отвори радар за шанс");
  radarButton.setAttribute("title", "Радар за шанс");

  const expected = "Радар за шанс";
  if (!normalize(radarButton.textContent).includes(expected) || !radarButton.querySelector(".mzm-hero-radar-target")) {
    radarButton.innerHTML = `${targetIconSvg()}<span>${expected}</span>`;
  }
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
