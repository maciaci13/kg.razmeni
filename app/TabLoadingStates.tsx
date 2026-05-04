"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-tab-loading-states-style";
const REQUEST_LOADER_ID = "mzm-request-tab-loader";
const MATCH_LOADER_ID = "mzm-match-tab-loader";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-tab-loader {
      border-radius: 2.2rem;
      background: rgba(255,255,255,.92);
      padding: 1rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.08), inset 0 0 0 1px rgba(28,27,25,.025);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .mzm-tab-loader-inner {
      border-radius: 1.8rem;
      background: #f7f5ef;
      padding: 1.2rem;
      min-height: 16rem;
      display: grid;
      align-content: center;
      gap: 1rem;
    }

    .mzm-tab-loader-kicker {
      margin: 0;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-tab-loader-title {
      margin: 0;
      font-size: 1.28rem;
      line-height: 1.06;
      font-weight: 900;
      letter-spacing: -.045em;
      color: #1c1b19;
    }

    .mzm-tab-loader-text {
      margin: 0;
      font-size: .86rem;
      line-height: 1.45;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-tab-loader-pulse {
      display: grid;
      gap: .7rem;
      margin-top: .4rem;
    }

    .mzm-tab-loader-line,
    .mzm-tab-loader-card {
      position: relative;
      overflow: hidden;
      background: rgba(255,255,255,.72);
    }

    .mzm-tab-loader-line::after,
    .mzm-tab-loader-card::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.78), transparent);
      animation: mzmLoaderSweep 1.25s infinite;
    }

    .mzm-tab-loader-line {
      height: .88rem;
      border-radius: 999px;
    }

    .mzm-tab-loader-line.short { width: 58%; }
    .mzm-tab-loader-line.mid { width: 78%; }

    .mzm-tab-loader-card {
      height: 4.8rem;
      border-radius: 1.35rem;
    }

    @keyframes mzmLoaderSweep {
      100% { transform: translateX(100%); }
    }
  `;

  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function currentTitleBlock() {
  const h1 = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((heading) => {
    const text = normalize(heading.textContent);
    return text.includes("Къде сте и къде искате да сте")
      || text.includes("Има потенциален цикъл")
      || text.includes("Координация")
      || text.includes("Още няма цикъл")
      || text.includes("Отказано");
  });

  return h1?.closest("div") as HTMLElement | null;
}

function isRequestTab() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((heading) => normalize(heading.textContent).includes("Къде сте и къде искате да сте"));
}

function isMatchTab() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((heading) => {
    const text = normalize(heading.textContent);
    return text.includes("Има потенциален цикъл") || text.includes("Координация") || text.includes("Още няма цикъл") || text.includes("Отказано");
  });
}

function hasRequestUi() {
  const root = document.getElementById("mzm-request-polish-root");
  return Boolean(root && root.closest("section") && root.getBoundingClientRect().height > 40);
}

function hasMatchUi() {
  const root = document.getElementById("mzm-match-simulator-bridge-root");
  return Boolean(root && root.getBoundingClientRect().height > 40 && normalize(root.textContent).length > 20);
}

function makeLoader(id: string, title: string, text: string) {
  const loader = document.createElement("section");
  loader.id = id;
  loader.className = "mzm-tab-loader";
  loader.setAttribute("aria-live", "polite");
  loader.innerHTML = `
    <div class="mzm-tab-loader-inner">
      <p class="mzm-tab-loader-kicker">Зареждане</p>
      <h2 class="mzm-tab-loader-title">${title}</h2>
      <p class="mzm-tab-loader-text">${text}</p>
      <div class="mzm-tab-loader-pulse" aria-hidden="true">
        <div class="mzm-tab-loader-line mid"></div>
        <div class="mzm-tab-loader-card"></div>
        <div class="mzm-tab-loader-line short"></div>
      </div>
    </div>
  `;
  return loader;
}

function ensureLoader(id: string, title: string, text: string) {
  const existing = document.getElementById(id);
  if (existing) return;

  const titleBlock = currentTitleBlock();
  if (!titleBlock) return;

  titleBlock.insertAdjacentElement("afterend", makeLoader(id, title, text));
}

function removeLoader(id: string) {
  document.getElementById(id)?.remove();
}

function updateLoaders() {
  injectStyles();

  if (isRequestTab()) {
    if (hasRequestUi()) removeLoader(REQUEST_LOADER_ID);
    else ensureLoader(REQUEST_LOADER_ID, "Подготвяме заявката", "Зареждаме районите, градините и активните ти заявки.");
  } else {
    removeLoader(REQUEST_LOADER_ID);
  }

  if (isMatchTab()) {
    if (hasMatchUi()) removeLoader(MATCH_LOADER_ID);
    else ensureLoader(MATCH_LOADER_ID, "Проверяваме цикъла", "Зареждаме веригата, статусите и данните за координация.");
  } else {
    removeLoader(MATCH_LOADER_ID);
  }
}

export default function TabLoadingStates() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        updateLoaders();
      });
    };

    updateLoaders();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    const interval = window.setInterval(updateLoaders, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      removeLoader(REQUEST_LOADER_ID);
      removeLoader(MATCH_LOADER_ID);
    };
  }, []);

  return null;
}
