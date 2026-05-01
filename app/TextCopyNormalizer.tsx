"use client";

import { useEffect } from "react";

const replacements: Array<[RegExp, string]> = [
  [/МястоЗаМясто/g, "Място За Място"],
  [/\bMatch\b/g, "Съвпадение"],
  [/\bmatch\b/g, "съвпадение"],
  [/Match покана/g, "Покана за съвпадение"],
  [/MATCH/g, "СЪВПАДЕНИЕ"]
];

const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);

function normalizeTextNode(node: Text) {
  const current = node.nodeValue;
  if (!current) return;

  let next = current;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  if (next !== current) node.nodeValue = next;
}

function walk(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(normalizeTextNode);
}

export default function TextCopyNormalizer() {
  useEffect(() => {
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        walk(document.body);
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
