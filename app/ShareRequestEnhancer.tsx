"use client";

import { useEffect } from "react";

const SHARE_TEXT = `Пуснах заявка в МястоЗаМясто — безплатна платформа за родители, които търсят възможна размяна на място за детска градина.

Ако и вие търсите размяна, влезте и подайте заявка. Колкото повече родители се включат, толкова по-голям шанс има за съвпадение.

Платформата не е официална общинска система и не гарантира преместване.`;

function getShareUrl() {
  return window.location.origin;
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
        МястоЗаМясто работи най-добре, когато повече родители подадат заявки. Сподели платформата в родителска група или чат — без да публикуваш район, набор, градина, тип място или лични данни.
      </p>
      <p class="mzm-share-popup__hint">
        Споделя се само обща покана към платформата. Конкретната ти заявка остава скрита.
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

function createShareCard() {
  const card = document.createElement("article");
  card.className = "mzm-safe-share-card";
  card.dataset.mzmShareCard = "true";

  card.innerHTML = `
    <button type="button" class="mzm-safe-share-cta" data-mzm-open-share>
      <span class="mzm-safe-share-cta__icon">↗</span>
      <span class="mzm-safe-share-cta__content">
        <small>По-бързо съвпадение</small>
        <strong>Увеличи шанса за съвпадение</strong>
      </span>
      <span class="mzm-safe-share-cta__arrow">›</span>
    </button>
  `;

  card.querySelector<HTMLButtonElement>("[data-mzm-open-share]")?.addEventListener("click", openSharePopup);

  return card;
}

function injectStyles() {
  if (document.getElementById("mzm-safe-share-styles")) return;
  const style = document.createElement("style");
  style.id = "mzm-safe-share-styles";
  style.textContent = `
    .mzm-safe-share-card {
      margin: 0.25rem 0 0.9rem;
    }
    .mzm-safe-share-cta {
      width: 100%;
      display: grid;
      grid-template-columns: 3.15rem 1fr auto;
      align-items: center;
      gap: 0.85rem;
      border: 0;
      border-radius: 1.65rem;
      padding: 0.92rem 1rem;
      background: linear-gradient(145deg, rgba(236,237,199,.98), rgba(255,255,255,.86));
      color: #1c1b19;
      text-align: left;
      box-shadow: 0 14px 34px rgba(40,34,20,.055), inset 0 0 0 1px rgba(28,27,25,.035);
    }
    .mzm-safe-share-cta__icon {
      display: grid;
      place-items: center;
      width: 3.15rem;
      height: 3.15rem;
      border-radius: 1.15rem;
      background: var(--study-orange);
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      box-shadow: 0 10px 20px rgba(249,94,8,.18);
    }
    .mzm-safe-share-cta__content {
      min-width: 0;
      display: grid;
      gap: 0.15rem;
    }
    .mzm-safe-share-cta__content small {
      font-size: .62rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(28,27,25,.44);
    }
    .mzm-safe-share-cta__content strong {
      font-size: 1rem;
      line-height: 1.08;
      font-weight: 900;
      letter-spacing: -.035em;
      color: #1c1b19;
    }
    .mzm-safe-share-cta__arrow {
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
    .mzm-share-popup-open {
      overflow: hidden;
    }
    .mzm-share-popup {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 1rem;
      background: rgba(28,27,25,.26);
      backdrop-filter: blur(8px);
      animation: mzmShareFade .16s ease-out;
    }
    .mzm-share-popup__panel {
      position: relative;
      width: min(100%, 27rem);
      border-radius: 2rem;
      padding: 1.25rem;
      background: #fffcfa;
      box-shadow: 0 24px 70px rgba(28,27,25,.22);
      animation: mzmShareSheet .22s cubic-bezier(.2,.8,.2,1);
    }
    .mzm-share-popup__close {
      position: absolute;
      top: .9rem;
      right: .9rem;
      width: 2.35rem;
      height: 2.35rem;
      border: 0;
      border-radius: 999px;
      background: #f7f5ef;
      color: #1c1b19;
      font-size: 1.45rem;
      line-height: 1;
      font-weight: 700;
    }
    .mzm-share-popup__icon {
      display: grid;
      place-items: center;
      width: 3.35rem;
      height: 3.35rem;
      border-radius: 1.2rem;
      background: var(--study-orange);
      color: #fff;
      font-size: 1.4rem;
      font-weight: 900;
      box-shadow: 0 12px 24px rgba(249,94,8,.2);
    }
    .mzm-share-popup__eyebrow {
      margin: 1rem 0 0;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(28,27,25,.44);
    }
    .mzm-share-popup h3 {
      margin: .3rem 0 0;
      font-size: 1.45rem;
      line-height: 1.02;
      font-weight: 900;
      letter-spacing: -.05em;
      color: #1c1b19;
    }
    .mzm-share-popup__text,
    .mzm-share-popup__hint {
      margin: .75rem 0 0;
      font-size: .92rem;
      line-height: 1.45;
      font-weight: 700;
      color: rgba(28,27,25,.62);
    }
    .mzm-share-popup__hint {
      border-radius: 1.2rem;
      padding: .85rem;
      background: #f7f5ef;
      font-size: .82rem;
      color: rgba(28,27,25,.58);
    }
    .mzm-share-popup__share {
      width: 100%;
      margin-top: 1rem;
      border: 0;
      border-radius: 999px;
      padding: 1rem 1.2rem;
      background: var(--study-orange);
      color: #fff;
      font-size: .95rem;
      font-weight: 900;
      box-shadow: 0 16px 34px rgba(249,94,8,.22);
    }
    @keyframes mzmShareFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes mzmShareSheet {
      from { transform: translateY(1.2rem) scale(.98); opacity: .5; }
      to { transform: translateY(0) scale(1); opacity: 1; }
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
    const carousel = section.querySelector(".mzm-hard-carousel-shell, .mzm-hard-request-carousel");
    if (carousel) {
      carousel.insertAdjacentElement("afterend", card);
    } else if (heading?.parentElement === section) {
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
