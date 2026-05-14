"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const currentStep = { index: 2, total: 6, title: "Отвори чата и пиши с другите родители" };

const participants = [
  { id: "me", label: "Ти", avatar: "Ти", cardTone: "orange", route: "ДГ №25 Изворче → ДГ №25 Изворче – сграда 2", status: "Още не съм започнал/а", isMe: true },
  { id: "parent-c", label: "Родител C", avatar: "1", cardTone: "green", route: "ДГ №25 Изворче – сграда 3 → ДГ №25 Изворче", status: "Още не съм започнал/а" },
  { id: "parent-b", label: "Родител Б", avatar: "Б", cardTone: "purple", route: "ДГ №25 Изворче – сграда 2 → ДГ №25 Изворче – сграда 3", status: "Още не съм започнал/а" }
] as const;

const mapNodes = [
  { id: "sun", label: "ДГ 25 „Слънчеви лъчи“", color: "#FF7A22", dotClass: "left-[64px] top-[34px]", labelClass: "left-[14px] top-[110px]" },
  { id: "rainbow", label: "ДГ 30 „Дъга“ — филиал Изток", color: "#79A758", dotClass: "left-[226px] top-[144px]", labelClass: "right-0 top-[212px]" },
  { id: "bear", label: "ДГ 184 „Мечо Пух“ — ясла", color: "#8D66D7", dotClass: "left-[96px] top-[218px]", labelClass: "left-[54px] top-[282px]" }
];

const toneClass = {
  orange: "bg-gradient-to-br from-[#FF8A3D] to-[#B9825A] text-white",
  green: "bg-gradient-to-br from-[#EEF5E8] to-[#D9E9CD] text-foreground",
  purple: "bg-gradient-to-br from-[#F1EBFB] to-[#DED2F5] text-foreground"
};

function MiniStep({ top, label, tone }: { top: string; label: string; tone: "done" | "active" | "next" }) {
  if (tone === "done") return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-[11px] font-extrabold leading-none tracking-[-0.02em] text-[#9AA486]`}><span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#DFE8CF] text-[#5F7D33]"><Check className="h-3 w-3" /></span><span>{label}</span></div>;
  if (tone === "active") return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-xs font-extrabold leading-none tracking-[-0.02em] text-foreground`}><span className="h-[22px] w-[22px] rounded-full border-[5px] border-[#FF8A3D] bg-white shadow-[0_8px_18px_rgba(255,138,61,0.25)]" /><span>{label}</span></div>;
  return <div className={`absolute left-0 ${top} z-10 grid h-[22px] grid-cols-[22px_1fr] items-center gap-2 font-display text-[11px] font-extrabold leading-none tracking-[-0.02em] text-[#A79A91] opacity-70`}><span className="relative grid h-3 w-3 place-self-center rounded-full bg-white shadow-[0_0_0_10px_#fff] before:absolute before:inset-[-9px] before:z-[1] before:rounded-full before:bg-white after:absolute after:inset-[-6px] after:z-[2] after:rounded-full after:border-2 after:border-dashed after:border-[rgba(83,54,48,0.18)]" /><span>{label}</span></div>;
}

function StepCard() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-[18px] shadow-[0_16px_38px_rgba(80,54,35,0.09)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 rounded-full bg-[#FF8A3D]/10 blur-sm" />
      <svg className="pointer-events-none absolute bottom-[-28px] right-7 h-32 w-32 rotate-[17deg] text-[#B8A898] opacity-[0.045]" viewBox="0 0 120 120" fill="none">
        <path d="M34 23h45c8 0 15 7 15 15v49c0 8-7 15-15 15H34c-8 0-15-7-15-15V38c0-8 7-15 15-15Z" stroke="currentColor" strokeWidth="9" />
        <path d="M39 43h38M39 60h30M39 77h24" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <path d="M82 76l12 12 18-22" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative z-10 grid grid-cols-[1fr_126px] gap-2.5">
        <div>
          <div className="mb-3 flex h-[38px] w-max items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A3D] to-[#C98555] px-4 font-display text-[13px] font-black tracking-[-0.02em] text-white shadow-[0_12px_24px_rgba(255,138,61,0.20)]">Стъпка: {currentStep.index}/{currentStep.total}</div>
          <h2 className="max-w-[190px] font-display text-[20px] font-black leading-[1.08] tracking-[-0.05em] text-foreground">{currentStep.title}</h2>
          <a href="#chat" className="mt-3 inline-flex h-10 min-w-[86px] items-center justify-center rounded-full border-2 border-[#B8A898] bg-white px-[18px] font-display text-sm font-black text-[#5A4039] shadow-[0_12px_26px_rgba(80,54,35,0.10)]">Чат ›</a>
        </div>
        <div className="relative h-[120px] translate-y-[33px]">
          <span className="absolute left-[10px] top-[11px] z-0 h-[74px] w-0.5 bg-[repeating-linear-gradient(to_bottom,rgba(83,54,48,.22)_0_6px,transparent_6px_13px)]" />
          <MiniStep top="top-0" label="Потвърждение" tone="done" />
          <MiniStep top="top-11" label="Координация" tone="active" />
          <MiniStep top="top-[88px]" label="Процедура" tone="next" />
        </div>
      </div>
    </section>
  );
}

function ProcessMap({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[26px] border border-black/5 bg-[#FBFAF6] ${compact ? "h-[360px]" : "h-[430px]"}`}>
      <div className="absolute inset-0 opacity-45" style={{ backgroundImage: "linear-gradient(rgba(90,74,58,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(90,74,58,.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className={`absolute left-1/2 top-1/2 ${compact ? "h-[300px] w-[320px]" : "h-[430px] w-[360px]"} -translate-x-1/2 -translate-y-1/2`}>
        <svg viewBox="0 0 320 300" className="absolute inset-0 z-[1] h-full w-full" fill="none">
          <path d="M88 72 C124 94 174 111 230 126" stroke="#FF7A22" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 17" />
          <path d="M230 166 C196 214 158 235 101 252" stroke="#79A758" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 18" />
          <path d="M68 93 C52 158 58 203 90 252" stroke="#8D66D7" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 18" />
        </svg>
        {mapNodes.map((node) => <div key={node.id}><div className={`absolute z-[3] ${node.dotClass}`}><div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white shadow-[0_18px_34px_rgba(41,32,24,0.10)]"><span className="h-[26px] w-[26px] rounded-full border-[9px] border-white/70" style={{ background: node.color }} /></div></div><div className={`absolute z-[4] whitespace-nowrap rounded-full bg-white px-[13px] py-2 font-display text-[11px] font-black text-foreground shadow-[0_12px_24px_rgba(32,25,21,0.08)] ${node.labelClass}`}>{node.label}</div></div>)}
      </div>
    </div>
  );
}

function ParticipantCard({ participant }: { participant: (typeof participants)[number] }) {
  return (
    <section className={`mb-2.5 flex gap-3 rounded-[28px] border border-white/90 p-4 shadow-[0_14px_34px_rgba(80,54,35,0.09)] ${toneClass[participant.cardTone]}`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-black ${participant.isMe ? "bg-white/20" : "bg-white/45"}`}>{participant.avatar}</div>
      <div>
        <div className="font-display text-base font-black tracking-[-0.04em]">{participant.label}</div>
        <div className={`mt-1 font-body text-[13px] leading-tight ${participant.isMe ? "text-white/80" : "text-[#7B6E67]"}`}>{participant.route}</div>
        {participant.isMe ? <select className="mt-2.5 h-[31px] rounded-full border-0 bg-white/25 px-3.5 pr-7 font-display text-xs font-black text-white outline-none"><option>Още не съм започнал/а</option><option>Пиша в чата</option><option>Готов/а съм да продължа</option><option>Имам въпрос</option></select> : <div className="mt-2.5 inline-flex h-[31px] items-center rounded-full bg-[#533630]/10 px-3.5 font-display text-xs font-black text-[#7B6E67]">{participant.status}</div>}
      </div>
    </section>
  );
}

function ProcessPopup({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211712]/20 p-[18px] backdrop-blur-[10px]" onClick={onClose}><div className="relative max-h-[86vh] w-full max-w-[390px] overflow-hidden rounded-[32px] border border-white/90 bg-white/95 p-[18px] shadow-[0_24px_70px_rgba(33,23,18,0.20)]" onClick={(event) => event.stopPropagation()}><button onClick={onClose} className="absolute right-4 top-4 grid h-[38px] w-[38px] place-items-center rounded-2xl bg-white font-display text-[22px] font-black text-[#5A4039]">×</button><h2 className="font-display text-2xl font-black tracking-[-0.04em]">Схема на процеса</h2><div className="mt-3.5"><ProcessMap compact /></div></div></div>;
}

export function MatchScreen() {
  const [showMap, setShowMap] = useState(false);
  return (
    <>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Статус в прогрес</p>
      <h1 className="mt-2 font-display text-4xl">Координация</h1>
      <p className="mt-3 text-sm text-muted-foreground">Следи кой на какъв етап е<br />и ъпдейтвай своя статус.</p>
      <StepCard />
      <div className="mt-5 flex items-center justify-between"><h2 className="font-display text-[22px] font-black tracking-[-0.04em]">Процес</h2><button onClick={() => setShowMap(true)} className="border-0 bg-transparent p-0 font-display text-sm font-black text-[#8B5F47]">Виж още</button></div>
      <div className="mt-2.5">{participants.map((participant) => <ParticipantCard key={participant.id} participant={participant} />)}</div>
      <button className="mt-5 h-14 w-full rounded-full bg-[rgba(180,50,40,0.07)] font-display text-sm font-black text-[#8A2820]">Отказ от процеса</button>
      {showMap ? <ProcessPopup onClose={() => setShowMap(false)} /> : null}
    </>
  );
}
