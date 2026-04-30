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
  if (!response.ok || "error" in json) {
    throw new Error("error" in json ? json.error : "Playground request failed");
  }
  return json;
}

async function getSnapshot(): Promise<PlaygroundSnapshot> {
  const response = await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) {
    throw new Error("error" in json ? json.error : "Playground request failed");
  }
  return json;
}

export default function PlaygroundPage() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageBody, setMessageBody] = useState("Здравейте, виждам, че имаме потенциално съвпадение.");

  const activeMatch = snapshot?.matches[0];
  const participants = useMemo(() => {
    if (!snapshot || !activeMatch) return [];
    return snapshot.participants.filter((p) => p.match_id === activeMatch.id).sort((a, b) => a.participant_order - b.participant_order);
  }, [snapshot, activeMatch]);
  const groupChat = useMemo(() => {
    if (!snapshot || !activeMatch) return undefined;
    return snapshot.chats.find((chat) => chat.match_id === activeMatch.id && chat.chat_type === "group");
  }, [snapshot, activeMatch]);

  async function run(action: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await postAction(action);
      setSnapshot(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getSnapshot().then(setSnapshot).catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-ink p-5 text-white shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Playground</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Тестова площадка</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Симулирай 2/3/4-странни съвпадения през реалната Supabase база и RPC логика.
          </p>
        </header>

        {error ? <div className="rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

        <section className="grid grid-cols-2 gap-3 rounded-[2rem] bg-milk p-4 shadow-soft">
          {[2, 3, 4].map((size) => (
            <button
              key={size}
              disabled={loading}
              onClick={() => run({ action: "seed", cycleSize: size as PlaygroundCycleSize })}
              className="rounded-2xl bg-beige px-4 py-4 text-left text-sm font-black"
            >
              Seed {size}-way
            </button>
          ))}
          <button disabled={loading} onClick={() => run({ action: "reset" })} className="rounded-2xl bg-orange px-4 py-4 text-left text-sm font-black text-white">
            Reset
          </button>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Match</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{activeMatch ? activeMatch.match_type : "Няма match"}</h2>
            </div>
            {activeMatch ? <span className="rounded-full bg-lime px-3 py-2 text-xs font-black">{activeMatch.status}</span> : null}
          </div>

          {activeMatch ? (
            <div className="mt-5 rounded-3xl bg-paper p-4">
              <p className="text-sm font-semibold">Confidence: {activeMatch.confidence_score}/100</p>
              <p className="mt-1 break-all text-xs text-ink/50">{activeMatch.id}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-ink/60">Създай seed сценарий, за да се появи потенциално съвпадение.</p>
          )}
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <h2 className="text-xl font-black tracking-[-0.04em]">Участници</h2>
          <div className="mt-4 space-y-3">
            {participants.map((participant) => {
              const user = snapshot?.users.find((u) => u.id === participant.user_id);
              return (
                <div key={participant.id} className="rounded-3xl bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{participant.participant_label} · {user?.display_name}</p>
                      <p className="mt-1 text-xs text-ink/55">Потвърждение: {participant.confirmation_status}</p>
                      <p className="mt-1 text-xs text-ink/55">Статус: {participant.coordination_status}</p>
                    </div>
                    <button
                      disabled={loading || !activeMatch}
                      onClick={() => activeMatch && run({ action: "confirm", matchId: activeMatch.id, userId: participant.user_id })}
                      className="rounded-full bg-ink px-3 py-2 text-xs font-bold text-white"
                    >
                      Интерес
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {statusOptions.map(([value, label]) => (
                      <button
                        key={value}
                        disabled={loading || !activeMatch}
                        onClick={() => activeMatch && run({ action: "status", matchId: activeMatch.id, userId: participant.user_id, status: value })}
                        className="rounded-2xl bg-milk px-3 py-2 text-left text-[11px] font-semibold"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-milk p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Chat</p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">{groupChat ? groupChat.status : "Няма чат"}</h2>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {snapshot?.messages.filter((m) => !groupChat || m.chat_id === groupChat.id).map((message) => {
              const user = snapshot.users.find((u) => u.id === message.sender_user_id);
              return (
                <div key={message.id} className="rounded-3xl bg-paper p-3 text-sm">
                  <p className="text-xs font-bold text-ink/45">{user?.display_name}</p>
                  <p className="mt-1">{message.body}</p>
                  {message.moderation_flag ? <p className="mt-2 text-xs font-black text-orange">Flagged: payment-related terms</p> : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              className="min-h-24 w-full rounded-3xl border-0 bg-paper p-4 text-sm outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              {participants.map((participant) => {
                const user = snapshot?.users.find((u) => u.id === participant.user_id);
                return (
                  <button
                    key={participant.id}
                    disabled={loading || !groupChat || groupChat.status !== "active"}
                    onClick={() => groupChat && run({ action: "message", chatId: groupChat.id, userId: participant.user_id, body: messageBody })}
                    className="rounded-full bg-ink px-4 py-3 text-xs font-bold text-white disabled:opacity-30"
                  >
                    Пиши като {user?.display_name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
