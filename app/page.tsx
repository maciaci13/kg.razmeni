"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";
import { AppShell } from "./components/AppShell";
import { HomeScreen } from "./components/screens/HomeScreen";
import { RequestScreen } from "./components/screens/RequestScreen";
import { MatchScreen } from "./components/screens/MatchScreen";
import { ChatScreen } from "./components/screens/ChatScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import type { AppTab, Chat, Participant } from "./components/types";
import { placeTypes, rejectedStep, steps } from "./components/types";

type ApiError = { error: string };

async function api(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
    : await fetch("/api/playground", { cache: "no-store" });

  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
  return json;
}

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("home");
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [selectedPlaceType, setSelectedPlaceType] = useState(placeTypes[0]);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [messageBody, setMessageBody] = useState("Здравейте, виждам, че имаме потенциално съвпадение.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const users = snapshot?.users ?? [];
  const selectedUser = users.find((u) => u.id === selectedProfileId) ?? users[0];
  const activeUserId = selectedUser?.id ?? "";
  const selectedUserName = selectedUser?.display_name ?? "Родител";

  const kgById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((u) => [u.id, u])), [snapshot]);
  const myParticipants = useMemo(() => (snapshot?.participants ?? []).filter((p) => p.user_id === activeUserId), [snapshot, activeUserId]);
  const activeMatch = useMemo(() => {
    const ids = new Set(myParticipants.map((p) => p.match_id));
    return (snapshot?.matches ?? []).find((m) => ids.has(m.id));
  }, [snapshot, myParticipants]);
  const activeParticipant = activeMatch ? myParticipants.find((p) => p.match_id === activeMatch.id) : undefined;
  const participants = useMemo(
    () => (snapshot?.participants ?? []).filter((p) => p.match_id === activeMatch?.id).sort((a, b) => a.participant_order - b.participant_order),
    [snapshot, activeMatch]
  );

  const allConfirmed = participants.length > 0 && participants.every((p) => p.confirmation_status === "interested");
  const anyDeclined = participants.some((p) => p.confirmation_status === "declined");
  const anyDropped = participants.some((p) => p.coordination_status === "dropped_out");
  const anyCannot = participants.some((p) => p.coordination_status === "cannot_continue");
  const allCan = participants.length > 0 && participants.every((p) => p.coordination_status === "can_continue");
  const anyStarted = participants.some((p) => ["checking_procedure", "contacted_kindergarten"].includes(p.coordination_status));
  const matchIsClosed = Boolean(activeMatch && (anyDeclined || anyDropped || ["at_risk", "cancelled"].includes(activeMatch.status)));
  const currentStep = !activeMatch ? 0 : matchIsClosed ? 6 : !allConfirmed ? 1 : allCan ? 5 : anyCannot ? 4 : anyStarted ? 3 : 2;
  const currentStepInfo = matchIsClosed ? rejectedStep : (steps[Math.max(currentStep - 1, 0)] ?? steps[0]);

  const myRequests = useMemo(
    () => !snapshot || !activeUserId || activeMatch ? [] : snapshot.requests.filter((r) => r.user_id === activeUserId),
    [snapshot, activeUserId, activeMatch]
  );
  const activeRequestText = myRequests[0]
    ? `${kgById.get(myRequests[0].from_kindergarten_id)?.name ?? "—"} → ${requestToText(myRequests[0].id)}`
    : "";

  const availableChats = useMemo(() => {
    if (!snapshot || !activeMatch || !activeUserId || !allConfirmed || matchIsClosed) return [];
    const hideGroupChat = participants.length === 2;
    return snapshot.chats
      .filter((c) => c.match_id === activeMatch.id && c.status === "active")
      .filter((c) => !(hideGroupChat && c.chat_type === "group"))
      .filter((c) => c.chat_type === "group" || c.direct_user_1_id === activeUserId || c.direct_user_2_id === activeUserId)
      .sort((a, b) => (a.chat_type === "group" ? -1 : 1) - (b.chat_type === "group" ? -1 : 1));
  }, [snapshot, activeMatch, activeUserId, allConfirmed, matchIsClosed, participants.length]);
  const selectedChat = availableChats.find((c) => c.id === selectedChatId) ?? availableChats[0];

  async function run(action?: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await api(action);
      setSnapshot(next);
      if (!selectedProfileId && next.users[0]) setSelectedProfileId(next.users[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function fromToText(p: Participant) {
    return `${kgById.get(p.from_kindergarten_id)?.name ?? "—"} → ${kgById.get(p.wants_kindergarten_id)?.name ?? "—"}`;
  }

  function requestToText(requestId: string) {
    const wanted = (snapshot?.wantedKindergartens ?? []).find((w) => w.request_id === requestId);
    return wanted ? kgById.get(wanted.wanted_kindergarten_id)?.name ?? "—" : "—";
  }

  function chatTitle(c: Chat) {
    if (c.chat_type === "group") return "Групов чат";
    const otherId = c.direct_user_1_id === activeUserId ? c.direct_user_2_id : c.direct_user_1_id;
    return `Лично: ${userById.get(otherId ?? "")?.display_name ?? "родител"}`;
  }

  function createRequest(data: { fromKgId: string; wantedKgId: string; ageGroup: string }) {
    if (!activeUserId) return setError("Няма избран профил.");
    if (data.fromKgId === data.wantedKgId) return setError("Текущата и желаната градина трябва да са различни.");
    run({ action: "createRequest", userId: activeUserId, fromKindergartenId: data.fromKgId, wantedKindergartenId: data.wantedKgId, ageGroup: data.ageGroup });
  }

  function updateMyStatus(status: string) {
    if (!activeMatch || !activeUserId) return;
    run({ action: "status", matchId: activeMatch.id, userId: activeUserId, status });
  }

  function leaveProcess(keepChat: boolean) {
    if (!activeMatch || !activeUserId) return;
    setShowLeaveOptions(false);
    run({ action: "leave", matchId: activeMatch.id, userId: activeUserId, keepChat });
  }

  function sendMessage() {
    if (!selectedChat || !activeUserId) return;
    run({ action: "message", chatId: selectedChat.id, userId: activeUserId, body: messageBody });
  }

  useEffect(() => { run({ action: "setupBase" }); }, []);
  useEffect(() => { if (users.length && !users.some((u) => u.id === selectedProfileId)) setSelectedProfileId(users[0].id); }, [users, selectedProfileId]);
  useEffect(() => { if (availableChats.length && !availableChats.some((c) => c.id === selectedChatId)) setSelectedChatId(availableChats[0].id); }, [availableChats, selectedChatId]);

  const Active = tab === "home"
    ? <HomeScreen setTab={setTab} activeRequestText={activeRequestText} matchCount={activeMatch ? 1 : 0} />
    : tab === "requests"
      ? <RequestScreen snapshot={snapshot} selectedProfileId={activeUserId} selectedPlaceType={selectedPlaceType} setSelectedPlaceType={setSelectedPlaceType} myRequests={myRequests} kgById={kgById} requestToText={requestToText} createRequest={createRequest} deactivateRequest={(id) => run({ action: "deactivateRequest", requestId: id })} deleteRequest={(id) => run({ action: "deleteRequest", requestId: id })} loading={loading} />
      : tab === "matches"
        ? <MatchScreen activeMatch={activeMatch} activeParticipant={activeParticipant} participants={participants} selectedProfileId={activeUserId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} matchIsClosed={matchIsClosed} currentStep={currentStep} currentStepInfo={currentStepInfo} loading={loading} confirm={() => activeMatch && run({ action: "confirm", matchId: activeMatch.id, userId: activeUserId })} decline={() => activeMatch && run({ action: "decline", matchId: activeMatch.id, userId: activeUserId })} updateMyStatus={updateMyStatus} leave={() => setShowLeaveOptions(true)} />
        : tab === "chats"
          ? <ChatScreen activeMatch={activeMatch} allConfirmed={allConfirmed} matchIsClosed={matchIsClosed} availableChats={availableChats} selectedChat={selectedChat} selectedChatId={selectedChat?.id ?? ""} setSelectedChatId={setSelectedChatId} snapshot={snapshot} selectedProfileId={activeUserId} selectedUserName={selectedUserName} userById={userById} chatTitle={chatTitle} messageBody={messageBody} setMessageBody={setMessageBody} sendMessage={sendMessage} loading={loading} />
          : <ProfileScreen selectedProfileId={activeUserId} selectedUserName={selectedUserName} users={users} setSelectedProfileId={setSelectedProfileId} />;

  return (
    <AppShell activeTab={tab} setTab={setTab} selectedUserName={selectedUserName}>
      {error ? (
        <div className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-3xl bg-red-100 p-4 text-sm font-semibold text-red-900 shadow-soft">
          {error}
        </div>
      ) : null}

      {Active}

      {showLeaveOptions && activeMatch && !matchIsClosed ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 px-4 pt-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-ink/40">Отказ от процеса</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Как да затворим цикъла?</h2>
              </div>
              <button type="button" onClick={() => setShowLeaveOptions(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-xl font-extrabold">×</button>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-ink/55">Избери дали чатът да остане видим за координация след отказа или всичко да се затвори напълно.</p>
            <div className="mt-5 grid gap-2">
              <button type="button" disabled={loading} onClick={() => leaveProcess(true)} className="rounded-full bg-ink px-4 py-4 text-sm font-extrabold text-white disabled:opacity-40">Отказвам се, но запази чата</button>
              <button type="button" disabled={loading} onClick={() => leaveProcess(false)} className="rounded-full bg-orange px-4 py-4 text-sm font-extrabold text-white disabled:opacity-40">Отказвам се и затвори чата</button>
              <button type="button" disabled={loading} onClick={() => setShowLeaveOptions(false)} className="rounded-full bg-beige px-4 py-4 text-sm font-extrabold disabled:opacity-40">Връщам се назад</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
