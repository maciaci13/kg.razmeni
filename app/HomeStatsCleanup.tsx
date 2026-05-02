"use client";

import { useEffect } from "react";

function cleanupActiveRequestStat() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h3"));

  headings.forEach((heading) => {
    const text = (heading.textContent || "").replace(/\s+/g, " ").trim();
    if (text !== "Активна заявка" && text !== "Активни заявки") return;

    heading.textContent = "Активни заявки";

    const card = heading.closest("div");
    if (!card) return;

    const bodyCandidates = Array.from(card.querySelectorAll<HTMLElement>("p"));
    bodyCandidates.forEach((paragraph) => {
      const paragraphText = (paragraph.textContent || "").replace(/\s+/g, " ").trim();
      const looksLikeRouteLine = paragraphText.includes("→") || paragraphText === "—" || paragraphText.includes("Няма активна заявка");
      const isStatBody = paragraph.className.includes("mt-2") || paragraph.className.includes("text-ink/55");

      if (looksLikeRouteLine || isStatBody) {
        paragraph.textContent = "";
        paragraph.setAttribute("aria-hidden", "true");
        paragraph.style.display = "none";
      }
    });
  });
}

export default function HomeStatsCleanup() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        cleanupActiveRequestStat();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
