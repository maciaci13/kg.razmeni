"use client";

import { Home, Plus, Sparkles, MessageSquare, CircleUser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

// ─── Types ───────────────────────────────────────────────────────────────────────────────────────
type AppTab = "home" | "requests" | "matches" | "chats" | "profile";
type ApiError = { error: string };
type Participant = PlaygroundSnapshot["participants"][number];
type Chat = PlaygroundSnapshot["chats"][number];

// ─── Constants ───────────────────────────────────────────────────────────────────────────────────
const tabs = [
  { id: "home" as AppTab,     label: "Начало",    Icon: Home },
  { id: "requests" as AppTab, label: "Заявка",    Icon: Plus },
  { id: "matches" as AppTab,  label: "Match",     Icon: Sparkles },
  { id: "chats" as AppTab,    label: "Чат",       Icon: MessageSquare },
  { id: "profile" as AppTab,  label: "Профил",    Icon: CircleUser },
];

const placeTypes = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

const statusOptions = [
  ["not_started",           "Още не съм започнал/а"],
  ["checking_procedure",    "Проверявам процедурата"],
  ["contacted_kindergarten","Свързал/а съм се със заведение"],
  ["can_continue",          "Мога да продължа"],
  ["cannot_continue",       "Не мога да продължа"],
  ["dropped_out",           "Отказвам се"],
] as const;

const steps = [
  { title: "Потвърждение",           helper: "Всички страни приемат потенциалното съвпадение." },
  { title: "Отключена координация",  helper: "Чатовете се отварят и започва уточняване." },
  { title: "Проверка на процедурата",  helper: "Всеки проверява официалния ред и контакт със заведение." },
  { title: "Готовност за действие",    helper: "Всички маркират дали могат да продължат." },
  { title: "Официални действия",       helper: "Следват се само официалните административни стъпки." },
  { title: "Резултат",                helper: "Цикълът се отбелязва като приключен или отпаднал." },
];

const rejectedStep = {
  title: "Отказано",
  helper: "Процесът е прекратен. Веригата и чатовете са затворени.",
};

const cardTones = [
  "bg-gradient-ember text-primary-foreground",
  "bg-gradient-sage",
  "bg-gradient-mist",
  "bg-gradient-butter",
];

// ─── API ───────────────────────────────────────────────────────────────────────────────────────────
async function api(body?: object): Promise<PlaygroundSnapshot> {
  const response = body
    ? await fetch("/api/playground", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    : await fetch("/api/playground", { cache: "no-store" });
  const json = (await response.json()) as PlaygroundSnapshot | ApiError;
  if (!response.ok || "error" in json) throw new Error("error" in json ? json.error : "Request failed");
  return json;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────────────────────
function statusLabel(status?: string) {
  return statusOptions.find(([v]) => v === status)?.[1] ?? status ?? "—";
}
function participantStatus(p: Participant, allConfirmed: boolean) {
  if (p.confirmation_status === "declined") return "Отказана размяна";
  if (p.confirmation_status === "pending")  return "Очаква потвърждение";
  if (!allConfirmed)                        return "Потвърдил/а · чака останалите";
  return statusLabel(p.coordination_status);
}

// ─── UI Primitives ─────────────────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-36 relative overflow-visible">
      {children}
    </div>
  );
}

function TopBar({ selectedName, onProfile }: { selectedName: string; onProfile: () => void }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <button className="liquid-action h-12 w-12 rounded-[1.35rem] flex items-center justify-center">
        <span className="grid grid-cols-2 gap-[5px]">
          <i className="block h-[7px] w-[7px] rounded-[3px] bg-foreground/50" />
          <i className="block h-[7px] w-[7px] rounded-[3px] bg-foreground/50" />
          <i className="block h-[7px] w-[7px] rounded-[3px] bg-foreground/50" />
          <i className="block h-[7px] w-[7px] rounded-[3px] bg-foreground/50" />
        </span>
      </button>
      <button
        onClick={onProfile}
        className="liquid-pill px-5 h-12 rounded-full text-[11px] tracking-[0.24em] uppercase text-muted-foreground font-bold"
      >
        {selectedName || "Профил"}
      </button>
    </header>
  );
}

function PageTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-extrabold">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-[-0.055em]">{title}</h1>
      {body ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p> : null}
    </div>
  );
}

function FieldLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground mb-2 ${className}`}>
      {children}
    </label>
  );
}

function SelectField({
  value, onChange, children, className = "", disabled = false,
}: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string; disabled?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-[1.35rem] border border-border bg-card py-4 pl-5 pr-12 text-sm font-bold text-foreground outline-none disabled:opacity-50"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</span>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[2rem] bg-card/85 p-5 shadow-soft border border-border">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </section>
  );
}

function SafetyNote() {
  return (
    <div className="rounded-[1.7rem] glass p-4 text-xs font-medium leading-5 text-muted-foreground">
      Независима платформа за потенциални съвпадения. Не е официална услуга и не гарантира прием, преместване или размяна.
    </div>
  );
}

// ─── Home Tab ───────────────────────────────────────────────────────────────────────────────────────────
function HomeTab({
  setTab, activeRequestText, matchCount,
}: {
  setTab: (tab: AppTab) => void;
  activeRequestText: string;
  matchCount: number;
}) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-cocoa text-primary-foreground p-5 shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.15)_0%,transparent_28%)]" />
        <div className="relative z-10">
          <p className="text-[11px] tracking-[0.22em] uppercase font-bold opacity-60">Намери място</p>
          <h1 className="mt-2 font-display text-[2.6rem] leading-[0.92] tracking-[-0.05em]">Намери<br />място</h1>
          <p className="mt-2 text-sm leading-5 opacity-65">за координирано преместване между детски заведения в София</p>
        </div>
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-white/15 p-4">
            <span className="font-display text-2xl font-black">{activeRequestText ? "01" : "00"}</span>
            <p className="mt-1 text-xs font-bold opacity-65">Активна заявка</p>
            <p className="mt-1 text-[11px] opacity-50 leading-4 truncate">{activeRequestText || "Няма активна заявка"}</p>
          </div>
          <div className="rounded-[1.5rem] bg-white/15 p-4">
            <span className="font-display text-2xl font-black">{String(matchCount).padStart(2, "0")}</span>
            <p className="mt-1 text-xs font-bold opacity-65">Потенциал</p>
            <p className="mt-1 text-[11px] opacity-50 leading-4">2/3/4-странни цикли</p>
          </div>
        </div>
        <button
          onClick={() => setTab("requests")}
          className="relative z-10 mt-4 w-full h-12 rounded-full bg-white/20 font-display text-sm font-black tracking-[-0.02em] border border-white/25 hover:bg-white/25 transition-colors"
        >
          Пусни заявка ›
        </button>
      </section>

      <h2 className="font-display text-2xl tracking-[-0.04em]">За теб днес</h2>

      <article className="rounded-[2rem] bg-gradient-butter p-5 shadow-soft">
        <p className="text-[11px] tracking-[0.22em] uppercase font-extrabold text-muted-foreground">Безопасност</p>
        <h3 className="mt-2 font-display text-xl">Преди да пишеш на други родители</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Не споделяй ЕГН, документи или данни на детето в чата. Координацията е само информативна.</p>
      </article>

      <article className="rounded-[2rem] bg-gradient-mist p-5 shadow-soft">
        <p className="text-[11px] tracking-[0.22em] uppercase font-extrabold text-muted-foreground">Важно за match</p>
        <h3 className="mt-2 font-display text-xl">Типът място трябва да съвпада</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Общ ред, СОП, хронични заболявания и социални критерии не се смесват в един цикъл.</p>
      </article>
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────────────────────────
function RequestsTab({
  snapshot, selectedProfileId, selectedPlaceType, setSelectedPlaceType,
  myRequests, kgById, requestToText, createRequest, deactivateRequest, deleteRequest, loading,
}: {
  snapshot: PlaygroundSnapshot | null;
  selectedProfileId: string;
  selectedPlaceType: string;
  setSelectedPlaceType: (v: string) => void;
  myRequests: PlaygroundSnapshot["requests"];
  kgById: Map<string, PlaygroundSnapshot["kindergartens"][number]>;
  requestToText: (id: string) => string;
  createRequest: (data: { fromKgId: string; wantedKgId: string; ageGroup: string }) => void;
  deactivateRequest: (id: string) => void;
  deleteRequest: (id: string) => void;
  loading: boolean;
}) {
  const [fromKgId, setFromKgId] = useState("");
  const [wantedKgId, setWantedKgId] = useState("");
  const [ageGroup, setAgeGroup] = useState("2019");
  const [open, setOpen] = useState(true);
  const kindergartens = snapshot?.kindergartens ?? [];

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Нова заявка"
        title="Къде сте и къде искате да сте?"
        body="Избери сегашно и желано място. Съвпадението работи само между еднакъв тип места."
      />

      <div className="rounded-[2rem] bg-card border border-border shadow-soft overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-6 py-5 flex items-center justify-between text-left"
        >
          <span className="font-display text-[1.4rem] tracking-[-0.04em]">Активирай заявка</span>
          <div className="liquid-action h-10 w-10 rounded-2xl flex items-center justify-center text-muted-foreground text-lg">
            {open ? "↑" : "↓"}
          </div>
        </button>

        {open && (
          <div className="px-5 pb-6 space-y-5">
            <div>
              <FieldLabel>Имаме място в</FieldLabel>
              <SelectField value={fromKgId} onChange={setFromKgId}>
                <option value="">Избери градина</option>
                {kindergartens.map((kg) => (
                  <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Желана градина</FieldLabel>
              <SelectField value={wantedKgId} onChange={setWantedKgId}>
                <option value="">Избери желана градина</option>
                {kindergartens.map((kg) => (
                  <option key={kg.id} value={kg.id}>{kg.name} · {kg.district}</option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Набор / група</FieldLabel>
              <input
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full rounded-[1.35rem] border border-border bg-card px-5 py-4 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <FieldLabel>Тип място</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {placeTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedPlaceType(t)}
                    className={`min-h-11 rounded-full text-sm font-extrabold px-5 transition-all ${
                      t === selectedPlaceType
                        ? "bg-gradient-ember text-primary-foreground shadow-glow"
                        : "bg-secondary border border-border text-foreground shadow-soft"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={loading || !selectedProfileId || !fromKgId || !wantedKgId}
              onClick={() => createRequest({ fromKgId, wantedKgId, ageGroup })}
              className="w-full h-14 rounded-full bg-gradient-ember text-primary-foreground font-extrabold text-sm shadow-glow disabled:opacity-40"
            >
              Активирай заявка
            </button>
            <p className="text-center text-xs text-muted-foreground">Заявката ще се скрие автоматично при потенциален цикъл.</p>
          </div>
        )}
      </div>

      <h2 className="font-display text-2xl tracking-[-0.04em]">Моите заявки</h2>

      {myRequests.length ? myRequests.map((r) => (
        <div key={r.id} className="rounded-[2rem] bg-gradient-sage p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-[0.2em] uppercase font-extrabold text-muted-foreground">
                {r.is_active ? "Активна" : "Неактивна"} · {selectedPlaceType}
              </p>
              <h3 className="mt-2 font-display text-xl leading-tight">
                {kgById.get(r.from_kindergarten_id)?.name ?? "—"} → {requestToText(r.id)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Набор {r.child_group_year_or_age_group}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/65 px-3 py-1.5 text-xs font-extrabold">
              {r.is_locked ? "MATCH" : "ON"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              disabled={loading || !r.is_active}
              onClick={() => deactivateRequest(r.id)}
              className="rounded-full bg-white/65 px-4 py-3 text-xs font-extrabold disabled:opacity-30"
            >
              Деактивирай
            </button>
            <button
              disabled={loading || r.is_locked}
              onClick={() => deleteRequest(r.id)}
              className="rounded-full bg-foreground text-card px-4 py-3 text-xs font-extrabold disabled:opacity-30"
            >
              Изтрий
            </button>
          </div>
        </div>
      )) : (
        <EmptyCard title="Няма активна заявка" body="Попълни формата горе, за да стартираш търсене на съвпадение." />
      )}
    </div>
  );
}

// ─── Cycle Map & Timeline ──────────────────────────────────────────────────────────────────────────
function CycleMap({
  participants, selectedProfileId, userById, fromToText, allConfirmed,
  loading = false, updateMyStatus, readOnly = false,
}: {
  participants: Participant[];
  selectedProfileId: string;
  userById: Map<string, PlaygroundSnapshot["users"][number]>;
  fromToText: (p: Participant) => string;
  allConfirmed: boolean;
  loading?: boolean;
  updateMyStatus?: (status: string) => void;
  readOnly?: boolean;
}) {
  if (!participants.length) return null;
  return (
    <div className="rounded-[1.75rem] bg-secondary/60 p-4">
      <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Верига и статуси</p>
      <div className="space-y-3">
        {participants.map((p, i) => {
          const me = p.user_id === selectedProfileId;
          const user = userById.get(p.user_id);
          return (
            <div key={p.id} className="relative">
              {i < participants.length - 1 && (
                <div className="absolute left-8 top-[4.5rem] h-5 border-l border-dashed border-foreground/20" />
              )}
              <div className={`relative z-10 rounded-[1.4rem] p-3.5 ${cardTones[i % cardTones.length]}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold shadow-sm ${
                    me ? "bg-white/25" : "bg-white/60 text-foreground"
                  }`}>
                    {me ? "Ти" : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-tight">{me ? "Ти" : user?.display_name}</p>
                    <p className="mt-1 text-[11px] font-medium leading-4 opacity-60">{fromToText(p)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  {me && allConfirmed && !readOnly ? (
                    <SelectField value={p.coordination_status} disabled={loading} onChange={(v) => updateMyStatus?.(v)}>
                      {statusOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </SelectField>
                  ) : (
                    <p className="px-1 text-xs font-extrabold opacity-60">{participantStatus(p, allConfirmed)}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ currentStep, rejected = false }: { currentStep: number; rejected?: boolean }) {
  return (
    <div className="rounded-[1.75rem] bg-secondary/60 px-4 py-5">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const current = n === currentStep;
        const title = rejected && n === 6 ? rejectedStep.title : s.title;
        const helper = rejected && n === 6 ? rejectedStep.helper : s.helper;
        return (
          <div key={s.title} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <div className={`absolute left-[0.94rem] top-8 h-[calc(100%-1.7rem)] border-l-2 border-dashed ${
                done ? (rejected ? "border-red-300" : "border-sage/60") : "border-foreground/15"
              }`} />
            )}
            <div className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold ${
              done    ? (rejected ? "bg-red-100 text-red-800" : "bg-gradient-sage text-foreground") :
              current ? (rejected ? "bg-red-100 text-red-800" : "bg-gradient-ember text-primary-foreground") :
              "bg-white text-muted-foreground ring-1 ring-foreground/10"
            }`}>
              {done ? "✓" : (rejected && current ? "!" : n)}
            </div>
            <div className="pt-0.5">
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                current ? "text-foreground" : "text-muted-foreground"
              }`}>Стъпка {n}</p>
              <p className={`mt-1 text-sm font-extrabold ${
                current ? "text-foreground" : "text-foreground/65"
              }`}>{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Matches Tab ───────────────────────────────────────────────────────────────────────────────────
function MatchesTab({
  activeMatch, activeParticipant, participants, selectedProfileId, userById,
  fromToText, allConfirmed, matchIsClosed, currentStep, currentStepInfo,
  loading, confirm, decline, updateMyStatus, leave,
}: {
  activeMatch?: PlaygroundSnapshot["matches"][number];
  activeParticipant?: Participant;
  participants: Participant[];
  selectedProfileId: string;
  userById: Map<string, PlaygroundSnapshot["users"][number]>;
  fromToText: (p: Participant) => string;
  allConfirmed: boolean;
  matchIsClosed: boolean;
  currentStep: number;
  currentStepInfo: { title: string; helper: string };
  loading: boolean;
  confirm: () => void;
  decline: () => void;
  updateMyStatus: (status: string) => void;
  leave: () => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);

  if (!activeMatch || !activeParticipant) {
    return (
      <div className="space-y-5">
        <PageTitle eyebrow="Match" title="Още няма цикъл" body="Когато има потенциално съвпадение, заявката се скрива и тук се появява поканата." />
        <EmptyCard title="Няма match" body="Пусни заявка или използвай симулатора от профила за тестове." />
      </div>
    );
  }

  if (activeParticipant.confirmation_status === "pending" && !matchIsClosed) {
    return (
      <div className="space-y-5">
        <PageTitle eyebrow="Match покана" title="Има потенциален цикъл" body="Заявката ти вече е скрита. Потвърди интерес, за да се отключи координацията." />
        <section className="rounded-[2rem] bg-card border border-border p-5 shadow-soft space-y-4">
          <CycleMap participants={participants} selectedProfileId={selectedProfileId} userById={userById} fromToText={fromToText} allConfirmed={allConfirmed} readOnly />
          <div className="grid grid-cols-2 gap-3">
            <button disabled={loading} onClick={confirm} className="h-14 rounded-full bg-gradient-ember text-primary-foreground font-extrabold text-sm shadow-glow disabled:opacity-40">Приемам</button>
            <button disabled={loading} onClick={decline} className="h-14 rounded-full bg-secondary border border-border font-extrabold text-sm disabled:opacity-40">Отказвам</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow={matchIsClosed ? "Затворен процес" : "Статус в прогрес"}
        title={matchIsClosed ? "Отказано" : "Координация"}
        body={matchIsClosed ? "Процесът е затворен след отказ." : "Следи кой на какъв етап е и промени само своя статус."}
      />
      <section className="rounded-[2rem] bg-card border border-border p-5 shadow-soft space-y-4">
        <button
          type="button"
          onClick={() => setShowTimeline((v) => !v)}
          className={`w-full flex items-center justify-between gap-4 rounded-[1.6rem] px-5 py-4 text-left shadow-soft ${
            matchIsClosed ? "bg-red-50" : "bg-gradient-sage"
          }`}
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
              Стъпка {currentStep || 1} от {steps.length}
            </p>
            <p className="mt-2 font-display text-lg leading-tight">{currentStepInfo.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{currentStepInfo.helper}</p>
          </div>
          <span className="text-muted-foreground shrink-0">{showTimeline ? "↑" : "↓"}</span>
        </button>

        {showTimeline && <Timeline currentStep={currentStep} rejected={matchIsClosed} />}

        {!matchIsClosed ? (
          <CycleMap
            participants={participants}
            selectedProfileId={selectedProfileId}
            userById={userById}
            fromToText={fromToText}
            allConfirmed={allConfirmed}
            loading={loading}
            updateMyStatus={updateMyStatus}
          />
        ) : (
          <EmptyCard title="Веригата е затворена" body="Чатовете вече не се показват за този процес." />
        )}

        {!matchIsClosed && (
          <button
            onClick={leave}
            className="w-full rounded-full bg-red-50 px-4 py-4 text-sm font-extrabold text-red-700"
          >
            Отказ от процеса
          </button>
        )}
      </section>
    </div>
  );
}

// ─── Chats Tab ───────────────────────────────────────────────────────────────────────────────────────
function ChatsTab({
  activeMatch, allConfirmed, matchIsClosed, availableChats, selectedChat,
  selectedChatId, setSelectedChatId, snapshot, selectedProfileId, selectedUserName,
  userById, chatTitle, messageBody, setMessageBody, sendMessage, loading,
}: {
  activeMatch?: PlaygroundSnapshot["matches"][number];
  allConfirmed: boolean;
  matchIsClosed: boolean;
  availableChats: Chat[];
  selectedChat?: Chat;
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  snapshot: PlaygroundSnapshot | null;
  selectedProfileId: string;
  selectedUserName: string;
  userById: Map<string, PlaygroundSnapshot["users"][number]>;
  chatTitle: (c: Chat) => string;
  messageBody: string;
  setMessageBody: (v: string) => void;
  sendMessage: () => void;
  loading: boolean;
}) {
  if (!activeMatch || !allConfirmed || matchIsClosed) {
    return (
      <div className="space-y-5">
        <PageTitle eyebrow="Чатове" title="Още са заключени" body="Чатовете се появяват само след потвърждение от всички страни." />
        <div className="rounded-[2rem] bg-gradient-butter p-5 shadow-soft flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-ember flex items-center justify-center text-primary-foreground text-xl shadow-pill">↗</div>
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-muted-foreground">По-бързо съвпадение</p>
            <p className="font-display text-base mt-0.5">Увеличи шанса за съвпадение</p>
          </div>
        </div>
        <SafetyNote />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle
        eyebrow="Чатове"
        title={selectedChat ? chatTitle(selectedChat) : "Координация"}
        body="При 2 страни — само личен чат. При 3/4 — групов и лични."
      />
      <section className="rounded-[2rem] bg-card border border-border p-5 shadow-soft space-y-4">
        {availableChats.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableChats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChatId(c.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-extrabold transition-all ${
                  selectedChatId === c.id
                    ? "bg-gradient-ember text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground"
                }`}
              >
                {chatTitle(c)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Няма активни чатове.</p>
        )}

        <div className="space-y-3">
          {snapshot?.messages
            .filter((m) => selectedChat && m.chat_id === selectedChat.id)
            .map((m) => {
              const mine = m.sender_user_id === selectedProfileId;
              return (
                <div
                  key={m.id}
                  className={`rounded-[1.8rem] p-4 text-sm shadow-soft ${
                    mine ? "ml-8 bg-gradient-ember text-primary-foreground" : "mr-8 bg-secondary"
                  }`}
                >
                  <p className={`text-xs font-extrabold ${mine ? "opacity-60" : "text-muted-foreground"}`}>
                    {mine ? "Ти" : userById.get(m.sender_user_id)?.display_name ?? "Родител"}
                  </p>
                  <p className="mt-1 leading-6">{m.body}</p>
                </div>
              );
            })}
        </div>

        {selectedChat && (
          <div className="space-y-2">
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="min-h-24 w-full rounded-[1.6rem] border border-border bg-secondary/60 p-4 text-sm outline-none resize-none"
            />
            <button
              disabled={loading || selectedChat.status !== "active"}
              onClick={sendMessage}
              className="w-full h-14 rounded-full bg-gradient-ember text-primary-foreground font-extrabold text-sm shadow-glow disabled:opacity-30"
            >
              Изпрати като {selectedUserName}
            </button>
          </div>
        )}
      </section>
      <SafetyNote />
    </div>
  );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────────────────────────────
function ProfileTab({
  selectedProfileId, selectedUserName, users, setSelectedProfileId,
}: {
  selectedProfileId: string;
  selectedUserName: string;
  users: PlaygroundSnapshot["users"];
  setSelectedProfileId: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-card border border-border p-5 shadow-soft flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.8rem] bg-gradient-ember text-primary-foreground font-display text-3xl shadow-pill">
          {selectedUserName.slice(-1) || "А"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground font-bold">Профил</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">{selectedUserName || "Родител"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Тестов профил · София</p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-card border border-border p-5 shadow-soft">
        <FieldLabel>Тестов потребител</FieldLabel>
        <SelectField value={selectedProfileId} onChange={setSelectedProfileId}>
          {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
        </SelectField>
      </div>

      <div className="rounded-[2rem] bg-card border border-border p-5 shadow-soft space-y-3">
        <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-bold">Настройки</p>
        {[
          { title: "Данни за профила",   body: "Район, набор, тип място и сегашна градина" },
          { title: "Поверителност",     body: "Показваме само нужното за координация" },
          { title: "Правила и безопасност", body: "Без продажба, гаранции и неофициални обещания" },
        ].map((row) => (
          <div key={row.title} className="rounded-[1.5rem] bg-secondary/60 p-4">
            <p className="font-display text-sm font-extrabold">{row.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[2rem] bg-gradient-sage p-5 shadow-soft min-h-[130px] flex flex-col justify-between">
          <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-bold">Каузата</p>
          <h3 className="font-display text-2xl">Подкрепи<br />проекта</h3>
        </div>
        <a href="/playground" className="rounded-[2rem] bg-gradient-cocoa text-primary-foreground p-5 shadow-glow min-h-[130px] flex flex-col justify-between">
          <p className="text-[11px] tracking-[0.22em] uppercase font-bold opacity-60">Тестове</p>
          <h3 className="font-display text-2xl">Симулатор</h3>
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────────────────────────
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
  const participants = useMemo(() =>
    (snapshot?.participants ?? [])
      .filter((p) => p.match_id === activeMatch?.id)
      .sort((a, b) => a.participant_order - b.participant_order),
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
  const myRequests = useMemo(() =>
    !snapshot || !activeUserId || activeMatch ? [] :
    snapshot.requests.filter((r) => r.user_id === activeUserId),
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
  useEffect(() => {
    if (users.length && !users.some((u) => u.id === selectedProfileId)) setSelectedProfileId(users[0].id);
  }, [users, selectedProfileId]);
  useEffect(() => {
    if (availableChats.length && !availableChats.some((c) => c.id === selectedChatId)) setSelectedChatId(availableChats[0].id);
  }, [availableChats, selectedChatId]);

  const Active =
    tab === "home" ? (
      <HomeTab setTab={setTab} activeRequestText={activeRequestText} matchCount={activeMatch ? 1 : 0} />
    ) : tab === "requests" ? (
      <RequestsTab
        snapshot={snapshot}
        selectedProfileId={activeUserId}
        selectedPlaceType={selectedPlaceType}
        setSelectedPlaceType={setSelectedPlaceType}
        myRequests={myRequests}
        kgById={kgById}
        requestToText={requestToText}
        createRequest={createRequest}
        deactivateRequest={(id) => run({ action: "deactivateRequest", requestId: id })}
        deleteRequest={(id) => run({ action: "deleteRequest", requestId: id })}
        loading={loading}
      />
    ) : tab === "matches" ? (
      <MatchesTab
        activeMatch={activeMatch}
        activeParticipant={activeParticipant}
        participants={participants}
        selectedProfileId={activeUserId}
        userById={userById}
        fromToText={fromToText}
        allConfirmed={allConfirmed}
        matchIsClosed={matchIsClosed}
        currentStep={currentStep}
        currentStepInfo={currentStepInfo}
        loading={loading}
        confirm={() => activeMatch && run({ action: "confirm", matchId: activeMatch.id, userId: activeUserId })}
        decline={() => activeMatch && run({ action: "decline", matchId: activeMatch.id, userId: activeUserId })}
        updateMyStatus={updateMyStatus}
        leave={() => setShowLeaveOptions(true)}
      />
    ) : tab === "chats" ? (
      <ChatsTab
        activeMatch={activeMatch}
        allConfirmed={allConfirmed}
        matchIsClosed={matchIsClosed}
        availableChats={availableChats}
        selectedChat={selectedChat}
        selectedChatId={selectedChat?.id ?? ""}
        setSelectedChatId={setSelectedChatId}
        snapshot={snapshot}
        selectedProfileId={activeUserId}
        selectedUserName={selectedUserName}
        userById={userById}
        chatTitle={chatTitle}
        messageBody={messageBody}
        setMessageBody={setMessageBody}
        sendMessage={sendMessage}
        loading={loading}
      />
    ) : (
      <ProfileTab
        selectedProfileId={activeUserId}
        selectedUserName={selectedUserName}
        users={users}
        setSelectedProfileId={setSelectedProfileId}
      />
    );

  return (
    <main className="min-h-screen bg-background">
      {error && (
        <div className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-soft">
          {error}
        </div>
      )}

      <AppShell>
        <TopBar selectedName={selectedUserName} onProfile={() => setTab("profile")} />
        {Active}
      </AppShell>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
        <div className="liquid-dock rounded-[2rem] flex items-center justify-between px-3 py-2.5">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex min-w-0 flex-col items-center gap-0.5 px-2.5 py-2 rounded-[1.35rem] transition-all duration-200 ${
                  active
                    ? "bg-gradient-ember text-primary-foreground shadow-glow scale-[1.03] -translate-y-0.5"
                    : "text-foreground/50"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.45 : 1.85} />
                <span className={`text-[10px] leading-none mt-0.5 ${
                  active ? "font-extrabold" : "font-bold"
                }`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showLeaveOptions && activeMatch && !matchIsClosed && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 px-4 pb-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[2rem] bg-card p-5 shadow-glow">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Отказ от процеса</p>
                <h2 className="mt-2 font-display text-2xl">Как да затворим цикъла?</h2>
              </div>
              <button
                onClick={() => setShowLeaveOptions(false)}
                className="liquid-action grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold text-lg"
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-6 text-muted-foreground mb-4">Избери дали чатът да остане видим или всичко да се затвори напълно.</p>
            <div className="space-y-2">
              <button
                disabled={loading}
                onClick={() => leaveProcess(true)}
                className="w-full h-14 rounded-full bg-gradient-cocoa text-primary-foreground font-extrabold text-sm shadow-glow disabled:opacity-40"
              >
                Отказвам се, но запази чата
              </button>
              <button
                disabled={loading}
                onClick={() => leaveProcess(false)}
                className="w-full h-14 rounded-full bg-red-600 text-white font-extrabold text-sm disabled:opacity-40"
              >
                Отказвам се и затвори чата
              </button>
              <button
                disabled={loading}
                onClick={() => setShowLeaveOptions(false)}
                className="w-full h-14 rounded-full bg-secondary border border-border font-extrabold text-sm disabled:opacity-40"
              >
                Връщам се назад
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
