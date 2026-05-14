import type { Participant } from "../types";
import { participantColors, rejectedStep, statusOptions, steps } from "../types";
import type { PlaygroundSnapshot } from "@/lib/playground";

export function statusLabel(status?: string) {
  return statusOptions.find(([v]) => v === status)?.[1] ?? status ?? "—";
}

export function participantStatus(p: Participant, allConfirmed: boolean) {
  if (p.confirmation_status === "declined") return "Отказана размяна";
  if (p.confirmation_status === "pending") return "Очаква потвърждение";
  if (!allConfirmed) return "Потвърдил/а · чака останалите";
  return statusLabel(p.coordination_status);
}

export function SelectField({ value, onChange, children, className = "", disabled = false }: { value: string; onChange: (value: string) => void; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return <div className={`relative ${className}`}><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="app-select w-full appearance-none rounded-[1.35rem] border-0 bg-paper py-4 pl-4 pr-14 text-sm font-bold text-ink outline-none disabled:opacity-50">{children}</select><span className="app-select-chevron" /></div>;
}

export function AppSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

export function PageTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return <div className="px-1"><p className="text-xs font-extrabold uppercase tracking-[0.24em] text-orange">{eyebrow}</p><h1 className="mt-2 text-4xl font-extrabold leading-[0.95] tracking-[-0.055em]">{title}</h1>{body ? <p className="mt-3 text-sm font-medium leading-6 text-ink/55">{body}</p> : null}</div>;
}

export function FieldLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-extrabold uppercase tracking-[0.18em] text-ink/40 ${className}`}>{children}</label>;
}

export function EmptyCard({ title, body }: { title: string; body: string }) {
  return <section className="rounded-[2rem] bg-white/85 p-5 shadow-soft"><h3 className="text-xl font-extrabold tracking-[-0.03em]">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-ink/55">{body}</p></section>;
}

export function Bubble({ name, body, mine = false }: { name: string; body: string; mine?: boolean }) {
  return <div className={`rounded-[1.8rem] p-4 text-sm shadow-soft ${mine ? "ml-8 bg-orange text-white" : "mr-8 bg-paper"}`}><p className={`text-xs font-extrabold ${mine ? "text-white/60" : "text-ink/40"}`}>{name}</p><p className="mt-1 leading-6">{body}</p></div>;
}

export function SafetyNote() {
  return <div className="rounded-[1.7rem] bg-white/75 p-4 text-xs font-semibold leading-5 text-ink/55 shadow-soft backdrop-blur">Независима платформа за потенциални съвпадения. Не е официална услуга и не гарантира прием, преместване или размяна.</div>;
}

export function SettingsRow({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.5rem] bg-paper p-4"><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/50">{body}</p></div>;
}

export function RouteMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true"><path d="M20 36h42L82 18v84" stroke="#1C1B19" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.16"/><circle cx="83" cy="42" r="8" fill="#1C1B19" opacity="0.16"/></svg>;
}

export function Timeline({ currentStep, rejected = false }: { currentStep: number; rejected?: boolean }) {
  return <div className="mt-5 rounded-[1.75rem] bg-paper px-4 py-5">{steps.map((s, i) => { const n = i + 1; const done = n < currentStep; const current = n === currentStep; const title = rejected && n === 6 ? "Отказано" : s.title; const helper = rejected && n === 6 ? rejectedStep.helper : s.helper; return <div key={s.title} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0">{i < steps.length - 1 ? <div className={`absolute left-[0.94rem] top-8 h-[calc(100%-1.7rem)] border-l-2 border-dashed ${done ? rejected ? "border-red-300" : "border-lime" : "border-ink/15"}`} /> : null}<div className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold ${done ? rejected ? "bg-red-100 text-red-900" : "bg-lime text-ink" : current ? rejected ? "bg-red-100 text-red-900" : "bg-ink text-white" : "bg-white text-ink/35 ring-1 ring-ink/10"}`}>{done ? "✓" : rejected && current ? "!" : n}</div><div className="pt-0.5"><p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${current ? "text-ink" : "text-ink/40"}`}>Стъпка {n}</p><p className={`mt-1 text-sm font-extrabold ${current ? "text-ink" : "text-ink/65"}`}>{title}</p><p className="mt-1 text-xs font-medium leading-5 text-ink/45">{helper}</p></div></div>; })}</div>;
}

export function CycleMap({ participants, selectedProfileId, userById, fromToText, allConfirmed, loading = false, updateMyStatus, readOnly = false }: { participants: Participant[]; selectedProfileId: string; userById: Map<string, PlaygroundSnapshot["users"][number]>; fromToText: (p: Participant) => string; allConfirmed: boolean; loading?: boolean; updateMyStatus?: (status: string) => void; readOnly?: boolean }) {
  if (!participants.length) return null;
  return <div className="mt-5 rounded-[1.75rem] bg-paper p-4"><p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-ink/40">Верига и статуси</p><div className="space-y-3">{participants.map((p, i) => { const me = p.user_id === selectedProfileId; const user = userById.get(p.user_id); return <div key={p.id} className="relative">{i < participants.length - 1 ? <div className="absolute left-8 top-[4.5rem] h-5 border-l border-dashed border-ink/25" /> : null}<div className={`relative z-10 rounded-[1.4rem] p-3 ${me ? "bg-ink text-white" : participantColors[i % participantColors.length]}`}><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-ink shadow-sm">{me ? "Ти" : i + 1}</div><div className="min-w-0 flex-1"><p className="font-extrabold leading-tight">{me ? "Ти" : user?.display_name}</p><p className={`mt-1 text-[11px] font-semibold leading-4 ${me ? "text-white/65" : "text-ink/60"}`}>{fromToText(p)}</p></div></div><div className="mt-3">{me && allConfirmed && !readOnly ? <SelectField value={p.coordination_status} disabled={loading} onChange={(value) => updateMyStatus?.(value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField> : <div className={`px-1 py-1 text-xs font-extrabold ${me ? "text-white/65" : "text-ink/55"}`}>{participantStatus(p, allConfirmed)}</div>}</div></div></div>; })}</div></div>;
}
