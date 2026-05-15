"use client";

import type { AppTab } from "../types";

export function HomeScreen({ setTab }: { setTab: (tab: AppTab) => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-background">
      <iframe
        src="/myasto.html"
        title="Място За Място — Hi-Fi preview"
        className="h-full w-full border-0"
      />
      <button
        type="button"
        onClick={() => setTab("requests")}
        className="sr-only"
      >
        Към заявка
      </button>
    </div>
  );
}
