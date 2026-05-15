"use client";

import { useState } from "react";
import { usePlaygroundController } from "../components/playground/usePlaygroundController";
import { RequestScreen } from "../components/screens/RequestScreen";

type ReactPreviewTab = "requests";

export default function ReactPreviewPage() {
  const [tab] = useState<ReactPreviewTab>("requests");
  const playground = usePlaygroundController();

  return (
    <>
      <link rel="stylesheet" href="/styles/myasto.css" />
      <div className="outer-nav">
        <button className="onb on" type="button">React · Заявка</button>
        <a className="onb" href="/myasto.html" style={{ textDecoration: "none" }}>HTML preview</a>
      </div>
      <p className="outer-label">Място За Място · React Preview</p>

      <div className="phone">
        <div className="status"><span>09:41</span><span>●●● 95%</span></div>
        <div className="screen on">
          <div className="app">
            {tab === "requests" ? (
              <RequestScreen
                kindergartens={playground.kindergartens}
                myRequests={playground.myRequests}
                requestToText={playground.requestToText}
                createRequest={playground.createRequest}
                deactivateRequest={playground.deactivateRequest}
                deleteRequest={playground.deleteRequest}
                loading={playground.loading}
                error={playground.error}
              />
            ) : null}
          </div>
          <nav className="dock">
            <div className="tab" aria-disabled="true"><i>⌂</i>Начало</div>
            <div className="tab active"><i>＋</i>Заявка</div>
            <div className="tab" aria-disabled="true"><i>✦</i>Съвпадение</div>
            <div className="tab" aria-disabled="true"><i>💬</i>Чат</div>
            <div className="tab" aria-disabled="true"><i>👤</i>Профил</div>
          </nav>
        </div>
      </div>
    </>
  );
}
