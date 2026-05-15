"use client";

import { useState } from "react";

const placeTypes = ["Общ ред", "Социални критерии", "Хронични заболявания", "СОП"];
const districts = ["Избери район", "Лозенец", "Младост", "Люлин", "Оборище", "Витоша"];
const cohorts = ["Избери набор / група", "Набор 2019", "Набор 2020", "Набор 2021", "Набор 2022", "Набор 2023"];
const kindergartens = ["Избери градина", "ДГ №25 Изворче", "ДГ №25 Изворче – сграда 2", "ДГ №193 Славейче", "ДГ №192 Лозичка"];

export function RequestScreen() {
  const [open, setOpen] = useState(true);
  const [selectedType, setSelectedType] = useState("Общ ред");
  const [saveProfile, setSaveProfile] = useState(false);
  const [district, setDistrict] = useState(districts[0]);
  const [cohort, setCohort] = useState(cohorts[0]);
  const [fromKg, setFromKg] = useState(kindergartens[0]);
  const [toKg, setToKg] = useState(kindergartens[0]);

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
            <PreviewSelect label="Район" value={district} onChange={setDistrict} options={districts} muted={district === districts[0]} />
            <PreviewSelect label="Набор / Група" value={cohort} onChange={setCohort} options={cohorts} muted={cohort === cohorts[0]} />
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
              <PreviewSelect label="Сегашна градина" value={fromKg} onChange={setFromKg} options={kindergartens} muted={fromKg === kindergartens[0]} bare />
            </div>
            <div className="swap-btn-wrap">
              <button className="swap-btn" type="button" aria-label="Размени" onClick={() => { const nextFrom = toKg; setToKg(fromKg); setFromKg(nextFrom); }}>
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
              <PreviewSelect label="Желана градина" value={toKg} onChange={setToKg} options={kindergartens} muted={toKg === kindergartens[0]} bare />
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

function PreviewSelect({ label, value, onChange, options, muted = false, bare = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; muted?: boolean; bare?: boolean }) {
  return (
    <label className={bare ? "" : "input"} style={bare ? { display: "block", position: "relative", zIndex: 2 } : { position: "relative", display: "block" }}>
      <span style={{ display: "block", fontSize: 10, fontFamily: "Manrope, sans-serif", fontWeight: 800, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={{ width: "100%", border: 0, background: "transparent", outline: 0, color: muted ? "var(--soft)" : "var(--ink)", fontSize: 15, fontWeight: 600, fontFamily: "Onest, system-ui, sans-serif", appearance: "auto", position: "relative", zIndex: 3 }}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
