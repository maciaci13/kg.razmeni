"use client";

import { useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";
import type { Participant } from "../types";
import { AppSection, CycleMap, EmptyCard, PageTitle, Timeline } from "../shared/ui";

export function MatchScreen({ activeMatch, activeParticipant, participants, selectedProfileId, userById, fromToText, allConfirmed, matchIsClosed, currentStep, currentStepInfo, loading, confirm, decline, updateMyStatus, leave }: { activeMatch?: PlaygroundSnapshot["matches"][number]; activeParticipant?: Participant; participants: Participant[]; selectedProfileId: string; userById: Map<string, PlaygroundSnapshot["users"][number]>; fromToText: (p: Participant) => string; allConfirmed: boolean; matchIsClosed: boolean; currentStep: number; currentStepInfo: { title: string; helper: string }; loading: boolean; confirm: () => void; decline: () => void; updateMyStatus: (status: string) => void; leave: () => void }) {
  const [showTimeline, setShowTimeline] = useState(false);

  if (!activeMatch || !activeParticipant) {
    return <AppSection><PageTitle eyebrow="Match" title="Още няма цикъл" body="Когато има потенциално съвпадение, заявката се скрива и тук се появява поканата." /><EmptyCard title="Няма match" body="Пусни заявка или използвай симулатора от профила за тестове." /></AppSection>;
  }

  if (activeParticipant.confirmation_status === "pending" && !matchIsClosed) {
    return <AppSection><PageTitle eyebrow="Match покана" title="Има потенциален цикъл" body="Заявката ти вече е скрита. Потвърди интерес, за да се отключи координацията." /><section className="rounded-[2.2rem] bg-white/90 p-4 shadow-soft backdrop-blur"><CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} readOnly /><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={loading} onClick={confirm} className="rounded-full bg-orange px-3 py-4 text-sm font-extrabold text-white">Приемам</button><button type="button" disabled={loading} onClick={decline} className="rounded-full bg-paper px-3 py-4 text-sm font-extrabold">Отказвам</button></div></section></AppSection>;
  }

  return <AppSection><PageTitle eyebrow="Статус в прогрес" title={matchIsClosed ? "Отказано" : "Координация"} body={matchIsClosed ? "Процесът е затворен след отказ." : "Следи кой на какъв етап е и промени само своя статус."} /><section className="rounded-[2.2rem] bg-white/90 p-4 shadow-soft backdrop-blur"><button type="button" onClick={() => setShowTimeline((v) => !v)} className={`flex w-full items-center justify-between gap-4 rounded-[1.6rem] px-5 py-4 text-left shadow-sm ${matchIsClosed ? "bg-red-100" : "bg-lime"}`}><div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-ink/45">Стъпка {currentStep || 1} от 6</p><p className="mt-2 text-lg font-extrabold leading-tight">{currentStepInfo.title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/60">{currentStepInfo.helper}</p></div><span className={`playground-toggle-icon ${showTimeline ? "is-open" : ""}`} /></button>{showTimeline ? <Timeline currentStep={currentStep} rejected={matchIsClosed} /> : null}{!matchIsClosed ? <CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} loading={loading} updateMyStatus={updateMyStatus} /> : <EmptyCard title="Веригата е затворена" body="Чатовете вече не се показват за този процес." />}{!matchIsClosed ? <button type="button" onClick={leave} className="mt-5 w-full rounded-full bg-paper px-4 py-4 text-sm font-extrabold">Отказ от процеса</button> : null}</section></AppSection>;
}
