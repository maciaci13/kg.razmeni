"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

const types = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-extrabold mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

function Select({ placeholder }: { placeholder: string }) {
  return (
    <button className="w-full min-h-16 rounded-[1.8rem] bg-card/82 backdrop-blur-xl border border-white/80 px-5 flex items-center justify-between text-[15px] font-bold text-secondary-foreground shadow-soft transition-all hover:scale-[1.01]">
      <span className="text-left">{placeholder}</span>
      <ChevronDown className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

export function RequestScreen() {
  const [open, setOpen] = useState(true);
  const [type, setType] = useState("Общ ред");

  return (
    <>
      <div className="space-y-3">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-extrabold">Нова заявка</p>
        <h1 className="font-display text-[3rem] leading-[0.95] text-balance max-w-[92%]">
          Къде сте и къде искате да сте?
        </h1>
        <p className="text-[15px] leading-7 text-muted-foreground max-w-[92%]">
          Избери сегашно и желано място. Съвпадението работи само между еднакъв тип места.
        </p>
      </div>

      <div className="mt-8 rounded-[2rem] bg-card/92 backdrop-blur-xl border border-white/80 shadow-soft overflow-visible relative">
        <button onClick={() => setOpen(!open)} className="w-full px-6 py-6 flex items-center justify-between">
          <span className="font-display text-[1.55rem] tracking-[-0.04em]">Активирай заявка</span>
          <div className="liquid-action h-10 w-10 rounded-2xl flex items-center justify-center">
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {open && (
          <div className="px-5 pb-7 space-y-6 overflow-visible">
            <Field label="Район"><Select placeholder="Избери район" /></Field>
            <Field label="Набор / Група"><Select placeholder="Избери набор / група" /></Field>

            <Field label="Тип място">
              <div className="flex flex-wrap gap-3">
                {types.map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`min-h-14 rounded-full text-[15px] font-extrabold px-6 transition-all duration-200 ${type === t ? "bg-gradient-ember text-primary-foreground shadow-pill scale-[1.01]" : "bg-card text-secondary-foreground border border-border/70 shadow-soft"}`}>
                    {t}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-3 mt-5 px-1 py-2 rounded-2xl">
                <div className="h-7 w-7 rounded-xl bg-card border border-border shadow-soft" />
                <span className="text-[15px] text-muted-foreground font-medium">Запази тези данни в профила ми</span>
              </label>
            </Field>

            <div className="space-y-4 pt-1">
              <Field label="Сегашна градина"><Select placeholder="Избери сегашна градина" /></Field>
              <div className="flex justify-center -my-1 relative z-10">
                <button className="liquid-action h-14 w-14 rounded-full flex items-center justify-center text-muted-foreground font-black text-lg shadow-soft">↕</button>
              </div>
              <Field label="Желана градина"><Select placeholder="Избери желана градина" /></Field>
            </div>

            <button className="w-full h-16 rounded-full bg-gradient-ember text-primary-foreground font-extrabold text-lg shadow-glow mt-2">
              Активирай заявка
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-[1.8rem] border border-white/70 bg-card/70 backdrop-blur-xl px-6 py-5 shadow-soft">
        <p className="text-[14px] leading-7 text-muted-foreground">Заявката ще се скрие автоматично при потенциален цикъл.</p>
      </div>

      <h2 className="font-display text-[2rem] tracking-[-0.05em] mt-12">Моите заявки</h2>

      <div className="mt-5 flex gap-4 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
        {[
          { c: "bg-gradient-sage", from: "ДГ №25 Изворче", to: "ДГ №25 Изворче — сграда 2", set: "Набор 2019", state: "Активна · Общ ред", chip: "Съвпадение" },
          { c: "bg-gradient-mist", from: "ДГ №14 Слънце", to: "ДГ №7 Звънче", set: "Набор 2020", state: "Чака · Общ ред", chip: "В търсене" }
        ].map((q, i) => (
          <div key={i} className={`${q.c} rounded-[2rem] p-5 min-w-[88%] snap-start shadow-soft relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_85%_15%,white_0%,transparent_24%)]" />
            <div className="relative flex items-center justify-between">
              <span className="text-[10px] tracking-[0.22em] uppercase font-extrabold text-foreground/62">{q.state}</span>
              <button className="liquid-action h-10 w-10 rounded-full flex items-center justify-center"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="relative mt-5 space-y-1">
              <div className="font-display text-[1.4rem] leading-tight">{q.from}</div>
              <div className="text-foreground/55 text-lg">→</div>
              <div className="font-display text-[1.4rem] leading-tight">{q.to}</div>
            </div>
            <div className="text-[13px] text-foreground/62 mt-3 font-medium">{q.set}</div>
            <button className="mt-5 px-5 h-10 rounded-full bg-white/72 backdrop-blur-xl shadow-soft text-[11px] font-black tracking-[0.18em] uppercase">{q.chip}</button>
          </div>
        ))}
      </div>

      <div className="mt-7 bg-gradient-butter rounded-[2rem] p-4 pr-5 shadow-soft flex items-center gap-4 overflow-hidden relative">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
        <div className="relative h-14 w-14 rounded-[1.4rem] bg-gradient-ember flex items-center justify-center shadow-pill">
          <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="relative flex-1">
          <p className="text-[10px] tracking-[0.22em] uppercase font-extrabold text-muted-foreground">По-бързо съвпадение</p>
          <p className="font-display text-lg mt-1">Увеличи шанса за съвпадение</p>
        </div>
      </div>
    </>
  );
}
