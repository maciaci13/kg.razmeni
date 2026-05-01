import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KG_HOME = "https://kg.sofia.bg/";
const NEEDLES = [
  "/api/public/school",
  "app-kindergarten-search-results",
  "app-kindergartens",
  "kindergartenPagination",
  "schoolPagination",
  "preparatory-groups",
  "app-preparatory-groups",
  "spots",
  "groups-info",
  "kgGroup",
  "nursery",
  "by_region",
  "schoolId",
  "sofiaRegion"
];

function absoluteUrl(src: string, base: string) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/javascript,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM bundle context inspector"
    },
    cache: "no-store"
  });
  return await response.text();
}

function extractScripts(html: string) {
  return unique(
    Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => absoluteUrl(match[1], KG_HOME))
  );
}

function contexts(text: string, needle: string, radius = 900) {
  const out: string[] = [];
  let index = 0;

  while ((index = text.indexOf(needle, index)) !== -1 && out.length < 12) {
    out.push(text.slice(Math.max(0, index - radius), Math.min(text.length, index + needle.length + radius)).replace(/\s+/g, " "));
    index += needle.length;
  }

  return out;
}

export async function GET() {
  const home = await fetchText(KG_HOME);
  const scripts = extractScripts(home);
  const scriptPayloads = await Promise.all(scripts.map((script) => fetchText(script).catch(() => "")));
  const allText = [home, ...scriptPayloads].join("\n");

  const lines = [
    "MZM kg.sofia.bg bundle contexts",
    `Generated: ${new Date().toISOString()}`,
    `Scripts inspected: ${scripts.length}`,
    ""
  ];

  for (const needle of NEEDLES) {
    const found = contexts(allText, needle);
    lines.push(`=== ${needle} (${found.length}) ===`);
    if (found.length === 0) lines.push("not found");
    found.forEach((context, index) => {
      lines.push(`${index + 1}. ${context}`);
      lines.push("");
    });
    lines.push("");
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
