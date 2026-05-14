"use client";

import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { HomeScreen } from "./components/screens/HomeScreen";
import { RequestScreen } from "./components/screens/RequestScreen";
import { MatchScreen } from "./components/screens/MatchScreen";
import { ChatScreen } from "./components/screens/ChatScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import type { AppTab } from "./components/types";

const emptyMap = new Map();

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("home");
  const [selectedProfileId, setSelectedProfileId] = useState("parent-a");

  const Active =
    tab === "home" ? (
      <HomeScreen setTab={setTab} activeRequestText="ДГ №25 Изворче → ДГ №25 Изворче — сграда 2" matchCount={1} />
    ) : tab === "requests" ? (
      <RequestScreen
        snapshot={null}
        selectedProfileId="parent-a"
        selectedPlaceType="Общ ред"
        setSelectedPlaceType={() => undefined}
        myRequests={[]}
        kgById={emptyMap}
        requestToText={() => "ДГ №25 Изворче — сграда 2"}
        createRequest={() => undefined}
        deactivateRequest={() => undefined}
        deleteRequest={() => undefined}
        loading={false}
      />
    ) : tab === "matches" ? (
      <MatchScreen
        activeMatch={undefined}
        activeParticipant={undefined}
        participants={[]}
        selectedProfileId="parent-a"
        userById={emptyMap}
        fromToText={() => "ДГ №25 Изворче → ДГ №25 Изворче — сграда 2"}
        allConfirmed={false}
        matchIsClosed={false}
        currentStep={2}
        currentStepInfo={{ title: "Отвори чата и пиши с другите родители", helper: "Следи кой на какъв етап е и ъпдейтвай своя статус." }}
        loading={false}
        confirm={() => undefined}
        decline={() => undefined}
        updateMyStatus={() => undefined}
        leave={() => undefined}
      />
    ) : tab === "chats" ? (
      <ChatScreen
        activeMatch={undefined}
        allConfirmed={false}
        matchIsClosed={false}
        availableChats={[]}
        selectedChat={undefined}
        selectedChatId=""
        setSelectedChatId={() => undefined}
        snapshot={null}
        selectedProfileId="parent-a"
        selectedUserName="Родител A"
        userById={emptyMap}
        chatTitle={() => "Групов чат"}
        messageBody=""
        setMessageBody={() => undefined}
        sendMessage={() => undefined}
        loading={false}
      />
    ) : (
      <ProfileScreen
        selectedProfileId={selectedProfileId}
        selectedUserName="Родител A"
        users={[{ id: "parent-a", display_name: "Родител A" } as any]}
        setSelectedProfileId={setSelectedProfileId}
      />
    );

  return (
    <AppShell activeTab={tab} setTab={setTab} selectedUserName="Родител A">
      {Active}
    </AppShell>
  );
}
