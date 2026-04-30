"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaygroundCycleSize, PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };

const statusOptions = [
  ["not_started", "Още не съм започнал/а"],
  ["checking_procedure", "Проверявам процедурата"],
  ["contacted_kindergarten", "Свързал/а съм се със заведение"],
  ["can_continue", "Мога да продължа"],
  ["cannot_continue", "Не мога да продължа"],
  ["dropped_out", "Отказвам се"]
] as const;

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

export default function PlaygroundPage() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageBody, setMessageBody] = useState("Здравейте, виждам, че имаме потенциално съвпадение.");
  const [fromKgId, setFromKgId] = useState("");
  const [wantedKgId, setWantedKgId] = useState("");

  const selectedUser = snapshot?.users.find((user) => user.id === selectedUserId) ?? snapshot?.users[0];
  const selectedProfileId = selectedUser?.id ?? "";

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
    return snapshot.participants.filter((p) => p.match_id === activeMatch.id).sort((a, b) => a.participant_order - b.participant_order);
  }, [snapshot, activeMatch]);
  const groupChat = useMemo(() => {
    if (!snapshot || !activeMatch) return undefined;
    return snapshot.chats.find((chat) => chat.match_id === activeMatch.id && chat.chat_type === "group");
  }, [snapshot, activeMatch]);

  const kindergartenById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((user) => [user.id, user])), [snapshot]);

  async function run(action: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await postAction(action);
      setSnapshot(next);
      if (!selectedUserId && next.users[0]) setSelectedUserId(next.users[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
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
    run({ action: "createRequest", userId: selectedProfileId, fromKindergartenId: fromKgId, wantedKindergartenId: wantedKgId, ageGroup: "2019" });
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
    if (!fromKgId && snapshot?.kindergartens[0]) setFromKgId(snapshot.kindergartens[0].id);
    if (!wantedKgId && snapshot?.kindergartens[1]) setWantedKgId(snapshot.kindergartens[1].id);
  }, [snapshot, fromKgId, wantedKgId]);

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-ink p-5 text-white shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Playground</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Симулатор като app</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">Избери профил и гледай какво вижда конкретният родител в реалната база.</p>
          <select
            value={selectedProfileId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-sm font-black text-ink outline-none"
          >
            {(snapshot?.users ?? []).map((user) => (
              <option key={user.id} value={user.id}>{user.display_name}</option>
            ))}
          </select>
        </header>

        {error ? <div className="rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

        <section className="rounded-[2rem] bg-milk p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Сценарии</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[2, 3, 4].map((size) => (
              <button key={size} disabled={loading} onClick={() => run({ action: "seed", cycleSize: size as PlaygroundCycleSize })} className="rounded-2xl bg-beige px-4 py-4 text-left text-sm font-black">
                Seed {size}-way
              </button>
            ))}
            <button disabled={loading} onClick={() => run({ action: "reset" })} className="rounded-2xl bg-orange px-4 py-4 text-left text-sm font-black text-white">Reset</button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Изглед като потребител</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{selectedUser?.display_name ?? "Няма избран профил"}</h2>
          <p className="mt-2 text-xs text-ink/45">ID: {shortId(selectedProfileId)}</p>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Добави желание за размяна</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Имаме място в</label>
            <select value={fromKgId} onChange={(event) => setFromKgId(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none">
              {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
            </select>
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Искаме</label>
            <select value={wantedKgId} onChange={(event) => setWantedKgId(event.target.value)} className="w-full rounded-2xl bg-paper px-4 py-4 text-sm font-bold outline-none">
              {(snapshot?.kindergartens ?? []).map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
            </select>
            <button disabled={loading || !selectedProfileId} onClick={createRequest} className="w-full rounded-full bg-ink px-5 py-4 text-sm font-black text-white disabled:opacity-40">Запази заявка като {selectedUser?.display_name}</button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Моите заявки</h2>
          <div className="mt-4 space-y-3">
            {myRequests.length === 0 ? <p className="text-sm text-ink/55">Този родител още няма активна заявка.</p> : null}
            {myRequests.map((request) => {
              const fromKg = kindergartenById.get(request.from_kindergarten_id);
              const wanted = snapshot?.wantedKindergartens.filter((item) => item.request_id === request.id) ?? [];
              return (
                <div key={request.id} className="rounded-3xl bg-paper p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Текущо място</p>
                  <p className="mt-1 font-black">{fromKg?.name}</p>
                  <p className="mt-1 text-xs text-ink/55">Набор {request.child_group_year_or_age_group} · {request.is_locked ? "Заключена" : "Активна"}</p>
                  <div className="mt-3 border-t border-ink/10 pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/40">Желани</p>
                    {wanted.map((item) => <p key={item.id} className="mt-1 text-sm font-semibold">→ {kindergartenById.get(item.wanted_kindergarten_id)?.name}</p>)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Моите match-ове</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{activeMatch ? activeMatch.match_type : "Няма match"}</h2>
            </div>
            {activeMatch ? <span className="rounded-full bg-lime px-3 py-2 text-xs font-black">{activeMatch.status}</span> : null}
          </div>
          {activeMatch && activeParticipant ? (
            <div className="mt-5 rounded-3xl bg-paper p-4">
              <p className="text-sm font-black">Моят статус</p>
              <p className="mt-1 text-xs text-ink/55">Потвърждение: {activeParticipant.confirmation_status}</p>
              <p className="mt-1 text-xs text-ink/55">Координация: {activeParticipant.coordination_status}</p>
              <p className="mt-3 text-xs text-ink/45">Confidence: {activeMatch.confidence_score}/100</p>
              <div className="mt-4 flex gap-2">
                <button disabled={loading} onClick={() => run({ action: "confirm", matchId: activeMatch.id, userId: selectedProfileId })} className="flex-1 rounded-full bg-ink px-3 py-3 text-xs font-bold text-white">Имам интерес</button>
                <button disabled={loading} onClick={() => run({ action: "decline", matchId: activeMatch.id, userId: selectedProfileId })} className="flex-1 rounded-full bg-beige px-3 py-3 text-xs font-bold">Не ме интересува</button>
              </div>
            </div>
          ) : <p className="mt-5 text-sm text-ink/60">Този родител още не вижда потенциално съвпадение.</p>}
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Схема на съвпадението</h2>
          <div className="mt-4 space-y-3">
            {participants.length === 0 ? <p className="text-sm text-ink/55">Няма схема за този профил.</p> : null}
            {participants.map((participant, index) => {
              const user = userById.get(participant.user_id);
              const fromKg = kindergartenById.get(participant.from_kindergarten_id);
              const wantsKg = kindergartenById.get(participant.wants_kindergarten_id);
              return (
                <div key={participant.id} className={`rounded-3xl p-4 ${participant.user_id === selectedProfileId ? "bg-lime" : "bg-paper"}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">Стъпка {index + 1}</p>
                  <p className="mt-1 font-black">{participant.user_id === selectedProfileId ? "Ти" : user?.display_name}</p>
                  <p className="mt-2 text-sm font-semibold">{fromKg?.name} → {wantsKg?.name}</p>
                  <p className="mt-1 text-xs text-ink/55">Потенциална посока на преместване</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Моят статус</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusOptions.map(([value, label]) => (
              <button key={value} disabled={loading || !activeMatch || !selectedProfileId} onClick={() => activeMatch && run({ action: "status", matchId: activeMatch.id, userId: selectedProfileId, status: value })} className="rounded-2xl bg-paper px-3 py-3 text-left text-[11px] font-semibold disabled:opacity-35">{label}</button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Групов чат</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">{groupChat ? groupChat.status : "Няма чат"}</h2>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {snapshot?.messages.filter((m) => !groupChat || m.chat_id === groupChat.id).map((message) => {
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
            <button disabled={loading || !groupChat || groupChat.status !== "active" || !selectedProfileId} onClick={() => groupChat && run({ action: "message", chatId: groupChat.id, userId: selectedProfileId, body: messageBody })} className="w-full rounded-full bg-ink px-4 py-4 text-sm font-bold text-white disabled:opacity-30">Изпрати като {selectedUser?.display_name}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
