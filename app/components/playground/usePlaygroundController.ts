"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };
type Scenario = 2 | 3 | 4;
type Participant = PlaygroundSnapshot["participants"][number];
type Chat = PlaygroundSnapshot["chats"][number];

async function playgroundApi(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

function matchBelongsToScenario(matchId: string, allParticipants: Participant[], scenarioUserIds: Set<string>, scenario: Scenario) {
  const matchParticipants = allParticipants.filter((participant) => participant.match_id === matchId);
  if (matchParticipants.length !== scenario) return false;
  return matchParticipants.every((participant) => scenarioUserIds.has(participant.user_id));
}

export function usePlaygroundController() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [scenario] = useState<Scenario>(3);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messageBody, setMessageBody] = useState("Здравейте, виждам, че имаме потенциално съвпадение.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarioUsers = useMemo(() => (snapshot?.users ?? []).slice(0, scenario), [snapshot, scenario]);
  const scenarioUserIds = useMemo(() => new Set(scenarioUsers.map((user) => user.id)), [scenarioUsers]);
  const selectedProfile = scenarioUsers.find((user) => user.id === selectedProfileId) ?? scenarioUsers[0];
  const effectiveProfileId = selectedProfile?.id ?? "";

  const kgById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const userById = useMemo(() => new Map((snapshot?.users ?? []).map((user) => [user.id, user])), [snapshot]);
  const wantedByRequestId = useMemo(() => {
    const map = new Map<string, PlaygroundSnapshot["wantedKindergartens"][number]>();
    for (const wanted of snapshot?.wantedKindergartens ?? []) map.set(wanted.request_id, wanted);
    return map;
  }, [snapshot]);

  const myRequests = useMemo(() => {
    if (!snapshot || !effectiveProfileId) return [];
    return snapshot.requests.filter((request) => request.user_id === effectiveProfileId);
  }, [snapshot, effectiveProfileId]);

  const scenarioMatches = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.matches.filter((match) => matchBelongsToScenario(match.id, snapshot.participants, scenarioUserIds, scenario));
  }, [snapshot, scenarioUserIds, scenario]);

  const myParticipants = useMemo(() => {
    if (!snapshot || !effectiveProfileId) return [];
    const scenarioMatchIds = new Set(scenarioMatches.map((match) => match.id));
    return snapshot.participants.filter((participant) => participant.user_id === effectiveProfileId && scenarioMatchIds.has(participant.match_id));
  }, [snapshot, effectiveProfileId, scenarioMatches]);

  const activeMatch = useMemo(() => {
    const myMatchIds = new Set(myParticipants.map((participant) => participant.match_id));
    return scenarioMatches.find((match) => myMatchIds.has(match.id)) ?? scenarioMatches[0];
  }, [scenarioMatches, myParticipants]);

  const participants = useMemo(() => {
    if (!snapshot || !activeMatch) return [];
    return snapshot.participants.filter((participant) => participant.match_id === activeMatch.id).sort((a, b) => a.participant_order - b.participant_order);
  }, [snapshot, activeMatch]);

  const activeParticipant = participants.find((participant) => participant.user_id === effectiveProfileId);
  const allConfirmed = participants.length > 0 && participants.every((participant) => participant.confirmation_status === "interested");
  const matchIsClosed = participants.some((participant) => participant.confirmation_status === "declined" || participant.coordination_status === "dropped_out");

  const availableChats = useMemo(() => {
    if (!snapshot || !activeMatch || !effectiveProfileId || !allConfirmed || matchIsClosed) return [] as Chat[];
    const participantIds = new Set(participants.map((participant) => participant.user_id));
    return snapshot.chats
      .filter((chat) => chat.match_id === activeMatch.id && chat.status === "active")
      .filter((chat) => {
        if (chat.chat_type === "group") return true;
        if (!chat.direct_user_1_id || !chat.direct_user_2_id) return false;
        return participantIds.has(chat.direct_user_1_id) && participantIds.has(chat.direct_user_2_id) && (chat.direct_user_1_id === effectiveProfileId || chat.direct_user_2_id === effectiveProfileId);
      });
  }, [snapshot, activeMatch, effectiveProfileId, allConfirmed, matchIsClosed, participants]);

  const selectedChat = availableChats.find((chat) => chat.id === selectedChatId) ?? availableChats[0];
  const messages = useMemo(() => {
    if (!snapshot || !selectedChat) return [];
    return snapshot.messages.filter((message) => message.chat_id === selectedChat.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [snapshot, selectedChat]);

  async function run(action: object) {
    setLoading(true);
    setError(null);
    try {
      const next = await playgroundApi(action);
      setSnapshot(next);
      if (!selectedProfileId) setSelectedProfileId(next.users[0]?.id ?? "");
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  function requestToText(request: PlaygroundSnapshot["requests"][number]) {
    const wanted = wantedByRequestId.get(request.id);
    const from = kgById.get(request.from_kindergarten_id)?.name ?? "—";
    const to = wanted ? kgById.get(wanted.wanted_kindergarten_id)?.name ?? "—" : "—";
    return `${from} → ${to}`;
  }

  function participantRoute(participant: Participant) {
    return `${kgById.get(participant.from_kindergarten_id)?.name ?? "—"} → ${kgById.get(participant.wants_kindergarten_id)?.name ?? "—"}`;
  }

  function participantName(participant: Participant) {
    return participant.user_id === effectiveProfileId ? "Ти" : userById.get(participant.user_id)?.display_name ?? participant.participant_label;
  }

  function chatTitle(chat: Chat) {
    if (chat.chat_type === "group") return "Групов чат";
    const otherId = chat.direct_user_1_id === effectiveProfileId ? chat.direct_user_2_id : chat.direct_user_1_id;
    return `Лично: ${userById.get(otherId ?? "")?.display_name ?? "родител"}`;
  }

  async function createRequest(input: { fromKindergartenId: string; wantedKindergartenId: string; ageGroup: string; requestType: string }) {
    if (!effectiveProfileId) return setError("Липсва избран профил.");
    if (!input.fromKindergartenId || !input.wantedKindergartenId) return setError("Избери текуща и желана градина.");
    if (input.fromKindergartenId === input.wantedKindergartenId) return setError("Текущата и желаната градина трябва да са различни.");
    await run({ action: "createRequest", userId: effectiveProfileId, fromKindergartenId: input.fromKindergartenId, wantedKindergartenId: input.wantedKindergartenId, ageGroup: input.ageGroup, requestType: input.requestType });
  }

  async function deactivateRequest(requestId: string) { await run({ action: "deactivateRequest", requestId }); }
  async function deleteRequest(requestId: string) { await run({ action: "deleteRequest", requestId }); }
  async function confirmMatch() { if (activeMatch && effectiveProfileId) await run({ action: "confirm", matchId: activeMatch.id, userId: effectiveProfileId }); }
  async function declineMatch() { if (activeMatch && effectiveProfileId) await run({ action: "decline", matchId: activeMatch.id, userId: effectiveProfileId }); }
  async function updateMyStatus(status: string) { if (activeMatch && effectiveProfileId) await run({ action: "status", matchId: activeMatch.id, userId: effectiveProfileId, status }); }
  async function sendMessage(body = messageBody) { if (selectedChat && effectiveProfileId && body.trim()) await run({ action: "message", chatId: selectedChat.id, userId: effectiveProfileId, body }); }

  useEffect(() => {
    playgroundApi()
      .then((data) => {
        setSnapshot(data);
        setSelectedProfileId(data.users[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

  useEffect(() => {
    if (!selectedChatId && availableChats[0]) setSelectedChatId(availableChats[0].id);
  }, [availableChats, selectedChatId]);

  return {
    snapshot,
    users: scenarioUsers,
    selectedProfileId: effectiveProfileId,
    selectedProfileName: selectedProfile?.display_name ?? "Родител A",
    setSelectedProfileId,
    kindergartens: snapshot?.kindergartens ?? [],
    myRequests,
    requestToText,
    createRequest,
    deactivateRequest,
    deleteRequest,
    activeMatch,
    activeParticipant,
    participants,
    participantRoute,
    participantName,
    allConfirmed,
    matchIsClosed,
    confirmMatch,
    declineMatch,
    updateMyStatus,
    chats: availableChats,
    selectedChat,
    selectedChatId: selectedChat?.id ?? "",
    setSelectedChatId,
    chatTitle,
    messages,
    messageBody,
    setMessageBody,
    sendMessage,
    loading,
    error,
  };
}
