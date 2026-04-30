"use client";

import Link from "next/link";
import { useState } from "react";

type AppTab = "home" | "requests" | "matches" | "chats" | "profile";

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: "home", label: "Начало", icon: "⌂" },
  { id: "requests", label: "Заявки", icon: "+" },
  { id: "matches", label: "Match", icon: "◇" },
  { id: "chats", label: "Чат", icon: "✉" },
  { id: "profile", label: "Профил", icon: "◎" }
];

const userCards = [
  { title: "Ти си в", value: "ДГ „Слънце“", tone: "bg-lime" },
  { title: "Търсиш", value: "ДГ „Дъга“", tone: "bg-[#D8D5FF]" },
  { title: "Статус", value: "Активна заявка", tone: "bg-[#FFE2A8]" }
];

const matchSteps = [
  "Потвърждение от всички",
  "Отключване на чатове",
  "Проверка на процедурата",
  "Координация по ред",
  "Официални действия",
  "Резултат"
];

function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-orange">МястоЗаМясто</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.06em]">Хора, свързани чрез места.</h1>
      </div>
      <Link href="/playground" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-lg font-black text-white shadow-soft" aria-label="Playground simulator">
        ✦
      </Link>
    </header>
  );
}

function SafetyNote() {
  return (
    <div className="rounded-[1.6rem] bg-white/75 p-4 text-xs font-semibold leading-5 text-ink/55 shadow-soft backdrop-blur">
      Независима платформа за потенциални съвпадения. Не е официална услуга и не гарантира прием, преместване или размяна.
    </div>
  );
}

function HomeTab({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="relative min-h-56 rounded-[1.7rem] bg-[#fff4df] p-5">
          <div className="absolute right-5 top-5 rounded-full bg-orange px-4 py-2 text-xs font-black text-white">MVP</div>
          <div className="absolute left-7 top-16 grid h-14 w-14 place-items-center rounded-full bg-lime text-sm font-black shadow-soft">Ти</div>
          <div className="absolute right-12 top-24 grid h-14 w-14 place-items-center rounded-full bg-[#D8D5FF] text-sm font-black shadow-soft">А</div>
          <div className="absolute bottom-10 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-[#FFE2A8] text-sm font-black shadow-soft">Б</div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 220" fill="none" aria-hidden="true">
            <path d="M62 92 C128 35, 184 182, 257 105" stroke="#ff6614" strokeWidth="5" strokeDasharray="12 10" strokeLinecap="round" opacity="0.8" />
            <path d="M85 168 C132 118, 194 118, 238 168" stroke="#171712" strokeWidth="2" strokeDasharray="7 8" opacity="0.22" />
          </svg>
          <div className="absolute bottom-4 left-4 right-4 rounded-[1.4rem] bg-white/85 p-4 backdrop-blur">
            <p className="text-lg font-black tracking-[-0.04em]">Всяко съвпадение е маршрут.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">Добавяш къде си и къде искаш да преместиш детето. Системата търси 2/3/4-странни цикли.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {userCards.map((card) => (
          <div key={card.title} className={`rounded-[1.4rem] ${card.tone} p-4 shadow-soft`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">{card.title}</p>
            <p className="mt-3 text-sm font-black leading-5">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Бързо действие</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Пусни заявка за размяна</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">Заявката се скрива автоматично, когато се намери потенциален цикъл.</p>
        <button onClick={() => setTab("requests")} className="mt-5 w-full rounded-full bg-orange px-5 py-4 text-sm font-black text-white shadow-soft">Създай заявка</button>
      </section>

      <SafetyNote />
    </div>
  );
}

function RequestsTab() {
  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Нова заявка</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Къде сте и къде искате да сте?</h2>
        <div className="mt-5 space-y-3">
          <Field label="Сегашно заведение" value="ДГ „Слънце“" />
          <Field label="Желано заведение" value="ДГ „Дъга“" />
          <Field label="Набор / група" value="2019 · IV група" />
        </div>
        <button className="mt-5 w-full rounded-full bg-orange px-5 py-4 text-sm font-black text-white shadow-soft">Активирай заявка</button>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Моите заявки</p>
        <div className="mt-4 rounded-[1.5rem] bg-paper p-4">
          <p className="text-sm font-black">ДГ „Слънце“ → ДГ „Дъга“</p>
          <p className="mt-2 text-xs font-semibold text-ink/50">Активна · скрива се при match</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-full bg-beige px-4 py-3 text-xs font-black">Деактивирай</button>
            <button className="rounded-full bg-ink px-4 py-3 text-xs font-black text-white">Изтрий</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MatchesTab() {
  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Потенциален цикъл</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">3-странно съвпадение</h2>
          </div>
          <span className="rounded-full bg-lime px-3 py-2 text-[10px] font-black">88%</span>
        </div>
        <div className="mt-5 space-y-3 rounded-[1.7rem] bg-paper p-4">
          <CycleRow index="Ти" title="ДГ „Слънце“ → ДГ „Дъга“" tone="bg-orange text-white" />
          <CycleRow index="2" title="ДГ „Дъга“ → ДГ „Мечо Пух“" tone="bg-[#D8D5FF]" />
          <CycleRow index="3" title="ДГ „Мечо Пух“ → ДГ „Слънце“" tone="bg-[#FFE2A8]" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="rounded-full bg-orange px-4 py-4 text-sm font-black text-white">Приемам</button>
          <button className="rounded-full bg-beige px-4 py-4 text-sm font-black">Отказвам</button>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Стъпки</p>
        <div className="mt-4 space-y-4">
          {matchSteps.map((step, index) => (
            <div key={step} className="grid grid-cols-[2rem_1fr] gap-3">
              <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index < 2 ? "bg-lime" : "bg-paper text-ink/40"}`}>{index < 2 ? "✓" : index + 1}</div>
              <div><p className="text-sm font-black">{step}</p><p className="mt-1 text-xs text-ink/45">{index === 1 ? "Текуща стъпка" : index < 1 ? "Готово" : "Предстои"}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChatsTab() {
  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Чатове</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Координация</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button className="shrink-0 rounded-full bg-orange px-4 py-3 text-xs font-black text-white">Групов чат</button>
          <button className="shrink-0 rounded-full bg-paper px-4 py-3 text-xs font-black">Лично: Родител А</button>
          <button className="shrink-0 rounded-full bg-paper px-4 py-3 text-xs font-black">Лично: Родител Б</button>
        </div>
        <div className="mt-4 space-y-2">
          <Bubble name="Родител А" body="Здравейте, проверих процедурата в нашата градина." />
          <Bubble mine name="Ти" body="Супер. Аз ще се свържа утре сутринта." />
        </div>
        <div className="mt-4 rounded-[1.4rem] bg-paper p-4 text-sm font-semibold text-ink/45">Съобщение...</div>
      </section>
      <SafetyNote />
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Профил</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-orange text-xl font-black text-white">А</div>
          <div><h2 className="text-2xl font-black tracking-[-0.05em]">Родител</h2><p className="mt-1 text-sm font-semibold text-ink/55">Потвърден имейл · София</p></div>
        </div>
      </section>
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Настройки</p>
        <div className="mt-4 space-y-3">
          <SettingsRow title="Данни за детето" body="Набор, район и тип заведение" />
          <SettingsRow title="Поверителност" body="Показваме само нужното за координация" />
          <SettingsRow title="Правила и безопасност" body="Без продажба, гаранции и неофициални обещания" />
        </div>
      </section>
      <Link href="/playground" className="block rounded-[1.7rem] bg-ink p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Само за тестове</p>
        <p className="mt-2 text-xl font-black">Отвори симулатора</p>
      </Link>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><label className="text-xs font-black uppercase tracking-[0.18em] text-ink/40">{label}</label><div className="mt-2 rounded-2xl bg-paper px-4 py-4 text-sm font-black">{value}</div></div>;
}

function CycleRow({ index, title, tone }: { index: string; title: string; tone: string }) {
  return <div className={`rounded-[1.4rem] p-4 ${tone}`}><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-black text-ink shadow-soft">{index}</span><p className="text-sm font-black leading-5">{title}</p></div></div>;
}

function Bubble({ name, body, mine = false }: { name: string; body: string; mine?: boolean }) {
  return <div className={`rounded-3xl p-4 text-sm ${mine ? "ml-8 bg-orange text-white" : "mr-8 bg-paper"}`}><p className={`text-xs font-black ${mine ? "text-white/60" : "text-ink/40"}`}>{name}</p><p className="mt-1 leading-6">{body}</p></div>;
}

function SettingsRow({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.4rem] bg-paper p-4"><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-ink/50">{body}</p></div>;
}

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("home");
  const Active = tab === "home" ? <HomeTab setTab={setTab} /> : tab === "requests" ? <RequestsTab /> : tab === "matches" ? <MatchesTab /> : tab === "chats" ? <ChatsTab /> : <ProfileTab />;

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-5 text-ink">
      <div className="mx-auto max-w-md space-y-4">
        <AppHeader />
        {Active}
      </div>
      <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[2rem] bg-white/90 p-2 shadow-soft backdrop-blur">
        <div className="grid grid-cols-6 gap-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-[1.4rem] px-2 py-3 text-[10px] font-black ${tab === item.id ? "bg-orange text-white" : "text-ink/55"}`}>
              <span className="block text-base leading-none">{item.icon}</span>
              <span className="mt-1 block">{item.label}</span>
            </button>
          ))}
          <Link href="/playground" className="rounded-[1.4rem] px-2 py-3 text-center text-[10px] font-black text-ink/55">
            <span className="block text-base leading-none">✦</span>
            <span className="mt-1 block">Сим.</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
