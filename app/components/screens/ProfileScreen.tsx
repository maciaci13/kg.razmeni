import Link from "next/link";
import type { PlaygroundSnapshot } from "@/lib/playground";

export function ProfileScreen({ selectedProfileId, selectedUserName, users, setSelectedProfileId }: { selectedProfileId: string; selectedUserName: string; users: PlaygroundSnapshot["users"]; setSelectedProfileId: (id: string) => void }) {
  return (
    <>
      <div className="bg-card rounded-3xl p-5 shadow-soft flex items-center gap-4">
        <div className="h-20 w-20 rounded-3xl bg-gradient-ember flex items-center justify-center font-display text-3xl text-primary-foreground shadow-pill">
          {selectedUserName.slice(-1) || "A"}
        </div>
        <div className="flex-1">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground font-bold">Профил</p>
          <h1 className="font-display text-3xl leading-tight mt-0.5">{selectedUserName || "Родител"}</h1>
          <p className="text-xs text-muted-foreground mt-1">София</p>
        </div>
      </div>

      {users.length > 1 ? (
        <div className="mt-5 bg-card rounded-3xl p-5 shadow-soft">
          <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-bold">Профил за преглед</p>
          <select
            value={selectedProfileId}
            onChange={(event) => setSelectedProfileId(event.target.value)}
            className="mt-4 w-full min-h-16 rounded-[1.8rem] bg-secondary/60 px-5 text-[15px] font-bold text-secondary-foreground outline-none"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.display_name}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-5 bg-card rounded-3xl p-5 shadow-soft">
        <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-bold">Настройки</p>
        <div className="mt-4 space-y-3">
          <Link href="#" className="block bg-secondary/60 rounded-2xl p-4 hover:bg-secondary transition-colors">
            <div className="font-display text-base">Данни за профила</div>
            <div className="text-xs text-muted-foreground mt-1">Район, набор, тип място и сегашна градина</div>
          </Link>
          <div className="bg-secondary/60 rounded-2xl p-4">
            <div className="font-display text-base">Поверителност</div>
            <div className="text-xs text-muted-foreground mt-1">Показваме само нужното за координация</div>
          </div>
          <div className="bg-secondary/60 rounded-2xl p-4">
            <div className="font-display text-base">Правила и безопасност</div>
            <div className="text-xs text-muted-foreground mt-1">Без продажба, гаранции и неофициални обещания</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="#" className="bg-gradient-sage rounded-3xl p-5 shadow-soft min-h-[140px] flex flex-col justify-between">
          <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-bold">Каузата</p>
          <h3 className="font-display text-2xl">Подкрепи проекта</h3>
        </Link>
        <Link href="/playground" className="bg-gradient-ember text-primary-foreground rounded-3xl p-5 shadow-glow min-h-[140px] flex flex-col justify-between text-left">
          <p className="text-[11px] tracking-[0.22em] uppercase font-bold opacity-80">Тестове</p>
          <h3 className="font-display text-2xl">Симулатор</h3>
        </Link>
      </div>
    </>
  );
}
