"use client";

import { useState } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type Chat = PlaygroundSnapshot["chats"][number];
type Message = PlaygroundSnapshot["messages"][number];

type ChatScreenProps = {
  chats?: Chat[];
  selectedChatId?: string;
  setSelectedChatId?: (id: string) => void;
  chatTitle?: (chat: Chat) => string;
  messages?: Message[];
  selectedProfileId?: string;
  messageBody?: string;
  setMessageBody?: (body: string) => void;
  sendMessage?: (body?: string) => void | Promise<void>;
  loading?: boolean;
};

function initials(label: string) {
  if (label.includes("Групов")) return "Г";
  return label.replace("Лично:", "").trim().slice(0, 1) || "Р";
}

export function ChatScreen({ chats = [], selectedChatId = "", setSelectedChatId, chatTitle, messages = [], selectedProfileId = "", messageBody = "", setMessageBody, sendMessage, loading = false }: ChatScreenProps) {
  const [localBody, setLocalBody] = useState("");
  const body = setMessageBody ? messageBody : localBody;
  const setBody = setMessageBody ?? setLocalBody;

  async function submitMessage() {
    if (!body.trim()) return;
    await sendMessage?.(body);
    setBody("");
  }

  if (!chats.length) {
    return (
      <>
        <div className="app-head" style={{ marginBottom: 0 }}>
          <div className="app-head-left">
            <div className="eyebrow muted">Чатове</div>
            <div className="hello">Още са заключени</div>
            <div className="sub" style={{ maxWidth: 260 }}>Чатовете се отключват само когато всички родители в потенциалния цикъл потвърдят интерес.</div>
          </div>
          <div className="avatar" style={{ cursor: "pointer" }}>🔔</div>
        </div>
        <div className="chat-list" style={{ justifyContent: "center", gap: 16, paddingBottom: 120 }}>
          <div className="msg-group"><div className="msg sys">Няма отключен чат. След потвърждение от всички участници тук ще се появят груповият и личните чатове.</div></div>
        </div>
      </>
    );
  }

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? chats[0];

  return (
    <>
      <div className="app-head" style={{ marginBottom: 14 }}>
        <div className="app-head-left">
          <div className="eyebrow muted">Активен разговор</div>
          <div className="hello">Чат</div>
        </div>
        <div className="avatar" style={{ cursor: "pointer" }}>🔔</div>
      </div>

      <style jsx>{`
        .react-chat-tabs{display:flex;gap:10px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.react-chat-tabs::-webkit-scrollbar{display:none}
        .react-chat-tab{flex:0 0 auto;min-height:46px;border-radius:999px;border:1px solid rgba(83,54,48,.12);background:rgba(255,255,255,.68);color:#7f6f66;font:900 13px/1 Manrope,sans-serif;padding:0 16px 0 8px;display:inline-flex;align-items:center;gap:9px;box-shadow:0 8px 20px rgba(80,54,35,.06);cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        .react-chat-tab.active{background:linear-gradient(135deg,#ff8a3d,#c98555);color:#fff;border-color:rgba(255,255,255,.58);box-shadow:0 12px 26px rgba(255,138,61,.24)}
        .react-chat-tab-avatar{width:28px;height:28px;border-radius:999px;border:2px solid #fff;background:linear-gradient(135deg,#ffb56f,#c06b36);display:grid;place-items:center;color:#fff;font:900 10px/1 Manrope,sans-serif;box-shadow:0 4px 10px rgba(80,54,35,.12)}
        .react-chat-area{position:relative;margin-left:-8px;margin-right:-8px;min-height:360px;padding-bottom:138px}
        .react-chat-list{display:flex;flex-direction:column;gap:12px;max-height:390px;overflow-y:auto;padding:8px 8px 20px;scrollbar-width:none}.react-chat-list::-webkit-scrollbar{display:none}
        .react-chat-bottom-fade{position:absolute;left:0;right:0;bottom:0;height:128px;z-index:1;pointer-events:none;background:linear-gradient(to bottom,rgba(251,250,248,0),rgba(251,250,248,.16) 38%,rgba(251,250,248,.70) 100%);filter:blur(10px);border-radius:36px}
        .react-composer{position:absolute;left:0;right:0;bottom:22px;z-index:2;display:block;padding:0;border:0;background:transparent;box-shadow:none;overflow:visible}
        .react-chat-panel-shell{position:relative;padding:12px;border-radius:34px;background:radial-gradient(circle at 18% 8%,rgba(255,185,96,.78),transparent 42%),radial-gradient(circle at 88% 16%,rgba(142,94,63,.40),transparent 42%),linear-gradient(135deg,rgba(255,138,61,.62),rgba(205,142,83,.52) 42%,rgba(92,66,52,.30));border:1px solid rgba(255,236,211,.72);box-shadow:0 20px 52px rgba(112,70,38,.24),inset 0 1px 0 rgba(255,255,255,.55),inset 0 -24px 60px rgba(255,255,255,.16);backdrop-filter:blur(22px) saturate(1.25);-webkit-backdrop-filter:blur(22px) saturate(1.25);overflow:hidden}
        .react-chat-panel-shell:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,rgba(255,255,255,.34),transparent 34%,rgba(255,255,255,.12) 68%,transparent);pointer-events:none;opacity:.95}
        .react-chat-input-band{position:relative;z-index:1;min-height:56px;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:23px;background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.96);box-shadow:0 18px 36px rgba(80,54,35,.18),inset 0 1px 0 rgba(255,255,255,.9)}
        .react-chat-input-band input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#332620;font:800 15px/1.2 Onest,Manrope,sans-serif;letter-spacing:-.02em}.react-chat-input-band input::placeholder{color:rgba(83,54,48,.48)}
        .react-chat-send-main{flex:0 0 40px;width:40px;height:40px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff8a3d,#c98555);color:#fff;font:900 22px/1 Manrope,sans-serif;display:grid;place-items:center;box-shadow:0 10px 22px rgba(255,138,61,.28);cursor:pointer}.react-chat-send-main:disabled{opacity:.45}
        .react-chat-attach-main{flex:0 0 36px;width:36px;height:36px;border:0;border-radius:15px;background:rgba(245,241,236,.9);color:#7a6c66;font:900 19px/1 Manrope,sans-serif;display:grid;place-items:center;cursor:pointer}
      `}</style>

      <div className="react-chat-tabs" aria-label="Избор на чат">
        {chats.map((chat) => {
          const title = chatTitle?.(chat) ?? (chat.chat_type === "group" ? "Групов чат" : "Личен чат");
          return <button key={chat.id} className={`react-chat-tab ${selectedChat.id === chat.id ? "active" : ""}`} type="button" onClick={() => setSelectedChatId?.(chat.id)}><span className="react-chat-tab-avatar">{initials(title)}</span>{title}</button>;
        })}
      </div>

      <div className="react-chat-area">
        <div className="react-chat-list">
          {messages.length ? messages.map((message) => {
            const isMe = message.sender_user_id === selectedProfileId;
            const time = new Date(message.created_at).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
            return isMe ? <div key={message.id} className="msg-group me"><div className="msg me">{message.body}</div><div className="msg-time" style={{ textAlign: "right" }}>{time}</div></div> : <div key={message.id} className="msg-group"><div className="msg-sender">Родител</div><div className="msg them">{message.body}</div><div className="msg-time">{time}</div></div>;
          }) : <div className="msg-group"><div className="msg sys">Все още няма съобщения.</div></div>}
        </div>
        <div className="react-chat-bottom-fade"></div>
        <div className="react-composer">
          <div className="react-chat-panel-shell">
            <div className="react-chat-input-band">
              <button className="react-chat-attach-main" aria-label="Прикачи файл" type="button">＋</button>
              <input value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitMessage(); }} placeholder="Напиши съобщение..." />
              <button className="react-chat-send-main" disabled={loading || !body.trim()} onClick={submitMessage} aria-label="Изпрати" type="button">↑</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
