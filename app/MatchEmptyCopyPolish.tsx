"use client";

import { useEffect } from "react";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function polishEmptyMatchCopy() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3"));
  headings.forEach((heading) => {
    const text = normalize(heading.textContent);
    if (text === "Още няма цикъл" || text === "Няма match" || text === "Няма съвпадение") {
      heading.textContent = "Още няма съвпадение.";
    }
  });

  const paragraphs = Array.from(document.querySelectorAll<HTMLElement>("p"));
  paragraphs.forEach((paragraph) => {
    const text = normalize(paragraph.textContent);
    if (
      text.includes("Когато има потенциално съвпадение") ||
      text.includes("Пусни заявка или използвай симулатора") ||
      text.includes("симулатора от профила")
    ) {
      paragraph.textContent = "При съвпадение тук ще получиш покана.";
    }
  });
}

export default function MatchEmptyCopyPolish() {
  useEffect(() => {
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        polishEmptyMatchCopy();
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(schedule, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
