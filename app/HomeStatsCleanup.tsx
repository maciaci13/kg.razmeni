"use client";

import { useEffect } from "react";
import type { PlaygroundSnapshot } from "@/lib/playground";

type ApiError = { error: string };

let cachedActiveRequestCount: number | null = null;
let fetchingSnapshot = false;

async function getSnapshot(): Promise<PlaygroundSnapshot | null> {
  try {
    const response = await fetch("/api/playground", { cache: "no-store" });
    const json = await response.json() as PlaygroundSnapshot | ApiError;
    if (!response.ok || "error" in json) return null;
    return json;
  } catch {
    return null;
  }
}

function selectedUserNameFromPage() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const profileButton = buttons.find((button) => /родител\s*[абвгabcd]/i.test(button.textContent || ""));
  return (profileButton?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function selectedUserId(snapshot: PlaygroundSnapshot) {
  const label = selectedUserNameFromPage();
  if (label) {
    const found = snapshot.users.find((user) => label.includes(user.display_name.toLowerCase()));
    if (found) return found.id;
  }
  return snapshot.users[0]?.id ?? "";
}

function countActiveRequests(snapshot: PlaygroundSnapshot) {
  const userId = selectedUserId(snapshot);
  if (!userId) return 0;

  const directRequests = snapshot.requests.filter((request) => {
    if (request.user_id !== userId) return false;
    return request.is_active || request.is_locked || request.status === "enrolled";
  });

  const participantRequests = snapshot.participants.filter((participant) => participant.user_id === userId);
  const requestIds = new Set(directRequests.map((request) => request.id));
  participantRequests.forEach((participant) => {
    if ("request_id" in participant && typeof participant.request_id === "string") {
      requestIds.add(participant.request_id);
    }
  });

  return requestIds.size || directRequests.length;
}

async function refreshActiveRequestCount() {
  if (fetchingSnapshot) return;
  fetchingSnapshot = true;
  try {
    const snapshot = await getSnapshot();
    if (snapshot) {
      cachedActiveRequestCount = countActiveRequests(snapshot);
      cleanupActiveRequestStat();
    }
  } finally {
    fetchingSnapshot = false;
  }
}

function cleanupActiveRequestStat() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h3"));

  headings.forEach((heading) => {
    const text = (heading.textContent || "").replace(/\s+/g, " ").trim();
    if (text !== "Активна заявка" && text !== "Активни заявки") return;

    heading.textContent = "Активни заявки";

    const card = heading.closest("div");
    if (!card) return;

    const numberBadge = Array.from(card.children).find((child) => child.tagName.toLowerCase() === "span") as HTMLElement | undefined;
    if (numberBadge && cachedActiveRequestCount !== null) {
      numberBadge.textContent = String(cachedActiveRequestCount).padStart(2, "0");
    }

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
    let interval: number | null = null;

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        cleanupActiveRequestStat();
        void refreshActiveRequestCount();
      });
    };

    schedule();
    interval = window.setInterval(schedule, 2500);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
