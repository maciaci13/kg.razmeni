"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };

type Scenario = 2 | 3 | 4;

async function playgroundApi(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Playground request failed");
  return json;
}

export function usePlaygroundController() {
  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const [scenario] = useState<Scenario>(3);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarioUsers = useMemo(() => (snapshot?.users ?? []).slice(0, scenario), [snapshot, scenario]);
  const selectedProfile = scenarioUsers.find((user) => user.id === selectedProfileId) ?? scenarioUsers[0];
  const effectiveProfileId = selectedProfile?.id ?? "";

  const kgById = useMemo(() => new Map((snapshot?.kindergartens ?? []).map((kg) => [kg.id, kg])), [snapshot]);
  const wantedByRequestId = useMemo(() => {
    const map = new Map<string, PlaygroundSnapshot["wantedKindergartens"][number]>();
    for (const wanted of snapshot?.wantedKindergartens ?? []) map.set(wanted.request_id, wanted);
    return map;
  }, [snapshot]);

  const myRequests = useMemo(() => {
    if (!snapshot || !effectiveProfileId) return [];
    return snapshot.requests.filter((request) => request.user_id === effectiveProfileId);
  }, [snapshot, effectiveProfileId]);

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

  async function createRequest(input: { fromKindergartenId: string; wantedKindergartenId: string; ageGroup: string; requestType: string }) {
    if (!effectiveProfileId) return setError("Липсва избран профил.");
    if (!input.fromKindergartenId || !input.wantedKindergartenId) return setError("Избери текуща и желана градина.");
    if (input.fromKindergartenId === input.wantedKindergartenId) return setError("Текущата и желаната градина трябва да са различни.");
    await run({ action: "createRequest", userId: effectiveProfileId, fromKindergartenId: input.fromKindergartenId, wantedKindergartenId: input.wantedKindergartenId, ageGroup: input.ageGroup, requestType: input.requestType });
  }

  async function deactivateRequest(requestId: string) {
    await run({ action: "deactivateRequest", requestId });
  }

  async function deleteRequest(requestId: string) {
    await run({ action: "deleteRequest", requestId });
  }

  useEffect(() => {
    playgroundApi()
      .then((data) => {
        setSnapshot(data);
        setSelectedProfileId(data.users[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, []);

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
    loading,
    error,
  };
}
