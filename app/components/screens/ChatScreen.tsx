"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
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
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold mt-6">Чатове</p>
        <h1 className="font-display text-5xl leading-[1] mt-2 text-balance">Още са<br />заключени</h1>
        <p className="text-sm text-muted-foreground mt-4 max-w-[34ch]">Чатовете се отключват само когато всички родители в потенциалния цикъл потвърдят интерес.</p>
        <div className="mt-8 rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_38px_rgba(80,54,35,0.09)] backdrop-blur-xl">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F5EFE8]"><Lock className="h-5 w-5 text-muted-foreground" /></div>
          <h2 className="mt-5 font-display text-[22px] font-black leading-tight tracking-[-0.05em]">Няма отключен чат</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">След потвърждение от всички участници тук ще се появят груповият и личните чатове.</p>
        </div>
      </>
    );
  }

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? chats[0];

  return (
    <>
      <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold mt-6">Чатове</p>
      <h1 className="font-display text-5xl leading-[1] mt-2 text-balance">Координация</h1>
      <p className="text-sm text-muted-foreground mt-4 max-w-[34ch]">Пиши само за уточняване на процеса. Не споделяй чувствителни данни.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {chats.map((chat) => (
          <button key={chat.id} type="button" onClick={() => setSelectedChatId?.(chat.id)} className={`shrink-0 rounded-full px-4 py-2 font-display text-xs font-black shadow-soft ${selectedChat.id === chat.id ? "bg-gradient-ember text-white" : "bg-white/75 text-[#5A4039]"}`}>{chatTitle?.(chat) ?? (chat.chat_type === "group" ? "Групов чат" : "Личен чат")}</button>
        ))}
      </div>

      <div className="mt-3 rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-[0_16px_38px_rgba(80,54,35,0.09)] backdrop-blur-xl">
        <div className="mb-4 font-display text-lg font-black tracking-[-0.04em]">{chatTitle?.(selectedChat) ?? "Чат"}</div>
        <div className="flex max-h-[360px] min-h-[260px] flex-col gap-3 overflow-y-auto pr-1">
          {messages.length ? messages.map((message) => {
            const isMe = message.sender_user_id === selectedProfileId;
            return <div key={message.id} className={`max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-5 shadow-soft ${isMe ? "ml-auto bg-gradient-ember text-white" : "mr-auto bg-[#F5EFE8] text-[#533630]"}`}>{message.body}<div className={`mt-1 text-[10px] ${isMe ? "text-white/70" : "text-[#7B6E67]"}`}>{new Date(message.created_at).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}</div></div>;
          }) : <div className="rounded-[22px] bg-[#F5EFE8] px-4 py-3 text-sm text-muted-foreground">Все още няма съобщения.</div>}
        </div>
        <div className="mt-4 flex gap-2 rounded-full bg-white p-2 shadow-soft">
          <input value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitMessage(); }} placeholder="Напиши съобщение..." className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold outline-none" />
          <button disabled={loading || !body.trim()} onClick={submitMessage} className="h-11 rounded-full bg-gradient-ember px-5 font-display text-sm font-black text-white disabled:opacity-50">Изпрати</button>
        </div>
      </div>
    </>
  );
}
