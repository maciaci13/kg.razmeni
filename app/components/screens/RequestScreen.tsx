"use client";

import { useState } from "react";

const placeTypes = ["Общ ред", "Социални критерии", "Хронични заболявания", "СОП"];

export function RequestScreen() {
  const [open, setOpen] = useState(true);
  const [selectedType, setSelectedType] = useState("Общ ред");
  const [saveProfile, setSaveProfile] = useState(false);

  return (
    <>
      <div className="app-head">
        <div className="app-head-left">
          <div className="eyebrow orange">Нова заявка</div>
          <div className="hello">Къде искате да сте?</div>
          <div className="sub">Избери сегашно и желано място. Съвпадението работи само между еднакъв тип места.</div>
        </div>
        <div className="avatar" style={{ cursor: "pointer" }}>🔔</div>
      </div>

      <div className={`request-collapse ${open ? "open" : ""}`} id="requestCollapse">
        <button type="button" className="request-collapse-head" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="rc-title">Активирай заявка</span>
          <span className="rc-caret" aria-hidden="true">⌃</span>
        </button>
        <div className="request-collapse-body">
          <div className="form-panel">
            <PreviewInput label="Район" value="Избери район" muted />
            <PreviewInput label="Набор / Група" value="Избери набор / група" muted />
            <div style={{ padding: "4px 2px 10px" }}>
              <label className="eyebrow soft" style={{ display: "block", marginBottom: 8 }}>Тип място</label>
              <div className="chip-row">
                {placeTypes.slice(0, 2).map((type) => (
                  <button key={type} type="button" className={`chip-sel ${selectedType === type ? "on" : ""}`} onClick={() => setSelectedType(type)}>{type}</button>
                ))}
              </div>
              <div className="chip-row">
                {placeTypes.slice(2).map((type) => (
                  <button key={type} type="button" className={`chip-sel ${selectedType === type ? "on" : ""}`} onClick={() => setSelectedType(type)}>{type}</button>
                ))}
              </div>
              <button type="button" className="chk-row" onClick={() => setSaveProfile(!saveProfile)}>
                <div className={`chk-box ${saveProfile ? "on" : ""}`}>{saveProfile ? "✓" : ""}</div>
                <span className="chk-label">Запази тези данни в профила ми</span>
              </button>
            </div>
          </div>

          <div className="swap-pair">
            <div className="input swap-input">
              <svg className="swap-bg bg-home" viewBox="0 0 24 24" fill="none" stroke="#533630" strokeWidth="1.2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <label>Сегашна градина</label>
              <div>Избери сегашна градина</div>
            </div>
            <div className="swap-btn-wrap">
              <button className="swap-btn" type="button" aria-label="Размени">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
            <div className="input swap-input">
              <svg className="swap-bg bg-star" viewBox="0 0 24 24" fill="none" stroke="#ff8a3d" strokeWidth="1.2" strokeLinecap="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <label>Желана градина</label>
              <div>Избери желана градина</div>
            </div>
          </div>

          <div style={{ margin: "20px 4px 16px" }}>
            <button className="btn primary" style={{ width: "100%", whiteSpace: "nowrap" }}>Активирай заявка</button>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>Моите заявки · v4<span className="see">версия 4</span></div>
      <div className="folder4-wrap">
        <div className="folder4-silhouette" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 164" preserveAspectRatio="none"><defs><linearGradient id="f4grad-react" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cfe6ef"/><stop offset="100%" stopColor="#cfe6ef"/></linearGradient></defs><path fill="url(#f4grad-react)" d="M 28 164 L 172 164 Q 200 164 200 140 L 200 68 Q 200 52 184 52 L 104 52 L 90 36 Q 85 28 75 28 L 28 28 Q 0 28 0 52 L 0 140 Q 0 164 28 164 Z"/></svg></div>
      </div>
      <div className="folder4-carousel">
        <div className="folder4-cards">
          <div className="folder4-card is-active"><div className="folder4-top"><div className="folder4-badge">Чакаща</div><button className="folder4-gear" aria-label="Настройки">⚙</button></div><div className="folder4-from">ДГ №193 Славейче →</div><div className="folder4-title">ДГ №192 Лозичка</div><div className="folder4-meta">Общ ред · Набор 2023</div></div>
          <div className="folder4-card"><div className="folder4-top"><div className="folder4-badge is-pending" style={{ background: "#ff8a3d" }}>Активна</div><button className="folder4-gear" aria-label="Настройки">⚙</button></div><div className="folder4-from">ДГ №25 Изворче →</div><div className="folder4-title">ДГ №25 Изворче – сграда 2</div><div className="folder4-meta">Общ ред · Набор 2019</div></div>
        </div>
      </div>

      <div className="notice notice-paper" style={{ marginTop: 14 }}>Заявката ще се скрие автоматично при потенциален цикъл.</div>
    </>
  );
}

function PreviewInput({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className="input"><label>{label}</label><div style={muted ? { color: "var(--soft)" } : undefined}>{value}</div></div>;
}
