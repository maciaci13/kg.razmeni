"use client";

import { useEffect } from "react";

type NameMapResponse = {
  requests?: Record<string, {
    fromText: string;
    wantedText: string;
    ageGroup: string;
    locked: boolean;
  }>;
  error?: string;
};

const STYLE_ID = "mzm-request-visual-polish-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 {
      background:
        linear-gradient(180deg, rgba(255,255,255,.78), rgba(255,255,255,.96)),
        rgba(255,255,255,.88) !important;
      border: 1px solid rgba(255,255,255,.98) !important;
      box-shadow:
        0 -8px 28px rgba(28,27,25,.07),
        0 18px 56px rgba(28,27,25,.18),
        inset 0 1px 0 rgba(255,255,255,.92),
        inset 0 -1px 0 rgba(28,27,25,.045) !important;
      backdrop-filter: blur(24px) saturate(1.22) !important;
      -webkit-backdrop-filter: blur(24px) saturate(1.22) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4::before {
      background: linear-gradient(180deg, rgba(255,252,250,0), rgba(255,252,250,.88)) !important;
      height: 42px !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button {
      color: rgba(28,27,25,.58) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      color: #fff !important;
      background: var(--study-orange,#f95e08) !important;
      box-shadow: 0 12px 26px rgba(249,94,8,.22) !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button:not(.bg-orange) {
      background: rgba(255,255,255,.42) !important;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.035), 0 8px 20px rgba(28,27,25,.035) !important;
    }

    .mzm-request-carousel {
      height: 17.6rem !important;
      margin-top: .15rem !important;
    }

    .mzm-request-card {
      border: 1px solid rgba(255,255,255,.32) !important;
      overflow: hidden !important;
    }

    .mzm-request-card::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 16% 12%, rgba(255,255,255,.42), transparent 7.5rem),
        linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,0));
      opacity: .75;
    }

    .mzm-request-card:nth-child(4n+1) { background: #ECECC7 !important; }
    .mzm-request-card:nth-child(4n+2) { background: #D9E7CB !important; }
    .mzm-request-card:nth-child(4n+3) { background: #DED1E8 !important; }
    .mzm-request-card:nth-child(4n+4) { background: #D2E4E2 !important; }

    .mzm-request-card.is-active-card {
      transform: translateX(0) translateY(0) rotate(0deg) scale(1) !important;
      opacity: 1 !important;
      box-shadow: 0 26px 64px rgba(40,34,20,.15) !important;
    }

    .mzm-request-card.is-next-card {
      transform: translateX(1.35rem) translateY(.35rem) rotate(5deg) scale(.965) !important;
      opacity: .88 !important;
      filter: saturate(.98) brightness(.99);
    }

    .mzm-request-card.is-next-next-card {
      transform: translateX(2.55rem) translateY(.72rem) rotate(9deg) scale(.925) !important;
      opacity: .68 !important;
      filter: saturate(.92) brightness(.98);
    }

    .mzm-request-card.is-prev-card {
      transform: translateX(-1.55rem) translateY(.52rem) rotate(-7deg) scale(.93) !important;
      opacity: .48 !important;
    }

    .mzm-request-card.is-hidden-card {
      transform: translateX(3.25rem) translateY(1rem) rotate(11deg) scale(.88) !important;
      opacity: 0 !important;
    }

    .mzm-request-card-content {
      position: relative;
      z-index: 2;
    }

    .mzm-card-menu {
      z-index: 7 !important;
    }
  `;
  document.head.appendChild(style);
}

async function hydrateNames() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true'][data-request-id]"));
  const requestIds = Array.from(new Set(cards.map((card) => card.dataset.requestId || "").filter(Boolean)));
  if (!requestIds.length) return;

  try {
    const response = await fetch(`/api/request-name-map?requestIds=${encodeURIComponent(requestIds.join(","))}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as NameMapResponse;
    const map = data.requests || {};

    cards.forEach((card) => {
      const id = card.dataset.requestId || "";
      const item = map[id];
      if (!item) return;
      const title = card.querySelector<HTMLElement>(".mzm-request-card-content h3");
      const age = card.querySelector<HTMLElement>(".mzm-request-card-content em");
      if (title) {
        title.innerHTML = `<span>${escapeHtml(item.fromText)}</span><b>→</b><span>${escapeHtml(item.wantedText)}</span>`;
      }
      if (age) age.textContent = `Набор ${item.ageGroup}`;
    });
  } catch {
    // Visual polish should never block the app.
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

export default function RequestVisualPolish() {
  useEffect(() => {
    let scheduled = false;
    let lastIds = "";

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        injectStyles();
        const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-mzm-active-request-card='true'][data-request-id]")).map((card) => card.dataset.requestId || "").join(",");
        if (ids && ids !== lastIds) {
          lastIds = ids;
          void hydrateNames();
        }
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-request-id"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
