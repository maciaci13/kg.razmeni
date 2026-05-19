"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PlaygroundCycleSize, PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };
type Scenario = 2 | 3 | 4;
type Participant = PlaygroundSnapshot["participants"][number];
type Chat = PlaygroundSnapshot["chats"][number];

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

const colors = ["bg-lime", "bg-[#D8D5FF]", "bg-[#FFE2A8]", "bg-[#FFD2C5]"];

async function api(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

function statusLabel(status?: string) {
  return statusOptions.find(([value]) => value === status)?.[1] ?? status ?? "—";
}

function participantStatus(participant: Participant, allConfirmed: boolean) {
  if (participant.confirmation_status === "declined") return "Отказана размяна";
  if (participant.confirmation_status === "pending") return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabel(participant.coordination_status);
}

function SelectField({ value, onChange, children, className = "", disabled = false }: { value: string; onChange: (value: string) => void; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-2xl border-0 bg-paper py-4 pl-4 pr-14 text-sm font-black text-ink outline-none disabled:opacity-50">
        {children}
      </select>
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xl font-black leading-none text-ink/55">∨</span>
    </div>
  );
}

function getScenarioUsers(snapshot: PlaygroundSnapshot | null, scenario: Scenario) {
  return (snapshot?.users ?? []).slice(0, scenario);
}

function matchBelongsToScenario(matchId: string, allParticipants: Participant[], scenarioUserIds: Set<string>, scenario: Scenario) {
  const matchParticipants = allParticipants.filter((participant) => participant.match_id === matchId);
  if (matchParticipants.length !== scenario) return false;
  return matchParticipants.every((participant) => scenarioUserIds.has(participant.user_id));
}

export default function PlaygroundPage() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [scenario, setScenario] = useState<Scenario>(2);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageBody, setMessageBody] = useState("Здравейте, виждам, че имаме потенциално съвпадение.");
  const [fromKgId, setFromKgId] = useState("");
  const [wantedKgId, setWantedKgId] = useState("");
  const [ageGroup, setAgeGroup] = useState("2019");

  const scenarioUsers = useMemo(() => getScenarioUsers(snapshot, scenario), [snapshot, scenario]);
  const scenarioUserIds = useMemo(() => new Set(scenarioUsers.map((user) => user.id)), [scenarioUsers]);
  const selectedUser = scenarioUsers.find((user) => user.id === selectedUserId) ?? scenarioUsers[0];
  const selectedProfileId = selectedUser?.id ?? "";
  const kgById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((user) => [user.id, user])), [snapshot]);

  const scenarioMatches = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.matches.filter((match) => matchBelongsToScenario(match.id, snapshot.participants, scenarioUserIds, scenario));
  }, [snapshot, scenarioUserIds, scenario]);

  const myParticipants = useMemo(() => {
    if (!snapshot || !selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return [];
    const scenarioMatchIds = new Set(scenarioMatches.map((match) => match.id));
    return snapshot.participants.filter((participant) => participant.user_id === selectedProfileId && scenarioMatchIds.has(participant.match_id));
  }, [snapshot, selectedProfileId, scenarioUserIds, scenarioMatches]);

  const activeMatch = useMemo(() => {
    const myMatchIds = new Set(myParticipants.map((participant) => participant.match_id));
    return scenarioMatches.find((match) => myMatchIds.has(match.id));
  }, [scenarioMatches, myParticipants]);

  const activeParticipant = activeMatch ? myParticipants.find((participant) => participant.match_id === activeMatch.id) : undefined;
  const participants = useMemo(() => {
    if (!snapshot || !activeMatch) return [];
    return snapshot.participants
      .filter((participant) => participant.match_id === activeMatch.id && scenarioUserIds.has(participant.user_id))
      .sort((a, b) => a.participant_order - b.participant_order);
  }, [snapshot, activeMatch, scenarioUserIds]);

  const allConfirmed = participants.length === scenario && participants.every((participant) => participant.confirmation_status === "interested");
  const anyDeclined = participants.some((participant) => participant.confirmation_status === "declined");
  const anyDropped = participants.some((participant) => participant.coordination_status === "dropped_out");
  const anyCannot = participants.some((participant) => participant.coordination_status === "cannot_continue");
  const allCan = participants.length === scenario && participants.every((participant) => participant.coordination_status === "can_continue");
  const anyStarted = participants.some((participant) => ["checking_procedure", "contacted_kindergarten"].includes(participant.coordination_status));
  const matchIsClosed = Boolean(activeMatch && (anyDeclined || anyDropped || ["at_risk", "cancelled"].includes(activeMatch.status)));
  const currentStep = !activeMatch ? 0 : matchIsClosed ? 6 : !allConfirmed ? 1 : allCan ? 5 : anyCannot ? 4 : anyStarted ? 3 : 2;
  const currentStepInfo = matchIsClosed ? rejectedStep : (steps[Math.max(currentStep - 1, 0)] ?? steps[0]);
  const isProcessMode = Boolean(activeMatch && activeParticipant && activeParticipant.confirmation_status !== "pending");

  const availableChats = useMemo(() => {
    if (!snapshot || !activeMatch || !selectedProfileId || !scenarioUserIds.has(selectedProfileId) || !allConfirmed || matchIsClosed) return [];
    const hideGroupChat = participants.length === 2;
    const participantIds = new Set(participants.map((participant) => participant.user_id));

    return snapshot.chats
      .filter((chat) => chat.match_id === activeMatch.id && chat.status === "active")
      .filter((chat) => !(hideGroupChat && chat.chat_type === "group"))
      .filter((chat) => {
        if (chat.chat_type === "group") return true;
        if (!chat.direct_user_1_id || !chat.direct_user_2_id) return false;
        const directUsersAreInsideScenario = participantIds.has(chat.direct_user_1_id) && participantIds.has(chat.direct_user_2_id);
        const selectedUserIsInChat = chat.direct_user_1_id === selectedProfileId || chat.direct_user_2_id === selectedProfileId;
        return directUsersAreInsideScenario && selectedUserIsInChat;
      })
      .sort((a, b) => (a.chat_type === "group" ? -1 : 1) - (b.chat_type === "group" ? -1 : 1));
  }, [snapshot, activeMatch, selectedProfileId, scenarioUserIds, allConfirmed, matchIsClosed, participants]);

  const selectedChat = availableChats.find((chat) => chat.id === selectedChatId) ?? availableChats[0];

  const myRequests = useMemo(() => {
    if (!snapshot || !selectedProfileId || !scenarioUserIds.has(selectedProfileId) || activeMatch) return [];
    return snapshot.requests.filter((request) => request.user_id === selectedProfileId);
  }, [snapshot, selectedProfileId, scenarioUserIds, activeMatch]);

  async function run(action: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await api(action);
      setSnapshot(next);
      const nextScenarioUsers = getScenarioUsers(next, scenario);
      if (!nextScenarioUsers.some((user) => user.id === selectedUserId)) {
        setSelectedUserId(nextScenarioUsers[0]?.id ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function leaveProcess(keepChat: boolean) {
    if (!activeMatch || !selectedProfileId) return;
    setShowLeaveOptions(false);
    await run({ action: "leave", matchId: activeMatch.id, userId: selectedProfileId, keepChat });
  }

  function updateMyStatus(status: string) {
    if (!activeMatch || !selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return;
    run({ action: "status", matchId: activeMatch.id, userId: selectedProfileId, status });
  }

  function fromToText(participant: Participant) {
    return `${kgById.get(participant.from_kindergarten_id)?.name ?? "—"} → ${kgById.get(participant.wants_kindergarten_id)?.name ?? "—"}`;
  }

  function requestToText(requestId: string) {
    const wanted = (snapshot?.wantedKindergartens ?? []).find((item) => item.request_id === requestId);
    return wanted ? kgById.get(wanted.wanted_kindergarten_id)?.name ?? "—" : "—";
  }

  function chatTitle(chat: Chat) {
    if (chat.chat_type === "group") return "Групов чат";
    const otherId = chat.direct_user_1_id === selectedProfileId ? chat.direct_user_2_id : chat.direct_user_1_id;
    return `Лично: ${userById.get(otherId ?? "")?.display_name ?? "родител"}`;
  }

  function fillDemo() {
    if (!snapshot || !selectedProfileId) return;
    const index = scenarioUsers.findIndex((user) => user.id === selectedProfileId);
    const kindergartens = snapshot.kindergartens;
    if (index < 0 || kindergartens.length < scenario) return;
    setFromKgId(kindergartens[index].id);
    setWantedKgId(kindergartens[(index + 1) % scenario].id);
    setAgeGroup("2019");
  }

  function createRequest() {
    if (!selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return setError("Избери профил от текущия сценарий.");
    if (!fromKgId || !wantedKgId) return setError("Избери текуща градина и желана градина.");
    if (fromKgId === wantedKgId) return setError("Текущата и желаната градина трябва да са различни.");
    run({ action: "createRequest", userId: selectedProfileId, fromKindergartenId: fromKgId, wantedKindergartenId: wantedKgId, ageGroup });
  }

  async function setupScenario(nextScenario: Scenario) {
    setScenario(nextScenario);
    setSelectedUserId("");
    setSelectedChatId("");
    setFromKgId("");
    setWantedKgId("");
    setShowTimeline(false);
    setShowLeaveOptions(false);
    await run({ action: "setupBase" });
  }

  function confirmMatch() {
    if (!activeMatch || !selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return;
    run({ action: "confirm", matchId: activeMatch.id, userId: selectedProfileId });
  }

  function declineMatch() {
    if (!activeMatch || !selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return;
    run({ action: "decline", matchId: activeMatch.id, userId: selectedProfileId });
  }

  function sendMessage() {
    if (!selectedChat || !selectedProfileId || !scenarioUserIds.has(selectedProfileId)) return;
    run({ action: "message", chatId: selectedChat.id, userId: selectedProfileId, body: messageBody });
  }

  useEffect(() => {
    api()
      .then((data) => {
        setSnapshot(data);
        const initialUsers = getScenarioUsers(data, scenario);
        setSelectedUserId(initialUsers[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

  useEffect(() => {
    if (scenarioUsers.length && !scenarioUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(scenarioUsers[0].id);
    }
  }, [scenarioUsers, selectedUserId]);

  useEffect(() => {
    if (availableChats.length && !availableChats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(availableChats[0].id);
    }
    if (!availableChats.length && selectedChatId) setSelectedChatId("");
  }, [availableChats, selectedChatId]);

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-3 text-sm font-black shadow-soft backdrop-blur">← Към приложението</Link>
        <header className="rounded-[2rem] bg-ink p-5 text-white shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Playground</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Изолиран flow тест</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">Всеки сценарий вижда само своите 2, 3 или 4 родители. Без кръстосани чатове между стари симулации.</p>
        </header>

        {error ? <div className="rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">1. Сценарий</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([2, 3, 4] as Scenario[]).map((size) => <button key={size} disabled={loading} onClick={() => setupScenario(size)} className={`rounded-2xl px-3 py-4 text-sm font-black ${scenario === size ? "bg-ink text-white" : "bg-beige"}`}>{size} страни</button>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={loading} onClick={() => run({ action: "setupBase" })} className="rounded-2xl bg-beige px-4 py-4 text-left text-sm font-black">Навий база</button>
            <button disabled={loading} onClick={() => run({ action: "seed", cycleSize: scenario as PlaygroundCycleSize })} className="rounded-2xl bg-lime px-4 py-4 text-left text-sm font-black">Авто match</button>
            <button disabled={loading} onClick={() => run({ action: "reset" })} className="col-span-2 rounded-2xl bg-orange px-4 py-4 text-left text-sm font-black text-white">Reset playground</button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">2. Родител в текущия сценарий</p>
          <SelectField value={selectedProfileId} onChange={setSelectedUserId} className="mt-3">
            {scenarioUsers.map((user, index) => <option key={user.id} value={user.id}>{String.fromCharCode(65 + index)} · {user.display_name}</option>)}
          </SelectField>
          <p className="mt-3 text-xs font-semibold leading-5 text-ink/45">Показват се само първите {scenario} тестови родители. Останалите не могат да участват в този сценарий.</p>
        </section>

        {!activeMatch ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Пусни заявка за размяна</h2>
          <p className="mt-2 text-sm text-ink/55">Когато се появи цикъл за текущия сценарий, тази форма се прибира.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Имаме място в</label>
            <SelectField value={fromKgId} onChange={setFromKgId}>
              <option value="">Избери градина</option>
              {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
            </SelectField>
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Желана градина</label>
            <SelectField value={wantedKgId} onChange={setWantedKgId}>
              <option value="">Избери желана градина</option>
              {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
            </SelectField>
            <input value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <button disabled={loading || !selectedProfileId} onClick={fillDemo} className="rounded-full bg-beige px-5 py-4 text-xs font-black">Демо</button>
              <button disabled={loading || !selectedProfileId} onClick={createRequest} className="rounded-full bg-ink px-5 py-4 text-xs font-black text-white disabled:opacity-40">Добави заявка</button>
            </div>
          </div>
        </section> : null}

        {!activeMatch && myRequests.length ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Моите заявки</h2>
          <div className="mt-4 space-y-3">{myRequests.map((request) => <div key={request.id} className="rounded-3xl bg-paper p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/40">Желание за размяна</p>
            <p className="mt-2 text-sm font-black leading-5">{kgById.get(request.from_kindergarten_id)?.name ?? "—"} <span className="px-1 text-ink/35">→</span> {requestToText(request.id)}</p>
            <p className="mt-2 text-xs text-ink/55">Набор {request.child_group_year_or_age_group} · {request.is_active ? "Активна" : "Неактивна"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={loading || !request.is_active} onClick={() => run({ action: "deactivateRequest", requestId: request.id })} className="rounded-full bg-beige px-3 py-3 text-xs font-bold disabled:opacity-30">Деактивирай</button>
              <button disabled={loading || request.is_locked} onClick={() => run({ action: "deleteRequest", requestId: request.id })} className="rounded-full bg-ink px-3 py-3 text-xs font-bold text-white disabled:opacity-30">Изтрий</button>
            </div>
          </div>)}</div>
        </section> : null}

        {activeMatch && activeParticipant?.confirmation_status === "pending" && !matchIsClosed ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Match покана</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">Има потенциален цикъл</h2>
          <p className="mt-3 text-sm leading-6 text-ink/60">Заявката ти вече е скрита. Потвърди интерес, за да се отключи координацията.</p>
          <CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} readOnly />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button disabled={loading} onClick={confirmMatch} className="rounded-full bg-ink px-3 py-4 text-sm font-black text-white">Приемам</button>
            <button disabled={loading} onClick={declineMatch} className="rounded-full bg-beige px-3 py-4 text-sm font-black">Отказвам</button>
          </div>
        </section> : null}

        {activeMatch && isProcessMode ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Статус в прогрес</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{matchIsClosed ? "Отказано" : "Координация"}</h2></div><span className={`rounded-full px-3 py-2 text-[10px] font-black ${matchIsClosed ? "bg-red-100 text-red-900" : allConfirmed ? "bg-lime" : "bg-beige"}`}>{matchIsClosed ? "отказано" : activeMatch.status}</span></div>
          <button type="button" onClick={() => setShowTimeline((value) => !value)} className={`mt-5 flex w-full items-center justify-between gap-4 rounded-[1.6rem] px-5 py-4 text-left shadow-sm ${matchIsClosed ? "bg-red-100" : "bg-lime"}`}><div><p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">Стъпка {currentStep || 1} от {steps.length}</p><p className="mt-2 text-lg font-black leading-tight">{currentStepInfo.title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/60">{currentStepInfo.helper}</p></div><span className={`playground-toggle-icon ${showTimeline ? "is-open" : ""}`} /></button>
          {showTimeline ? <Timeline currentStep={currentStep} rejected={matchIsClosed} /> : null}
          {!matchIsClosed ? <CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} loading={loading} updateMyStatus={updateMyStatus} /> : <div className="mt-5 rounded-[1.75rem] bg-paper p-5 text-sm font-bold leading-6 text-ink/60">Веригата е затворена след отказ. Чатовете вече не се показват в playground-а.</div>}
          {!matchIsClosed ? <button onClick={() => setShowLeaveOptions(true)} className="mt-5 w-full rounded-full bg-beige px-4 py-4 text-sm font-black">Отказ от процеса</button> : null}
        </section> : null}

        {activeMatch && allConfirmed && !matchIsClosed ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Чатове</p><h2 className="mt-2 text-xl font-black tracking-[-0.04em]">{selectedChat ? chatTitle(selectedChat) : "Няма чат"}</h2></div>{selectedChat ? <span className="rounded-full bg-beige px-3 py-2 text-[10px] font-black">{selectedChat.status}</span> : null}</div>
          {availableChats.length ? <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{availableChats.map((chat) => <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`shrink-0 rounded-full px-4 py-3 text-xs font-black ${selectedChat?.id === chat.id ? "bg-ink text-white" : "bg-paper"}`}>{chatTitle(chat)}</button>)}</div> : <p className="mt-4 text-sm text-ink/50">Няма активен чат за текущия родител в този сценарий.</p>}
          <div className="mt-4 space-y-2">{snapshot?.messages.filter((message) => selectedChat && message.chat_id === selectedChat.id).map((message) => { const mine = message.sender_user_id === selectedProfileId; return <div key={message.id} className={`rounded-3xl p-3 text-sm ${mine ? "ml-8 bg-ink text-white" : "mr-8 bg-paper"}`}><p className={`text-xs font-bold ${mine ? "text-white/50" : "text-ink/45"}`}>{mine ? "Ти" : userById.get(message.sender_user_id)?.display_name}</p><p className="mt-1">{message.body}</p>{message.moderation_flag ? <p className="mt-2 text-xs font-black text-orange">Flagged</p> : null}</div>; })}</div>
          <div className="mt-4 space-y-2"><textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} className="min-h-24 w-full rounded-3xl border-0 bg-paper p-4 text-sm outline-none" /><button disabled={loading || !selectedChat || selectedChat.status !== "active"} onClick={sendMessage} className="w-full rounded-full bg-ink px-4 py-4 text-sm font-bold text-white disabled:opacity-30">Изпрати като {selectedUser?.display_name}</button></div>
        </section> : null}
      </div>

      {showLeaveOptions && activeMatch && !matchIsClosed ? <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-8" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Отказ от процеса</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Как да затворим цикъла?</h2></div><button onClick={() => setShowLeaveOptions(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-xl font-black">×</button></div><p className="mt-3 text-sm font-medium leading-6 text-ink/55">Избери дали чатът да остане видим за координация след отказа или всичко да се затвори напълно.</p><div className="mt-5 grid gap-2"><button disabled={loading} onClick={() => leaveProcess(true)} className="rounded-full bg-ink px-4 py-4 text-sm font-black text-white disabled:opacity-40">Отказвам се, но запази чата</button><button disabled={loading} onClick={() => leaveProcess(false)} className="rounded-full bg-orange px-4 py-4 text-sm font-black text-white disabled:opacity-40">Отказвам се и затвори чата</button><button disabled={loading} onClick={() => setShowLeaveOptions(false)} className="rounded-full bg-beige px-4 py-4 text-sm font-black disabled:opacity-40">Връщам се назад</button></div></div></div> : null}
    </main>
  );
}

function CycleMap({ participants, selectedProfileId, userById, fromToText, allConfirmed, loading = false, updateMyStatus, readOnly = false }: { participants: Participant[]; selectedProfileId: string; userById: Map<string, PlaygroundSnapshot["users"][number]>; fromToText: (participant: Participant) => string; allConfirmed: boolean; loading?: boolean; updateMyStatus?: (status: string) => void; readOnly?: boolean }) {
  if (!participants.length) return null;
  return <div className="mt-5 rounded-[1.75rem] bg-paper p-4"><p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-ink/40">Верига и статуси</p><div className="space-y-3">{participants.map((participant, index) => { const me = participant.user_id === selectedProfileId; const user = userById.get(participant.user_id); return <div key={participant.id} className="relative">{index < participants.length - 1 ? <div className="absolute left-8 top-[4.5rem] h-5 border-l border-dashed border-ink/25" /> : null}<div className={`relative z-10 rounded-[1.4rem] p-3 ${me ? "bg-ink text-white" : colors[index % colors.length]}`}><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-ink shadow-sm">{me ? "Ти" : index + 1}</div><div className="min-w-0 flex-1"><p className="font-black leading-tight">{me ? "Ти" : user?.display_name}</p><p className={`mt-1 text-[11px] font-semibold leading-4 ${me ? "text-white/65" : "text-ink/60"}`}>{fromToText(participant)}</p></div></div><div className="mt-3">{me && allConfirmed && !readOnly ? <SelectField value={participant.coordination_status} disabled={loading} onChange={(value) => updateMyStatus?.(value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField> : <div className={`px-1 py-1 text-xs font-black ${me ? "text-white/65" : "text-ink/55"}`}>{participantStatus(participant, allConfirmed)}</div>}</div></div></div>; })}</div></div>;
}

function Timeline({ currentStep, rejected = false }: { currentStep: number; rejected?: boolean }) {
  return <div className="mt-5 rounded-[1.75rem] bg-paper px-4 py-5">{steps.map((step, index) => { const number = index + 1; const done = number < currentStep; const current = number === currentStep; const title = rejected && number === 6 ? "Отказано" : step.title; const helper = rejected && number === 6 ? rejectedStep.helper : step.helper; return <div key={step.title} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0">{index < steps.length - 1 ? <div className={`absolute left-[0.94rem] top-8 h-[calc(100%-1.7rem)] border-l-2 border-dashed ${done ? rejected ? "border-red-300" : "border-lime" : "border-ink/15"}`} /> : null}<div className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-black ${done ? rejected ? "bg-red-100 text-red-900" : "bg-lime text-ink" : current ? rejected ? "bg-red-100 text-red-900" : "bg-ink text-white" : "bg-white text-ink/35 ring-1 ring-ink/10"}`}>{done ? "✓" : rejected && current ? "!" : number}</div><div className="pt-0.5"><p className={`text-[10px] font-black uppercase tracking-[0.18em] ${current ? "text-ink" : "text-ink/40"}`}>Стъпка {number}</p><p className={`mt-1 text-sm font-black ${current ? "text-ink" : "text-ink/65"}`}>{title}</p><p className="mt-1 text-xs font-medium leading-5 text-ink/45">{helper}</p></div></div>; })}</div>;
}