import Link from "next/link";
import type { PlaygroundSnapshot } from "@/lib/playground";

export function ProfileScreen({ selectedProfileId, selectedUserName, users, setSelectedProfileId }: { selectedProfileId: string; selectedUserName: string; users: PlaygroundSnapshot["users"]; setSelectedProfileId: (id: string) => void }) {
  return (
    <>
      <div className="app-head">
        <div className="app-head-left">
          <div className="hello">Профил</div>
          <div className="sub">Настройки, поверителност и поддръжка.</div>
        </div>
        <div className="avatar">🔔</div>
      </div>

      <div className="profile-cover">
        <div className="profile-avatar">{selectedUserName?.slice(0, 1) || "А"}</div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>{selectedUserName || "Родител А"}<span className="see">Редактирай</span></div>
      <div className="place-sub" style={{ marginBottom: 14 }}>Тестов профил · София</div>

      {users.length > 1 ? (
        <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
          <div className="eyebrow soft" style={{ marginBottom: 8 }}>Тестов профил</div>
          <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)} style={{ width: "100%", border: 0, background: "transparent", outline: 0, fontSize: 15, fontWeight: 700, fontFamily: "Onest, sans-serif" }}>
            {users.map((user) => <option key={user.id} value={user.id}>{user.display_name}</option>)}
          </select>
        </div>
      ) : null}

      <div className="section-title">Настройки</div>

      <div className="glass-card" style={{ padding: "4px 16px" }}>
        <div className="setting-row"><div><div className="sr-label">Данни за профила</div><div className="sr-sub">Район, набор, тип място и сегашна градина</div></div><span className="sr-right">›</span></div>
        <div className="setting-row"><div><div className="sr-label">Поверителност</div><div className="sr-sub">Показваме само нужното за координация</div></div><span className="sr-right">›</span></div>
        <div className="setting-row"><div><div className="sr-label">Правила и безопасност</div><div className="sr-sub">Без продажба, гаранции и неофициални обещания</div></div><span className="sr-right">›</span></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <div className="card-sage" style={{ borderRadius: 26, padding: 16 }}>
          <div className="eyebrow green">Каузата</div>
          <div className="place-title" style={{ lineHeight: 1.2 }}>Подкрепи<br />проекта</div>
        </div>

        <Link href="/playground" className="card-orange" style={{ borderRadius: 26, padding: 16, textDecoration: "none", display: "block" }}>
          <div className="eyebrow" style={{ color: "var(--on-dark-lo)" }}>Тестове</div>
          <div className="place-title" style={{ lineHeight: 1.2, color: "#fff" }}>Симулатор</div>
        </Link>
      </div>

      <div className="section-title" style={{ marginTop: 26 }}>Dev preview</div>

      <div className="glass-card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/react-preview" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit", fontFamily: "Manrope,sans-serif", fontWeight: 800 }}>
          <span>Отвори React preview</span>
          <span>↗</span>
        </Link>

        <Link href="/playground" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit", fontFamily: "Manrope,sans-serif", fontWeight: 800 }}>
          <span>Отвори Playground simulator</span>
          <span>↗</span>
        </Link>

        <div className="place-sub">Симулаторът е sandbox за демо сценарии и тестове. Не го смесваме с основния app flow.</div>
      </div>
    </>
  );
}
