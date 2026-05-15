"use client";

import { useState } from "react";
import { usePlaygroundController } from "../components/playground/usePlaygroundController";
import { HomeScreen } from "../components/screens/HomeScreen";
import { RequestScreen } from "../components/screens/RequestScreen";
import { MatchScreen } from "../components/screens/MatchScreen";
import { ChatScreen } from "../components/screens/ChatScreen";
import { ProfileScreen } from "../components/screens/ProfileScreen";

type ReactPreviewTab = "home" | "requests" | "matches" | "chats" | "profile";

const dockIcons: Record<ReactPreviewTab, string> = {
  home: "⌂",
  requests: "+",
  matches: "✦",
  chats: "◌",
  profile: "☻",
};

export default function ReactPreviewPage() {
  const [tab, setTab] = useState<ReactPreviewTab>("home");
  const playground = usePlaygroundController();

  return (
    <>
      <link rel="stylesheet" href="/styles/myasto.css" />
      <div className="outer-nav">
        <button className={`onb ${tab === "home" ? "on" : ""}`} type="button" onClick={() => setTab("home")}>React · Начало</button>
        <button className={`onb ${tab === "requests" ? "on" : ""}`} type="button" onClick={() => setTab("requests")}>React · Заявка</button>
        <button className={`onb ${tab === "matches" ? "on" : ""}`} type="button" onClick={() => setTab("matches")}>React · Съвпадение</button>
        <button className={`onb ${tab === "chats" ? "on" : ""}`} type="button" onClick={() => setTab("chats")}>React · Чат</button>
        <button className={`onb ${tab === "profile" ? "on" : ""}`} type="button" onClick={() => setTab("profile")}>React · Профил</button>
        <a className="onb" href="/myasto.html" style={{ textDecoration: "none" }}>HTML preview</a>
      </div>
      <p className="outer-label">Място За Място · React Preview</p>

      <div className="phone">
        <div className="status"><span>09:41</span><span>●●● 95%</span></div>
        <div className="screen on">
          <div className="app">
            {tab === "home" ? <HomeScreen setTab={setTab as any} /> : null}
            {tab === "requests" ? (
              <RequestScreen
                kindergartens={playground.kindergartens}
                myRequests={playground.myRequests}
                requestToText={playground.requestToText}
                createRequest={playground.createRequest}
                deactivateRequest={playground.deactivateRequest}
                deleteRequest={playground.deleteRequest}
                loading={playground.loading}
                error={playground.error}
              />
            ) : null}
            {tab === "matches" ? (
              <MatchScreen
                participants={playground.participants}
                selectedProfileId={playground.selectedProfileId}
                participantRoute={playground.participantRoute}
                participantName={playground.participantName}
                allConfirmed={playground.allConfirmed}
                matchIsClosed={playground.matchIsClosed}
                confirmMatch={playground.confirmMatch}
                declineMatch={playground.declineMatch}
                updateMyStatus={playground.updateMyStatus}
                loading={playground.loading}
              />
            ) : null}
            {tab === "chats" ? (
              <ChatScreen
                chats={playground.chats}
                selectedChatId={playground.selectedChatId}
                setSelectedChatId={playground.setSelectedChatId}
                chatTitle={playground.chatTitle}
                messages={playground.messages}
                selectedProfileId={playground.selectedProfileId}
                messageBody={playground.messageBody}
                setMessageBody={playground.setMessageBody}
                sendMessage={playground.sendMessage}
                loading={playground.loading}
              />
            ) : null}
            {tab === "profile" ? (
              <ProfileScreen
                selectedProfileId={playground.selectedProfileId}
                selectedUserName={playground.selectedProfileName}
                users={playground.users}
                setSelectedProfileId={playground.setSelectedProfileId}
              />
            ) : null}
          </div>
          <nav className="dock" aria-label="Основна навигация">
            <DockButton id="home" label="Начало" tab={tab} setTab={setTab} />
            <DockButton id="requests" label="Заявка" tab={tab} setTab={setTab} />
            <DockButton id="matches" label="Съвпадение" tab={tab} setTab={setTab} />
            <DockButton id="chats" label="Чат" tab={tab} setTab={setTab} />
            <DockButton id="profile" label="Профил" tab={tab} setTab={setTab} />
          </nav>
        </div>
      </div>
    </>
  );
}

function DockButton({ id, label, tab, setTab }: { id: ReactPreviewTab; label: string; tab: ReactPreviewTab; setTab: (tab: ReactPreviewTab) => void }) {
  return <button type="button" className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}><i>{dockIcons[id]}</i>{label}</button>;
}
