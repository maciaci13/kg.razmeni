import { ArrowUpRight, ChevronRight, MapPin, Search, Sparkles } from "lucide-react";
import type { AppTab } from "../types";
import { RouteMark } from "../shared/ui";

function StatCard({ number, title, body, tone }: { number: string; title: string; body: string; tone: string }) {
  return (
    <div className={`rounded-[2rem] ${tone} p-5 shadow-soft relative overflow-hidden`}>
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/22 blur-xl" />
      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/65 font-display text-lg font-black shadow-soft">{number}</span>
      <h3 className="relative mt-5 font-display text-lg leading-tight tracking-[-0.04em]">{title}</h3>
      <p className="relative mt-2 text-xs font-semibold leading-5 text-foreground/58">{body}</p>
    </div>
  );
}

function InsightCard({ category, title, body, tone }: { category: string; title: string; body: string; tone: string }) {
  return (
    <article className={`relative overflow-hidden rounded-[2rem] ${tone} p-5 shadow-soft`}>
      <RouteMark className="absolute -right-8 -top-7 h-28 w-28 opacity-15" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-extrabold">{category}</span>
          <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold">3 мин.</span>
        </div>
        <h3 className="font-display text-xl leading-tight tracking-[-0.04em]">{title}</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-foreground/58">{body}</p>
      </div>
    </article>
  );
}

function HeroSearch({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] bg-gradient-butter p-5 shadow-soft">
      <RouteMark className="absolute -right-8 -top-10 h-36 w-36 opacity-15" />
      <div className="absolute -left-10 bottom-6 h-36 w-36 rounded-full bg-white/24 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary">Твоят маршрут</p>
          <h1 className="mt-2 max-w-[13rem] font-display text-[3rem] leading-[0.9] tracking-[-0.055em] text-balance">Намери място</h1>
          <p className="mt-3 max-w-[15rem] text-[15px] font-medium leading-6 text-muted-foreground">за възможна координация между родители</p>
        </div>

        <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[1.8rem] bg-white/65 shadow-soft">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-ember text-primary-foreground shadow-pill">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-2 rounded-full bg-white/85 p-2 shadow-[inset_0_0_0_1px_rgba(28,27,25,0.04)] backdrop-blur-xl">
        <button className="grid h-12 w-12 place-items-center rounded-full bg-gradient-ember text-white shadow-pill"><MapPin className="h-5 w-5" /></button>
        <button className="grid h-12 w-12 place-items-center rounded-full bg-card text-foreground/60 shadow-soft"><Search className="h-5 w-5" /></button>
        <button onClick={() => setTab("requests")} className="flex min-h-12 flex-1 items-center justify-between rounded-full bg-card px-5 text-left text-sm font-extrabold text-secondary-foreground shadow-soft">Пусни заявка <ChevronRight className="h-5 w-5 text-primary" /></button>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
        <StatCard number="01" title="Активна заявка" body="ДГ №25 Изворче → ДГ №25 Изворче — сграда 2" tone="bg-gradient-sage" />
        <StatCard number="03" title="Потенциални маршрута" body="2/3/4-странни цикли" tone="bg-gradient-mist" />
      </div>
    </section>
  );
}

export function HomeScreen({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <>
      <HeroSearch setTab={setTab} />
      <div className="mt-6 rounded-[2rem] border border-white/70 bg-card/70 px-5 py-4 shadow-soft backdrop-blur-xl">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">Как работи</p>
        <p className="mt-2 font-display text-xl leading-tight tracking-[-0.04em]">Нужда → заявка → съвпадение → чат</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Следим само потенциална координация между родители. Официалните действия остават извън платформата.</p>
      </div>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-[2rem] tracking-[-0.05em]">За теб днес</h2>
          <button className="rounded-full bg-card px-4 py-2 text-xs font-bold shadow-soft">Виж всички</button>
        </div>
        <InsightCard category="Безопасност" title="Преди да пишеш на други родители" body="Не споделяй ЕГН, документи или данни на детето в чата. Координацията е само информативна." tone="bg-gradient-sage" />
        <InsightCard category="Важно за match" title="Типът място трябва да съвпада" body="Общ ред, СОП, хронични заболявания и социални критерии не се смесват в един цикъл." tone="bg-gradient-mist" />
      </section>

      <div className="relative mt-7 flex items-center gap-4 overflow-hidden rounded-[2rem] bg-gradient-butter p-4 pr-5 shadow-soft">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-gradient-ember shadow-pill"><ArrowUpRight className="h-5 w-5 text-primary-foreground" /></div>
        <div className="relative flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">По-бързо съвпадение</p>
          <p className="mt-1 font-display text-lg">Увеличи шанса за съвпадение</p>
        </div>
      </div>
    </>
  );
}
