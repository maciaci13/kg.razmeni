"use client";

import { useState } from "react";
import { usePlaygroundController } from "../components/playground/usePlaygroundController";
import { RequestScreen } from "../components/screens/RequestScreen";
import { MatchScreen } from "../components/screens/MatchScreen";
import { ChatScreen } from "../components/screens/ChatScreen";

type ReactPreviewTab = "requests" | "matches" | "chats";

export default function ReactPreviewPage() {
  const [tab, setTab] = useState<ReactPreviewTab>("requests");
  const playground = usePlaygroundController();

  return (
    <>
      <link rel="stylesheet" href="/styles/myasto.css" />
      <div className="outer-nav">
        <button className={`onb ${tab === "requests" ? "on" : ""}`} type="button" onClick={() => setTab("requests")}>React · Заявка</button>
        <button className={`onb ${tab === "matches" ? "on" : ""}`} type="button" onClick={() => setTab("matches")}>React · Съвпадение</button>
        <button className={`onb ${tab === "chats" ? "on" : ""}`} type="button" onClick={() => setTab("chats")}>React · Чат</button>
        <a className="onb" href="/myasto.html" style={{ textDecoration: "none" }}>HTML preview</a>
      </div>
      <p className="outer-label">Място За Място · React Preview</p>

      <div className="phone">
        <div className="status"><span>09:41</span><span>●●● 95%</span></div>
        <div className="screen on">
          <div className="app">
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
          </div>
          <nav className="dock">
            <button type="button" className="tab" aria-disabled="true"><i>⌂</i>Начало</button>
            <button type="button" className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}><i>＋</i>Заявка</button>
            <button type="button" className={`tab ${tab === "matches" ? "active" : ""}`} onClick={() => setTab("matches")}><i>✦</i>Съвпадение</button>
            <button type="button" className={`tab ${tab === "chats" ? "active" : ""}`} onClick={() => setTab("chats")}><i>💬</i>Чат</button>
            <button type="button" className="tab" aria-disabled="true"><i>👤</i>Профил</button>
          </nav>
        </div>
      </div>
    </>
  );
}
