"use client";

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

const colors = ["bg-lime", "bg-[#D8D5FF]", "bg-[#FFE2A8]", "bg-[#FFD2C5]"];

async function api(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

function shortId(id?: string) { return id ? id.slice(0, 8) : "—"; }
function statusLabel(status?: string) { return statusOptions.find(([v]) => v === status)?.[1] ?? status ?? "—"; }
function participantStatus(p: Participant, allConfirmed: boolean) {
  if (p.confirmation_status === "declined") return "Отказана размяна";
  if (p.confirmation_status === "pending") return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabel(p.coordination_status);
}
function tone(p: Participant, allConfirmed: boolean) {
  if (p.confirmation_status === "declined") return "bg-red-100 text-red-900";
  if (p.confirmation_status === "pending") return "bg-black/5 text-ink/60";
  if (!allConfirmed || p.coordination_status === "can_continue") return "bg-lime/70 text-ink";
  if (["cannot_continue", "dropped_out"].includes(p.coordination_status)) return "bg-red-100 text-red-900";
  if (["checking_procedure", "contacted_kindergarten"].includes(p.coordination_status)) return "bg-[#FFE2A8] text-ink";
  return "bg-black/5 text-ink/60";
}

function SelectField({ value, onChange, children, className = "", disabled = false }: { value: string; onChange: (value: string) => void; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border-0 bg-paper py-4 pl-4 pr-14 text-sm font-black text-ink outline-none disabled:opacity-50"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xl font-black leading-none text-ink/55">∨</span>
    </div>
  );
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
  const selectedUser = scenarioUsers.find((u) => u.id === selectedUserId) ?? scenarioUsers[0];
  const selectedProfileId = selectedUser?.id ?? "";
  const kgById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((u) => [u.id, u])), [snapshot]);
  const myParticipants = useMemo(() => (snapshot?.participants ?? []).filter((p) => p.user_id === selectedProfileId), [snapshot, selectedProfileId]);
  const activeMatch = useMemo(() => {
    const ids = new Set(myParticipants.map((p) => p.match_id));
    return (snapshot?.matches ?? []).find((m) => ids.has(m.id));
  }, [snapshot, myParticipants]);
  const activeParticipant = activeMatch ? myParticipants.find((p) => p.match_id === activeMatch.id) : undefined;
  const participants = useMemo(() => (snapshot?.participants ?? []).filter((p) => p.match_id === activeMatch?.id).sort((a, b) => a.participant_order - b.participant_order), [snapshot, activeMatch]);
  const allConfirmed = participants.length > 0 && participants.every((p) => p.confirmation_status === "interested");
  const anyDeclined = participants.some((p) => p.confirmation_status === "declined");
  const anyDropped = participants.some((p) => p.coordination_status === "dropped_out");
  const anyCannot = participants.some((p) => p.coordination_status === "cannot_continue");
  const allCan = participants.length > 0 && participants.every((p) => p.coordination_status === "can_continue");
  const anyStarted = participants.some((p) => ["checking_procedure", "contacted_kindergarten"].includes(p.coordination_status));
  const currentStep = !activeMatch ? 0 : anyDeclined || anyDropped ? 6 : !allConfirmed ? 1 : allCan ? 5 : anyCannot ? 4 : anyStarted ? 3 : 2;
  const currentStepInfo = steps[Math.max(currentStep - 1, 0)] ?? steps[0];
  const isProcessMode = Boolean(activeMatch && activeParticipant && activeParticipant.confirmation_status !== "pending");

  const availableChats = useMemo(() => {
    if (!snapshot || !activeMatch || !selectedProfileId || !allConfirmed) return [];
    return snapshot.chats
      .filter((c) => c.match_id === activeMatch.id && c.status === "active")
      .filter((c) => c.chat_type === "group" || c.direct_user_1_id === selectedProfileId || c.direct_user_2_id === selectedProfileId)
      .sort((a, b) => (a.chat_type === "group" ? -1 : 1) - (b.chat_type === "group" ? -1 : 1));
  }, [snapshot, activeMatch, selectedProfileId, allConfirmed]);
  const selectedChat = availableChats.find((c) => c.id === selectedChatId) ?? availableChats[0];

  const myRequests = useMemo(() => {
    if (!snapshot || !selectedProfileId || activeMatch) return [];
    return snapshot.requests.filter((r) => r.user_id === selectedProfileId);
  }, [snapshot, selectedProfileId, activeMatch]);

  async function run(action: object) {
    setLoading(true); setError(null);
    try {
      const next = await api(action);
      setSnapshot(next);
      const users = next.users.slice(0, scenario);
      if (!selectedUserId && users[0]) setSelectedUserId(users[0].id);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  }
  function updateMyStatus(status: string) {
    if (!activeMatch || !selectedProfileId) return;
    run({ action: "status", matchId: activeMatch.id, userId: selectedProfileId, status });
  }
  function fromToText(p: Participant) { return `${kgById.get(p.from_kindergarten_id)?.name ?? "—"} → ${kgById.get(p.wants_kindergarten_id)?.name ?? "—"}`; }
  function requestToText(requestId: string) {
    const wanted = (snapshot?.wantedKindergartens ?? []).find((w) => w.request_id === requestId);
    return wanted ? kgById.get(wanted.wanted_kindergarten_id)?.name ?? "—" : "—";
  }
  function chatTitle(c: Chat) {
    if (c.chat_type === "group") return "Групов чат";
    const otherId = c.direct_user_1_id === selectedProfileId ? c.direct_user_2_id : c.direct_user_1_id;
    return `Лично: ${userById.get(otherId ?? "")?.display_name ?? "родител"}`;
  }
  function fillDemo() {
    if (!snapshot || !selectedProfileId) return;
    const index = scenarioUsers.findIndex((u) => u.id === selectedProfileId);
    const kgs = snapshot.kindergartens;
    if (index < 0 || kgs.length < scenario) return;
    setFromKgId(kgs[index].id); setWantedKgId(kgs[(index + 1) % scenario].id); setAgeGroup("2019");
  }
  function createRequest() {
    if (!selectedProfileId || !fromKgId || !wantedKgId) return setError("Избери профил, текуща градина и желана градина.");
    if (fromKgId === wantedKgId) return setError("Текущата и желаната градина трябва да са различни.");
    run({ action: "createRequest", userId: selectedProfileId, fromKindergartenId: fromKgId, wantedKindergartenId: wantedKgId, ageGroup });
  }
  async function setupScenario(nextScenario: Scenario) {
    setScenario(nextScenario); setSelectedUserId(""); setSelectedChatId(""); setFromKgId(""); setWantedKgId(""); setShowTimeline(false); setShowLeaveOptions(false);
    await run({ action: "setupBase" });
  }

  useEffect(() => { api().then((data) => { setSnapshot(data); if (data.users[0]) setSelectedUserId(data.users[0].id); }).catch((err) => setError(err instanceof Error ? err.message : "Unknown error")); }, []);
  useEffect(() => { if (scenarioUsers.length && !scenarioUsers.some((u) => u.id === selectedUserId)) setSelectedUserId(scenarioUsers[0].id); }, [scenarioUsers, selectedUserId]);
  useEffect(() => { if (availableChats.length && !availableChats.some((c) => c.id === selectedChatId)) setSelectedChatId(availableChats[0].id); }, [availableChats, selectedChatId]);

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink"><div className="mx-auto max-w-md space-y-4">
      <header className="rounded-[2rem] bg-ink p-5 text-white shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Playground</p><h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Прогресивен flow тест</h1><p className="mt-2 text-sm leading-6 text-white/70">Заявка → match покана → процес → чатове и статуси.</p></header>
      {error ? <div className="rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

      <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">1. Сценарий</p><div className="mt-3 grid grid-cols-3 gap-2">{([2,3,4] as Scenario[]).map((s) => <button key={s} disabled={loading} onClick={() => setupScenario(s)} className={`rounded-2xl px-3 py-4 text-sm font-black ${scenario === s ? "bg-ink text-white" : "bg-beige"}`}>{s} страни</button>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={loading} onClick={() => run({ action: "setupBase" })} className="rounded-2xl bg-beige px-4 py-4 text-left text-sm font-black">Навий празни данни</button><button disabled={loading} onClick={() => run({ action: "seed", cycleSize: scenario as PlaygroundCycleSize })} className="rounded-2xl bg-lime px-4 py-4 text-left text-sm font-black">Авто match</button><button disabled={loading} onClick={() => run({ action: "reset" })} className="col-span-2 rounded-2xl bg-orange px-4 py-4 text-left text-sm font-black text-white">Reset playground</button></div></section>
      <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">2. Профил</p><SelectField value={selectedProfileId} onChange={setSelectedUserId} className="mt-3">{scenarioUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}</SelectField><p className="mt-3 text-xs text-ink/45">ID: {shortId(selectedProfileId)}</p></section>

      {!activeMatch ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><h2 className="text-xl font-black tracking-[-0.04em]">Пусни заявка за размяна</h2><p className="mt-2 text-sm text-ink/55">Когато се появи цикъл, тази форма се прибира.</p><div className="mt-4 space-y-3"><label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Имаме място в</label><SelectField value={fromKgId} onChange={setFromKgId}><option value="">Избери градина</option>{(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}</SelectField><label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Желана градина</label><SelectField value={wantedKgId} onChange={setWantedKgId}><option value="">Избери желана градина</option>{(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}</SelectField><input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none" /><div className="grid grid-cols-2 gap-2"><button disabled={loading || !selectedProfileId} onClick={fillDemo} className="rounded-full bg-beige px-5 py-4 text-xs font-black">Демо</button><button disabled={loading || !selectedProfileId} onClick={createRequest} className="rounded-full bg-ink px-5 py-4 text-xs font-black text-white disabled:opacity-40">Добави заявка</button></div></div></section> : null}
      {!activeMatch && myRequests.length ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><h2 className="text-xl font-black tracking-[-0.04em]">Моите активни заявки</h2><div className="mt-4 space-y-3">{myRequests.map((r) => <div key={r.id} className="rounded-3xl bg-paper p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-ink/40">Желание за размяна</p><p className="mt-2 text-sm font-black leading-5">{kgById.get(r.from_kindergarten_id)?.name ?? "—"} <span className="px-1 text-ink/35">→</span> {requestToText(r.id)}</p><p className="mt-2 text-xs text-ink/55">Набор {r.child_group_year_or_age_group} · {r.is_active ? "Активна" : "Неактивна"}</p><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={loading || !r.is_active} onClick={() => run({ action: "deactivateRequest", requestId: r.id })} className="rounded-full bg-beige px-3 py-3 text-xs font-bold disabled:opacity-30">Деактивирай</button><button disabled={loading || r.is_locked} onClick={() => run({ action: "deleteRequest", requestId: r.id })} className="rounded-full bg-ink px-3 py-3 text-xs font-bold text-white disabled:opacity-30">Изтрий</button></div></div>)}</div></section> : null}

      {activeMatch && activeParticipant?.confirmation_status === "pending" ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Match покана</p><h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">Има потенциален цикъл</h2><p className="mt-3 text-sm leading-6 text-ink/60">Заявката ти вече е скрита. Потвърди интерес, за да се отключи координацията.</p><CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} readOnly /><div className="mt-5 grid grid-cols-2 gap-2"><button disabled={loading} onClick={() => run({ action: "confirm", matchId: activeMatch.id, userId: selectedProfileId })} className="rounded-full bg-ink px-3 py-4 text-sm font-black text-white">Приемам</button><button disabled={loading} onClick={() => run({ action: "decline", matchId: activeMatch.id, userId: selectedProfileId })} className="rounded-full bg-beige px-3 py-4 text-sm font-black">Отказвам</button></div></section> : null}

      {activeMatch && isProcessMode ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Статус в прогрес</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{activeMatch.status === "at_risk" ? "Цикъл с отказ" : "Координация"}</h2></div><span className={`rounded-full px-3 py-2 text-[10px] font-black ${allConfirmed ? "bg-lime" : "bg-beige"}`}>{activeMatch.status}</span></div><button type="button" onClick={() => setShowTimeline((v) => !v)} className="mt-5 flex w-full items-center justify-between gap-4 rounded-[1.6rem] bg-lime px-5 py-4 text-left shadow-sm"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">Стъпка {currentStep || 1} от {steps.length}</p><p className="mt-2 text-lg font-black leading-tight">{currentStepInfo.title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/60">{currentStepInfo.helper}</p></div><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/85 text-xl font-black leading-none text-ink transition-transform ${showTimeline ? "rotate-180" : ""}`}>∨</span></button>{showTimeline ? <Timeline currentStep={currentStep} /> : null}<CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} loading={loading} updateMyStatus={updateMyStatus} /><div className="mt-5 rounded-[1.5rem] bg-paper p-4"><button onClick={() => setShowLeaveOptions((v) => !v)} className="w-full rounded-full bg-beige px-4 py-3 text-sm font-black">Отказ от процеса</button>{showLeaveOptions ? <div className="mt-3 grid gap-2"><button disabled={loading} onClick={() => run({ action: "leave", matchId: activeMatch.id, userId: selectedProfileId, keepChat: true })} className="rounded-full bg-ink px-4 py-3 text-xs font-black text-white">Отказвам се, но запази чата</button><button disabled={loading} onClick={() => run({ action: "leave", matchId: activeMatch.id, userId: selectedProfileId, keepChat: false })} className="rounded-full bg-orange px-4 py-3 text-xs font-black text-white">Отказвам се и затвори чата</button></div> : null}</div></section> : null}

      {activeMatch && allConfirmed ? <section className="rounded-[2rem] bg-milk p-5 shadow-soft"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Чатове</p><h2 className="mt-2 text-xl font-black tracking-[-0.04em]">{selectedChat ? chatTitle(selectedChat) : "Няма чат"}</h2></div>{selectedChat ? <span className="rounded-full bg-beige px-3 py-2 text-[10px] font-black">{selectedChat.status}</span> : null}</div>{availableChats.length ? <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{availableChats.map((c) => <button key={c.id} onClick={() => setSelectedChatId(c.id)} className={`shrink-0 rounded-full px-4 py-3 text-xs font-black ${selectedChat?.id === c.id ? "bg-ink text-white" : "bg-paper"}`}>{chatTitle(c)}</button>)}</div> : <p className="mt-4 text-sm text-ink/50">Чатовете се отключват след потвърждение от всички. Ако виждаш само групов чат след потвърждение, пусни миграция 005 за личните чатове.</p>}<div className="mt-4 space-y-2">{snapshot?.messages.filter((m) => selectedChat && m.chat_id === selectedChat.id).map((m) => { const mine = m.sender_user_id === selectedProfileId; return <div key={m.id} className={`rounded-3xl p-3 text-sm ${mine ? "ml-8 bg-ink text-white" : "mr-8 bg-paper"}`}><p className={`text-xs font-bold ${mine ? "text-white/50" : "text-ink/45"}`}>{mine ? "Ти" : userById.get(m.sender_user_id)?.display_name}</p><p className="mt-1">{m.body}</p>{m.moderation_flag ? <p className="mt-2 text-xs font-black text-orange">Flagged</p> : null}</div>; })}</div><div className="mt-4 space-y-2"><textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} className="min-h-24 w-full rounded-3xl border-0 bg-paper p-4 text-sm outline-none" /><button disabled={loading || !selectedChat || selectedChat.status !== "active"} onClick={() => selectedChat && run({ action: "message", chatId: selectedChat.id, userId: selectedProfileId, body: messageBody })} className="w-full rounded-full bg-ink px-4 py-4 text-sm font-bold text-white disabled:opacity-30">Изпрати като {selectedUser?.display_name}</button></div></section> : null}
    </div></main>
  );
}

function CycleMap({ participants, selectedProfileId, userById, fromToText, allConfirmed, loading = false, updateMyStatus, readOnly = false }: { participants: Participant[]; selectedProfileId: string; userById: Map<string, PlaygroundSnapshot["users"][number]>; fromToText: (p: Participant) => string; allConfirmed: boolean; loading?: boolean; updateMyStatus?: (status: string) => void; readOnly?: boolean }) {
  if (!participants.length) return null;
  return <div className="mt-5 rounded-[1.75rem] bg-paper p-4"><p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-ink/40">Верига и статуси</p><div className="space-y-3">{participants.map((p, i) => { const me = p.user_id === selectedProfileId; const user = userById.get(p.user_id); return <div key={p.id} className="relative">{i < participants.length - 1 ? <div className="absolute left-8 top-[4.5rem] h-5 border-l border-dashed border-ink/25" /> : null}<div className={`relative z-10 rounded-[1.4rem] p-3 ${me ? "bg-ink text-white" : colors[i % colors.length]}`}><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-ink shadow-sm">{me ? "Ти" : i + 1}</div><div className="min-w-0 flex-1"><p className="font-black leading-tight">{me ? "Ти" : user?.display_name}</p><p className={`mt-1 text-[11px] font-semibold leading-4 ${me ? "text-white/65" : "text-ink/60"}`}>{fromToText(p)}</p></div></div><div className="mt-3">{me && allConfirmed && !readOnly ? <SelectField value={p.coordination_status} disabled={loading} onChange={(value) => updateMyStatus?.(value)}><option value="not_started">Още не съм започнал/а</option><option value="checking_procedure">Проверявам процедурата</option><option value="contacted_kindergarten">Свързал/а съм се със заведение</option><option value="can_continue">Мога да продължа</option><option value="cannot_continue">Не мога да продължа</option><option value="dropped_out">Отказвам се</option></SelectField> : <div className={`px-1 py-1 text-xs font-black ${me ? "text-white/65" : "text-ink/55"}`}>{participantStatus(p, allConfirmed)}</div>}</div></div></div>; })}</div></div>;
}

function Timeline({ currentStep }: { currentStep: number }) {
  return <div className="mt-5 rounded-[1.75rem] bg-paper px-4 py-5">{steps.map((s, i) => { const n = i + 1; const done = n < currentStep; const current = n === currentStep; return <div key={s.title} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0">{i < steps.length - 1 ? <div className={`absolute left-[0.94rem] top-8 h-[calc(100%-1.7rem)] border-l-2 border-dashed ${done ? "border-lime" : "border-ink/15"}`} /> : null}<div className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-black ${done ? "bg-lime text-ink" : current ? "bg-ink text-white" : "bg-white text-ink/35 ring-1 ring-ink/10"}`}>{done ? "✓" : n}</div><div className="pt-0.5"><p className={`text-[10px] font-black uppercase tracking-[0.18em] ${current ? "text-ink" : "text-ink/40"}`}>Стъпка {n}</p><p className={`mt-1 text-sm font-black ${current ? "text-ink" : "text-ink/65"}`}>{s.title}</p><p className="mt-1 text-xs font-medium leading-5 text-ink/45">{s.helper}</p></div></div>; })}</div>;
}
