import { ArrowUpRight, ChevronRight, Lock, Send } from "lucide-react";
import type { PlaygroundSnapshot } from "@/lib/playground";
import type { Chat } from "../types";
import { Bubble, SafetyNote } from "../shared/ui";

function PromoCard() {
  return (
    <div className="mt-8 flex items-center gap-4 rounded-3xl bg-gradient-butter p-3 pl-3 pr-5 shadow-soft">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-ember shadow-pill">
        <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">По-бързо съвпадение</p>
        <p className="mt-0.5 font-display text-base">Увеличи шанса за съвпадение</p>
      </div>
      <ChevronRight className="h-5 w-5 text-foreground/50" />
    </div>
  );
}

export function ChatScreen({ activeMatch, allConfirmed, matchIsClosed, availableChats, selectedChat, selectedChatId, setSelectedChatId, snapshot, selectedProfileId, selectedUserName, userById, chatTitle, messageBody, setMessageBody, sendMessage, loading }: { activeMatch?: PlaygroundSnapshot["matches"][number]; allConfirmed: boolean; matchIsClosed: boolean; availableChats: Chat[]; selectedChat?: Chat; selectedChatId: string; setSelectedChatId: (id: string) => void; snapshot: PlaygroundSnapshot | null; selectedProfileId: string; selectedUserName: string; userById: Map<string, PlaygroundSnapshot["users"][number]>; chatTitle: (chat: Chat) => string; messageBody: string; setMessageBody: (value: string) => void; sendMessage: () => void; loading: boolean }) {
  if (!activeMatch || !allConfirmed || matchIsClosed) {
    return (
      <>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Чатове</p>
        <h1 className="mt-2 text-balance font-display text-5xl leading-[1]">Още са<br />заключени</h1>
        <p className="mt-4 max-w-[34ch] text-sm text-muted-foreground">
          Чатовете се отключват само когато всички родители в потенциалния цикъл потвърдят интерес.
        </p>

        <PromoCard />

        <div className="mt-5 space-y-3">
          {["Цикъл #A21", "Цикъл #B07", "Потенциал #C13"].map((title, index) => (
            <div key={title} className="flex items-center gap-4 rounded-3xl bg-card p-5 opacity-80 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-display text-base">{title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Чака потвърждение от {3 - index} {3 - index === 1 ? "родител" : "родители"}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5"><SafetyNote /></div>
      </>
    );
  }

  return (
    <>
      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Чатове</p>
      <h1 className="mt-2 text-balance font-display text-5xl leading-[1]">{selectedChat ? chatTitle(selectedChat) : "Координация"}</h1>
      <p className="mt-4 max-w-[34ch] text-sm text-muted-foreground">
        При 2 страни показваме само личния чат. При 3/4 има групов и лични чатове.
      </p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {availableChats.map((chat) => (
          <button key={chat.id} type="button" onClick={() => setSelectedChatId(chat.id)} className={`shrink-0 rounded-full px-5 py-3 text-xs font-extrabold shadow-soft transition ${selectedChatId === chat.id ? "bg-gradient-ember text-primary-foreground shadow-glow" : "bg-card text-secondary-foreground"}`}>
            {chatTitle(chat)}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-white/80 bg-card/92 p-4 shadow-soft backdrop-blur-xl">
        <div className="space-y-3">
          {snapshot?.messages.filter((message) => selectedChat && message.chat_id === selectedChat.id).map((message) => {
            const mine = message.sender_user_id === selectedProfileId;
            return <Bubble key={message.id} mine={mine} name={mine ? "Ти" : userById.get(message.sender_user_id)?.display_name ?? "Родител"} body={message.body} />;
          })}
        </div>

        {selectedChat ? (
          <div className="mt-5 space-y-3">
            <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} className="min-h-28 w-full rounded-[1.8rem] border border-white/80 bg-secondary/60 p-4 text-sm outline-none backdrop-blur-xl" />
            <button type="button" disabled={loading || selectedChat.status !== "active"} onClick={sendMessage} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-ember font-display text-sm font-black text-primary-foreground shadow-glow disabled:opacity-30">
              <Send className="h-4 w-4" /> Изпрати като {selectedUserName}
            </button>
          </div>
        ) : null}
      </section>

      <div className="mt-5"><SafetyNote /></div>
    </>
  );
}
