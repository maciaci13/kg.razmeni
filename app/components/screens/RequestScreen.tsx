"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import type { PlaygroundSnapshot } from "@/lib/playground";
import { EmptyCard, SelectField } from "../shared/ui";
import { placeTypes } from "../types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function PlaceTypeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Тип място">
      <div className="flex flex-wrap gap-3">
        {placeTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`min-h-14 rounded-full px-6 text-[15px] font-extrabold transition-all duration-200 ${
              value === type
                ? "bg-gradient-ember text-primary-foreground shadow-pill scale-[1.01]"
                : "bg-card text-secondary-foreground border border-border/70 shadow-soft"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-2xl px-1 py-2">
        <div className="h-7 w-7 rounded-xl border border-border bg-card shadow-soft" />
        <span className="text-[15px] font-medium text-muted-foreground">
          Запази тези данни в профила ми
        </span>
      </label>
    </Field>
  );
}

function RequestCard({ text, ageGroup, active, locked, placeType, onDeactivate, onDelete, loading, index }: { text: string; ageGroup: string; active: boolean; locked: boolean; placeType: string; onDeactivate: () => void; onDelete: () => void; loading: boolean; index: number }) {
  const [from, to = "—"] = text.split(" → ");
  const tone = index % 2 === 0 ? "bg-gradient-sage" : "bg-gradient-mist";

  return (
    <div className={`${tone} relative min-w-[88%] snap-start overflow-hidden rounded-[2rem] p-5 shadow-soft`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,white_0%,transparent_24%)] opacity-[0.14]" />

      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground/62">
          {active ? "Активна" : "Неактивна"} · {placeType}
        </span>

        <button type="button" className="liquid-action flex h-10 w-10 items-center justify-center rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mt-5 space-y-1">
        <div className="font-display text-[1.4rem] leading-tight">{from}</div>
        <div className="text-lg text-foreground/55">→</div>
        <div className="font-display text-[1.4rem] leading-tight">{to}</div>
      </div>

      <div className="mt-3 text-[13px] font-medium text-foreground/62">Набор {ageGroup}</div>

      <div className="relative mt-5 flex gap-2">
        <button type="button" disabled={loading || !active} onClick={onDeactivate} className="h-10 rounded-full bg-white/72 px-5 text-[11px] font-black uppercase tracking-[0.18em] shadow-soft backdrop-blur-xl disabled:opacity-35">
          {locked ? "Съвпадение" : "Деактивирай"}
        </button>
        <button type="button" disabled={loading || locked} onClick={onDelete} className="h-10 rounded-full bg-white/45 px-4 text-[11px] font-black uppercase tracking-[0.18em] shadow-soft backdrop-blur-xl disabled:opacity-35">
          Изтрий
        </button>
      </div>
    </div>
  );
}

export function RequestScreen({ snapshot, selectedProfileId, selectedPlaceType, setSelectedPlaceType, myRequests, kgById, requestToText, createRequest, deactivateRequest, deleteRequest, loading }: { snapshot: PlaygroundSnapshot | null; selectedProfileId: string; selectedPlaceType: string; setSelectedPlaceType: (value: string) => void; myRequests: PlaygroundSnapshot["requests"]; kgById: Map<string, PlaygroundSnapshot["kindergartens"][number]>; requestToText: (requestId: string) => string; createRequest: (data: { fromKgId: string; wantedKgId: string; ageGroup: string }) => void; deactivateRequest: (id: string) => void; deleteRequest: (id: string) => void; loading: boolean }) {
  const [open, setOpen] = useState(true);
  const [fromKgId, setFromKgId] = useState("");
  const [wantedKgId, setWantedKgId] = useState("");
  const [ageGroup, setAgeGroup] = useState("2019");
  const kindergartens = snapshot?.kindergartens ?? [];

  return (
    <>
      <div className="space-y-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary">Нова заявка</p>
        <h1 className="font-display max-w-[92%] text-[3rem] leading-[0.95] text-balance">
          Къде сте и къде искате да сте?
        </h1>
        <p className="max-w-[92%] text-[15px] leading-7 text-muted-foreground">
          Избери сегашно и желано място. Съвпадението работи само между еднакъв тип места.
        </p>
      </div>

      <div className="relative mt-8 overflow-visible rounded-[2rem] border border-white/80 bg-card/92 shadow-soft backdrop-blur-xl">
        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-6">
          <span className="font-display text-[1.55rem] tracking-[-0.04em]">Активирай заявка</span>
          <div className="liquid-action flex h-10 w-10 items-center justify-center rounded-2xl">
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {open ? (
          <div className="space-y-6 overflow-visible px-5 pb-7">
            <Field label="Район">
              <SelectField value="" onChange={() => undefined}>
                <option value="">Избери район</option>
              </SelectField>
            </Field>

            <Field label="Набор / Група">
              <input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="min-h-16 w-full rounded-[1.8rem] border border-white/80 bg-card/82 px-5 text-[15px] font-bold text-secondary-foreground shadow-soft outline-none backdrop-blur-xl transition-all hover:scale-[1.01]" />
            </Field>

            <PlaceTypeSelector value={selectedPlaceType} onChange={setSelectedPlaceType} />

            <div className="space-y-4 pt-1">
              <Field label="Сегашна градина">
                <SelectField value={fromKgId} onChange={setFromKgId}>
                  <option value="">Избери сегашна градина</option>
                  {kindergartens.map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
                </SelectField>
              </Field>

              <div className="relative z-10 -my-1 flex justify-center">
                <button type="button" className="liquid-action flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-muted-foreground shadow-soft">
                  ↕
                </button>
              </div>

              <Field label="Желана градина">
                <SelectField value={wantedKgId} onChange={setWantedKgId}>
                  <option value="">Избери желана градина</option>
                  {kindergartens.map((kg) => <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>)}
                </SelectField>
              </Field>
            </div>

            <button type="button" disabled={loading || !selectedProfileId || !fromKgId || !wantedKgId} onClick={() => createRequest({ fromKgId, wantedKgId, ageGroup })} className="mt-2 h-16 w-full rounded-full bg-gradient-ember text-lg font-extrabold text-primary-foreground shadow-glow disabled:opacity-40">
              Активирай заявка
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-[1.8rem] border border-white/70 bg-card/70 px-6 py-5 shadow-soft backdrop-blur-xl">
        <p className="text-[14px] leading-7 text-muted-foreground">
          Заявката ще се скрие автоматично при потенциален цикъл.
        </p>
      </div>

      <h2 className="mt-12 font-display text-[2rem] tracking-[-0.05em]">Моите заявки</h2>

      {myRequests.length ? (
        <div className="-mx-5 mt-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
          {myRequests.map((r, index) => (
            <RequestCard key={r.id} index={index} text={`${kgById.get(r.from_kindergarten_id)?.name ?? "—"} → ${requestToText(r.id)}`} ageGroup={r.child_group_year_or_age_group} active={r.is_active} locked={r.is_locked} placeType={selectedPlaceType} onDeactivate={() => deactivateRequest(r.id)} onDelete={() => deleteRequest(r.id)} loading={loading} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyCard title="Няма активна заявка" body="Попълни формата горе, за да стартираш търсене на съвпадение." />
        </div>
      )}

      <div className="relative mt-7 flex items-center gap-4 overflow-hidden rounded-[2rem] bg-gradient-butter p-4 pr-5 shadow-soft">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

        <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-gradient-ember shadow-pill">
          <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
        </div>

        <div className="relative flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
            По-бързо съвпадение
          </p>
          <p className="mt-1 font-display text-lg">Увеличи шанса за съвпадение</p>
        </div>
      </div>
    </>
  );
}
