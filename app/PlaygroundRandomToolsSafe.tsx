"use client";

import { useEffect } from "react";

type CatalogResponse = { districts?: string[] };

type GeneratorKind = "cycle" | "radar";

const ALL_DISTRICTS = "__all__";
const MODAL_ID = "mzm-playground-generator-modal";
const SECTION_ID = "mzm-playground-radar-section";
const STYLE_ID = "mzm-playground-generator-style";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isPlaygroundPage() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => normalize(h1.textContent).includes("Изолиран flow тест"));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-pg-tools{border-radius:2rem;background:rgba(255,255,255,.94);padding:1.25rem;box-shadow:0 18px 48px rgba(40,34,20,.08);color:#1c1b19}.mzm-pg-k{margin:0;font-size:.68rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:rgba(28,27,25,.42)}.mzm-pg-tools h2{margin:.55rem 0 0;font-size:1.35rem;line-height:1.05;font-weight:900;letter-spacing:-.045em}.mzm-pg-copy{margin:.55rem 0 0;font-size:.84rem;line-height:1.45;font-weight:700;color:rgba(28,27,25,.58)}.mzm-pg-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:1rem}.mzm-pg-btn{border:0;border-radius:999px;padding:.95rem 1rem;font-size:.78rem;font-weight:900}.mzm-pg-primary{background:var(--study-orange,#f95e08);color:#fff;box-shadow:0 14px 30px rgba(249,94,8,.18)}.mzm-pg-secondary{background:#f7f5ef;color:#1c1b19}.mzm-pg-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(28,27,25,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.mzm-pg-modal{width:min(100%,28rem);max-height:calc(100dvh - 2rem);overflow:auto;border-radius:2rem;background:#fffcfa;padding:1rem;box-shadow:0 28px 80px rgba(28,27,25,.24);color:#1c1b19}.mzm-pg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.mzm-pg-modal h3{margin:.35rem 0 0;font-size:1.45rem;line-height:1.03;font-weight:900;letter-spacing:-.05em}.mzm-pg-close{display:grid;place-items:center;width:2.75rem;height:2.75rem;border:0;border-radius:999px;background:#f7f5ef;font-size:1.25rem;font-weight:900}.mzm-pg-form{display:grid;gap:.75rem;border-radius:1.55rem;background:#f7f5ef;padding:1rem}.mzm-pg-label{display:block;margin:.15rem 0 .35rem;font-size:.62rem;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:rgba(28,27,25,.42)}.mzm-pg-input,.mzm-pg-select{width:100%;border:0;outline:0;border-radius:1.15rem;background:rgba(255,255,255,.86);padding:.95rem 1rem;color:#1c1b19;font:inherit;font-size:.86rem;font-weight:800}.mzm-pg-check{display:flex;align-items:center;gap:.55rem;border-radius:1.15rem;background:rgba(255,255,255,.64);padding:.85rem .95rem;font-size:.78rem;font-weight:850;color:rgba(28,27,25,.64)}.mzm-pg-actions{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:1rem}.mzm-pg-hint{margin:.8rem 0 0;border-radius:1.1rem;background:#fff0e3;padding:.85rem;font-size:.76rem;line-height:1.45;font-weight:800;color:rgba(28,27,25,.66)}
  `;
  document.head.appendChild(style);
}

async function fetchDistricts() {
  try {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as CatalogResponse;
    return (data.districts || []).filter(Boolean).sort((a, b) => a.localeCompare(b, "bg"));
  } catch {
    return [];
  }
}

async function postPlayground(body: Record<string, unknown>) {
  const response = await fetch("/api/playground", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok || data?.error) throw new Error(data?.error || "Playground action failed");
  window.location.reload();
}

function selectedCycleSize() {
  const active = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => /^(2|3|4) страни$/.test(normalize(button.textContent)) && button.className.includes("bg-ink"));
  const parsed = Number(normalize(active?.textContent).match(/^(2|3|4)/)?.[1] || "2");
  return parsed === 3 || parsed === 4 ? parsed : 2;
}

async function openGenerator(kind: GeneratorKind) {
  injectStyles();
  document.getElementById(MODAL_ID)?.remove();

  const districts = await fetchDistricts();
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "mzm-pg-backdrop";
  modal.innerHTML = `
    <div class="mzm-pg-modal" role="dialog" aria-modal="true">
      <div class="mzm-pg-head">
        <div><p class="mzm-pg-k">Sandbox генератор</p><h3>${kind === "cycle" ? "Генерирай демо цикъл" : "Генерирай радар данни"}</h3><p class="mzm-pg-copy">${kind === "cycle" ? "Random цикли по район или във всички райони." : "Random активни заявки за тест на радара."}</p></div>
        <button type="button" class="mzm-pg-close" aria-label="Затвори">×</button>
      </div>
      <div class="mzm-pg-form">
        <div><label class="mzm-pg-label">Район</label><select class="mzm-pg-select" data-district><option value="${ALL_DISTRICTS}">Всички райони</option>${districts.map((district) => `<option value="${district}">${district}</option>`).join("")}</select></div>
        ${kind === "cycle" ? `<div><label class="mzm-pg-label">Размер на цикъл</label><select class="mzm-pg-select" data-cycle-size><option value="2">2 страни</option><option value="3">3 страни</option><option value="4">4 страни</option></select></div><div><label class="mzm-pg-label">Брой потенциални цикли</label><input class="mzm-pg-input" data-cycle-count type="number" min="1" max="6" value="2" /></div>` : `<div><label class="mzm-pg-label">Брой активни заявки</label><input class="mzm-pg-input" data-request-count type="number" min="6" max="60" value="24" /></div>`}
        <div><label class="mzm-pg-label">Набор</label><select class="mzm-pg-select" data-age-group><option value="">Random</option><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option><option value="2020">2020</option><option value="2019">2019</option></select></div>
        <label class="mzm-pg-check"><input type="checkbox" data-reset-first checked /> Изчисти playground-а преди генериране</label>
      </div>
      <p class="mzm-pg-hint">Данните се създават само през /api/playground и само за потребители с is_playground=true.</p>
      <div class="mzm-pg-actions"><button type="button" class="mzm-pg-btn mzm-pg-secondary" data-cancel>Откажи</button><button type="button" class="mzm-pg-btn mzm-pg-primary" data-generate>Генерирай</button></div>
    </div>`;

  const cycleSize = modal.querySelector<HTMLSelectElement>("[data-cycle-size]");
  if (cycleSize) cycleSize.value = String(selectedCycleSize());

  const close = () => modal.remove();
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.querySelector(".mzm-pg-close")?.addEventListener("click", close);
  modal.querySelector("[data-cancel]")?.addEventListener("click", close);

  const generate = modal.querySelector<HTMLButtonElement>("[data-generate]");
  generate?.addEventListener("click", async () => {
    const button = generate;
    button.disabled = true;
    button.textContent = "Генерирам...";

    const district = modal.querySelector<HTMLSelectElement>("[data-district]")?.value || ALL_DISTRICTS;
    const resetFirst = Boolean(modal.querySelector<HTMLInputElement>("[data-reset-first]")?.checked);
    const ageGroup = modal.querySelector<HTMLSelectElement>("[data-age-group]")?.value || undefined;

    try {
      if (kind === "cycle") {
        await postPlayground({
          action: "seedRandomCycle",
          district,
          resetFirst,
          ageGroup,
          cycleSize: Number(modal.querySelector<HTMLSelectElement>("[data-cycle-size]")?.value || "2"),
          cycleCount: Number(modal.querySelector<HTMLInputElement>("[data-cycle-count]")?.value || "2")
        });
      } else {
        await postPlayground({
          action: "seedRadarDemo",
          district,
          resetFirst,
          ageGroup,
          requestCount: Number(modal.querySelector<HTMLInputElement>("[data-request-count]")?.value || "24")
        });
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = "Генерирай";
      alert(error instanceof Error ? error.message : "Грешка при генериране");
    }
  });

  document.body.appendChild(modal);
}

function replaceAutoMatchButton() {
  const autoButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalize(button.textContent).includes("Авто match"));
  if (!autoButton || autoButton.dataset.mzmRandomCycleBound === "true") return;

  const clone = autoButton.cloneNode(true) as HTMLButtonElement;
  clone.dataset.mzmRandomCycleBound = "true";
  clone.textContent = "Демо цикъл";
  clone.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openGenerator("cycle");
  });
  autoButton.replaceWith(clone);
}

function ensureRadarSection() {
  if (document.getElementById(SECTION_ID)) return;
  const scenarioSection = Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => normalize(section.textContent).includes("1. Сценарий"));
  if (!scenarioSection) return;

  const section = document.createElement("section");
  section.id = SECTION_ID;
  section.className = "mzm-pg-tools";
  section.innerHTML = `<p class="mzm-pg-k">Радар тестове</p><h2>Симулирай активност за Радар за шанс</h2><p class="mzm-pg-copy">Генерира random активни заявки по район или във всички райони.</p><div class="mzm-pg-grid"><button type="button" class="mzm-pg-btn mzm-pg-primary" data-radar-demo>Радар демо</button><button type="button" class="mzm-pg-btn mzm-pg-secondary" data-cycle-demo>Демо цикъл</button></div><p class="mzm-pg-hint">Sandbox режим: работи само с playground потребителите и не трябва да се меша с реални заявки.</p>`;
  section.querySelector("[data-radar-demo]")?.addEventListener("click", () => void openGenerator("radar"));
  section.querySelector("[data-cycle-demo]")?.addEventListener("click", () => void openGenerator("cycle"));
  scenarioSection.insertAdjacentElement("afterend", section);
}

function run() {
  injectStyles();
  if (!isPlaygroundPage()) return;
  replaceAutoMatchButton();
  ensureRadarSection();
}

export default function PlaygroundRandomToolsSafe() {
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
