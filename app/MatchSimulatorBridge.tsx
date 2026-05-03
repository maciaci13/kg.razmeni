"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type Participant = PlaygroundSnapshot["participants"][number];
type Match = PlaygroundSnapshot["matches"][number];
type User = PlaygroundSnapshot["users"][number];

type ApiError = { error: string };

const ROOT_ID = "mzm-match-simulator-bridge-root";
const STYLE_ID = "mzm-match-simulator-bridge-style";
const LEAVE_MODAL_ID = "mzm-match-leave-modal";

const statusOptions = [
  ["not_started", "Още не съм започнал/а"],
  ["checking_procedure", "Проверявам процедурата"],
  ["contacted_kindergarten", "Свързал/а съм се със заведение"],
  ["can_continue", "Мога да продължа"],
  ["cannot_continue", "Не мога да продължа"],
  ["dropped_out", "Отказвам се"]
] as const;

const steps = [
  { title: "Потвърждение", helper: "Всички страни приемат потенциалното съвпадение." },
  { title: "Отключена координация", helper: "Чатовете се отварят и започва уточняване." },
  { title: "Проверка на процедурата", helper: "Всеки проверява официалния ред и контакт със заведение." },
  { title: "Готовност за действие", helper: "Всички маркират дали могат да продължат." },
  { title: "Официални действия", helper: "Следват се само официалните административни стъпки." },
  { title: "Резултат", helper: "Цикълът се отбелязва като приключен или отпаднал." }
];

const rejectedStep = {
  title: "Отказано",
  helper: "Процесът е прекратен. Веригата и чатовете са затворени."
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    main:has(#${ROOT_ID}) .mx-auto.max-w-md > div.px-1 + section,
    main:has(#${ROOT_ID}) #${ROOT_ID} ~ section {
      display: none !important;
    }

    #${ROOT_ID} {
      display: grid;
      gap: 1rem;
    }

    .mzm-match-card {
      border-radius: 2.2rem;
      background: rgba(255,255,255,.9);
      padding: 1rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.08), inset 0 0 0 1px rgba(28,27,25,.025);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .mzm-match-invite-title {
      margin: 0;
      font-size: 1.8rem;
      line-height: .98;
      font-weight: 900;
      letter-spacing: -.06em;
      color: #1c1b19;
    }

    .mzm-match-muted {
      margin: .65rem 0 0;
      font-size: .9rem;
      line-height: 1.55;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-match-stage {
      width: 100%;
      display: flex;
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

    .mzm-match-stage.is-closed { background: #ffe1d5; }

    .mzm-match-stage small {
      display: block;
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.45);
    }

    .mzm-match-stage strong {
      display: block;
      margin-top: .45rem;
      font-size: 1.08rem;
      line-height: 1.1;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-match-stage span {
      display: block;
      margin-top: .22rem;
      font-size: .76rem;
      line-height: 1.35;
      font-weight: 700;
      color: rgba(28,27,25,.58);
    }

    .mzm-match-toggle-icon {
      width: 1.1rem;
      height: 1.1rem;
      flex: 0 0 auto;
      background: #1c1b19;
      opacity: .78;
      mask: url('/icons/angle-down.svg') center / contain no-repeat;
      -webkit-mask: url('/icons/angle-down.svg') center / contain no-repeat;
      transition: transform .18s ease;
    }

    .mzm-match-stage.is-open .mzm-match-toggle-icon { transform: rotate(180deg); }

    .mzm-match-timeline {
      margin-top: 1rem;
      border-radius: 1.75rem;
      background: #f7f5ef;
      padding: 1.25rem 1rem;
    }

    .mzm-match-step {
      position: relative;
      display: grid;
      grid-template-columns: 2rem 1fr;
      gap: .75rem;
      padding-bottom: 1.5rem;
    }

    .mzm-match-step:last-child { padding-bottom: 0; }

    .mzm-match-step::after {
      content: "";
      position: absolute;
      left: .94rem;
      top: 2rem;
      height: calc(100% - 1.35rem);
      border-left: 2px dashed rgba(28,27,25,.14);
    }

    .mzm-match-step:last-child::after { display: none; }
    .mzm-match-step.is-done::after { border-color: #d9e7cb; }

    .mzm-match-dot {
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

    .mzm-match-step.is-done .mzm-match-dot { background: #1c1b19; color: #fff; box-shadow: none; }
    .mzm-match-step.is-current .mzm-match-dot { background: var(--study-orange,#f95e08); color: #fff; box-shadow: none; }

    .mzm-match-step strong {
      display: block;
      padding-top: .18rem;
      font-size: .86rem;
      font-weight: 900;
      color: #1c1b19;
    }

    .mzm-match-step span {
      display: block;
      margin-top: .14rem;
      font-size: .72rem;
      font-weight: 700;
      color: rgba(28,27,25,.5);
    }

    .mzm-match-cycle {
      margin-top: 1rem;
      border-radius: 1.75rem;
      background: #f7f5ef;
      padding: 1rem;
    }

    .mzm-match-cycle-label {
      margin: 0 0 .8rem;
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(28,27,25,.42);
    }

    .mzm-match-person {
      position: relative;
      border-radius: 1.45rem;
      padding: .9rem;
      background: #d9e7cb;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.03);
    }

    .mzm-match-person + .mzm-match-person { margin-top: .75rem; }
    .mzm-match-person:nth-of-type(3) { background: #ff5a0a; color: #fff; }
    .mzm-match-person:nth-of-type(4) { background: #ECECC7; }
    .mzm-match-person:nth-of-type(5) { background: #DED1E8; }

    .mzm-match-person.is-me {
      background: var(--study-orange,#f95e08) !important;
      color: #fff;
    }

    .mzm-match-person-head {
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .mzm-match-avatar {
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      background: rgba(255,255,255,.9);
      font-size: .86rem;
      font-weight: 900;
      color: #1c1b19;
      box-shadow: 0 8px 18px rgba(33,28,17,.05);
      flex: 0 0 auto;
    }

    .mzm-match-person h3 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.1;
      font-weight: 900;
      color: inherit;
    }

    .mzm-match-person p {
      margin: .25rem 0 0;
      font-size: .73rem;
      line-height: 1.35;
      font-weight: 700;
      color: rgba(28,27,25,.56);
    }

    .mzm-match-person.is-me p { color: rgba(255,255,255,.72); }

    .mzm-match-status-text {
      margin-top: .75rem;
      display: inline-flex;
      border-radius: 999px;
      background: rgba(255,255,255,.68);
      padding: .48rem .7rem;
      font-size: .68rem;
      font-weight: 900;
      color: rgba(28,27,25,.68);
    }

    .mzm-match-status-select {
      margin-top: .75rem;
      width: 100%;
      border: 0;
      outline: 0;
      appearance: none;
      border-radius: 999px;
      background: rgba(255,255,255,.92);
      padding: .78rem 2.5rem .78rem .9rem;
      font-size: .76rem;
      font-weight: 900;
      color: #1c1b19;
      box-shadow: inset 0 0 0 1px rgba(28,27,25,.04);
    }

    .mzm-match-actions {
      margin-top: 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .75rem;
    }

    .mzm-match-actions button,
    .mzm-match-leave-button {
      border: 0;
      border-radius: 999px;
      padding: 1rem;
      font-size: .9rem;
      font-weight: 900;
      box-shadow: 0 10px 24px rgba(33,28,17,.04);
    }

    .mzm-match-primary { background: var(--study-orange,#f95e08); color: #fff; }
    .mzm-match-secondary { background: #f7f5ef; color: #1c1b19; }

    .mzm-match-leave-button {
      width: 100%;
      margin-top: 1rem;
      background: #f7f5ef;
      color: #1c1b19;
    }

    .mzm-match-empty {
      border-radius: 2rem;
      background: rgba(255,255,255,.85);
      padding: 1.25rem;
      box-shadow: 0 18px 48px rgba(40,34,20,.06);
    }

    .mzm-match-empty h3 { margin: 0; font-size: 1.2rem; font-weight: 900; letter-spacing: -.03em; }
    .mzm-match-empty p { margin: .45rem 0 0; font-size: .86rem; font-weight: 700; line-height: 1.5; color: rgba(28,27,25,.58); }

    .mzm-match-leave-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(28,27,25,.28);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .mzm-match-leave-panel {
      width: min(100%, 27rem);
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      border-radius: 2rem;
      background: #fffcfa;
      padding: 1rem;
      box-shadow: 0 24px 70px rgba(28,27,25,.22);
    }

    .mzm-match-leave-panel h3 { margin: 0; font-size: 1.45rem; line-height: 1.02; font-weight: 900; letter-spacing: -.05em; }
    .mzm-match-leave-panel p { margin: .65rem 0 0; font-size: .86rem; line-height: 1.5; font-weight: 700; color: rgba(28,27,25,.58); }
    .mzm-match-leave-panel button { width: 100%; border: 0; border-radius: 999px; padding: 1rem; font-size: .86rem; font-weight: 900; }
    .mzm-match-leave-list { display: grid; gap: .6rem; margin-top: 1rem; }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button {
      text-align: center !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: .22rem !important;
      text-align: center !important;
      line-height: 1.05 !important;
    }

    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange span,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange p,
    main:has(nav.fixed.bottom-4) nav.fixed.bottom-4 button.bg-orange div {
      text-align: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value: string) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

async function api(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = await response.json() as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

function isConfirmedLike(participant: Participant) {
  return participant.confirmation_status === "interested" || participant.confirmation_status === "confirmed";
}

function statusLabel(status?: string) {
  return statusOptions.find(([value]) => value === status)?.[1] ?? status ?? "—";
}

function participantStatus(participant: Participant, allConfirmed: boolean) {
  if (participant.confirmation_status === "declined") return "Отказана размяна";
  if (!isConfirmedLike(participant)) return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabel(participant.coordination_status);
}

function isMatchesTabVisible() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((h1) => {
    const text = h1.textContent || "";
    return text.includes("Координация") || text.includes("Има потенциален цикъл") || text.includes("Още няма цикъл") || text.includes("Отказано");
  });
}

function selectedUserNameFromPage() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const profileButton = buttons.find((button) => /родител\s*[абвгabcd]/i.test(button.textContent || ""));
  return (profileButton?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function selectedUser(snapshot: PlaygroundSnapshot) {
  const label = selectedUserNameFromPage();
  if (label) {
    const found = snapshot.users.find((user) => label.includes(user.display_name.toLowerCase()));
    if (found) return found;
  }
  return snapshot.users[0];
}

function activeMatchForUser(snapshot: PlaygroundSnapshot, userId: string) {
  const myMatchIds = new Set(snapshot.participants.filter((participant) => participant.user_id === userId).map((participant) => participant.match_id));
  const matches = snapshot.matches.filter((match) => myMatchIds.has(match.id) && match.status !== "expired");
  return matches.find((match) => ["pending", "candidate", "created", "confirmed", "at_risk"].includes(match.status)) || matches[0];
}

function stepState(match: Match, participants: Participant[]) {
  const anyDeclined = participants.some((participant) => participant.confirmation_status === "declined");
  const anyDropped = participants.some((participant) => participant.coordination_status === "dropped_out");
  const anyCannot = participants.some((participant) => participant.coordination_status === "cannot_continue");
  const allCan = participants.length > 0 && participants.every((participant) => participant.coordination_status === "can_continue");
  const anyStarted = participants.some((participant) => ["checking_procedure", "contacted_kindergarten"].includes(participant.coordination_status));
  const allConfirmed = participants.length > 0 && participants.every(isConfirmedLike);
  const closed = anyDeclined || anyDropped || ["at_risk", "cancelled", "rejected", "failed"].includes(match.status);
  const currentStep = closed ? 6 : !allConfirmed ? 1 : allCan ? 5 : anyCannot ? 4 : anyStarted ? 3 : 2;
  return { allConfirmed, closed, currentStep, currentStepInfo: closed ? rejectedStep : steps[Math.max(currentStep - 1, 0)] ?? steps[0] };
}

function kgName(snapshot: PlaygroundSnapshot, id: string) {
  return snapshot.kindergartens.find((kg) => kg.id === id)?.name || "—";
}

function fromTo(snapshot: PlaygroundSnapshot, participant: Participant) {
  return `${kgName(snapshot, participant.from_kindergarten_id)} → ${kgName(snapshot, participant.wants_kindergarten_id)}`;
}

function timelineHtml(currentStep: number, rejected: boolean) {
  return `<div class="mzm-match-timeline">${steps.map((step, index) => {
    const n = index + 1;
    const done = n < currentStep;
    const current = n === currentStep;
    const title = rejected && n === 6 ? "Отказано" : step.title;
    const helper = rejected && n === 6 ? rejectedStep.helper : step.helper;
    return `<div class="mzm-match-step ${done ? "is-done" : current ? "is-current" : ""}">
      <div class="mzm-match-dot">${done ? "✓" : rejected && current ? "!" : n}</div>
      <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(helper)}</span></div>
    </div>`;
  }).join("")}</div>`;
}

function cycleHtml(snapshot: PlaygroundSnapshot, participants: Participant[], selectedUserId: string, allConfirmed: boolean, readOnly: boolean) {
  const userById = new Map<string, User>(snapshot.users.map((user) => [user.id, user]));
  return `<div class="mzm-match-cycle"><p class="mzm-match-cycle-label">Верига и статуси</p>${participants.map((participant, index) => {
    const me = participant.user_id === selectedUserId;
    const user = userById.get(participant.user_id);
    return `<article class="mzm-match-person ${me ? "is-me" : ""}" data-user-id="${escapeHtml(participant.user_id)}">
      <div class="mzm-match-person-head">
        <div class="mzm-match-avatar">${me ? "Ти" : index + 1}</div>
        <div><h3>${escapeHtml(me ? "Ти" : user?.display_name || participant.participant_label || `Родител ${index + 1}`)}</h3><p>${escapeHtml(fromTo(snapshot, participant))}</p></div>
      </div>
      ${me && allConfirmed && !readOnly ? `<select class="mzm-match-status-select" data-status-select="true">${statusOptions.map(([value, label]) => `<option value="${value}" ${participant.coordination_status === value ? "selected" : ""}>${label}</option>`).join("")}</select>` : `<span class="mzm-match-status-text">${escapeHtml(participantStatus(participant, allConfirmed))}</span>`}
    </article>`;
  }).join("")}</div>`;
}

function mountRoot(html: string) {
  document.getElementById(ROOT_ID)?.remove();
  const title = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((h1) => {
    const text = h1.textContent || "";
    return text.includes("Координация") || text.includes("Има потенциален цикъл") || text.includes("Още няма цикъл") || text.includes("Отказано");
  });
  const titleBlock = title?.closest("div");
  if (!titleBlock) return null;
  const root = document.createElement("section");
  root.id = ROOT_ID;
  root.innerHTML = html;
  titleBlock.insertAdjacentElement("afterend", root);
  return root;
}

function attachHandlers(root: HTMLElement, snapshot: PlaygroundSnapshot, match: Match, selectedUserId: string) {
  const stage = root.querySelector<HTMLButtonElement>("[data-toggle-timeline]");
  const timelineWrap = root.querySelector<HTMLElement>("[data-timeline-wrap]");
  stage?.addEventListener("click", () => {
    const open = stage.classList.toggle("is-open");
    if (timelineWrap) timelineWrap.hidden = !open;
  });

  root.querySelector<HTMLButtonElement>("[data-confirm]")?.addEventListener("click", () => runAction({ action: "confirm", matchId: match.id, userId: selectedUserId }));
  root.querySelector<HTMLButtonElement>("[data-decline]")?.addEventListener("click", () => runAction({ action: "decline", matchId: match.id, userId: selectedUserId }));
  root.querySelector<HTMLSelectElement>("[data-status-select]")?.addEventListener("change", (event) => {
    const status = (event.target as HTMLSelectElement).value;
    runAction({ action: "status", matchId: match.id, userId: selectedUserId, status });
  });
  root.querySelector<HTMLButtonElement>("[data-leave]")?.addEventListener("click", () => openLeaveModal(match.id, selectedUserId));
}

async function runAction(action: object) {
  try {
    await api(action);
    setTimeout(() => renderBridge(), 180);
  } catch {
    // Keep UI stable; server errors are surfaced in the real app elsewhere.
  }
}

function openLeaveModal(matchId: string, userId: string) {
  document.getElementById(LEAVE_MODAL_ID)?.remove();
  const modal = document.createElement("div");
  modal.id = LEAVE_MODAL_ID;
  modal.className = "mzm-match-leave-modal";
  modal.innerHTML = `<div class="mzm-match-leave-panel"><h3>Как да затворим цикъла?</h3><p>Избери дали чатът да остане видим за координация след отказа или всичко да се затвори напълно.</p><div class="mzm-match-leave-list"><button class="mzm-match-primary" data-keep-chat>Отказвам се, но запази чата</button><button class="mzm-match-primary" data-close-chat>Отказвам се и затвори чата</button><button class="mzm-match-secondary" data-cancel>Връщам се назад</button></div></div>`;
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("[data-cancel]")?.addEventListener("click", () => modal.remove());
  modal.querySelector("[data-keep-chat]")?.addEventListener("click", () => { modal.remove(); runAction({ action: "leave", matchId, userId, keepChat: true }); });
  modal.querySelector("[data-close-chat]")?.addEventListener("click", () => { modal.remove(); runAction({ action: "leave", matchId, userId, keepChat: false }); });
  document.body.appendChild(modal);
}

async function renderBridge() {
  injectStyles();
  if (!isMatchesTabVisible()) {
    document.getElementById(ROOT_ID)?.remove();
    return;
  }

  const snapshot = await api().catch(() => null);
  if (!snapshot) return;
  const selected = selectedUser(snapshot);
  if (!selected) return;
  const match = activeMatchForUser(snapshot, selected.id);

  if (!match) {
    mountRoot(`<div class="mzm-match-empty"><h3>Няма match</h3><p>Пусни заявка или използвай симулатора от профила за тестове.</p></div>`);
    return;
  }

  const participants = snapshot.participants.filter((participant) => participant.match_id === match.id).sort((a, b) => a.participant_order - b.participant_order);
  const activeParticipant = participants.find((participant) => participant.user_id === selected.id);
  if (!activeParticipant) return;
  const state = stepState(match, participants);

  if (!isConfirmedLike(activeParticipant) && activeParticipant.confirmation_status !== "declined" && !state.closed) {
    const root = mountRoot(`<div class="mzm-match-card"><h2 class="mzm-match-invite-title">Има потенциален цикъл</h2><p class="mzm-match-muted">Заявката ти вече е скрита. Потвърди интерес, за да се отключи координацията.</p>${cycleHtml(snapshot, participants, selected.id, state.allConfirmed, true)}<div class="mzm-match-actions"><button class="mzm-match-primary" data-confirm>Приемам</button><button class="mzm-match-secondary" data-decline>Отказвам</button></div></div>`);
    if (root) attachHandlers(root, snapshot, match, selected.id);
    return;
  }

  const root = mountRoot(`<div class="mzm-match-card"><button type="button" class="mzm-match-stage" data-toggle-timeline><div><small>Стъпка ${state.currentStep || 1} от ${steps.length}</small><strong>${escapeHtml(state.currentStepInfo.title)}</strong><span>${escapeHtml(state.currentStepInfo.helper)}</span></div><i class="mzm-match-toggle-icon"></i></button><div data-timeline-wrap hidden>${timelineHtml(state.currentStep, state.closed)}</div>${state.closed ? `<div class="mzm-match-empty" style="margin-top:1rem"><h3>Веригата е затворена</h3><p>Чатовете вече не се показват за този процес.</p></div>` : cycleHtml(snapshot, participants, selected.id, state.allConfirmed, false)}${!state.closed ? `<button class="mzm-match-leave-button" data-leave>Отказ от процеса</button>` : ""}</div>`);
  if (root) attachHandlers(root, snapshot, match, selected.id);
}

export default function MatchSimulatorBridge() {
  useEffect(() => {
    let scheduled = false;
    let interval: number | null = null;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        void renderBridge();
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
