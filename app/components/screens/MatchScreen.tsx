"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ParticipantRow = PlaygroundSnapshot["participants"][number];

type MatchScreenProps = {
  participants?: ParticipantRow[];
  selectedProfileId?: string;
  participantRoute?: (participant: ParticipantRow) => string;
  participantName?: (participant: ParticipantRow) => string;
  allConfirmed?: boolean;
  matchIsClosed?: boolean;
  confirmMatch?: () => void | Promise<void>;
  declineMatch?: () => void | Promise<void>;
  updateMyStatus?: (status: string) => void | Promise<void>;
  loading?: boolean;
};

type Participant = {
  id: string;
  label: string;
  cardTone: "orange" | "green" | "purple";
  avatar: string;
  route: string;
  status: string;
  isMe?: boolean;
  coordinationStatus?: string;
};

const statusLabels: Record<string, string> = {
  not_started: "Още не съм започнал/а",
  checking_procedure: "Проверявам процедурата",
  contacted_kindergarten: "Свързал/а съм се със заведение",
  can_continue: "Мога да продължа",
  cannot_continue: "Не мога да продължа",
  dropped_out: "Отказвам се",
};

const toneClass: Record<Participant["cardTone"], string> = {
  orange: "bg-gradient-to-br from-[#FF8A3D] to-[#B9825A] text-white",
  green: "bg-gradient-to-br from-[#EEF5E8] to-[#D9E9CD] text-foreground",
  purple: "bg-gradient-to-br from-[#F1EBFB] to-[#DED2F5] text-foreground",
};

function FastMatchCard() {
  return (
    <button className="request-card mt-7 flex w-full items-center gap-3 px-4 py-3.5 text-left" type="button">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[17px] bg-gradient-to-br from-[#FF8A3D] to-[#B9825A] text-xl shadow-[0_10px_22px_rgba(255,138,61,0.25)]">↗</div>
      <div className="flex-1">
        <div className="place-title">По-бързо съвпадение</div>
        <div className="place-sub">Увеличи шанса — покани родители</div>
      </div>
      <span className="text-lg text-[var(--soft)]">›</span>
    </button>
  );
}

function EmptyMatchState() {
  return (
    <>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Потенциален цикъл</p>
      <h1 className="mt-2 font-display text-4xl">Няма намерено съвпадение</h1>
      <p className="mt-3 text-sm text-muted-foreground">Тук ще видиш своята покана за размяна, когато алгоритъма намери подходящо съвпадение.</p>
      <FastMatchCard />
      <button className="mt-5 h-14 w-full rounded-full bg-gradient-ember font-display text-sm font-black text-white shadow-glow" type="button">Виж поканата ›</button>
    </>
  );
}

function StepCard({ allConfirmed }: { allConfirmed: boolean }) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-[18px] shadow-[0_16px_38px_rgba(80,54,35,0.09)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 rounded-full bg-[#FF8A3D]/10 blur-sm" />
      <div className="relative z-10 grid grid-cols-[1fr_126px] gap-2.5">
        <div>
          <div className="mb-3 flex h-[38px] w-max items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A3D] to-[#C98555] px-4 font-display text-[13px] font-black tracking-[-0.02em] text-white shadow-[0_12px_24px_rgba(255,138,61,0.20)]">Стъпка: {allConfirmed ? "2" : "1"}/6</div>
          <h2 className="max-w-[190px] font-display text-[20px] font-black leading-[1.08] tracking-[-0.05em] text-foreground">{allConfirmed ? "Отвори чата и пиши с другите родители" : "Потвърди интерес към потенциалния цикъл"}</h2>
          <a href="#chat" className="mt-3 inline-flex h-10 min-w-[86px] items-center justify-center rounded-full border-2 border-[#B8A898] bg-white px-[18px] font-display text-sm font-black text-[#5A4039] shadow-[0_12px_26px_rgba(80,54,35,0.10)]">Чат ›</a>
        </div>
        <div className="relative h-[120px] translate-y-[33px]"><span className="absolute left-[10px] top-[11px] z-0 h-[74px] w-0.5 bg-[repeating-linear-gradient(to_bottom,rgba(83,54,48,.22)_0_6px,transparent_6px_13px)]" /><MiniStep top="top-0" label="Потвърждение" tone={allConfirmed ? "done" : "active"} /><MiniStep top="top-11" label="Координация" tone={allConfirmed ? "active" : "next"} /><MiniStep top="top-[88px]" label="Процедура" tone="next" /></div>
      </div>
    </section>
  );
}

function MiniStep({ top, label, tone }: { top: string; label: string; tone: "done" | "active" | "next" }) {
  if (tone === "done") return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-[11px] font-extrabold leading-none tracking-[-0.02em] text-[#9AA486]`}><span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#DFE8CF] text-[#5F7D33]"><Check className="h-3 w-3" /></span><span>{label}</span></div>;
  if (tone === "active") return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-xs font-extrabold leading-none tracking-[-0.02em] text-foreground`}><span className="h-[22px] w-[22px] rounded-full border-[5px] border-[#FF8A3D] bg-white shadow-[0_8px_18px_rgba(255,138,61,0.25)]" /><span>{label}</span></div>;
  return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-[11px] font-extrabold leading-none tracking-[-0.02em] text-[#A79A91] opacity-70`}><span className="relative grid h-3 w-3 place-self-center rounded-full bg-white shadow-[0_0_0_10px_#fff] after:absolute after:inset-[-6px] after:z-[2] after:rounded-full after:border-2 after:border-dashed after:border-[rgba(83,54,48,0.18)]" /><span>{label}</span></div>;
}

function ParticipantCard({ participant, updateMyStatus }: { participant: Participant; updateMyStatus?: (status: string) => void | Promise<void> }) {
  return (
    <section className={`mb-2.5 flex gap-3 rounded-[28px] border border-white/90 p-4 shadow-[0_14px_34px_rgba(80,54,35,0.09)] ${toneClass[participant.cardTone]}`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-black ${participant.isMe ? "bg-white/20" : "bg-white/45"}`}>{participant.avatar}</div>
      <div><div className="font-display text-base font-black tracking-[-0.04em]">{participant.label}</div><div className={`mt-1 font-body text-[13px] leading-tight ${participant.isMe ? "text-white/80" : "text-[#7B6E67]"}`}>{participant.route}</div>{participant.isMe ? <select value={participant.coordinationStatus ?? "not_started"} onChange={(event) => updateMyStatus?.(event.target.value)} className="mt-2.5 h-[31px] rounded-full border-0 bg-white/25 px-3.5 pr-7 font-display text-xs font-black text-white outline-none"><option value="not_started">Още не съм започнал/а</option><option value="checking_procedure">Проверявам процедурата</option><option value="contacted_kindergarten">Свързал/а съм се със заведение</option><option value="can_continue">Мога да продължа</option><option value="cannot_continue">Не мога да продължа</option></select> : <div className="mt-2.5 inline-flex h-[31px] items-center rounded-full bg-[#533630]/10 px-3.5 font-display text-xs font-black text-[#7B6E67]">{participant.status}</div>}</div>
    </section>
  );
}

function ProcessMapModal({ participants, onClose }: { participants: Participant[]; onClose: () => void }) {
  const visible = participants.slice(0, 4);
  const positions = [
    { node: "left-[25%] top-[20%]", label: "left-[5%] top-[6%]", color: "#FF8A3D" },
    { node: "right-[16%] top-[34%]", label: "right-[7%] top-[56%]", color: "#7AA653" },
    { node: "left-[38%] top-[58%]", label: "left-[19%] top-[82%]", color: "#8E60D8" },
    { node: "left-[26%] top-[58%]", label: "left-[4%] top-[82%]", color: "#6DAAC2" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211712]/20 p-[18px] backdrop-blur-[10px]" onClick={onClose}>
      <div className="relative w-full max-w-[390px] rounded-[32px] border border-white/90 bg-white/95 px-[18px] pb-[18px] pt-[52px] shadow-[0_24px_70px_rgba(33,23,18,0.20)]" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-20 grid h-[38px] w-[38px] place-items-center rounded-2xl bg-white font-display text-[22px] font-black text-[#5A4039] shadow-[0_10px_22px_rgba(80,54,35,0.08)]">×</button>
        <h2 className="font-display text-[30px] font-black leading-none tracking-[-0.06em] text-[#111827]">Схема на процеса</h2>
        <div className="relative mt-5 h-[420px] overflow-hidden rounded-[28px] bg-[#FBFAF6]">
          <span className="absolute left-[33%] top-[31%] h-2 w-2 rounded-full bg-[#FF8A3D]" /><span className="absolute left-[40%] top-[33%] h-2 w-2 rounded-full bg-[#FF8A3D]" /><span className="absolute left-[47%] top-[35%] h-2 w-2 rounded-full bg-[#FF8A3D]" /><span className="absolute left-[54%] top-[37%] h-2 w-2 rounded-full bg-[#FF8A3D]" /><span className="absolute left-[61%] top-[39%] h-2 w-2 rounded-full bg-[#FF8A3D]" />
          <span className="absolute left-[71%] top-[48%] h-2 w-2 rounded-full bg-[#7AA653]" /><span className="absolute left-[67%] top-[55%] h-2 w-2 rounded-full bg-[#7AA653]" /><span className="absolute left-[61%] top-[61%] h-2 w-2 rounded-full bg-[#7AA653]" /><span className="absolute left-[54%] top-[66%] h-2 w-2 rounded-full bg-[#7AA653]" /><span className="absolute left-[47%] top-[70%] h-2 w-2 rounded-full bg-[#7AA653]" />
          <span className="absolute left-[28%] top-[35%] h-2 w-2 rounded-full bg-[#8E60D8]" /><span className="absolute left-[25%] top-[43%] h-2 w-2 rounded-full bg-[#8E60D8]" /><span className="absolute left-[24%] top-[51%] h-2 w-2 rounded-full bg-[#8E60D8]" /><span className="absolute left-[27%] top-[59%] h-2 w-2 rounded-full bg-[#8E60D8]" /><span className="absolute left-[33%] top-[66%] h-2 w-2 rounded-full bg-[#8E60D8]" />
          {visible.map((participant, index) => (
            <div key={participant.id}>
              <div className={`absolute ${positions[index].node} z-10 grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-[0_18px_36px_rgba(80,54,35,0.12)]`}><span className="h-5 w-5 rounded-full" style={{ backgroundColor: positions[index].color }} /></div>
              <div className={`absolute ${positions[index].label} z-20 max-w-[210px] rounded-full bg-white px-4 py-2.5 text-center font-display text-[13px] font-black leading-tight tracking-[-0.03em] text-[#17120F] shadow-[0_12px_28px_rgba(80,54,35,0.08)]`}>{participant.route.split("→")[0].trim()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MatchScreen({ participants = [], selectedProfileId = "", participantRoute, participantName, allConfirmed = false, matchIsClosed = false, confirmMatch, declineMatch, updateMyStatus, loading = false }: MatchScreenProps) {
  const [showMap, setShowMap] = useState(false);
  if (!participants.length) return <EmptyMatchState />;

  const visibleParticipants: Participant[] = participants.map((participant, index) => {
    const isMe = participant.user_id === selectedProfileId;
    return { id: participant.id, label: isMe ? "Ти" : participantName?.(participant) ?? participant.participant_label, avatar: isMe ? "Ти" : String(index + 1), cardTone: isMe ? "orange" : index % 2 ? "green" : "purple", route: participantRoute?.(participant) ?? "— → —", status: participant.confirmation_status === "pending" ? "Очаква потвърждение" : statusLabels[participant.coordination_status] ?? participant.coordination_status, isMe, coordinationStatus: participant.coordination_status };
  });

  return (
    <>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{allConfirmed ? "Статус в прогрес" : "Покана за цикъл"}</p>
      <h1 className="mt-2 font-display text-4xl">{allConfirmed ? "Координация" : "Потенциален цикъл"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{allConfirmed ? "Следи кой на какъв етап е и ъпдейтвай своя статус." : "Потвърди интерес, за да се отключи координацията."}</p>
      {!allConfirmed ? <div className="mt-5 grid grid-cols-[1fr_2fr] gap-2.5"><button disabled={loading || matchIsClosed} onClick={declineMatch} className="h-12 rounded-full bg-white/75 font-display text-sm font-black text-[#5A4039] shadow-soft">Не мога</button><button disabled={loading || matchIsClosed} onClick={confirmMatch} className="h-12 rounded-full bg-gradient-ember font-display text-sm font-black text-white shadow-glow">Потвърждавам ›</button></div> : null}
      <StepCard allConfirmed={allConfirmed} />
      <div className="mt-5 flex items-center justify-between"><h2 className="font-display text-[22px] font-black tracking-[-0.04em]">Процес</h2><button onClick={() => setShowMap(true)} className="border-0 bg-transparent p-0 font-display text-sm font-black text-[#8B5F47]">Виж още</button></div>
      <div className="mt-2.5">{visibleParticipants.map((participant) => <ParticipantCard key={participant.id} participant={participant} updateMyStatus={updateMyStatus} />)}</div>
      <button disabled={loading} onClick={declineMatch} className="mt-5 h-14 w-full rounded-full bg-[rgba(180,50,40,0.07)] font-display text-sm font-black text-[#8A2820]">Отказ от процеса</button>
      {showMap ? <ProcessMapModal participants={visibleParticipants} onClose={() => setShowMap(false)} /> : null}
    </>
  );
}
