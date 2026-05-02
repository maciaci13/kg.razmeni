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

const stepList = [
  "Потвърждение",
  "Отключена координация",
  "Проверка на процедурата",
  "Готовност за действие",
  "Официални действия",
  "Резултат"
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
      border-radius: 2.2rem;
      background: rgba(255,255,255,.9);
      padding: 1rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.08), inset 0 0 0 1px rgba(28,27,25,.025);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .mzm-persist-hero {
      position: relative;
      overflow: hidden;
      border-radius: 1.8rem;
      background: linear-gradient(145deg, #ECECC7, #D9E7CB);
      padding: 1rem;
    }

    .mzm-persist-hero::after {
      content: "";
      position: absolute;
      right: -2.8rem;
      top: -3rem;
      width: 8rem;
      height: 8rem;
      border-radius: 999px;
      background: rgba(255,255,255,.32);
    }

    .mzm-persist-eyebrow {
      margin: 0;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.45);
    }

    .mzm-persist-title {
      margin: .45rem 0 0;
      font-size: 1.45rem;
      line-height: 1.02;
      font-weight: 900;
      letter-spacing: -.055em;
      color: #1c1b19;
    }

    .mzm-persist-helper {
      margin: .4rem 0 0;
      max-width: 19rem;
      font-size: .84rem;
      line-height: 1.38;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-persist-timeline {
      margin-top: 1rem;
      display: grid;
      gap: .65rem;
    }

    .mzm-persist-step {
      display: grid;
      grid-template-columns: 2rem 1fr;
      gap: .7rem;
      align-items: start;
    }

    .mzm-persist-dot {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: rgba(255,255,255,.72);
      font-size: .72rem;
      font-weight: 900;
      color: rgba(28,27,25,.45);
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.04);
    }

    .mzm-persist-step.is-done .mzm-persist-dot {
      background: #1c1b19;
      color: white;
    }

    .mzm-persist-step.is-current .mzm-persist-dot {
      background: var(--study-orange,#f95e08);
      color: white;
    }

    .mzm-persist-step strong {
      display: block;
      padding-top: .18rem;
      font-size: .84rem;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-persist-step span {
      display: block;
      margin-top: .12rem;
      font-size: .72rem;
      font-weight: 700;
      color: rgba(28,27,25,.5);
    }

    .mzm-persist-cards {
      display: grid;
      gap: .7rem;
      margin-top: 1rem;
    }

    .mzm-persist-card {
      border-radius: 1.45rem;
      padding: .9rem;
      background: #f7f5ef;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.03);
    }

    .mzm-persist-card:nth-child(4n+1) { background: #F7F5EF; }
    .mzm-persist-card:nth-child(4n+2) { background: #D9E7CB; }
    .mzm-persist-card:nth-child(4n+3) { background: #DED1E8; }
    .mzm-persist-card:nth-child(4n+4) { background: #D2E4E2; }

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

    .mzm-persist-closed {
      background: #ffe1d5 !important;
    }

    main:has(nav.fixed.bottom-4) section:has(h3):has(+ #${ROOT_ID}) {
      display: none !important;
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
  if (participants.some((p) => p.confirmation_status === "pending")) return 1;
  if (["confirmed", "at_risk"].includes(match.status)) {
    if (participants.some((p) => ["can_continue", "cannot_continue", "dropped_out"].includes(p.coordination_status))) return 4;
    if (participants.some((p) => ["checking_procedure", "contacted_kindergarten"].includes(p.coordination_status))) return 3;
    return 2;
  }
  return 1;
}

function statusText(participant: Participant, allConfirmed: boolean) {
  if (participant.confirmation_status === "declined") return "Отказана размяна";
  if (participant.confirmation_status === "pending") return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabels[participant.coordination_status] || participant.coordination_status || "—";
}

function isMatchesTabVisible() {
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => {
    const text = h1.textContent || "";
    return text.includes("Координация") || text.includes("Още няма цикъл") || text.includes("Има потенциален цикъл") || text.includes("Отказано");
  });
  return Boolean(title);
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
  if (!isMatchesTabVisible()) {
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
  const allConfirmed = participants.every((participant) => participant.confirmation_status === "confirmed");
  const closed = ["cancelled", "rejected", "failed"].includes(match.status) || participants.some((p) => p.confirmation_status === "declined" || p.coordination_status === "dropped_out");

  removePrevious();
  const root = document.createElement("section");
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="mzm-persist-shell">
      <div class="mzm-persist-hero ${closed ? "mzm-persist-closed" : ""}">
        <p class="mzm-persist-eyebrow">${closed ? "Процесът е прекратен" : "Активна координация"}</p>
        <h2 class="mzm-persist-title">${closed ? "Веригата е затворена" : "Пътеката остава видима"}</h2>
        <p class="mzm-persist-helper">${closed ? "Историята остава тук, за да е ясно кой кога е променил статуса си." : "Следи всички родители, етапите и статуса на веригата. Това не изчезва след приемане."}</p>
      </div>
      <div class="mzm-persist-timeline">
        ${stepList.map((title, index) => {
          const n = index + 1;
          const cls = n < activeStep ? "is-done" : n === activeStep ? "is-current" : "";
          return `<div class="mzm-persist-step ${cls}"><div class="mzm-persist-dot">${n < activeStep ? "✓" : n}</div><div><strong>${escapeHtml(title)}</strong><span>${n === activeStep ? "Текущ етап" : n < activeStep ? "Минат етап" : "Предстои"}</span></div></div>`;
        }).join("")}
      </div>
      <div class="mzm-persist-cards">
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
