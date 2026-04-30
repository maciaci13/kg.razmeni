"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaygroundCycleSize, PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };
type Scenario = 2 | 3 | 4;

type ChatItem = PlaygroundSnapshot["chats"][number];
type ParticipantItem = PlaygroundSnapshot["participants"][number];

const statusOptions = [
  ["not_started", "Още не съм започнал/а"],
  ["checking_procedure", "Проверявам процедурата"],
  ["contacted_kindergarten", "Свързал/а съм се със заведение"],
  ["can_continue", "Мога да продължа"],
  ["cannot_continue", "Не мога да продължа"],
  ["dropped_out", "Отказвам се"]
] as const;

const coordinationSteps = [
  { title: "Потвърждение", helper: "Всички страни приемат потенциалното съвпадение." },
  { title: "Отключена координация", helper: "Чатовете са активни. Уточнете кой какво проверява." },
  { title: "Проверка на процедурата", helper: "Родителите проверяват официалния ред и контактите със заведенията." },
  { title: "Готовност за действие", helper: "Всички маркират дали могат да продължат." },
  { title: "Официални действия", helper: "Следват се само официалните административни стъпки." },
  { title: "Резултат", helper: "Цикълът се отбелязва като приключен или отпаднал." }
];

const nodeStyles = [
  "bg-lime",
  "bg-[#D8D5FF]",
  "bg-[#FFE2A8]",
  "bg-[#FFD2C5]"
];

async function postAction(body: object): Promise<PlaygroundSnapshot> {
  const response = await fetch("/api/playground", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

async function getSnapshot(): Promise<PlaygroundSnapshot> {
  const response = await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

function shortId(id?: string) {
  return id ? id.slice(0, 8) : "—";
}

function statusLabel(status?: string) {
  const found = statusOptions.find(([value]) => value === status);
  return found?.[1] ?? status ?? "—";
}

function statusTone(status?: string) {
  if (status === "can_continue") return "bg-lime text-ink";
  if (status === "cannot_continue" || status === "dropped_out") return "bg-red-100 text-red-900";
  if (status === "checking_procedure" || status === "contacted_kindergarten") return "bg-[#FFE2A8] text-ink";
  return "bg-white/70 text-ink/60";
}

export default function PlaygroundPage() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [scenario, setScenario] = useState<Scenario>(3);
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

  const scenarioUsers = useMemo(() => (snapshot?.users ?? []).slice(0, scenario), [snapshot, scenario]);
  const selectedUser = scenarioUsers.find((user) => user.id === selectedUserId) ?? scenarioUsers[0];
  const selectedProfileId = selectedUser?.id ?? "";

  const kindergartenById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((user) => [user.id, user])), [snapshot]);

  const myRequests = useMemo(() => {
    if (!snapshot || !selectedProfileId) return [];
    return snapshot.requests.filter((request) => request.user_id === selectedProfileId);
  }, [snapshot, selectedProfileId]);

  const myParticipants = useMemo(() => {
    if (!snapshot || !selectedProfileId) return [];
    return snapshot.participants.filter((participant) => participant.user_id === selectedProfileId);
  }, [snapshot, selectedProfileId]);

  const visibleMatches = useMemo(() => {
    if (!snapshot || !selectedProfileId) return [];
    const matchIds = new Set(myParticipants.map((participant) => participant.match_id));
    return snapshot.matches.filter((match) => matchIds.has(match.id));
  }, [snapshot, selectedProfileId, myParticipants]);

  const activeMatch = visibleMatches[0];
  const activeParticipant = activeMatch ? myParticipants.find((participant) => participant.match_id === activeMatch.id) : undefined;

  const participants = useMemo(() => {
    if (!snapshot || !activeMatch) return [];
    return snapshot.participants
      .filter((participant) => participant.match_id === activeMatch.id)
      .sort((a, b) => a.participant_order - b.participant_order);
  }, [snapshot, activeMatch]);

  const matchedFromIds = useMemo(() => new Set(participants.map((participant) => participant.from_kindergarten_id)), [participants]);
  const visibleRequests = activeMatch ? myRequests.filter((request) => !matchedFromIds.has(request.from_kindergarten_id)) : myRequests;

  const availableChats = useMemo(() => {
    if (!snapshot || !activeMatch || !selectedProfileId) return [];
    return snapshot.chats
      .filter((chat) => chat.match_id === activeMatch.id)
      .filter((chat) => chat.chat_type === "group" || chat.direct_user_1_id === selectedProfileId || chat.direct_user_2_id === selectedProfileId)
      .sort((a, b) => (a.chat_type === "group" ? -1 : 1) - (b.chat_type === "group" ? -1 : 1));
  }, [snapshot, activeMatch, selectedProfileId]);

  const selectedChat = availableChats.find((chat) => chat.id === selectedChatId) ?? availableChats[0];

  const allConfirmed = participants.length > 0 && participants.every((participant) => participant.confirmation_status === "interested");
  const anyDeclined = participants.some((participant) => participant.confirmation_status === "declined");
  const anyDropped = participants.some((participant) => participant.coordination_status === "dropped_out");
  const anyCannotContinue = participants.some((participant) => participant.coordination_status === "cannot_continue");
  const allCanContinue = participants.length > 0 && participants.every((participant) => ["can_continue"].includes(participant.coordination_status));
  const anyProcedureStarted = participants.some((participant) => ["checking_procedure", "contacted_kindergarten"].includes(participant.coordination_status));
  const currentStep = !activeMatch
    ? 0
    : anyDeclined || anyDropped
      ? 6
      : !allConfirmed
        ? 1
        : allCanContinue
          ? 5
          : anyCannotContinue
            ? 4
            : anyProcedureStarted
              ? 3
              : 2;
  const currentStepInfo = coordinationSteps[Math.max(currentStep - 1, 0)] ?? coordinationSteps[0];
  const isProcessMode = Boolean(activeMatch && activeParticipant && activeParticipant.confirmation_status !== "pending");
  const canChat = selectedChat?.status === "active";

  async function run(action: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await postAction(action);
      setSnapshot(next);
      const nextScenarioUsers = next.users.slice(0, scenario);
      if (!selectedUserId && nextScenarioUsers[0]) setSelectedUserId(nextScenarioUsers[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function updateMyStatus(status: string) {
    if (!activeMatch || !selectedProfileId) return;
    run({ action: "status", matchId: activeMatch.id, userId: selectedProfileId, status });
  }

  function chatTitle(chat: ChatItem) {
    if (chat.chat_type === "group") return "Групов чат";
    const otherUserId = chat.direct_user_1_id === selectedProfileId ? chat.direct_user_2_id : chat.direct_user_1_id;
    return `Лично: ${userById.get(otherUserId ?? "")?.display_name ?? "родител"}`;
  }

  function createRequest() {
    if (!selectedProfileId || !fromKgId || !wantedKgId) {
      setError("Избери профил, текуща градина и желана градина.");
      return;
    }
    if (fromKgId === wantedKgId) {
      setError("Текущата и желаната градина трябва да са различни.");
      return;
    }
    run({ action: "createRequest", userId: selectedProfileId, fromKindergartenId: fromKgId, wantedKindergartenId: wantedKgId, ageGroup });
  }

  function fillDemoForSelectedUser() {
    if (!snapshot || !selectedProfileId) return;
    const index = scenarioUsers.findIndex((user) => user.id === selectedProfileId);
    const kgs = snapshot.kindergartens;
    if (index < 0 || kgs.length < scenario) return;
    setFromKgId(kgs[index].id);
    setWantedKgId(kgs[(index + 1) % scenario].id);
    setAgeGroup("2019");
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

  function fromToText(participant: ParticipantItem) {
    const fromKg = kindergartenById.get(participant.from_kindergarten_id)?.name ?? "—";
    const wantsKg = kindergartenById.get(participant.wants_kindergarten_id)?.name ?? "—";
    return `${fromKg} → ${wantsKg}`;
  }

  useEffect(() => {
    getSnapshot()
      .then((data) => {
        setSnapshot(data);
        if (data.users[0]) setSelectedUserId(data.users[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

  useEffect(() => {
    if (scenarioUsers.length > 0 && !scenarioUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(scenarioUsers[0].id);
    }
  }, [scenarioUsers, selectedUserId]);

  useEffect(() => {
    if (availableChats.length > 0 && !availableChats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(availableChats[0].id);
    }
  }, [availableChats, selectedChatId]);

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-ink p-5 text-white shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Playground</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Прогресивен flow тест</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">Заявка → match покана → процес → чатове и статуси.</p>
        </header>

        {error ? <div className="rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">1. Сценарий</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[2, 3, 4].map((size) => (
              <button key={size} disabled={loading} onClick={() => setupScenario(size as Scenario)} className={`rounded-2xl px-3 py-4 text-sm font-black ${scenario === size ? "bg-ink text-white" : "bg-beige"}`}>
                {size} страни
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={loading} onClick={() => run({ action: "setupBase" })} className="rounded-2xl bg-beige px-4 py-4 text-left text-sm font-black">Навий празни данни</button>
            <button disabled={loading} onClick={() => run({ action: "seed", cycleSize: scenario as PlaygroundCycleSize })} className="rounded-2xl bg-lime px-4 py-4 text-left text-sm font-black">Авто match</button>
            <button disabled={loading} onClick={() => run({ action: "reset" })} className="col-span-2 rounded-2xl bg-orange px-4 py-4 text-left text-sm font-black text-white">Reset playground</button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">2. Профил</p>
          <select value={selectedProfileId} onChange={(event) => setSelectedUserId(event.target.value)} className="mt-3 w-full rounded-2xl bg-paper px-4 py-4 text-sm font-black outline-none">
            {scenarioUsers.map((user) => <option key={user.id} value={user.id}>{user.display_name}</option>)}
          </select>
          <p className="mt-3 text-xs text-ink/45">ID: {shortId(selectedProfileId)} · показани са първите {scenario} playground родителя.</p>
        </section>

        {!activeMatch ? (
          <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
            <h2 className="text-xl font-black tracking-[-0.04em]">Пусни заявка за размяна</h2>
            <p className="mt-2 text-sm text-ink/55">Когато се появи цикъл, тази форма се прибира и се показва match поканата.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Имаме място в</label>
              <select value={fromKgId} onChange={(event) => setFromKgId(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none">
                <option value="">Избери градина</option>
                {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
              </select>
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Желана градина</label>
              <select value={wantedKgId} onChange={(event) => setWantedKgId(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none">
                <option value="">Избери желана градина</option>
                {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
              </select>
              <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Набор / група</label>
              <input value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <button disabled={loading || !selectedProfileId} onClick={fillDemoForSelectedUser} className="rounded-full bg-beige px-5 py-4 text-xs font-black">Демо за този профил</button>
                <button disabled={loading || !selectedProfileId} onClick={createRequest} className="rounded-full bg-ink px-5 py-4 text-xs font-black text-white disabled:opacity-40">Добави заявка</button>
              </div>
            </div>
          </section>
        ) : null}

        {!activeMatch && visibleRequests.length > 0 ? (
          <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
            <h2 className="text-xl font-black tracking-[-0.04em]">Моите активни заявки</h2>
            <div className="mt-4 space-y-3">
              {visibleRequests.map((request) => {
                const fromKg = kindergartenById.get(request.from_kindergarten_id);
                const wanted = snapshot?.wantedKindergartens.filter((item) => item.request_id === request.id) ?? [];
                return (
                  <div key={request.id} className={`rounded-3xl p-4 ${request.is_active ? "bg-paper" : "bg-red-50"}`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Текущо място</p>
                    <p className="mt-1 font-black">{fromKg?.name}</p>
                    <p className="mt-1 text-xs text-ink/55">Набор {request.child_group_year_or_age_group} · {request.is_active ? "Активна" : "Неактивна"}</p>
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Желани</p>
                      {wanted.map((item) => <p key={item.id} className="mt-1 text-sm font-semibold">→ {kindergartenById.get(item.wanted_kindergarten_id)?.name}</p>)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button disabled={loading || !request.is_active} onClick={() => run({ action: "deactivateRequest", requestId: request.id })} className="rounded-full bg-beige px-3 py-3 text-xs font-bold disabled:opacity-30">Деактивирай</button>
                      <button disabled={loading || request.is_locked} onClick={() => run({ action: "deleteRequest", requestId: request.id })} className="rounded-full bg-ink px-3 py-3 text-xs font-bold text-white disabled:opacity-30">Изтрий</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeMatch && activeParticipant?.confirmation_status === "pending" ? (
          <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Match покана</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">Има потенциален цикъл</h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">Заявката ти вече е скрита от активните заявки. Потвърди интерес, за да се отключи координацията.</p>
            <MiniCycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button disabled={loading} onClick={() => run({ action: "confirm", matchId: activeMatch.id, userId: selectedProfileId })} className="rounded-full bg-ink px-3 py-4 text-sm font-black text-white">Приемам</button>
              <button disabled={loading} onClick={() => run({ action: "decline", matchId: activeMatch.id, userId: selectedProfileId })} className="rounded-full bg-beige px-3 py-4 text-sm font-black">Отказвам</button>
            </div>
          </section>
        ) : null}

        {activeMatch && isProcessMode ? (
          <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Статус в прогрес</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{activeMatch.status === "at_risk" ? "Цикъл с отказ" : "Координация"}</h2>
              </div>
              <span className={`rounded-full px-3 py-2 text-[10px] font-black ${allConfirmed ? "bg-lime" : "bg-beige"}`}>{activeMatch.status}</span>
            </div>

            <button type="button" onClick={() => setShowTimeline((value) => !value)} className="mt-5 flex w-full items-center justify-between rounded-[1.6rem] bg-lime px-5 py-4 text-left shadow-sm">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">Стъпка {currentStep || 1} от {coordinationSteps.length}</p>
                <p className="mt-2 text-lg font-black leading-tight">{currentStepInfo.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-ink/60">{currentStepInfo.helper}</p>
              </div>
              <span className={`ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xl font-black transition-transform ${showTimeline ? "rotate-180" : ""}`}>⌄</span>
            </button>

            {showTimeline ? <TimelinePath currentStep={currentStep} /> : null}

            <div className="mt-5">
              <MiniCycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} />
            </div>

            <div className="mt-5 space-y-3">
              {participants.map((participant, index) => {
                const isMe = participant.user_id === selectedProfileId;
                const user = userById.get(participant.user_id);
                return (
                  <div key={participant.id} className={`rounded-[1.6rem] p-4 ${isMe ? "bg-ink text-white" : "bg-paper"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isMe ? "text-white/45" : "text-ink/40"}`}>Ред {index + 1}</p>
                        <p className="mt-1 font-black">{isMe ? "Ти" : user?.display_name}</p>
                        <p className={`mt-1 text-xs leading-5 ${isMe ? "text-white/60" : "text-ink/55"}`}>{fromToText(participant)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-2 text-[10px] font-black ${statusTone(participant.coordination_status)}`}>{statusLabel(participant.coordination_status)}</span>
                    </div>
                    <div className="mt-3">
                      {isMe ? (
                        <select value={participant.coordination_status} disabled={loading || !allConfirmed} onChange={(event) => updateMyStatus(event.target.value)} className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black text-ink outline-none disabled:opacity-50">
                          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      ) : (
                        <p className={`rounded-2xl px-4 py-3 text-xs font-bold ${isMe ? "bg-white/10 text-white/60" : "bg-milk text-ink/55"}`}>Само този родител може да промени своя статус.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-paper p-4">
              <button onClick={() => setShowLeaveOptions((value) => !value)} className="w-full rounded-full bg-beige px-4 py-3 text-sm font-black">Отказ от процеса</button>
              {showLeaveOptions ? (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button disabled={loading} onClick={() => run({ action: "leave", matchId: activeMatch.id, userId: selectedProfileId, keepChat: true })} className="rounded-full bg-ink px-4 py-3 text-xs font-black text-white">Отказвам се, но запази чата</button>
                  <button disabled={loading} onClick={() => run({ action: "leave", matchId: activeMatch.id, userId: selectedProfileId, keepChat: false })} className="rounded-full bg-orange px-4 py-3 text-xs font-black text-white">Отказвам се и затвори чата</button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeMatch ? (
          <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Чатове</p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">{selectedChat ? chatTitle(selectedChat) : "Няма чат"}</h2>
              </div>
              {selectedChat ? <span className="rounded-full bg-beige px-3 py-2 text-[10px] font-black">{selectedChat.status}</span> : null}
            </div>
            {availableChats.length > 0 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {availableChats.map((chat) => (
                  <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`shrink-0 rounded-full px-4 py-3 text-xs font-black ${selectedChat?.id === chat.id ? "bg-ink text-white" : "bg-paper"}`}>
                    {chatTitle(chat)}
                  </button>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-ink/50">Чатовете се появяват след потвърждение от всички.</p>}
            <div className="mt-4 space-y-2">
              {snapshot?.messages.filter((m) => !selectedChat || m.chat_id === selectedChat.id).map((message) => {
                const user = userById.get(message.sender_user_id);
                const isMine = message.sender_user_id === selectedProfileId;
                return (
                  <div key={message.id} className={`rounded-3xl p-3 text-sm ${isMine ? "ml-8 bg-ink text-white" : "mr-8 bg-paper"}`}>
                    <p className={`text-xs font-bold ${isMine ? "text-white/50" : "text-ink/45"}`}>{isMine ? "Ти" : user?.display_name}</p>
                    <p className="mt-1">{message.body}</p>
                    {message.moderation_flag ? <p className="mt-2 text-xs font-black text-orange">Flagged: payment-related terms</p> : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2">
              <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} className="min-h-24 w-full rounded-3xl border-0 bg-paper p-4 text-sm outline-none" />
              <button disabled={loading || !selectedChat || !canChat || !selectedProfileId} onClick={() => selectedChat && run({ action: "message", chatId: selectedChat.id, userId: selectedProfileId, body: messageBody })} className="w-full rounded-full bg-ink px-4 py-4 text-sm font-bold text-white disabled:opacity-30">Изпрати като {selectedUser?.display_name}</button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function MiniCycleMap({ participants, selectedProfileId, userById, fromToText }: {
  participants: ParticipantItem[];
  selectedProfileId: string;
  userById: Map<string, PlaygroundSnapshot["users"][number]>;
  fromToText: (participant: ParticipantItem) => string;
}) {
  if (participants.length === 0) return null;

  return (
    <div className="mt-5 rounded-[1.75rem] bg-paper p-4">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-ink/40">Верига на размяната</p>
      <div className="space-y-3">
        {participants.map((participant, index) => {
          const isMe = participant.user_id === selectedProfileId;
          const user = userById.get(participant.user_id);
          return (
            <div key={participant.id} className="relative">
              {index < participants.length - 1 ? <div className="absolute left-6 top-14 h-6 border-l-2 border-dotted border-ink/30" /> : null}
              <div className={`flex items-center gap-3 rounded-[1.4rem] p-3 ${isMe ? "bg-ink text-white" : nodeStyles[index % nodeStyles.length]}`}>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-ink shadow-sm">{isMe ? "Ти" : index + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-black leading-tight">{isMe ? "Ти" : user?.display_name}</p>
                  <p className={`mt-1 text-[11px] font-semibold leading-4 ${isMe ? "text-white/65" : "text-ink/60"}`}>{fromToText(participant)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isMe ? "bg-white text-ink" : "bg-white/70 text-ink"}`}>{participant.confirmation_status === "interested" ? "✓" : "…"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelinePath({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-5 rounded-[1.75rem] bg-paper px-4 py-5">
      {coordinationSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <div key={step.title} className="relative grid grid-cols-[2.2rem_1fr] gap-3 pb-7 last:pb-0">
            {index < coordinationSteps.length - 1 ? <div className={`absolute left-[1.06rem] top-8 h-[calc(100%-2rem)] w-0.5 ${isDone ? "bg-lime" : "bg-ink/15"}`} /> : null}
            <div className={`relative z-10 grid h-9 w-9 place-items-center rounded-full text-sm font-black ${isDone ? "bg-lime text-ink" : isCurrent ? "bg-ink text-white" : "bg-ink/10 text-ink/40"}`}>
              {isDone ? "✓" : stepNumber}
            </div>
            <div className="pt-1">
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isCurrent ? "text-ink" : "text-ink/45"}`}>Стъпка {stepNumber}</p>
              <p className={`mt-1 text-sm font-black ${isCurrent ? "text-ink" : "text-ink/70"}`}>{step.title}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-ink/50">{step.helper}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
