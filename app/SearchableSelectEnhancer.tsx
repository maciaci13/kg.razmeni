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
  return normalize(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
}

function escapeHtml(value: string) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-search-select-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(28,27,25,.34);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      overflow: hidden;
    }

    .mzm-search-select-backdrop.is-keyboard-open {
      align-items: flex-start;
      justify-content: center;
      padding: .55rem .65rem;
    }

    .mzm-search-select-panel {
      width: min(100%, 30rem);
      max-height: calc(100dvh - 2rem);
      display: flex;
      flex-direction: column;
      border-radius: 2.15rem;
      background: #fffcfa;
      color: #1c1b19;
      overflow: hidden;
      box-shadow: 0 28px 90px rgba(28,27,25,.24);
    }

    .mzm-search-select-backdrop.is-keyboard-open .mzm-search-select-panel {
      max-height: calc(100% - 1.1rem);
      border-radius: 1.8rem;
    }

    .mzm-search-select-head {
      flex: 0 0 auto;
      padding: 1rem 1rem .75rem;
      background: linear-gradient(145deg, rgba(255,240,227,.98), rgba(255,255,255,.94));
    }

    .mzm-search-select-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .85rem;
      margin-bottom: .85rem;
    }

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
      position: relative;
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

    .mzm-search-select-input::placeholder {
      color: rgba(28,27,25,.36);
      opacity: 1;
    }

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

    .mzm-search-select-option.is-selected {
      background: rgba(249,94,8,.11);
      box-shadow: inset 0 0 0 2px rgba(249,94,8,.34);
    }

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
      .mzm-search-select-backdrop { align-items: flex-end; padding: .65rem; }
      .mzm-search-select-backdrop.is-keyboard-open { align-items: flex-start; padding: .45rem .55rem; }
      .mzm-search-select-panel { max-height: calc(100dvh - 1.3rem); border-radius: 1.8rem; }
      .mzm-search-select-backdrop.is-keyboard-open .mzm-search-select-panel { max-height: calc(100% - .9rem); }
      .mzm-search-select-head { padding: .82rem .82rem .62rem; }
      .mzm-search-select-top { margin-bottom: .62rem; }
      .mzm-search-select-title { font-size: 1.25rem; }
      .mzm-search-select-input, .mzm-search-select-input-icon { height: 2.85rem; }
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
  if (parts.length <= 1) return "";
  return parts.slice(1).join(" · ");
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
  const parentLabel = wrapper?.querySelector<HTMLElement>("label, .mzm-label, .mzm-onboarding-label")?.textContent || "";
  const aria = select.getAttribute("aria-label") || "";
  const selected = select.selectedOptions[0]?.textContent || "";
  const candidate = parentLabel || aria || selected;
  const clean = normalize(candidate);
  if (clean.includes("район")) return "Район";
  if (clean.includes("набор") || clean.includes("група")) return "Набор / група";
  if (clean.includes("сегашна")) return "Сегашна градина";
  if (clean.includes("желана")) return "Желана градина";
  return candidate || "Избери от списъка";
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

function chooseOption(select: HTMLSelectElement, item: OptionItem) {
  if (item.disabled) return;
  select.value = item.value;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  closePicker();
  window.setTimeout(() => select.blur(), 0);
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

function openPicker(select: HTMLSelectElement) {
  if (select.disabled || select.dataset.mzmNoSearchPicker === "true") return;
  const options = getOptions(select).filter((item) => !item.disabled);
  if (options.length <= 4) return;

  injectStyles();
  closePicker();
  document.body.style.overflow = "hidden";

  const modal = document.createElement("div");
  modal.className = "mzm-search-select-backdrop";
  modal.setAttribute(MODAL_ATTR, "true");
  modal.innerHTML = `
    <div class="mzm-search-select-panel" role="dialog" aria-modal="true">
      <div class="mzm-search-select-head">
        <div class="mzm-search-select-top">
          <div>
            <p class="mzm-search-select-kicker">Бърз избор</p>
            <h3 class="mzm-search-select-title">${escapeHtml(getTitle(select))}</h3>
          </div>
          <button type="button" class="mzm-search-select-close" aria-label="Затвори">×</button>
        </div>
        <div class="mzm-search-select-input-wrap">
          <span class="mzm-search-select-input-icon">⌕</span>
          <input class="mzm-search-select-input" type="search" placeholder="Търси по име, номер или първи букви…" autocomplete="off" />
        </div>
        <p class="mzm-search-select-count"></p>
      </div>
      <div class="mzm-search-select-list"></div>
    </div>
  `;

  const input = modal.querySelector<HTMLInputElement>(".mzm-search-select-input");
  const list = modal.querySelector<HTMLElement>(".mzm-search-select-list");
  const count = modal.querySelector<HTMLElement>(".mzm-search-select-count");

  const render = () => {
    if (!input || !list || !count) return;
    const query = input.value;
    const filtered = options.filter((item) => matches(item, query)).slice(0, 120);
    count.textContent = query.trim()
      ? `${filtered.length} намерени резултата`
      : "Започни да пишеш за по-лесно намиране.";

    if (!filtered.length) {
      list.innerHTML = `<div class="mzm-search-select-empty">Няма резултат. Пробвай с номер, част от името или първите букви.</div>`;
      return;
    }

    list.innerHTML = filtered.map((item, index) => `
      <button type="button" class="mzm-search-select-option ${item.selected ? "is-selected" : ""}" data-index="${index}">
        ${escapeHtml(item.label)}
        ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
      </button>
    `).join("");

    Array.from(list.querySelectorAll<HTMLButtonElement>(".mzm-search-select-option")).forEach((button) => {
      const item = filtered[Number(button.dataset.index || 0)];
      button.addEventListener("click", () => chooseOption(select, item));
    });
  };

  const onViewportChange = () => updateViewport(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closePicker();
  });
  modal.querySelector<HTMLButtonElement>(".mzm-search-select-close")?.addEventListener("click", closePicker);
  input?.addEventListener("focus", () => {
    modal.classList.add("is-keyboard-open");
    window.setTimeout(onViewportChange, 60);
    window.setTimeout(onViewportChange, 260);
  });
  input?.addEventListener("blur", () => {
    window.setTimeout(onViewportChange, 160);
  });
  input?.addEventListener("input", () => {
    render();
    window.setTimeout(onViewportChange, 0);
  });
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
  const options = Array.from(select.options).filter((option) => !option.disabled);
  if (options.length <= 4) return false;
  return select.classList.contains("mzm-select") || select.classList.contains("mzm-onboarding-select") || options.length > 12;
}

function bindSelects() {
  document.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    if (!isEligibleSelect(select) || select.dataset.mzmSearchPickerBound === "true") return;
    select.dataset.mzmSearchPickerBound = "true";

    const open = (event: Event) => {
      if (!isEligibleSelect(select)) return;
      event.preventDefault();
      event.stopPropagation();
      openPicker(select);
    };

    select.addEventListener("pointerdown", open, true);
    select.addEventListener("mousedown", open, true);
    select.addEventListener("touchstart", open, true);
    select.addEventListener("click", open, true);
    select.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowDown"].includes(event.key)) open(event);
    }, true);
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
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const interval = window.setInterval(schedule, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
