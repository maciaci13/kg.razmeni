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
      min-height: 14rem;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      overflow: hidden;
    }

    .mzm-loading-word {
      margin: 0;
      font-size: clamp(2.1rem, 9.5vw, 3.65rem);
      line-height: .95;
      font-weight: 900;
      letter-spacing: .035em;
      text-transform: uppercase;
      color: rgba(28,27,25,.16);
      background:
        linear-gradient(100deg,
          rgba(28,27,25,.22) 0%,
          rgba(28,27,25,.22) 34%,
          rgba(255,255,255,.96) 45%,
          rgba(249,94,8,.9) 50%,
          rgba(255,255,255,.96) 55%,
          rgba(28,27,25,.22) 66%,
          rgba(28,27,25,.22) 100%);
      background-size: 260% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: mzmLoadingWordSweep 1.65s cubic-bezier(.4,0,.2,1) infinite;
      filter: drop-shadow(0 12px 24px rgba(40,34,20,.05));
    }

    @keyframes mzmLoadingWordSweep {
      0% { background-position: 140% 0; }
      100% { background-position: -140% 0; }
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

function makeLoader(id: string) {
  const loader = document.createElement("section");
  loader.id = id;
  loader.className = "mzm-tab-loader";
  loader.setAttribute("aria-live", "polite");
  loader.innerHTML = `
    <div class="mzm-tab-loader-inner">
      <h2 class="mzm-loading-word">Зареждане</h2>
    </div>
  `;
  return loader;
}

function ensureLoader(id: string) {
  const existing = document.getElementById(id);
  if (existing) return;

  const titleBlock = currentTitleBlock();
  if (!titleBlock) return;

  titleBlock.insertAdjacentElement("afterend", makeLoader(id));
}

function removeLoader(id: string) {
  document.getElementById(id)?.remove();
}

function updateLoaders() {
  injectStyles();

  if (isRequestTab()) {
    if (hasRequestUi()) removeLoader(REQUEST_LOADER_ID);
    else ensureLoader(REQUEST_LOADER_ID);
  } else {
    removeLoader(REQUEST_LOADER_ID);
  }

  if (isMatchTab()) {
    if (hasMatchUi()) removeLoader(MATCH_LOADER_ID);
    else ensureLoader(MATCH_LOADER_ID);
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

    const interval = window.setInterval(updateLoaders, 320);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      removeLoader(REQUEST_LOADER_ID);
      removeLoader(MATCH_LOADER_ID);
    };
  }, []);

  return null;
}
