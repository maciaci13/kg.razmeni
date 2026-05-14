import { ArrowUpRight, ChevronRight, Lock } from "lucide-react";

export function ChatScreen() {
  return (
    <>
      <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold mt-6">Чатове</p>
      <h1 className="font-display text-5xl leading-[1] mt-2 text-balance">Още са<br />заключени</h1>
      <p className="text-sm text-muted-foreground mt-4 max-w-[34ch]">
        Чатовете се отключват само когато всички родители в потенциалния цикъл потвърдят интерес.
      </p>

      <div className="mt-8 bg-gradient-butter rounded-3xl p-3 pl-3 pr-5 shadow-soft flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-ember flex items-center justify-center shadow-pill">
          <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.22em] uppercase font-bold text-muted-foreground">По-бързо съвпадение</p>
          <p className="font-display text-base mt-0.5">Увеличи шанса за съвпадение</p>
        </div>
        <ChevronRight className="h-5 w-5 text-foreground/50" />
      </div>

      <div className="mt-5 space-y-3">
        {["Цикъл #A21", "Цикъл #B07", "Потенциал #C13"].map((title, index) => (
          <div key={title} className="bg-card rounded-3xl p-5 shadow-soft flex items-center gap-4 opacity-80">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-display text-base">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Чака потвърждение от {3 - index} {3 - index === 1 ? "родител" : "родители"}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
