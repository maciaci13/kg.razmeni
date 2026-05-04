"use client";

import { useEffect } from "react";

type Catalog = { districts?: string[] };

const STYLE_ID = "mzm-playground-random-tools-style";
const MODAL_ID = "mzm-playground-random-modal";
const SECTION_ID = "mzm-playground-radar-tools";
const DISTRICTS_CACHE_KEY = "mzm-playground-districts-cache";
const ALL_DISTRICTS = "__all__";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-playground-tools {
      border-radius: 2rem;
      background: rgba(255,255,255,.92);
      padding: 1.25rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.08);
      color: #1c1b19;
    }

    .mzm-playground-tools p {
      margin: 0;
    }

    .mzm-playground-kicker {
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-playground-tools h2 {
      margin: .55rem 0 0;
      font-size: 1.35rem;
      line-height: 1.05;
      font-weight: 900;
      letter-spacing: -.045em;
    }

    .mzm-playground-copy {
      margin-top: .55rem !important;
      font-size: .84rem;
      line-height: 1.45;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-playground-action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .65rem;
      margin-top: 1rem;
    }

    .mzm-playground-action-grid button,
    .mzm-playground-modal button {
      border: 0;
      border-radius: 999px;
      padding: .95rem 1rem;
      font-size: .78rem;
      font-weight: 900;
    }

    .mzm-playground-primary {
      background: var(--study-orange,#f95e08);
      color: #fff;
      box-shadow: 0 14px 30px rgba(249,94,8,.18);
    }

    .mzm-playground-secondary {
      background: #f7f5ef;
      color: #1c1b19;
    }

    .mzm-playground-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(28,27,25,.34);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .mzm-playground-modal {
      width: min(100%, 28rem);
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      border-radius: 2rem;
      background: #fffcfa;
      padding: 1rem;
      box-shadow: 0 28px 80px rgba(28,27,25,.24);
      color: #1c1b19;
    }

    .mzm-playground-modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .mzm-playground-modal h3 {
      margin: .35rem 0 0;
      font-size: 1.45rem;
      line-height: 1.03;
      font-weight: 900;
      letter-spacing: -.05em;
    }

    .mzm-playground-close {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 999px !important;
      padding: 0 !important;
      background: #f7f5ef !important;
      font-size: 1.25rem !important;
    }

    .mzm-playground-form {
      display: grid;
      gap: .75rem;
      border-radius: 1.55rem;
      background: #f7f5ef;
      padding: 1rem;
    }

    .mzm-playground-label {
      display: block;
      margin: .15rem 0 .35rem;
      font-size: .62rem;
      font-weight: 900;
      letter-spacing: .17em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-playground-input,
    .mzm-playground-select {
      width: 100%;
      border: 0;
      outline: 0;
      border-radius: 1.15rem;
      background: rgba(255,255,255,.86);
      padding: .95rem 1rem;
      color: #1c1b19;
      font: inherit;
      font-size: .86rem;
      font-weight: 800;
    }

    .mzm-playground-check {
      display: flex;
      align-items: center;
      gap: .55rem;
      border-radius: 1.15rem;
      background: rgba(255,255,255,.64);
      padding: .85rem .95rem;
      font-size: .78rem;
      font-weight: 850;
      color: rgba(28,27,25,.64);
    }

    .mzm-playground-check input {
      width: 1rem;
      height: 1rem;
      accent-color: var(--study-orange,#f95e08);
    }

    .mzm-playground-modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .65rem;
      margin-top: 1rem;
    }

    .mzm-playground-hint {
      margin-top: .8rem !important;
      border-radius: 1.1rem;
      background: #fff0e3;
      padding: .85rem;
      font-size: .76rem;
      line-height: 1.45;
      font-weight: 800;
      color: rgba(28,27,25,.66);
    }
  `;

  document.head.appendChild(style);
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isPlaygroundPage() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => normalize(h1.textContent).includes("Изолиран flow тест"));
}

async function fetchDistricts() {
  try {
    const cached = sessionStorage.getItem(DISTRICTS_CACHE_KEY);
    if (cached) return JSON.parse(cached) as string[];
  } catch {
    // ignore
  }

  try {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) return [];
    const catalog = await response.json() as Catalog;
    const districts = (catalog.districts || []).filter(Boolean).sort((a, b) => a.localeCompare(b, "bg"));
    try { sessionStorage.setItem(DISTRICTS_CACHE_KEY, JSON.stringify(districts)); } catch {}
    return districts;
  } catch {
    return [];
  }
}

async function callPlayground(body: object) {
  const response = await fetch("/api/playground", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok || json?.error) throw new Error(json?.error || "Playground action failed");
  window.location.reload();
}

function activeScenarioSize() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const active = buttons.find((button) => {
    const text = normalize(button.textContent);
    return /^(2|3|4) страни$/.test(text) && button.className.includes("bg-ink");
  });
  const parsed = Number(normalize(active?.textContent).match(/^(2|3|4)/)?.[1] || "2");
  return parsed === 3 || parsed === 4 ? parsed : 2;
}

async function openGeneratorModal(kind: "cycle" | "radar") {
  injectStyles();
  document.getElementById(MODAL_ID)?.remove();
  const districts = await fetchDistricts();
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "mzm-playground-modal-backdrop";

  const title = kind === "cycle" ? "Генерирай демо цикъл" : "Генерирай радар данни";
  const intro = kind === "cycle"
    ? "Избери район и системата ще направи random заявки, които да образуват потенциални цикли само в playground sandbox-а."
    : "Генерира различни активни заявки за радара, без да ги смесва с реални потребители.";

  modal.innerHTML = `
    <div class="mzm-playground-modal" role="dialog" aria-modal="true">
      <div class="mzm-playground-modal-head">
        <div>
          <p class="mzm-playground-kicker">Sandbox генератор</p>
          <h3>${title}</h3>
          <p class="mzm-playground-copy">${intro}</p>
        </div>
        <button type="button" class="mzm-playground-close" aria-label="Затвори">×</button>
      </div>
      <div class="mzm-playground-form">
        <div>
          <label class="mzm-playground-label">Район</label>
          <select class="mzm-playground-select" data-district>
            <option value="${ALL_DISTRICTS}">Всички райони</option>
            ${districts.map((district) => `<option value="${district}">${district}</option>`).join("")}
          </select>
        </div>
        ${kind === "cycle" ? `
          <div>
            <label class="mzm-playground-label">Размер на цикъл</label>
            <select class="mzm-playground-select" data-cycle-size>
              <option value="2">2 страни</option>
              <option value="3">3 страни</option>
              <option value="4">4 страни</option>
            </select>
          </div>
          <div>
            <label class="mzm-playground-label">Брой потенциални цикли</label>
            <input class="mzm-playground-input" data-cycle-count type="number" min="1" max="6" value="2" />
          </div>
        ` : `
          <div>
            <label class="mzm-playground-label">Брой активни заявки</label>
            <input class="mzm-playground-input" data-request-count type="number" min="6" max="60" value="24" />
          </div>
        `}
        <div>
          <label class="mzm-playground-label">Набор</label>
          <select class="mzm-playground-select" data-age-group>
            <option value="">Random</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
          </select>
        </div>
        <label class="mzm-playground-check"><input type="checkbox" data-reset-first checked /> Изчисти playground-а преди генериране</label>
      </div>
      <p class="mzm-playground-hint">Важно: тези данни се създават само през <b>/api/playground</b> и само за потребители с <b>is_playground=true</b>. Не се ползват реални потребители.</p>
      <div class="mzm-playground-modal-actions">
        <button type="button" class="mzm-playground-secondary" data-cancel>Откажи</button>
        <button type="button" class="mzm-playground-primary" data-generate>Генерирай</button>
      </div>
    </div>
  `;

  const cycleSizeSelect = modal.querySelector<HTMLSelectElement>("[data-cycle-size]");
  if (cycleSizeSelect) cycleSizeSelect.value = String(activeScenarioSize());

  const close = () => modal.remove();
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.querySelector(".mzm-playground-close")?.addEventListener("click", close);
  modal.querySelector("[data-cancel]")?.addEventListener("click", close);
  modal.querySelector<HTMLButtonElement>("[data-generate]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.setAttribute("disabled", "true");
    button.textContent = "Генерирам...";
    const district = modal.querySelector<HTMLSelectElement>("[data-district]")?.value || ALL_DISTRICTS;
    const resetFirst = Boolean(modal.querySelector<HTMLInputElement>("[data-reset-first]")?.checked);
    const ageGroup = modal.querySelector<HTMLSelectElement>("[data-age-group]")?.value || undefined;

    try {
      if (kind === "cycle") {
        await callPlayground({
          action: "seedRandomCycle",
          district,
          resetFirst,
          ageGroup,
          cycleSize: Number(modal.querySelector<HTMLSelectElement>("[data-cycle-size]")?.value || "2"),
          cycleCount: Number(modal.querySelector<HTMLInputElement>("[data-cycle-count]")?.value || "2")
        });
      } else {
        await callPlayground({
          action: "seedRadarDemo",
          district,
          resetFirst,
          ageGroup,
          requestCount: Number(modal.querySelector<HTMLInputElement>("[data-request-count]")?.value || "24")
        });
      }
    } catch (error) {
      button.removeAttribute("disabled");
      button.textContent = "Генерирай";
      alert(error instanceof Error ? error.message : "Грешка при генериране");
    }
  });

  document.body.appendChild(modal);
}

function replaceAutoMatchButton() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const autoButton = buttons.find((button) => normalize(button.textContent).includes("Авто match"));
  if (!autoButton || autoButton.dataset.mzmRandomCycleBound === "true") return;

  const clone = autoButton.cloneNode(true) as HTMLButtonElement;
  clone.dataset.mzmRandomCycleBound = "true";
  clone.textContent = "Демо цикъл";
  clone.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openGeneratorModal("cycle");
  });
  autoButton.replaceWith(clone);
}

function ensureRadarSection() {
  if (document.getElementById(SECTION_ID)) return;
  const scenarioSection = Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => normalize(section.textContent).includes("1. Сценарий"));
  if (!scenarioSection) return;

  const section = document.createElement("section");
  section.id = SECTION_ID;
  section.className = "mzm-playground-tools";
  section.innerHTML = `
    <p class="mzm-playground-kicker">Радар тестове</p>
    <h2>Симулирай активност за Радар за шанс</h2>
    <p class="mzm-playground-copy">Генерира random активни заявки по район или във всички райони. Ползвай го, за да тестваш радара с различни данни.</p>
    <div class="mzm-playground-action-grid">
      <button type="button" class="mzm-playground-primary" data-radar-demo>Радар демо</button>
      <button type="button" class="mzm-playground-secondary" data-cycle-demo>Демо цикъл</button>
    </div>
    <p class="mzm-playground-hint">Sandbox режим: работи само с playground потребителите и не трябва да се меша с реални заявки.</p>
  `;

  section.querySelector("[data-radar-demo]")?.addEventListener("click", () => void openGeneratorModal("radar"));
  section.querySelector("[data-cycle-demo]")?.addEventListener("click", () => void openGeneratorModal("cycle"));
  scenarioSection.insertAdjacentElement("afterend", section);
}

function run() {
  injectStyles();
  if (!isPlaygroundPage()) return;
  replaceAutoMatchButton();
  ensureRadarSection();
}

export default function PlaygroundRandomTools() {
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
    return () => observer.disconnect();
  }, []);

  return null;
}
