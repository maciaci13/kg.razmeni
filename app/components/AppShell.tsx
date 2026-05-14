import { Bell, CircleUser, Home, MessageSquare, Plus, Sparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { AppTab } from "./types";

const tabs: { id: AppTab; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "home", label: "Начало", icon: Home },
  { id: "requests", label: "Заявка", icon: Plus },
  { id: "matches", label: "Съвпадение", icon: Sparkles },
  { id: "chats", label: "Чат", icon: MessageSquare },
  { id: "profile", label: "Профил", icon: CircleUser }
];

export function AppShell({ children, activeTab, setTab, selectedUserName }: { children: ReactNode; activeTab: AppTab; setTab: (tab: AppTab) => void; selectedUserName: string }) {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-36 pt-6 relative overflow-visible">
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className="liquid-action rounded-[1.35rem] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground/55"
          >
            {selectedUserName || "Профил"}
          </button>

          <button
            type="button"
            className="liquid-action flex h-12 w-12 items-center justify-center rounded-[1.35rem]"
            aria-label="Известия"
          >
            <Bell className="h-5 w-5 text-foreground/65" strokeWidth={2.15} />
          </button>
        </header>

        {children}
      </div>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-0.5">
        <div className="liquid-dock flex items-center justify-between rounded-[2rem] px-3 py-2.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[1.35rem] px-2.5 py-2 transition-all duration-200 ${
                  active
                    ? "bg-gradient-ember text-primary-foreground shadow-glow scale-[1.03] -translate-y-0.5"
                    : "text-foreground/52 hover:text-foreground/75"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.45 : 1.85} />
                <span className={`text-[10px] leading-none ${active ? "font-extrabold" : "font-bold"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
