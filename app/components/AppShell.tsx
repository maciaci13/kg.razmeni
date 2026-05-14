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

export function AppShell({ children, activeTab, setTab }: { children: ReactNode; activeTab: AppTab; setTab: (tab: AppTab) => void; selectedUserName?: string }) {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <div className="mx-auto max-w-md px-5 pt-6 pb-36 relative overflow-visible">
        <header className="flex items-center justify-end mb-6">
          <button className="liquid-action h-12 w-12 rounded-[1.35rem] flex items-center justify-center" aria-label="Известия">
            <Bell className="h-5 w-5 text-foreground/65" strokeWidth={2.15} />
          </button>
        </header>
        {children}
      </div>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md px-0.5">
        <div className="liquid-dock rounded-[2rem] flex items-center justify-between px-3 py-2.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex min-w-0 flex-col items-center gap-0.5 px-2.5 py-2 rounded-[1.35rem] transition-all duration-200 ${
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
    </div>
  );
}
