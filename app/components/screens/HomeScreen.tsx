"use client";

import type { AppTab } from "../types";

export function HomeScreen({ setTab }: { setTab: (tab: AppTab) => void }) {
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
          <button className="hero-stat" type="button" onClick={() => setTab("requests")}><div className="hero-stat-num" style={{ background: "#cfe6ef", color: "var(--ink)" }}>00</div><div className="hero-stat-lbl">Активни заявки<span className="hero-stat-arrow">›</span></div></button>
          <button className="hero-stat" type="button" onClick={() => setTab("matches")}><div className="hero-stat-num" style={{ background: "#f4e4b8", color: "var(--ink)" }}>00</div><div className="hero-stat-lbl">Съвпадения<span className="hero-stat-arrow">›</span></div></button>
        </div>
        <div className="orb"></div>
      </div>
      <div style={{ marginBottom: 14 }}><button className="btn primary" style={{ width: "100%", height: 54, fontSize: 15, fontWeight: 800 }} type="button">📡 Радар</button></div>
      <div className="section-title">Първи стъпки<span className="see">Виж всички</span></div>
      <div className="request-card green"><div className="row"><div className="place-icon">01</div><div className="grow"><div className="place-title">Настрой заявката</div><div className="place-sub">Избери район, набор, тип място, сегашна и желана градина.</div></div></div></div>
      <div className="request-card teal"><div className="row"><div className="place-icon">02</div><div className="grow"><div className="place-title">Чакай системата</div><div className="place-sub">Системата търси маршрути за съвместна размяна.</div></div></div></div>
      <div className="request-card sand"><div className="row"><div className="place-icon">03</div><div className="grow"><div className="place-title">Потвърди интерес</div><div className="place-sub">При съвпадение потвърди и координирай с другите.</div></div></div></div>
      <div className="section-title">Официален ред<span className="see">Виж още</span></div>
      <div className="glass-card" style={{ padding: 16 }}>
        <div className="eyebrow orange" style={{ marginBottom: 10 }}>Какво да направя?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div className="place-icon" style={{ width: 36, height: 36, borderRadius: 13, fontSize: 14, flexShrink: 0 }}>01</div><div><div className="place-title">Свържи се</div><div className="place-sub">Провери условията за преместване в конкретното учебно заведение.</div></div></div>
          <div style={{ height: 1, background: "rgba(83,54,48,.07)" }}></div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div className="place-icon" style={{ width: 36, height: 36, borderRadius: 13, fontSize: 14, flexShrink: 0 }}>02</div><div><div className="place-title">Подай документи</div><div className="place-sub">Подай необходимите документи в конкретното заведение.</div></div></div>
        </div>
      </div>
      <button className="request-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", width: "100%", textAlign: "left" }} type="button"><div style={{ width: 44, height: 44, borderRadius: 17, background: "linear-gradient(135deg,var(--orange),var(--brown2))", display: "grid", placeItems: "center", fontSize: 20, boxShadow: "0 10px 22px rgba(255,138,61,.25)", flexShrink: 0 }}>↗</div><div style={{ flex: 1 }}><div className="place-title">По-бързо съвпадение</div><div className="place-sub">Увеличи шанса — покани родители</div></div><span style={{ color: "var(--soft)", fontSize: 18 }}>›</span></button>
    </>
  );
}
