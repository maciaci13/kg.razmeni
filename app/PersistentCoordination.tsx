"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type Participant = PlaygroundSnapshot["participants"][number];
type Match = PlaygroundSnapshot["matches"][number];
type User = PlaygroundSnapshot["users"][number];

type KindergartenMapResponse = {
  kindergartens?: Record<string, { name: string; district: string | null; address?: string | null }>;
  error?: string;
};

const STYLE_ID = "mzm-persistent-coordination-styles";
const ROOT_ID = "mzm-persistent-coordination-root";

const statusLabels: Record<string, string> = {
  not_started: "Още не е започнал/а",
  checking_procedure: "Проверява процедурата",
  contacted_kindergarten: "Свързал/а се е със заведение",
  can_continue: "Може да продължи",
  cannot_continue: "Не може да продължи",
  dropped_out: "Отказва се"
};

const steps = [
  { title: "Потвърждение", helper: "Всички страни приемат потенциалното съвпадение." },
  { title: "Отключена координация", helper: "Чатовете се отварят и започва уточняване." },
  { title: "Проверка на процедурата", helper: "Всеки проверява официалния ред и контакт със заведение." },
  { title: "Готовност за действие", helper: "Всички маркират дали могат да продължат." },
  { title: "Официални действия", helper: "Следват се само официалните административни стъпки." },
  { title: "Резултат", helper: "Цикълът се отбелязва като приключен или отпаднал." }
];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      display: grid;
      gap: 1rem;
      margin-top: .25rem;
    }

    .mzm-persist-shell {
      border-radius: 2rem;
      background: rgba(255,255,255,.9);
      padding: 1.25rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.08), inset 0 0 0 1px rgba(28,27,25,.025);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .mzm-persist-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .75rem;
    }

    .mzm-persist-eyebrow {
      margin: 0;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-persist-title {
      margin: .45rem 0 0;
      font-size: 1.45rem;
      line-height: 1.02;
      font-weight: 900;
      letter-spacing: -.055em;
      color: #1c1b19;
    }

    .mzm-persist-badge {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: .52rem .75rem;
      background: #f7f5ef;
      font-size: .62rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: rgba(28,27,25,.56);
    }

    .mzm-persist-stage {
      margin-top: 1rem;
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 0;
      border-radius: 1.6rem;
      background: #d9e7cb;
      padding: 1rem 1.1rem;
      text-align: left;
      box-shadow: 0 10px 24px rgba(33,28,17,.04);
    }

    .mzm-persist-stage.is-closed {
      background: #ffe1d5;
    }

    .mzm-persist-stage small {
      display: block;
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.45);
    }

    .mzm-persist-stage strong {
      display: block;
      margin-top: .45rem;
      font-size: 1.08rem;
      line-height: 1.1;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-persist-stage span {
      display: block;
      margin-top: .22rem;
      font-size: .76rem;
      line-height: 1.35;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-persist-chevron {
      width: 1.1rem;
      height: 1.1rem;
      flex: 0 0 auto;
      background: #1c1b19;
      opacity: .78;
      mask: url('/icons/angle-up.svg') center / contain no-repeat;
      -webkit-mask: url('/icons/angle-up.svg') center / contain no-repeat;
    }

    .mzm-persist-timeline {
      margin-top: 1rem;
      border-radius: 1.75rem;
      background: #f7f5ef;
      padding: 1.25rem 1rem;
    }

    .mzm-persist-step {
      position: relative;
      display: grid;
      grid-template-columns: 2rem 1fr;
      gap: .75rem;
      padding-bottom: 1.5rem;
    }

    .mzm-persist-step:last-child {
      padding-bottom: 0;
    }

    .mzm-persist-step::after {
      content: "";
      position: absolute;
      left: .94rem;
      top: 2rem;
      height: calc(100% - 1.35rem);
      border-left: 2px dashed rgba(28,27,25,.14);
    }

    .mzm-persist-step:last-child::after {
      display: none;
    }

    .mzm-persist-step.is-done::after {
      border-color: #d9e7cb;
    }

    .mzm-persist-dot {
      position: relative;
      z-index: 2;
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: #fff;
      font-size: .72rem;
      font-weight: 900;
      color: rgba(28,27,25,.35);
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.08);
    }

    .mzm-persist-step.is-done .mzm-persist-dot {
      background: #1c1b19;
      color: white;
      box-shadow: none;
    }

    .mzm-persist-step.is-current .mzm-persist-dot {
      background: var(--study-orange,#f95e08);
      color: white;
      box-shadow: none;
    }

    .mzm-persist-step strong {
      display: block;
      padding-top: .18rem;
      font-size: .86rem;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-persist-step span {
      display: block;
      margin-top: .14rem;
      font-size: .72rem;
      font-weight: 700;
      color: rgba(28,27,25,.5);
    }

    .mzm-persist-cards {
      display: grid;
      gap: .75rem;
      margin-top: 1rem;
      border-radius: 1.75rem;
      background: #f7f5ef;
      padding: 1rem;
    }

    .mzm-persist-cards-label {
      margin: 0 0 .2rem;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-persist-card {
      border-radius: 1.45rem;
      padding: .9rem;
      background: #f7f5ef;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.03);
    }

    .mzm-persist-card:nth-of-type(4n+2) { background: #D9E7CB; }
    .mzm-persist-card:nth-of-type(4n+3) { background: #DED1E8; }
    .mzm-persist-card:nth-of-type(4n+4) { background: #ECECC7; }
    .mzm-persist-card:nth-of-type(4n+5) { background: #D2E4E2; }

    .mzm-persist-card-head {
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .mzm-persist-avatar {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 999px;
      background: rgba(255,255,255,.75);
      font-size: .76rem;
      font-weight: 900;
      color: #1c1b19;
      box-shadow: 0 8px 18px rgba(33,28,17,.05);
    }

    .mzm-persist-card h3 {
      margin: 0;
      font-size: .94rem;
      line-height: 1.15;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-persist-card p {
      margin: .25rem 0 0;
      font-size: .72rem;
      line-height: 1.35;
      font-weight: 700;
      color: rgba(28,27,25,.56);
    }

    .mzm-persist-status {
      margin-top: .75rem;
      display: inline-flex;
      border-radius: 999px;
      background: rgba(255,255,255,.68);
      padding: .48rem .7rem;
      font-size: .68rem;
      font-weight: 900;
      color: rgba(28,27,25,.68);
    }
  `;
  document.head.appendChild(style);
}

async function getSnapshot(): Promise<PlaygroundSnapshot | null> {
  try {
    const response = await fetch("/api/playground", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as PlaygroundSnapshot;
  } catch {
    return null;
  }
}

async function getKindergartenMap(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {} as Record<string, { name: string; district: string | null }>;
  try {
    const response = await fetch(`/api/kindergarten-name-map?ids=${encodeURIComponent(unique.join(","))}`, { cache: "no-store" });
    if (!response.ok) return {};
    const data = await response.json() as KindergartenMapResponse;
    return data.kindergartens || {};
  } catch {
    return {};
  }
}

function isConfirmedLike(participant: Participant) {
  return participant.confirmation_status === "confirmed" || participant.confirmation_status === "interested";
}

function pickActiveMatch(snapshot: PlaygroundSnapshot) {
  const matches = snapshot.matches || [];
  const participants = snapshot.participants || [];
  const meaningful = matches
    .filter((match) => participants.some((participant) => participant.match_id === match.id))
    .filter((match) => !["expired"].includes(match.status));

  const priority = meaningful.find((match) => ["confirmed", "at_risk", "pending", "candidate", "created"].includes(match.status));
  return priority || meaningful[0] || null;
}

function stepFor(match: Match, participants: Participant[]) {
  if (["cancelled", "rejected", "failed"].includes(match.status)) return 6;
  if (participants.some((participant) => !isConfirmedLike(participant) && participant.confirmation_status !== "declined")) return 1;
  if (["confirmed", "at_risk", "pending", "candidate", "created"].includes(match.status)) {
    if (participants.every((participant) => participant.coordination_status === "can_continue")) return 5;
    if (participants.some((participant) => ["can_continue", "cannot_continue", "dropped_out"].includes(participant.coordination_status))) return 4;
    if (participants.some((participant) => ["checking_procedure", "contacted_kindergarten"].includes(participant.coordination_status))) return 3;
    return 2;
  }
  return 1;
}

function statusText(participant: Participant, allConfirmed: boolean) {
  if (participant.confirmation_status === "declined") return "Отказана размяна";
  if (!isConfirmedLike(participant)) return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabels[participant.coordination_status] || participant.coordination_status || "—";
}

function isMatchesTabVisible() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => {
    const text = h1.textContent || "";
    return text.includes("Координация") || text.includes("Още няма цикъл") || text.includes("Има потенциален цикъл") || text.includes("Отказано");
  });
}

function nativeCoordinationAlreadyVisible() {
  const pageText = document.body.textContent || "";
  const hasNativeCycle = pageText.includes("Верига и статуси") || pageText.includes("Приемам") || pageText.includes("Отказвам") || pageText.includes("Отказ от процеса");
  const hasEmptyState = pageText.includes("Още няма цикъл") || pageText.includes("Няма match");
  return hasNativeCycle && !hasEmptyState;
}

function shouldRenderFallback() {
  if (!isMatchesTabVisible()) return false;
  if (nativeCoordinationAlreadyVisible()) return false;
  return true;
}

function removePrevious() {
  document.getElementById(ROOT_ID)?.remove();
}

function mountAfterTitle(root: HTMLElement) {
  const titleBlock = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => {
    const text = h1.textContent || "";
    return text.includes("Координация") || text.includes("Още няма цикъл") || text.includes("Има потенциален цикъл") || text.includes("Отказано");
  })?.closest("div");

  if (titleBlock) titleBlock.insertAdjacentElement("afterend", root);
}

async function renderPersistentCoordination() {
  injectStyles();

  if (!shouldRenderFallback()) {
    removePrevious();
    return;
  }

  const snapshot = await getSnapshot();
  if (!snapshot) return;
  const match = pickActiveMatch(snapshot);
  if (!match) return;

  const participants = (snapshot.participants || [])
    .filter((participant) => participant.match_id === match.id)
    .sort((a, b) => a.participant_order - b.participant_order);

  if (!participants.length) return;

  const kgIds = participants.flatMap((participant) => [participant.from_kindergarten_id, participant.wants_kindergarten_id]);
  const kgMap = await getKindergartenMap(kgIds);
  const userById = new Map<string, User>((snapshot.users || []).map((user) => [user.id, user]));
  const activeStep = stepFor(match, participants);
  const allConfirmed = participants.length > 0 && participants.every(isConfirmedLike);
  const closed = ["cancelled", "rejected", "failed"].includes(match.status) || participants.some((participant) => participant.confirmation_status === "declined" || participant.coordination_status === "dropped_out");
  const currentStepInfo = closed ? { title: "Отказано", helper: "Процесът е прекратен. Веригата и чатовете са затворени." } : steps[Math.max(activeStep - 1, 0)] ?? steps[0];

  removePrevious();
  const root = document.createElement("section");
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="mzm-persist-shell">
      <div class="mzm-persist-head">
        <div>
          <p class="mzm-persist-eyebrow">Статус в прогрес</p>
          <h2 class="mzm-persist-title">${closed ? "Отказано" : "Координация"}</h2>
        </div>
        <span class="mzm-persist-badge">${closed ? "отказано" : match.status}</span>
      </div>
      <div class="mzm-persist-stage ${closed ? "is-closed" : ""}">
        <div>
          <small>Стъпка ${activeStep || 1} от ${steps.length}</small>
          <strong>${escapeHtml(currentStepInfo.title)}</strong>
          <span>${escapeHtml(currentStepInfo.helper)}</span>
        </div>
        <i class="mzm-persist-chevron"></i>
      </div>
      <div class="mzm-persist-timeline">
        ${steps.map((step, index) => {
          const n = index + 1;
          const done = n < activeStep;
          const current = n === activeStep;
          const cls = done ? "is-done" : current ? "is-current" : "";
          return `<div class="mzm-persist-step ${cls}">
            <div class="mzm-persist-dot">${done ? "✓" : n}</div>
            <div><strong>${escapeHtml(closed && n === 6 ? "Отказано" : step.title)}</strong><span>${current ? "Текущ етап" : done ? "Минат етап" : "Предстои"}</span></div>
          </div>`;
        }).join("")}
      </div>
      <div class="mzm-persist-cards">
        <p class="mzm-persist-cards-label">Верига и статуси</p>
        ${participants.map((participant, index) => {
          const user = userById.get(participant.user_id);
          const from = kgMap[participant.from_kindergarten_id]?.name || "Избрана градина";
          const wanted = kgMap[participant.wants_kindergarten_id]?.name || "Желана градина";
          return `<article class="mzm-persist-card">
            <div class="mzm-persist-card-head">
              <div class="mzm-persist-avatar">${index + 1}</div>
              <div>
                <h3>${escapeHtml(user?.display_name || participant.participant_label || `Родител ${index + 1}`)}</h3>
                <p>${escapeHtml(from)} → ${escapeHtml(wanted)}</p>
              </div>
            </div>
            <span class="mzm-persist-status">${escapeHtml(statusText(participant, allConfirmed))}</span>
          </article>`;
        }).join("")}
      </div>
    </div>
  `;

  mountAfterTitle(root);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

export default function PersistentCoordination() {
  useEffect(() => {
    let scheduled = false;
    let interval: number | null = null;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        void renderPersistentCoordination();
      });
    };

    schedule();
    interval = window.setInterval(schedule, 2500);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
