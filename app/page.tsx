"use client";

import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { HomeScreen } from "./components/screens/HomeScreen";
import { RequestScreen } from "./components/screens/RequestScreen";
import { MatchScreen } from "./components/screens/MatchScreen";
import { ChatScreen } from "./components/screens/ChatScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import type { AppTab } from "./components/types";

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("home");
  const [selectedProfileId, setSelectedProfileId] = useState("parent-a");

  const Active =
    tab === "home" ? <HomeScreen setTab={setTab} />
    : tab === "requests" ? <RequestScreen />
    : tab === "matches" ? <MatchScreen />
    : tab === "chats" ? <ChatScreen />
    : <ProfileScreen selectedProfileId={selectedProfileId} selectedUserName="Родител A" users={[{ id: "parent-a", display_name: "Родител A" } as any]} setSelectedProfileId={setSelectedProfileId} />;

  return (
    <AppShell activeTab={tab} setTab={setTab}>
      <div className="mb-4 rounded-full bg-gradient-ember px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.22em] text-primary-foreground shadow-glow">
        REDESIGN PREVIEW ACTIVE
      </div>
      {Active}
    </AppShell>
  );
}
