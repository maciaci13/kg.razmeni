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
          <button className="hero-stat" type="button" onClick={() => setTab("requests")}>
            <div className="hero-stat-num" style={{ background: "#cfe6ef", color: "var(--ink)" }}>00</div>
            <div className="hero-stat-lbl">Активни заявки<span className="hero-stat-arrow">›</span></div>
          </button>
          <button className="hero-stat" type="button" onClick={() => setTab("matches")}>
            <div className="hero-stat-num" style={{ background: "#f4e4b8", color: "var(--ink)" }}>00</div>
            <div className="hero-stat-lbl">Съвпадения<span className="hero-stat-arrow">›</span></div>
          </button>
        </div>
        <div className="orb"></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <button className="btn primary" style={{ width: "100%", height: 54, fontSize: 15, fontWeight: 800 }} type="button">
          📡 Радар
        </button>
      </div>

      <div className="section-title">Първи стъпки<span className="see">Виж всички</span></div>

      <div className="request-card green">
        <div className="row">
          <div className="place-icon">01</div>
          <div className="grow">
            <div className="place-title">Настрой заявката</div>
            <div className="place-sub">Избери район, набор, тип място, сегашна и желана градина.</div>
          </div>
        </div>
      </div>

      <div className="request-card teal">
        <div className="row">
          <div className="place-icon">02</div>
          <div className="grow">
            <div className="place-title">Чакай системата</div>
            <div className="place-sub">Системата търси маршрути за съвместна размяна.</div>
          </div>
        </div>
      </div>

      <div className="request-card sand">
        <div className="row">
          <div className="place-icon">03</div>
          <div className="grow">
            <div className="place-title">Потвърди интерес</div>
            <div className="place-sub">При съвпадение потвърди и координирай с другите.</div>
          </div>
        </div>
      </div>
    </>
  );
}
