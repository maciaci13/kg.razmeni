import Link from "next/link";
import type { PlaygroundSnapshot } from "@/lib/playground";
import { SelectField } from "../shared/ui";

export function ProfileScreen({ selectedProfileId, selectedUserName, users, setSelectedProfileId }: { selectedProfileId: string; selectedUserName: string; users: PlaygroundSnapshot["users"]; setSelectedProfileId: (id: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-ember font-display text-3xl text-primary-foreground shadow-pill">
          {selectedUserName.slice(-1) || "А"}
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Профил</p>
          <h1 className="mt-0.5 font-display text-3xl leading-tight">{selectedUserName || "Родител"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Тестов профил · София</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Тестов потребител</p>

        <div className="mt-4">
          <SelectField value={selectedProfileId} onChange={setSelectedProfileId}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.display_name}</option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Настройки</p>

        <div className="mt-4 space-y-3">
          <Link href="#" className="block rounded-2xl bg-secondary/60 p-4 transition-colors hover:bg-secondary">
            <div className="font-display text-base">Данни за профила</div>
            <div className="mt-1 text-xs text-muted-foreground">Район, набор, тип място и сегашна градина</div>
          </Link>

          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="font-display text-base">Поверителност</div>
            <div className="mt-1 text-xs text-muted-foreground">Показваме само нужното за координация</div>
          </div>

          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="font-display text-base">Правила и безопасност</div>
            <div className="mt-1 text-xs text-muted-foreground">Без продажба, гаранции и неофициални обещания</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="#" className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-gradient-sage p-5 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Каузата</p>
          <h3 className="font-display text-2xl">Подкрепи проекта</h3>
        </Link>

        <button type="button" className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-gradient-ember p-5 text-left text-primary-foreground shadow-glow">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-80">Тестове</p>
          <h3 className="font-display text-2xl">Симулатор</h3>
        </button>
      </div>
    </>
  );
}
