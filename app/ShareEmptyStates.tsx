"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-share-empty-states-style";
const SHARE_TEXT = `Пуснах заявка в Място За Място — безплатна независима платформа за свързване на родители, които търсят възможна размяна на място в детските градини и ясли на София.

Ако и вие търсите размяна, влезте и подайте заявка. Колкото повече родители се включат, толкова по-голям шанс има твоето желано място да се появи.`;

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getShareUrl() {
  return window.location.origin;
}

async function nativeShare() {
  const url = getShareUrl();
  if (navigator.share) {
    await navigator.share({ title: "Място За Място", text: SHARE_TEXT, url });
    return;
  }
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
}

function closeSharePopup() {
  document.querySelector("[data-mzm-share-popup='true']")?.remove();
  document.body.classList.remove("mzm-share-popup-open");
}

function openSharePopup() {
  closeSharePopup();

  const overlay = document.createElement("div");
  overlay.className = "mzm-share-popup";
  overlay.dataset.mzmSharePopup = "true";
  overlay.innerHTML = `
    <div class="mzm-share-popup__panel" role="dialog" aria-modal="true" aria-label="Увеличи шанса за съвпадение">
      <button type="button" class="mzm-share-popup__close" aria-label="Затвори">×</button>
      <div class="mzm-share-popup__icon">↗</div>
      <p class="mzm-share-popup__eyebrow">Повече родители · повече шанс</p>
      <h3>Увеличи шанса за съвпадение</h3>
      <p class="mzm-share-popup__text">
        Място За Място работи най-добре, когато повече родители подадат заявки. Разкажи за платформата в социалните си мрежи, родителски групи, Viber общности или лични чатове.
      </p>
      <p class="mzm-share-popup__hint">
        Споделя се само обща покана към платформата. Конкретната ти заявка и личните ти данни остават скрити.
      </p>
      <button type="button" class="mzm-share-popup__share">Сподели</button>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeSharePopup();
  });
  overlay.querySelector<HTMLButtonElement>(".mzm-share-popup__close")?.addEventListener("click", closeSharePopup);
  overlay.querySelector<HTMLButtonElement>(".mzm-share-popup__share")?.addEventListener("click", () => {
    nativeShare().catch(() => undefined);
  });

  document.body.appendChild(overlay);
  document.body.classList.add("mzm-share-popup-open");
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-empty-share-cta {
      width: calc(100% - 2rem);
      max-width: 30rem;
      display: grid;
      grid-template-columns: 3.15rem 1fr auto;
      align-items: center;
      gap: .85rem;
      border: 0;
      border-radius: 1.65rem;
      padding: .92rem 1rem;
      margin: .85rem auto 0;
      background: linear-gradient(145deg, rgba(236,237,199,.98), rgba(255,255,255,.86));
      color: #1c1b19;
      text-align: left;
      box-shadow: 0 14px 34px rgba(40,34,20,.055), inset 0 0 0 1px rgba(28,27,25,.035);
    }
    .mzm-empty-share-cta__icon {
      display: grid;
      place-items: center;
      width: 3.15rem;
      height: 3.15rem;
      border-radius: 1.15rem;
      background: var(--study-orange,#f95e08);
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 10px 20px rgba(249,94,8,.18);
    }
    .mzm-empty-share-cta__content { min-width: 0; display: grid; gap: .15rem; }
    .mzm-empty-share-cta__content small {
      font-size: .62rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(28,27,25,.44);
    }
    .mzm-empty-share-cta__content strong {
      font-size: 1rem;
      line-height: 1.08;
      font-weight: 900;
      letter-spacing: -.035em;
      color: #1c1b19;
    }
    .mzm-empty-share-cta__arrow {
      display: grid;
      place-items: center;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 999px;
      background: rgba(255,255,255,.72);
      font-size: 1.45rem;
      font-weight: 900;
      color: rgba(28,27,25,.68);
    }
  `;
  document.head.appendChild(style);
}

function makeShareButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mzm-empty-share-cta";
  button.dataset.mzmEmptyShareCta = "true";
  button.innerHTML = `
    <span class="mzm-empty-share-cta__icon">↗</span>
    <span class="mzm-empty-share-cta__content">
      <small>По-бързо съвпадение</small>
      <strong>Увеличи шанса за съвпадение</strong>
    </span>
    <span class="mzm-empty-share-cta__arrow">›</span>
  `;
  button.addEventListener("click", openSharePopup);
  return button;
}

function stripNoPromiseText() {
  document.querySelectorAll<HTMLElement>("p, span, div").forEach((node) => {
    const text = normalize(node.textContent);
    if (text.includes("Без лични данни, без обещания")) {
      node.textContent = text.replace("Без лични данни, без обещания.", "").replace("Без лични данни, без обещания", "").trim();
    }
  });
}

function addShareToRadarEmpty() {
  const empties = Array.from(document.querySelectorAll<HTMLElement>(".mzm-radar-fixed-empty, .mzm-radar-empty"));
  empties.forEach((empty) => {
    if (empty.querySelector("[data-mzm-empty-share-cta='true']")) return;
    empty.appendChild(makeShareButton());
  });
}

function findMatchEmptyShell() {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((item) => normalize(item.textContent).includes("Още няма съвпадение") || normalize(item.textContent).includes("Още няма цикъл"));
  if (!heading) return null;
  return (heading.closest(".mx-auto.max-w-md") || heading.closest("main") || heading.parentElement) as HTMLElement | null;
}

function addShareToEmptyMatches() {
  const shell = findMatchEmptyShell();
  if (!shell || shell.querySelector("[data-mzm-empty-share-cta='true']")) return;

  const heading = Array.from(shell.querySelectorAll<HTMLElement>("h1")).find((item) => normalize(item.textContent).includes("Още няма съвпадение") || normalize(item.textContent).includes("Още няма цикъл"));
  const description = heading?.nextElementSibling as HTMLElement | null;
  const button = makeShareButton();

  if (description && normalize(description.textContent).includes("При съвпадение")) {
    description.insertAdjacentElement("afterend", button);
  } else if (heading) {
    heading.insertAdjacentElement("afterend", button);
  } else {
    shell.appendChild(button);
  }
}

function run() {
  injectStyles();
  stripNoPromiseText();
  addShareToRadarEmpty();
  addShareToEmptyMatches();
}

export default function ShareEmptyStates() {
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

    run();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(run, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
