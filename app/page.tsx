"use client";

import Link from "next/link";
import { useState } from "react";

type AppTab = "home" | "requests" | "matches" | "chats" | "profile";

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: "home", label: "Начало", icon: "⌂" },
  { id: "requests", label: "Заявка", icon: "+" },
  { id: "matches", label: "Match", icon: "✦" },
  { id: "chats", label: "Чат", icon: "▤" },
  { id: "profile", label: "Профил", icon: "○" }
];

const matchSteps = ["Потвърждение", "Чатове", "Проверка", "Готовност", "Действия", "Резултат"];

function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md space-y-5 pb-6">{children}</div>;
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-1 pt-1">
      <button className="grid h-14 w-14 place-items-center rounded-[1.25rem] bg-white/70 shadow-soft backdrop-blur">
        <span className="grid grid-cols-2 gap-1">
          <i className="h-2 w-2 rounded-sm border-2 border-ink/70" />
          <i className="h-2 w-2 rounded-sm border-2 border-ink/70" />
          <i className="h-2 w-2 rounded-sm border-2 border-ink/70" />
          <i className="h-2 w-2 rounded-sm border-2 border-ink/70" />
        </span>
      </button>
      <div className="flex items-center gap-2 rounded-[1.35rem] bg-white/70 p-2 shadow-soft backdrop-blur">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F7C948] text-lg">♛</div>
        <span className="pr-2 text-sm font-bold text-ink/70">Подкрепи</span>
      </div>
    </div>
  );
}

function HeroSearch({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#FFF0E3] p-5 shadow-soft">
      <RouteMark className="absolute -right-8 -top-10 h-36 w-36 opacity-25" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/50">Твоят маршрут</p>
          <h1 className="mt-1 text-4xl font-black leading-[0.95] tracking-[-0.07em]">Намери <span className="text-orange">място</span></h1>
          <p className="mt-2 text-sm font-medium leading-5 text-ink/60">за възможна координация между родители</p>
        </div>
        <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[1.8rem] bg-white/60 shadow-soft">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-lime text-2xl">⌁</div>
        </div>
      </div>
      <div className="relative z-10 mt-5 flex items-center gap-2 rounded-full bg-white/85 p-2 shadow-[inset_0_0_0_1px_rgba(23,23,18,0.04)]">
        <button className="grid h-12 w-12 place-items-center rounded-full bg-orange text-xl text-white shadow-soft">⌖</button>
        <button className="grid h-12 w-12 place-items-center rounded-full bg-paper text-lg text-ink/60">⌕</button>
        <button onClick={() => setTab("requests")} className="flex min-h-12 flex-1 items-center justify-between rounded-full bg-paper px-5 text-left text-sm font-bold text-ink/50">
          Пусни заявка <span className="text-xl text-orange">›</span>
        </button>
      </div>
    </section>
  );
}

function HomeTab({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <AppShell>
      <TopBar />
      <HeroSearch setTab={setTab} />

      <section className="grid grid-cols-2 gap-3">
        <StatCard number="01" title="Активна заявка" body="ДГ „Слънце“ → ДГ „Дъга“" tone="bg-lime" />
        <StatCard number="03" title="Потенциални маршрута" body="2/3/4-странни цикли" tone="bg-[#D2E4E2]" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black tracking-[-0.05em]">За теб днес</h2>
          <button className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold shadow-soft">Виж всички</button>
        </div>
        <InsightCard category="Безопасност" title="Преди да пишеш на други родители" body="Не споделяй ЕГН, документи или данни на детето в чата. Координацията е само информативна." tone="bg-[#ECECC7]" />
        <InsightCard category="Следваща стъпка" title="Провери дали заявката е точна" body="Наборът, районът и желаното заведение са критични за качествен match." tone="bg-[#DED1E8]" />
      </section>
    </AppShell>
  );
}

function RequestsTab() {
  return (
    <AppShell>
      <TopBar />
      <PageTitle eyebrow="Нова заявка" title="Къде сте и къде искате да сте?" />
      <section className="rounded-[2.2rem] bg-white/90 p-4 shadow-soft backdrop-blur">
        <div className="rounded-[1.8rem] bg-paper p-4">
          <FormField icon="⌂" label="Сегашно заведение" value="ДГ „Слънце“" />
          <FormField icon="⌁" label="Желано заведение" value="ДГ „Дъга“" />
          <FormField icon="◷" label="Набор / група" value="2019 · IV група" last />
        </div>
        <button className="mt-4 w-full rounded-full bg-orange px-5 py-4 text-sm font-black text-white shadow-soft">Активирай заявка</button>
        <p className="mt-3 text-center text-xs font-medium leading-5 text-ink/45">Заявката ще се скрие автоматично при потенциален цикъл.</p>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-2xl font-black tracking-[-0.05em]">Моите заявки</h2>
        <RequestCard />
      </section>
    </AppShell>
  );
}

function MatchesTab() {
  return (
    <AppShell>
      <TopBar />
      <PageTitle eyebrow="Match" title="Има потенциален цикъл" />
      <section className="rounded-[2.2rem] bg-white/90 p-4 shadow-soft backdrop-blur">
        <div className="flex items-center justify-between rounded-[1.7rem] bg-lime p-4">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">Confidence</p><p className="mt-1 text-3xl font-black tracking-[-0.06em]">88%</p></div>
          <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-black">3 страни</span>
        </div>
        <div className="mt-4 space-y-3 rounded-[1.8rem] bg-paper p-4">
          <CycleRow index="Ти" title="ДГ „Слънце“ → ДГ „Дъга“" tone="bg-orange text-white" />
          <CycleRow index="2" title="ДГ „Дъга“ → ДГ „Мечо Пух“" tone="bg-[#DED1E8]" />
          <CycleRow index="3" title="ДГ „Мечо Пух“ → ДГ „Слънце“" tone="bg-[#ECECC7]" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="rounded-full bg-orange px-4 py-4 text-sm font-black text-white">Приемам</button>
          <button className="rounded-full bg-paper px-4 py-4 text-sm font-black">Отказвам</button>
        </div>
      </section>

      <section className="rounded-[2.2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Стъпки</p>
        <div className="mt-5 space-y-4">
          {matchSteps.map((step, index) => <TimelineRow key={step} index={index} title={step} />)}
        </div>
      </section>
    </AppShell>
  );
}

function ChatsTab() {
  return (
    <AppShell>
      <TopBar />
      <PageTitle eyebrow="Чатове" title="Координация без хаос" />
      <section className="rounded-[2.2rem] bg-white/90 p-4 shadow-soft backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button className="shrink-0 rounded-full bg-orange px-5 py-3 text-xs font-black text-white">Групов чат</button>
          <button className="shrink-0 rounded-full bg-paper px-5 py-3 text-xs font-black">Родител А</button>
          <button className="shrink-0 rounded-full bg-paper px-5 py-3 text-xs font-black">Родител Б</button>
        </div>
        <div className="mt-5 space-y-3">
          <Bubble name="Родител А" body="Здравейте, проверих процедурата в нашата градина." />
          <Bubble mine name="Ти" body="Супер. Аз ще се свържа утре сутринта." />
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-full bg-paper p-2">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg">＋</button>
          <div className="flex-1 px-2 text-sm font-semibold text-ink/40">Съобщение...</div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-orange text-xl text-white">›</button>
        </div>
      </section>
      <SafetyNote />
    </AppShell>
  );
}

function ProfileTab() {
  return (
    <AppShell>
      <TopBar />
      <section className="rounded-[2.2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-[1.8rem] bg-orange text-2xl font-black text-white shadow-soft">А</div>
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Профил</p><h1 className="mt-1 text-3xl font-black tracking-[-0.06em]">Родител</h1><p className="mt-1 text-sm font-semibold text-ink/55">Потвърден имейл · София</p></div>
        </div>
      </section>
      <section className="rounded-[2.2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Настройки</p>
        <div className="mt-4 space-y-3">
          <SettingsRow title="Данни за детето" body="Набор, район и тип заведение" />
          <SettingsRow title="Поверителност" body="Показваме само нужното за координация" />
          <SettingsRow title="Правила и безопасност" body="Без продажба, гаранции и неофициални обещания" />
        </div>
      </section>
      <Link href="/playground" className="block rounded-[1.8rem] bg-ink p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Само за тестове</p>
        <p className="mt-2 text-xl font-black">Отвори симулатора</p>
      </Link>
    </AppShell>
  );
}

function PageTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="px-1"><p className="text-xs font-black uppercase tracking-[0.24em] text-orange">{eyebrow}</p><h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-[-0.07em]">{title}</h1></div>;
}

function StatCard({ number, title, body, tone }: { number: string; title: string; body: string; tone: string }) {
  return <div className={`rounded-[1.8rem] ${tone} p-4 shadow-soft`}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/65 text-lg font-black">{number}</span><h3 className="mt-5 text-lg font-black tracking-[-0.04em]">{title}</h3><p className="mt-2 text-xs font-semibold leading-5 text-ink/55">{body}</p></div>;
}

function InsightCard({ category, title, body, tone }: { category: string; title: string; body: string; tone: string }) {
  return <article className={`relative overflow-hidden rounded-[2rem] ${tone} p-5 shadow-soft`}><RouteMark className="absolute -right-8 -top-7 h-28 w-28 opacity-25" /><div className="relative z-10"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-black">{category}</span><span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold">3 мин.</span></div><h3 className="text-xl font-black leading-tight tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm font-semibold leading-6 text-ink/58">{body}</p></div></article>;
}

function FormField({ icon, label, value, last = false }: { icon: string; label: string; value: string; last?: boolean }) {
  return <div className={`flex items-center gap-3 py-3 ${last ? "" : "border-b border-ink/5"}`}><span className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF0E3] text-lg">{icon}</span><div className="flex-1"><p className="text-xs font-black uppercase tracking-[0.18em] text-ink/35">{label}</p><p className="mt-1 text-base font-black">{value}</p></div><span className="text-2xl text-ink/35">⌄</span></div>;
}

function RequestCard() {
  return <div className="rounded-[2rem] bg-[#ECECC7] p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Активна</p><h3 className="mt-2 text-xl font-black leading-tight">ДГ „Слънце“ → ДГ „Дъга“</h3><p className="mt-2 text-sm font-semibold text-ink/55">2019 · IV група</p></div><span className="rounded-full bg-white/65 px-3 py-2 text-xs font-black">ON</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button className="rounded-full bg-white/65 px-4 py-3 text-xs font-black">Деактивирай</button><button className="rounded-full bg-ink px-4 py-3 text-xs font-black text-white">Изтрий</button></div></div>;
}

function CycleRow({ index, title, tone }: { index: string; title: string; tone: string }) {
  return <div className={`rounded-[1.55rem] p-4 ${tone} shadow-soft`}><div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-ink shadow-soft">{index}</span><p className="text-sm font-black leading-5">{title}</p></div></div>;
}

function TimelineRow({ index, title }: { index: number; title: string }) {
  const done = index < 2;
  return <div className="relative grid grid-cols-[2.5rem_1fr] gap-3"><div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full text-xs font-black ${done ? "bg-lime" : "bg-paper text-ink/35"}`}>{done ? "✓" : index + 1}</div><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold text-ink/45">{index === 1 ? "Текуща стъпка" : index < 1 ? "Готово" : "Предстои"}</p></div>{index < matchSteps.length - 1 ? <div className={`absolute left-5 top-10 h-5 border-l-2 border-dashed ${done ? "border-lime" : "border-ink/10"}`} /> : null}</div>;
}

function Bubble({ name, body, mine = false }: { name: string; body: string; mine?: boolean }) {
  return <div className={`rounded-[1.8rem] p-4 text-sm shadow-soft ${mine ? "ml-8 bg-orange text-white" : "mr-8 bg-paper"}`}><p className={`text-xs font-black ${mine ? "text-white/60" : "text-ink/40"}`}>{name}</p><p className="mt-1 leading-6">{body}</p></div>;
}

function SafetyNote() {
  return <div className="rounded-[1.7rem] bg-white/75 p-4 text-xs font-semibold leading-5 text-ink/55 shadow-soft backdrop-blur">Независима платформа за потенциални съвпадения. Не е официална услуга и не гарантира прием, преместване или размяна.</div>;
}

function SettingsRow({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.5rem] bg-paper p-4"><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/50">{body}</p></div>;
}

function RouteMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true"><path d="M20 36h42L82 18v84" stroke="#1C1B19" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.16"/><circle cx="83" cy="42" r="8" fill="#1C1B19" opacity="0.16"/></svg>;
}

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("home");
  const Active = tab === "home" ? <HomeTab setTab={setTab} /> : tab === "requests" ? <RequestsTab /> : tab === "matches" ? <MatchesTab /> : tab === "chats" ? <ChatsTab /> : <ProfileTab />;

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-5 text-ink">
      {Active}
      <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[2.4rem] bg-white/88 p-2 shadow-soft backdrop-blur">
        <div className="grid grid-cols-6 items-end gap-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-[1.55rem] px-2 py-3 text-[10px] font-black transition ${tab === item.id ? "bg-orange text-white shadow-soft" : "text-ink/55"}`}>
              <span className="block text-lg leading-none">{item.icon}</span>
              <span className="mt-1 block">{item.label}</span>
            </button>
          ))}
          <Link href="/playground" className="rounded-[1.55rem] px-2 py-3 text-center text-[10px] font-black text-ink/55">
            <span className="block text-lg leading-none">⌘</span>
            <span className="mt-1 block">Сим.</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
