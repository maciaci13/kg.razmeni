"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-match-empty-copy-polish-style";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-empty-match-duplicate-hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function isMatchEmptyPage() {
  return Array.from(document.querySelectorAll<HTMLElement>("h1")).some((heading) => normalize(heading.textContent).includes("Още няма съвпадение") || normalize(heading.textContent).includes("Още няма цикъл"));
}

function polishEmptyMatchCopy() {
  injectStyles();

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

  if (!isMatchEmptyPage()) return;

  const duplicateSections = Array.from(document.querySelectorAll<HTMLElement>("section, article, div")).filter((node) => {
    const text = normalize(node.textContent);
    if (!text.includes("Още няма съвпадение") && !text.includes("При съвпадение тук ще получиш покана")) return false;
    if (node.querySelector("h1")) return false;
    if (node.closest("nav")) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 220 && rect.height > 70 && rect.height < 260;
  });

  duplicateSections.forEach((section) => {
    if (section.querySelector("[data-mzm-empty-share-cta='true']")) return;
    section.classList.add("mzm-empty-match-duplicate-hidden");
    section.setAttribute("aria-hidden", "true");
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
