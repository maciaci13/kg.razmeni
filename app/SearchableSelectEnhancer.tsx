"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-searchable-select-style";
const MODAL_ATTR = "data-mzm-searchable-select-modal";

function normalize(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[„“”]/g, "\"")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstLetters(value: string) {
  return normalize(value).split(" ").filter(Boolean).map((word) => word[0]).join("");
}

function escapeHtml(value: string) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    select.mzm-select-native-hidden { display: none !important; }

    .mzm-select-wrap-has-proxy:after { display: none !important; }

    .mzm-select-proxy {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      border: 0 !important;
      outline: 0 !important;
      border-radius: 1.2rem !important;
      background: #fff !important;
      padding: 1rem 1.55rem 1rem 1rem !important;
      color: #1c1b19 !important;
      font: inherit !important;
      font-size: .92rem !important;
      font-weight: 850 !important;
      letter-spacing: -.025em !important;
      line-height: 1.25 !important;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.025) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: .85rem !important;
      text-align: left !important;
      min-height: 3.45rem !important;
      touch-action: pan-y !important;
      -webkit-tap-highlight-color: transparent !important;
      user-select: none !important;
      cursor: pointer !important;
    }

    .mzm-select-proxy__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }

    .mzm-select-proxy__chev {
      flex: 0 0 auto;
      width: 1rem;
      height: 1rem;
      opacity: .72;
      font-size: 1.05rem;
      line-height: 1;
      margin-right: .28rem;
      pointer-events: none;
    }

    .mzm-search-select-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: .45rem;
      background: rgba(28,27,25,.34);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      overflow: hidden;
    }

    .mzm-search-select-backdrop.is-keyboard-open { align-items: flex-start; padding: .55rem .65rem; }

    .mzm-search-select-panel {
      width: min(100%, 30rem);
      max-height: calc(100dvh - .9rem);
      display: flex;
      flex-direction: column;
      border-radius: 2.15rem;
      background: #fffcfa;
      color: #1c1b19;
      overflow: hidden;
      box-shadow: 0 28px 90px rgba(28,27,25,.24);
    }

    .mzm-search-select-panel.is-simple { max-height: calc(100dvh - .9rem); }
    .mzm-search-select-backdrop.is-keyboard-open .mzm-search-select-panel { max-height: calc(100% - 1.1rem); border-radius: 1.8rem; }

    .mzm-search-select-head {
      flex: 0 0 auto;
      padding: 1rem 1rem .75rem;
      background: linear-gradient(145deg, rgba(255,240,227,.98), rgba(255,255,255,.94));
    }

    .mzm-search-select-panel.is-simple .mzm-search-select-head { padding: 1rem; }

    .mzm-search-select-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .85rem;
      margin-bottom: .85rem;
    }

    .mzm-search-select-panel.is-simple .mzm-search-select-top { margin-bottom: 0; }

    .mzm-search-select-kicker {
      margin: 0 0 .28rem;
      font-size: .62rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--study-orange,#f95e08);
    }

    .mzm-search-select-title {
      margin: 0;
      font-size: 1.45rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -.055em;
    }

    .mzm-search-select-close {
      display: grid;
      place-items: center;
      width: 2.7rem;
      height: 2.7rem;
      border: 0;
      border-radius: 999px;
      background: rgba(255,255,255,.82);
      color: #1c1b19;
      font-size: 1.35rem;
      font-weight: 900;
      flex: 0 0 auto;
    }

    .mzm-search-select-input-wrap {
      display: flex;
      align-items: center;
      border-radius: 1.3rem;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.045);
      overflow: hidden;
    }

    .mzm-search-select-input-icon {
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3.15rem;
      color: rgba(28,27,25,.4);
      font-size: 1.05rem;
      font-weight: 900;
      flex: 0 0 auto;
    }

    .mzm-search-select-input {
      width: 100%;
      min-width: 0;
      height: 3.15rem;
      border: 0;
      outline: 0;
      background: transparent;
      color: #1c1b19;
      font: inherit;
      font-size: 1rem;
      font-weight: 850;
      letter-spacing: -.025em;
      padding: 0 1rem 0 0;
    }

    .mzm-search-select-input::placeholder { color: rgba(28,27,25,.36); opacity: 1; }

    .mzm-search-select-count {
      margin: .55rem 0 0;
      font-size: .72rem;
      line-height: 1.25;
      font-weight: 800;
      color: rgba(28,27,25,.46);
    }

    .mzm-search-select-list {
      flex: 1 1 auto;
      min-height: 0;
      padding: .75rem;
      overflow: auto;
      display: grid;
      align-content: start;
      gap: .45rem;
      background: #fffcfa;
      -webkit-overflow-scrolling: touch;
    }

    .mzm-search-select-panel.is-simple .mzm-search-select-list { padding: .72rem 1rem 1rem; overflow: auto; gap: .42rem; }

    .mzm-search-select-option {
      width: 100%;
      border: 0;
      border-radius: 1.25rem;
      background: #f7f5ef;
      color: #1c1b19;
      padding: .9rem .95rem;
      text-align: left;
      font: inherit;
      font-size: .88rem;
      line-height: 1.25;
      font-weight: 850;
      letter-spacing: -.025em;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.025);
    }

    .mzm-search-select-panel.is-simple .mzm-search-select-option {
      min-height: 3.28rem;
      display: flex;
      align-items: center;
      font-size: 1rem;
      border-radius: 1.28rem;
      padding: .92rem 1.05rem;
    }

    .mzm-search-select-option.is-selected { background: rgba(249,94,8,.11); box-shadow: inset 0 0 0 2px rgba(249,94,8,.34); }

    .mzm-search-select-option small {
      display: block;
      margin-top: .28rem;
      font-size: .68rem;
      line-height: 1.25;
      font-weight: 800;
      color: rgba(28,27,25,.46);
      letter-spacing: 0;
    }

    .mzm-search-select-empty {
      border-radius: 1.35rem;
      background: #f7f5ef;
      padding: 1rem;
      font-size: .88rem;
      line-height: 1.45;
      font-weight: 800;
      color: rgba(28,27,25,.58);
    }

    @media (max-height: 680px) {
      .mzm-search-select-backdrop { align-items: center; padding: .35rem; }
      .mzm-search-select-backdrop.is-keyboard-open { align-items: flex-start; padding: .45rem .55rem; }
      .mzm-search-select-panel { max-height: calc(100dvh - .7rem); border-radius: 1.8rem; }
      .mzm-search-select-panel.is-simple { max-height: calc(100dvh - .7rem); }
      .mzm-search-select-backdrop.is-keyboard-open .mzm-search-select-panel { max-height: calc(100% - .9rem); }
      .mzm-search-select-head { padding: .82rem .82rem .62rem; }
      .mzm-search-select-title { font-size: 1.25rem; }
      .mzm-search-select-input, .mzm-search-select-input-icon { height: 2.85rem; }
      .mzm-search-select-panel.is-simple .mzm-search-select-option { min-height: 3.05rem; padding: .78rem .95rem; }
    }
  `;
  document.head.appendChild(style);
}

type OptionItem = {
  value: string;
  label: string;
  meta: string;
  disabled: boolean;
  selected: boolean;
  normalized: string;
  initials: string;
};

function optionMeta(option: HTMLOptionElement) {
  const text = option.textContent || "";
  const parts = text.split(" · ").map((part) => part.trim()).filter(Boolean);
  return parts.length <= 1 ? "" : parts.slice(1).join(" · ");
}

function optionLabel(option: HTMLOptionElement) {
  const text = option.textContent || "";
  return text.split(" · ")[0]?.trim() || text.trim();
}

function getOptions(select: HTMLSelectElement): OptionItem[] {
  return Array.from(select.options).map((option) => {
    const label = optionLabel(option);
    const meta = optionMeta(option);
    const combined = `${label} ${meta} ${option.value}`;
    return {
      value: option.value,
      label,
      meta,
      disabled: option.disabled,
      selected: option.selected,
      normalized: normalize(combined),
      initials: firstLetters(combined)
    };
  });
}

function getTitle(select: HTMLSelectElement) {
  const wrapper = select.closest(".mzm-onboarding-field, .mzm-field, div");
  const parentLabel = wrapper?.querySelector<HTMLElement>("label, .mzm-label, .mzm-onboarding-label, .mzm-form-label")?.textContent || "";
  const aria = select.getAttribute("aria-label") || "";
  const selected = select.selectedOptions[0]?.textContent || "";
  const candidate = parentLabel || aria || selected;
  const clean = normalize(candidate);
  if (select.hasAttribute("data-district") || clean.includes("район")) return "Район";
  if (select.hasAttribute("data-year") || clean.includes("набор") || clean.includes("група")) return "Избери набор";
  if (select.hasAttribute("data-place-type") || clean.includes("тип място")) return "Тип място";
  if (select.hasAttribute("data-from") || clean.includes("сегашна")) return "Сегашна градина";
  if (select.hasAttribute("data-wanted") || clean.includes("желана")) return "Желана градина";
  return candidate || "Избери от списъка";
}

function isSimplePicker(select: HTMLSelectElement) {
  const title = normalize(getTitle(select));
  return select.hasAttribute("data-year") || select.hasAttribute("data-place-type") || title.includes("набор") || title.includes("група") || title.includes("тип място");
}

function matches(option: OptionItem, query: string) {
  const q = normalize(query);
  if (!q) return true;
  return option.normalized.includes(q) || option.initials.includes(q) || option.normalized.split(" ").some((word) => word.startsWith(q));
}

function closePicker() {
  document.querySelector(`[${MODAL_ATTR}='true']`)?.remove();
  document.body.style.removeProperty("overflow");
}

function updateProxy(select: HTMLSelectElement) {
  const proxy = select.nextElementSibling as HTMLButtonElement | null;
  if (!proxy?.classList.contains("mzm-select-proxy")) return;
  const selected = select.selectedOptions[0];
  const label = selected ? optionLabel(selected) : "Избери";
  const span = proxy.querySelector<HTMLElement>(".mzm-select-proxy__label");
  if (span) span.textContent = label || "Избери";
  proxy.dataset.value = select.value;
}

function chooseOption(select: HTMLSelectElement, item: OptionItem) {
  if (item.disabled) return;
  select.value = item.value;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  updateProxy(select);
  closePicker();
}

function updateViewport(modal: HTMLElement) {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const keyboardOpen = viewport.height < window.innerHeight - 90;
  modal.classList.toggle("is-keyboard-open", keyboardOpen);
  modal.style.top = `${viewport.offsetTop}px`;
  modal.style.left = `${viewport.offsetLeft}px`;
  modal.style.width = `${viewport.width}px`;
  modal.style.height = `${viewport.height}px`;
  modal.style.right = "auto";
  modal.style.bottom = "auto";
}

function displayOptions(select: HTMLSelectElement) {
  return getOptions(select).filter((item) => !item.disabled && item.value !== "");
}

function renderOptionButtons(list: HTMLElement, select: HTMLSelectElement, items: OptionItem[]) {
  if (!items.length) {
    list.innerHTML = `<div class="mzm-search-select-empty">Няма резултат. Пробвай с номер, част от името или първите букви.</div>`;
    return;
  }
  list.innerHTML = items.map((item, index) => `
    <button type="button" class="mzm-search-select-option ${item.selected ? "is-selected" : ""}" data-index="${index}">
      ${escapeHtml(item.label)}${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
    </button>
  `).join("");
  Array.from(list.querySelectorAll<HTMLButtonElement>(".mzm-search-select-option")).forEach((button) => {
    const item = items[Number(button.dataset.index || 0)];
    button.addEventListener("click", () => chooseOption(select, item));
  });
}

function openPicker(select: HTMLSelectElement) {
  if (select.disabled || select.dataset.mzmNoSearchPicker === "true") return;
  const options = displayOptions(select);
  if (!options.length) return;

  injectStyles();
  closePicker();
  document.body.style.overflow = "hidden";

  const simple = isSimplePicker(select);
  const title = getTitle(select);
  const modal = document.createElement("div");
  modal.className = "mzm-search-select-backdrop";
  modal.setAttribute(MODAL_ATTR, "true");
  modal.innerHTML = `
    <div class="mzm-search-select-panel ${simple ? "is-simple" : ""}" role="dialog" aria-modal="true">
      <div class="mzm-search-select-head">
        <div class="mzm-search-select-top">
          <div>
            <p class="mzm-search-select-kicker">Бърз избор</p>
            <h3 class="mzm-search-select-title">${escapeHtml(title)}</h3>
          </div>
          <button type="button" class="mzm-search-select-close" aria-label="Затвори">×</button>
        </div>
        ${simple ? "" : `
          <div class="mzm-search-select-input-wrap">
            <span class="mzm-search-select-input-icon">⌕</span>
            <input class="mzm-search-select-input" type="search" placeholder="Търси по име, номер или първи букви…" autocomplete="off" />
          </div>
          <p class="mzm-search-select-count"></p>
        `}
      </div>
      <div class="mzm-search-select-list"></div>
    </div>
  `;

  const input = modal.querySelector<HTMLInputElement>(".mzm-search-select-input");
  const list = modal.querySelector<HTMLElement>(".mzm-search-select-list");
  const count = modal.querySelector<HTMLElement>(".mzm-search-select-count");

  const render = () => {
    if (!list) return;
    if (simple) {
      renderOptionButtons(list, select, options);
      return;
    }
    if (!input || !count) return;
    const query = input.value;
    const filtered = options.filter((item) => matches(item, query)).slice(0, 120);
    count.textContent = query.trim() ? `${filtered.length} намерени резултата` : "Започни да пишеш за по-лесно намиране.";
    renderOptionButtons(list, select, filtered);
  };

  const onViewportChange = () => updateViewport(modal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closePicker(); });
  modal.querySelector<HTMLButtonElement>(".mzm-search-select-close")?.addEventListener("click", closePicker);
  input?.addEventListener("focus", () => { modal.classList.add("is-keyboard-open"); window.setTimeout(onViewportChange, 60); window.setTimeout(onViewportChange, 260); });
  input?.addEventListener("blur", () => window.setTimeout(onViewportChange, 160));
  input?.addEventListener("input", () => { render(); window.setTimeout(onViewportChange, 0); });
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePicker();
    if (event.key === "Enter") {
      const first = options.filter((item) => matches(item, input.value))[0];
      if (first) chooseOption(select, first);
    }
  });

  window.visualViewport?.addEventListener("resize", onViewportChange);
  window.visualViewport?.addEventListener("scroll", onViewportChange);
  const cleanupObserver = new MutationObserver(() => {
    if (!document.body.contains(modal)) {
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
      cleanupObserver.disconnect();
    }
  });
  cleanupObserver.observe(document.body, { childList: true });

  document.body.appendChild(modal);
  render();
  updateViewport(modal);
}

function isEligibleSelect(select: HTMLSelectElement) {
  if (select.disabled || select.multiple) return false;
  if (select.dataset.mzmNoSearchPicker === "true") return false;
  if (select.closest("[data-mzm-searchable-select-modal='true']")) return false;
  const options = displayOptions(select);
  if (!options.length) return false;
  if (select.classList.contains("mzm-onboarding-select") || select.classList.contains("mzm-select")) return true;
  return options.length > 8;
}

function ensureProxy(select: HTMLSelectElement) {
  const wrap = select.parentElement;
  if (wrap) wrap.classList.add("mzm-select-wrap-has-proxy");
  if (select.dataset.mzmProxyReady === "true") {
    updateProxy(select);
    return;
  }
  select.dataset.mzmProxyReady = "true";
  select.classList.add("mzm-select-native-hidden");

  const proxy = document.createElement("button");
  proxy.type = "button";
  proxy.className = "mzm-select-proxy";
  proxy.innerHTML = `<span class="mzm-select-proxy__label"></span><span class="mzm-select-proxy__chev">⌄</span>`;

  let startX = 0;
  let startY = 0;
  let startScrollY = 0;
  let moved = false;
  let lastPointerEligible = true;

  proxy.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    moved = false;
    lastPointerEligible = true;
    startX = event.clientX;
    startY = event.clientY;
    startScrollY = window.scrollY;
  });

  proxy.addEventListener("pointermove", (event) => {
    const deltaX = Math.abs(event.clientX - startX);
    const deltaY = Math.abs(event.clientY - startY);
    const scrollDelta = Math.abs(window.scrollY - startScrollY);
    if (deltaX > 14 || deltaY > 14 || scrollDelta > 8) moved = true;
  });

  proxy.addEventListener("pointercancel", () => {
    moved = true;
    lastPointerEligible = false;
  });

  proxy.addEventListener("pointerup", (event) => {
    const deltaX = Math.abs(event.clientX - startX);
    const deltaY = Math.abs(event.clientY - startY);
    const scrollDelta = Math.abs(window.scrollY - startScrollY);
    lastPointerEligible = !moved && deltaX <= 14 && deltaY <= 14 && scrollDelta <= 8;
  });

  proxy.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!lastPointerEligible) return;
    openPicker(select);
  });

  proxy.addEventListener("keydown", (event) => {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      openPicker(select);
    }
  });

  select.insertAdjacentElement("afterend", proxy);
  select.addEventListener("change", () => updateProxy(select));
  select.addEventListener("input", () => updateProxy(select));
  updateProxy(select);
}

function bindSelects() {
  document.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    if (!isEligibleSelect(select)) return;
    ensureProxy(select);
  });
}

export default function SearchableSelectEnhancer() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        injectStyles();
        bindSelects();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
