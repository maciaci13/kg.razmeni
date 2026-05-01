"use client";

import { useEffect } from "react";

const SHARE_TEXT = `Пуснах заявка в МястоЗаМясто — безплатна платформа за родители, които търсят възможна размяна на място за детска градина.

Ако и вие търсите размяна, влезте и подайте заявка. Колкото повече родители се включат, толкова по-голям шанс има за съвпадение.

Платформата не е официална общинска система и не гарантира преместване.`;

function getShareUrl() {
  return window.location.origin;
}

function getFullShareText() {
  return `${SHARE_TEXT}\n\n${getShareUrl()}`;
}

async function copyShareText(button: HTMLButtonElement) {
  try {
    await navigator.clipboard.writeText(getFullShareText());
    const previous = button.textContent;
    button.textContent = "Копирано ✓";
    setTimeout(() => {
      button.textContent = previous || "Копирай текст";
    }, 1400);
  } catch {
    window.prompt("Копирай текста:", getFullShareText());
  }
}

async function nativeShare() {
  const url = getShareUrl();
  if (navigator.share) {
    await navigator.share({
      title: "МястоЗаМясто",
      text: SHARE_TEXT,
      url
    });
    return;
  }
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
}

function createShareCard() {
  const card = document.createElement("article");
  card.className = "mzm-safe-share-card";
  card.dataset.mzmShareCard = "true";

  card.innerHTML = `
    <div class="mzm-safe-share-card__icon">↗</div>
    <div class="mzm-safe-share-card__content">
      <p class="mzm-safe-share-card__eyebrow">Увеличи шанса за match</p>
      <h3>Покани други родители</h3>
      <p>Сподели МястоЗаМясто в родителска група. Не публикуваме район, набор, градина, тип място или лични данни.</p>
      <div class="mzm-safe-share-card__actions">
        <button type="button" data-mzm-copy-share>Копирай текст</button>
        <button type="button" data-mzm-native-share>Сподели</button>
      </div>
    </div>
  `;

  const copyButton = card.querySelector<HTMLButtonElement>("[data-mzm-copy-share]");
  const shareButton = card.querySelector<HTMLButtonElement>("[data-mzm-native-share]");

  copyButton?.addEventListener("click", () => copyShareText(copyButton));
  shareButton?.addEventListener("click", () => nativeShare().catch(() => undefined));

  return card;
}

function injectStyles() {
  if (document.getElementById("mzm-safe-share-styles")) return;
  const style = document.createElement("style");
  style.id = "mzm-safe-share-styles";
  style.textContent = `
    .mzm-safe-share-card {
      display: grid;
      grid-template-columns: 3.2rem 1fr;
      gap: 0.9rem;
      margin: 0.25rem 0 0.9rem;
      padding: 1rem;
      border-radius: 1.7rem;
      background: linear-gradient(145deg, rgba(236,237,199,.95), rgba(255,255,255,.82));
      box-shadow: 0 14px 34px rgba(40,34,20,.055), inset 0 0 0 1px rgba(28,27,25,.035);
    }
    .mzm-safe-share-card__icon {
      display: grid;
      place-items: center;
      width: 3.2rem;
      height: 3.2rem;
      border-radius: 1.15rem;
      background: var(--study-orange);
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 10px 20px rgba(249,94,8,.18);
    }
    .mzm-safe-share-card__eyebrow {
      margin: 0;
      font-size: .62rem;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(28,27,25,.44);
    }
    .mzm-safe-share-card h3 {
      margin: .22rem 0 0;
      font-size: 1.12rem;
      line-height: 1.08;
      font-weight: 900;
      letter-spacing: -.035em;
      color: #1c1b19;
    }
    .mzm-safe-share-card__content > p:not(.mzm-safe-share-card__eyebrow) {
      margin: .45rem 0 0;
      font-size: .78rem;
      line-height: 1.42;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }
    .mzm-safe-share-card__actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .5rem;
      margin-top: .8rem;
    }
    .mzm-safe-share-card__actions button {
      border: 0;
      border-radius: 999px;
      padding: .78rem .8rem;
      font-size: .76rem;
      font-weight: 900;
      color: #1c1b19;
      background: rgba(255,255,255,.78);
    }
    .mzm-safe-share-card__actions button:last-child {
      color: #fff;
      background: var(--study-orange);
    }
  `;
  document.head.appendChild(style);
}

function hasRealRequest(section: Element) {
  const text = section.textContent || "";
  return text.includes("Моите заявки") && !text.includes("Няма активна заявка");
}

function placeShareCards() {
  injectStyles();

  const requestSections = Array.from(document.querySelectorAll("section")).filter(hasRealRequest);
  requestSections.forEach((section) => {
    if (section.querySelector("[data-mzm-share-card='true']")) return;
    const heading = Array.from(section.querySelectorAll("h2, h3")).find((node) => (node.textContent || "").includes("Моите заявки"));
    const card = createShareCard();
    if (heading?.parentElement === section) {
      heading.insertAdjacentElement("afterend", card);
    } else {
      section.insertBefore(card, section.firstChild?.nextSibling || null);
    }
  });
}

export default function ShareRequestEnhancer() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        placeShareCards();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
