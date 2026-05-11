"use client";

import { useEffect } from "react";

const STYLE_ID = "mzm-route-map-bridge-style";
const OBSERVER_FLAG = "mzmRouteMapBridge";

const nodeColors = ["orange", "purple", "green", "blue"];

function injectRouteStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mzm-route-map{position:relative;margin-top:1.25rem;height:33rem;border-radius:1.9rem;background:#fbfaf6;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(28,27,25,.035)}
    .mzm-route-map:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(70,55,40,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,55,40,.055) 1px,transparent 1px);background-size:1.7rem 1.7rem;mask-image:linear-gradient(to bottom,#000 0 82%,transparent);pointer-events:none}
    .mzm-route-map-title{position:relative;z-index:2;margin:0;padding:1rem 1rem 0;font-size:.72rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:rgba(28,27,25,.42)}
    .mzm-route-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .mzm-route-node{position:absolute;z-index:2;width:4.75rem;height:4.75rem;border-radius:999px;background:rgba(255,255,255,.72);display:grid;place-items:center;box-shadow:0 18px 40px rgba(50,43,35,.11),inset 0 0 0 1px rgba(255,255,255,.9)}
    .mzm-route-node:before{content:"";position:absolute;inset:-1.1rem;border-radius:999px;background:rgba(255,255,255,.44);box-shadow:0 14px 36px rgba(60,48,38,.08);z-index:-1}
    .mzm-route-dot{width:1.45rem;height:1.45rem;border-radius:999px;box-shadow:0 0 0 .5rem rgba(255,255,255,.54),inset 0 1px 2px rgba(255,255,255,.35)}
    .mzm-route-dot-orange{background:#ff7a22}.mzm-route-dot-purple{background:#8d66d7}.mzm-route-dot-green{background:#79a758}.mzm-route-dot-blue{background:#69a7c8}
    .mzm-route-label{position:absolute;left:50%;top:-4.15rem;transform:translateX(-50%);width:max-content;max-width:14.3rem;padding:.62rem .9rem;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 14px 26px rgba(34,29,24,.08);font-size:.8rem;line-height:1.12;font-weight:900;text-align:center;letter-spacing:-.03em;color:#241d1a}
    .mzm-route-status{position:absolute;left:50%;bottom:-2.55rem;transform:translateX(-50%);width:max-content;max-width:12rem;border-radius:999px;background:rgba(255,255,255,.82);padding:.42rem .68rem;font-size:.64rem;font-weight:900;color:rgba(28,27,25,.56);box-shadow:0 10px 20px rgba(34,29,24,.06);text-align:center}
    .mzm-route-node-0{left:23%;top:24%}.mzm-route-node-1{left:31%;top:68%}.mzm-route-node-2{left:70%;top:48%}.mzm-route-node-3{left:57%;top:78%}
    .mzm-route-original-hidden{display:none!important}
    @media(max-width:390px){.mzm-route-map{height:31rem}.mzm-route-node{width:4.35rem;height:4.35rem}.mzm-route-label{max-width:12.5rem;font-size:.72rem}.mzm-route-node-2{left:68%}.mzm-route-node-3{left:55%}}
  `;
  document.head.appendChild(style);
}

function escapeHtml(value: string) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
}

function kindergartenLabel(raw: string, index: number) {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned === "—") return `ДГ ${index + 1} — детска градина`;
  if (/ДГ|детска градина/i.test(cleaned)) return cleaned;
  const suffixes = ["— филиал Център", "— яслена група", "— корпус Изток", "— сграда Борово"];
  return `${cleaned} ${suffixes[index % suffixes.length]}`;
}

function splitRoute(text: string) {
  const parts = text.split("→").map((part) => part.trim()).filter(Boolean);
  return { from: parts[0] || text.trim(), to: parts[1] || parts[0] || text.trim() };
}

function pathFor(count: number) {
  if (count <= 2) return `<path d="M170 168 C155 238 160 314 196 384" stroke="#8d66d7" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/>`;
  if (count === 3) return `<path d="M177 150 C155 210 143 280 164 376" stroke="#8d66d7" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/><path d="M194 160 C235 180 282 205 314 242" stroke="#ff7a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 17"/><path d="M188 392 C250 368 300 325 324 286" stroke="#79a758" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/>`;
  return `<path d="M177 150 C155 210 143 280 164 376" stroke="#8d66d7" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/><path d="M194 160 C235 180 282 205 314 242" stroke="#ff7a22" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 17"/><path d="M188 392 C250 368 300 325 324 286" stroke="#79a758" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/><path d="M198 420 C220 454 242 480 255 508" stroke="#69a7c8" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/>`;
}

function buildRouteMap(original: HTMLElement) {
  const people = Array.from(original.querySelectorAll<HTMLElement>(".mzm-match-person"));
  if (!people.length) return "";
  const nodes = people.slice(0, 4).map((person, index) => {
    const routeText = person.querySelector("p")?.textContent || "";
    const status = person.querySelector(".mzm-match-status-text")?.textContent || person.querySelector("select option:checked")?.textContent || "";
    const { from, to } = splitRoute(routeText);
    const label = kindergartenLabel(index === 0 ? from : to, index);
    const color = nodeColors[index % nodeColors.length];
    return `<div class="mzm-route-node mzm-route-node-${index}"><div class="mzm-route-label">${escapeHtml(label)}</div><span class="mzm-route-dot mzm-route-dot-${color}"></span>${status ? `<div class="mzm-route-status">${escapeHtml(status)}</div>` : ""}</div>`;
  }).join("");
  return `<div class="mzm-route-map" data-route-map-generated="true"><p class="mzm-route-map-title">Верига и статуси</p><svg class="mzm-route-svg" viewBox="0 0 430 560" fill="none" aria-hidden="true">${pathFor(people.length)}</svg>${nodes}</div>`;
}

function enhanceCycles() {
  injectRouteStyles();
  const cycles = Array.from(document.querySelectorAll<HTMLElement>(".mzm-match-cycle"));
  cycles.forEach((cycle) => {
    if (cycle.dataset[OBSERVER_FLAG] === "true") return;
    const html = buildRouteMap(cycle);
    if (!html) return;
    cycle.insertAdjacentHTML("afterend", html);
    cycle.classList.add("mzm-route-original-hidden");
    cycle.dataset[OBSERVER_FLAG] = "true";
  });
}

export default function MatchRouteMapBridge() {
  useEffect(() => {
    enhanceCycles();
    const observer = new MutationObserver(() => enhanceCycles());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
