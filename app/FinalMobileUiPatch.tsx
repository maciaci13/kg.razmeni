"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-final-mobile-ui-patch-style";
const DESIRED_TOP_GAP = 16;
const SCROLL_IDLE_DELAY = 180;

let isUserScrolling = false;
let scrollIdleTimer: number | undefined;

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function setImportant(el: HTMLElement, prop: string, value: string) {
  if (el.style.getPropertyValue(prop) === value && el.style.getPropertyPriority(prop) === "important") return;
  el.style.setProperty(prop, value, "important");
}

function parseCssPx(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function markUserScrolling(onIdle: () => void) {
  isUserScrolling = true;
  if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(() => {
    isUserScrolling = false;
    scrollIdleTimer = undefined;
    onIdle();
  }, SCROLL_IDLE_DELAY);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    main:has(nav.fixed.bottom-4) {
      padding-top: 10px !important;
      padding-bottom: calc(4.85rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    main:has(nav.fixed.bottom-4) > div {
      padding-top: 0 !important;
      padding-bottom: calc(4.85rem + env(safe-area-inset-bottom, 0px)) !important;
    }

    .mzm-final-tab-shell,
    .mzm-final-chat-shell {
      transition: none !important;
      width: 100% !important;
    }

    .mzm-final-chat-shell { display: block !important; }
    .mzm-final-chat-locked-shell { display: grid !important; gap: 1rem !important; }
    .mzm-final-chat-title { margin: 0 !important; }

    .mzm-final-chat-kicker {
      margin: 0 0 .7rem !important;
      color: var(--study-orange,#f95e08) !important;
      font-size: .72rem !important;
      font-weight: 900 !important;
      letter-spacing: .23em !important;
      text-transform: uppercase !important;
    }

    .mzm-final-chat-title h1 {
      margin: 0 !important;
      color: #1c1b19 !important;
      font-size: clamp(2.55rem, 12vw, 3.8rem) !important;
      line-height: .92 !important;
      font-weight: 900 !important;
      letter-spacing: -.075em !important;
    }

    .mzm-final-chat-title p:not(.mzm-final-chat-kicker) {
      margin: 1rem 0 0 !important;
      color: rgba(28,27,25,.58) !important;
      font-size: 1rem !important;
      line-height: 1.48 !important;
      font-weight: 750 !important;
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

function getMain() { return document.querySelector<HTMLElement>("main:has(nav.fixed.bottom-4)"); }

function findTopBar() {
  return Array.from(document.querySelectorAll<HTMLElement>("div")).find((node) => {
    const text = normalize(node.textContent).toUpperCase();
    if (!text.includes("РОДИТЕЛ") && !text.includes("ПРОФИЛ")) return false;
    const buttons = node.querySelectorAll("button");
    const hasGridIcon = Boolean(node.querySelector("i"));
    return buttons.length >= 2 && hasGridIcon;
  }) || null;
}

function isActiveTab(label: string) {
  return Boolean(Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((button) => {
    const text = normalize(button.textContent);
    const isActive = button.className.includes("bg-orange") || button.getAttribute("aria-current") === "page" || button.dataset.active === "true";
    return isActive && text.includes(label);
  }));
}

function removeChatShellIfInactive() {
  if (isActiveTab("Чат")) return;
  document.querySelectorAll<HTMLElement>(".mzm-final-chat-shell").forEach((shell) => shell.remove());
}

function isContentShellCandidate(node: HTMLElement, topBar: HTMLElement) {
  if (node === topBar || topBar.contains(node) || node.closest("nav.fixed.bottom-4")) return false;
  if (node.classList.contains("mzm-final-chat-shell")) return true;
  const rect = node.getBoundingClientRect();
  if (rect.width < 220 || rect.height < 40) return false;
  const text = normalize(node.textContent);
  return Boolean(text) && (
    text.includes("Намери") || text.includes("Нова заявка") || text.includes("Моите заявки") ||
    text.includes("Още няма") || text.includes("Още са заключени") || text.includes("Чатове") ||
    text.includes("Профил") || text.includes("Статус")
  );
}

function findVisibleContentShell(topBar: HTMLElement) {
  const siblingCandidates: HTMLElement[] = [];
  let next = topBar.nextElementSibling;
  while (next) {
    if (next instanceof HTMLElement) siblingCandidates.push(next);
    next = next.nextElementSibling;
  }
  const sibling = siblingCandidates.find((node) => isContentShellCandidate(node, topBar));
  if (sibling) return sibling;
  return Array.from(document.querySelectorAll<HTMLElement>(".mx-auto.max-w-md, .mzm-profile-subscreen, .mzm-final-chat-shell"))
    .find((node) => isContentShellCandidate(node, topBar)) || null;
}

function createChatShellAfterTopBar(topBar: HTMLElement) {
  let shell = document.querySelector<HTMLElement>(".mzm-final-chat-shell");
  if (shell) return shell;
  shell = document.createElement("div");
  shell.className = "mzm-final-chat-shell mx-auto max-w-md";
  topBar.insertAdjacentElement("afterend", shell);
  return shell;
}

function alignShell(topBar: HTMLElement, shell: HTMLElement) {
  shell.classList.add("mzm-final-tab-shell");
  if (isUserScrolling) return;
  const currentMargin = parseCssPx(window.getComputedStyle(shell).marginTop);
  const currentTop = shell.getBoundingClientRect().top;
  const naturalTop = currentTop - currentMargin;
  const desiredTop = topBar.getBoundingClientRect().bottom + DESIRED_TOP_GAP;
  const nextMargin = clamp(Math.round(desiredTop - naturalTop), -340, 20);
  const previousMargin = Number(shell.dataset.mzmFinalMarginTop);
  if (Number.isFinite(previousMargin) && Math.abs(previousMargin - nextMargin) <= 1) return;
  shell.dataset.mzmFinalMarginTop = String(nextMargin);
  setImportant(shell, "margin-top", `${nextMargin}px`);
}

function alignContentBelowTopBar() {
  const main = getMain();
  if (!main) return;
  setImportant(main, "padding-top", "10px");
  setImportant(main, "padding-bottom", "calc(4.85rem + env(safe-area-inset-bottom, 0px))");
  const direct = main.firstElementChild;
  if (direct instanceof HTMLElement) {
    setImportant(direct, "padding-top", "0");
    setImportant(direct, "padding-bottom", "calc(4.85rem + env(safe-area-inset-bottom, 0px))");
  }
  const topBar = findTopBar();
  if (!topBar) return;
  setImportant(topBar, "margin-bottom", "0");
  setImportant(topBar, "padding-top", "0");
  removeChatShellIfInactive();
  const shell = isActiveTab("Чат") ? createChatShellAfterTopBar(topBar) : findVisibleContentShell(topBar);
  if (!shell) return;
  alignShell(topBar, shell);
}

function findHeroSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => {
    const text = normalize(section.textContent);
    return text.includes("Намери") && text.includes("размяна") && text.includes("Пусни заявка");
  }) || null;
}

function openRadar(event?: Event) { event?.preventDefault(); event?.stopPropagation(); window.dispatchEvent(new CustomEvent("mzm:open-radar")); }
function openRequests(event?: Event) {
  event?.preventDefault(); event?.stopPropagation();
  const navButton = Array.from(document.querySelectorAll<HTMLButtonElement>("nav.fixed.bottom-4 button")).find((button) => normalize(button.textContent).includes("Заявка"));
  navButton?.click();
}
function makeRadarButton() { const button = document.createElement("button"); button.type = "button"; button.className = "mzm-final-radar-button"; button.setAttribute("aria-label", "Радар за шанс"); button.innerHTML = `<span class="mzm-final-radar-icon">⌁</span><span>Радар за шанс</span>`; button.addEventListener("click", openRadar); return button; }
function makeRequestButton() { const button = document.createElement("button"); button.type = "button"; button.className = "mzm-final-request-button"; button.innerHTML = `Пусни заявка <span>›</span>`; button.addEventListener("click", openRequests); return button; }

function patchHeroActions() {
  const hero = findHeroSection();
  if (!hero || hero.querySelector<HTMLElement>(".mzm-final-hero-actions")) return;
  const requestButton = Array.from(hero.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent).includes("Пусни заявка"));
  if (!requestButton) return;
  let row: HTMLElement | null = requestButton.parentElement;
  while (row && row !== hero) { const buttons = row.querySelectorAll("button").length; const text = normalize(row.textContent); if (buttons >= 1 && text.includes("Пусни заявка")) break; row = row.parentElement; }
  if (!row || row === hero) return;
  const next = document.createElement("div"); next.className = "mzm-final-hero-actions"; next.append(makeRadarButton(), makeRequestButton()); row.replaceWith(next);
}

function patchChatLockedHero() {
  if (!isActiveTab("Чат")) { removeChatShellIfInactive(); return; }
  const existingUnlocked = Array.from(document.querySelectorAll<HTMLElement>("textarea, [data-chat-active='true']")).length > 0;
  if (existingUnlocked) { document.querySelectorAll<HTMLElement>(".mzm-final-chat-shell").forEach((node) => node.remove()); return; }
  const topBar = findTopBar(); if (!topBar) return;
  const shell = createChatShellAfterTopBar(topBar);
  if (shell.dataset.mzmFinalChatLocked === "true") { alignShell(topBar, shell); return; }
  shell.dataset.mzmFinalChatLocked = "true";
  const locked = document.createElement("div"); locked.className = "mzm-final-chat-locked-shell";
  const title = document.createElement("section"); title.className = "mzm-final-chat-title"; title.innerHTML = `<p class="mzm-final-chat-kicker">Чатове</p><h1>Още са заключени</h1><p>Чатовете се отключват само когато всички родители в потенциалния цикъл потвърдят интерес.</p>`;
  const card = document.createElement("article"); card.className = "mzm-safe-share-card"; card.dataset.mzmShareCard = "true";
  const button = document.createElement("button"); button.type = "button"; button.className = "mzm-safe-share-cta"; button.dataset.mzmOpenShare = "true";
  button.innerHTML = `<span class="mzm-safe-share-cta__icon">↗</span><span class="mzm-safe-share-cta__content"><small>По-бързо съвпадение</small><strong>Увеличи шанса за съвпадение</strong></span><span class="mzm-safe-share-cta__arrow">›</span>`;
  card.append(button); locked.append(title, card); shell.replaceChildren(locked); alignShell(topBar, shell);
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
  smallText.style.setProperty("margin-top", ".95rem", "important"); smallText.style.setProperty("margin-bottom", "1.2rem", "important"); smallText.style.setProperty("font-size", "1rem", "important"); smallText.style.setProperty("line-height", "1.55", "important"); smallText.style.setProperty("font-weight", "700", "important"); smallText.style.setProperty("color", "rgba(28,27,25,.52)", "important");
  smallText.insertAdjacentElement("afterend", cta); shell.dataset.mzmMatchOrderFixed = "true";
}

function run() { injectStyles(); alignContentBelowTopBar(); patchHeroActions(); patchChatLockedHero(); patchMatchesEmptyOrder(); }

export default function FinalMobileUiPatch() {
  useEffect(() => {
    let raf = 0;
    const schedule = () => { window.cancelAnimationFrame(raf); raf = window.requestAnimationFrame(run); };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const onScroll = () => markUserScrolling(schedule);
    const onResize = () => schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("touchmove", onScroll, { passive: true });
    window.visualViewport?.addEventListener("scroll", onScroll);
    window.visualViewport?.addEventListener("resize", onResize);
    const interval = window.setInterval(schedule, 900);
    const t1 = window.setTimeout(schedule, 900);
    const t2 = window.setTimeout(schedule, 1800);
    return () => {
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = undefined;
      isUserScrolling = false;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("touchmove", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.clearInterval(interval);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return null;
}
