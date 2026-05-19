"use client";

import { useState } from "react";
import type { AppTab } from "../types";

type HomePopup = "radar" | "steps" | "official" | "share" | null;

type ReactHomeScreenProps = {
  setTab: (tab: AppTab) => void;
  activeRequestsCount?: number;
  matchesCount?: number;
};

export function ReactHomeScreen({ setTab, activeRequestsCount = 0, matchesCount = 0 }: ReactHomeScreenProps) {
  const [popup, setPopup] = useState<HomePopup>(null);

  return (
    <>
      <div className="app-head">
        <div className="app-head-left">
          <div className="hello">Намери<br /><span>размяна</span></div>
          <div className="sub">Координирай се с родители за преместване по официалния ред.</div>
        </div>
        <div className="avatar" style={{ cursor: "pointer" }}>🔔</div>
      </div>

      <div className="card hero-card">
        <h2>Място за<br />Място</h2>
        <div className="hero-stats">
          <button className="hero-stat" type="button" onClick={() => setTab("requests")}>
            <div className="hero-stat-num" style={{ background: "#cfe6ef", color: "var(--ink)" }}>{String(activeRequestsCount).padStart(2, "0")}</div>
            <div className="hero-stat-lbl">Активни заявки<span className="hero-stat-arrow">›</span></div>
          </button>
          <button className="hero-stat" type="button" onClick={() => setTab("matches")}>
            <div className="hero-stat-num" style={{ background: "#f4e4b8", color: "var(--ink)" }}>{String(matchesCount).padStart(2, "0")}</div>
            <div className="hero-stat-lbl">Съвпадения<span className="hero-stat-arrow">›</span></div>
          </button>
        </div>
        <div className="orb" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <button className="btn primary" style={{ width: "100%", height: 54, fontSize: 15, fontWeight: 800 }} type="button" onClick={() => setPopup("radar")}>📡 Радар</button>
      </div>

      <div className="section-title">Първи стъпки<button className="see" type="button" onClick={() => setPopup("steps")}>Виж всички</button></div>
      <StepCard tone="green" index="01" title="Настрой заявката" text="Избери район, набор, тип място, сегашна и желана градина." />
      <StepCard tone="teal" index="02" title="Чакай системата" text="Системата търси маршрути за съвместна размяна." />
      <StepCard tone="sand" index="03" title="Потвърди интерес" text="При съвпадение потвърди и координирай с другите." />

      <div className="section-title">Официален ред<button className="see" type="button" onClick={() => setPopup("official")}>Виж още</button></div>
      <OfficialCard />

      <button className="request-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", width: "100%", textAlign: "left" }} type="button" onClick={() => setPopup("share")}>
        <div style={{ width: 44, height: 44, borderRadius: 17, background: "linear-gradient(135deg,var(--orange),var(--brown2))", display: "grid", placeItems: "center", fontSize: 20, boxShadow: "0 10px 22px rgba(255,138,61,.25)", flexShrink: 0 }}>↗</div>
        <div style={{ flex: 1 }}><div className="place-title">По-бързо съвпадение</div><div className="place-sub">Увеличи шанса — покани родители</div></div>
        <span style={{ color: "var(--soft)", fontSize: 18 }}>›</span>
      </button>

      {popup === "radar" ? <RadarPopup onClose={() => setPopup(null)} setTab={setTab} /> : null}
      {popup === "steps" ? <StepsPopup onClose={() => setPopup(null)} /> : null}
      {popup === "official" ? <OfficialPopup onClose={() => setPopup(null)} /> : null}
      {popup === "share" ? <SharePopup onClose={() => setPopup(null)} /> : null}
    </>
  );
}

function StepCard({ tone, index, title, text }: { tone: "green" | "teal" | "sand"; index: string; title: string; text: string }) {
  return <div className={`request-card ${tone}`}><div className="row"><div className="place-icon">{index}</div><div className="grow"><div className="place-title">{title}</div><div className="place-sub">{text}</div></div></div></div>;
}

function OfficialCard() {
  return <div className="glass-card" style={{ padding: 16 }}><div className="eyebrow orange" style={{ marginBottom: 10 }}>Какво да направя?</div><div style={{ display: "flex", flexDirection: "column", gap: 12 }}><OfficialRow index="01" title="Свържи се" text="Провери условията за преместване в конкретното учебно заведение." /><div style={{ height: 1, background: "rgba(83,54,48,.07)" }} /><OfficialRow index="02" title="Подай документи" text="Подай необходимите документи в конкретното заведение." /></div></div>;
}

function OfficialRow({ index, title, text }: { index: string; title: string; text: string }) {
  return <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div className="place-icon" style={{ width: 36, height: 36, borderRadius: 13, fontSize: 14, flexShrink: 0 }}>{index}</div><div><div className="place-title">{title}</div><div className="place-sub">{text}</div></div></div>;
}

function FullScreenSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={onClose}><div className="coord-modal-card" onClick={(event) => event.stopPropagation()}><button className="coord-close" type="button" onClick={onClose}>×</button>{children}</div></div>;
}

function RadarPopup({ onClose, setTab }: { onClose: () => void; setTab: (tab: AppTab) => void }) {
  const cards = [
    { c: "card-pink", n: "ДГ №25 Изворче", a: "Банкя · гр. Банкя, ул. П. Д. Петков, №15" },
    { c: "card-teal", n: "ДГ №25 Изворче – сграда 2", a: "Банкя · гр. Банкя, ул. Восток–2, №4" },
    { c: "card-sand", n: "ДГ №25 Изворче – сграда 3", a: "Банкя · гр. Банкя, ул. Царибродска, №5" },
  ];
  return <FullScreenSheet onClose={onClose}><div className="eyebrow orange">Радар за шанс</div><div className="hello" style={{ marginBottom: 8 }}>Където има<br /><span>движение?</span></div><div className="sub" style={{ marginBottom: 16 }}>Показваме места с активни заявки и потенциал за бъдещо съвпадение.</div><div className="chip-row" style={{ marginBottom: 14 }}><button className="chip-sel on">Около мен</button><button className="chip-sel">Най-голям шанс</button><button className="chip-sel">Всички</button></div><div className="search-bar"><span>🔍</span><span>Търси по име, номер или район...</span></div>{cards.map((card) => <div key={card.n} className={`radar-card ${card.c}`}><div className="radar-card-name">{card.n}</div><div className="radar-card-addr">{card.a}</div><div className="stat-row"><div className="stat-cell"><div className="stat-num">0</div><div className="stat-label">родители я търсят</div></div><div className="stat-cell"><div className="stat-num">0</div><div className="stat-label">може да я освободят</div></div><div className="stat-cell"><div className="stat-num">0</div><div className="stat-label">Активни за твоя набор</div></div></div><button className="btn primary" type="button" style={{ height: 46, fontSize: 13 }} onClick={() => { onClose(); setTab("requests"); }}>Заяви размяна</button></div>)}</FullScreenSheet>;
}

function StepsPopup({ onClose }: { onClose: () => void }) {
  return <FullScreenSheet onClose={onClose}><div className="eyebrow orange">Първи стъпки</div><div className="hello" style={{ marginBottom: 14 }}>Как работи<br />процесът?</div>{["Настрой заявката", "Чакай системата", "Потвърди интерес", "Координирай се в чат", "Следвай официалния ред"].map((title, i) => <StepCard key={title} tone={i % 3 === 0 ? "green" : i % 3 === 1 ? "teal" : "sand"} index={String(i + 1).padStart(2, "0")} title={title} text="Стъпката се изпълнява само през официалните правила на учебното заведение." />)}</FullScreenSheet>;
}

function OfficialPopup({ onClose }: { onClose: () => void }) {
  return <FullScreenSheet onClose={onClose}><div className="eyebrow orange">Официален ред</div><div className="hello" style={{ marginBottom: 14 }}>Важно преди<br />действие</div><div className="glass-card" style={{ padding: 16 }}><div className="place-title">Място За Място не гарантира преместване</div><div className="place-sub" style={{ marginTop: 8 }}>Платформата помага да откриеш родители със съвместим интерес. Всички реални действия се случват през официалната процедура на детското заведение и общината.</div></div><div className="request-card sand"><div className="row"><div className="place-icon">01</div><div><div className="place-title">Свържи се със заведението</div><div className="place-sub">Провери срокове, документи и условия.</div></div></div></div><div className="request-card teal"><div className="row"><div className="place-icon">02</div><div><div className="place-title">Подай документи официално</div><div className="place-sub">Не разчитай на неофициални обещания.</div></div></div></div></FullScreenSheet>;
}

function SharePopup({ onClose }: { onClose: () => void }) {
  return <FullScreenSheet onClose={onClose}><div className="sheet-icon">↗</div><div className="eyebrow orange">Повече родители · Повече шанс</div><div className="hello" style={{ marginBottom: 10 }}>Увеличи шанса<br />за съвпадение</div><p className="body-text" style={{ marginBottom: 14 }}>Място За Място работи най-добре, когато повече родители подават заявки. Разкажи за платформата в социалните си мрежи, родителски групи, Viber общности или лични чатове.</p><div className="glass-card" style={{ padding: "13px 15px", marginBottom: 16, borderRadius: 20 }}><div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Споделя се само обща покана към платформата. Конкретната ти заявка и личните ти данни остават скрити.</div></div><button className="btn primary" type="button" onClick={onClose}>Сподели</button></FullScreenSheet>;
}