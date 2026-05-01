import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KG_HOME = "https://kg.sofia.bg/";
const BASE = "https://kg.sofia.bg/api/public";

const WORDS = [
  "kindergarten",
  "kindergartens",
  "children-garden",
  "child-garden",
  "garden",
  "gardens",
  "nursery",
  "nurseries",
  "school",
  "schools",
  "spots",
  "free-spots",
  "available-spots",
  "vacancies",
  "places",
  "groups",
  "districts",
  "district",
  "regions",
  "region",
  "settlements",
  "settlement",
  "institutions",
  "institution",
  "organizations",
  "organization",
  "classifier",
  "classifiers",
  "nomenclature",
  "nomenclatures"
];

const MANUAL_CANDIDATES = WORDS.flatMap((word) => [
  `${BASE}/${word}`,
  `${BASE}/${word}/`,
  `${BASE}/v1/${word}`,
  `${BASE}/v1/${word}/`,
  `${BASE}/api/${word}`,
  `${BASE}/api/${word}/`,
  `${BASE}/classifiers/${word}`,
  `${BASE}/classifiers/${word}/`,
  `${BASE}/nomenclatures/${word}`,
  `${BASE}/nomenclatures/${word}/`,
  `${BASE}/data/${word}`,
  `${BASE}/data/${word}/`
]);

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function absoluteUrl(src: string, base: string) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/javascript,application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM readable route probe"
    },
    cache: "no-store"
  });
  return { response, text: await response.text() };
}

function extractScripts(html: string) {
  return unique(
    Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => absoluteUrl(match[1], KG_HOME))
  );
}

function extractCandidatesFromText(text: string) {
  const matches = [
    ...Array.from(text.matchAll(/\/api\/public\/[a-zA-Z0-9_./?=&{}:-]+/g)).map((match) => absoluteUrl(match[0], KG_HOME)),
    ...Array.from(text.matchAll(/api\/public\/[a-zA-Z0-9_./?=&{}:-]+/g)).map((match) => absoluteUrl(`/${match[0]}`, KG_HOME)),
    ...Array.from(text.matchAll(/["'`]([^"'`]{2,180})["'`]/g))
      .map((match) => match[1].replace(/\\\//g, "/"))
      .filter((value) => /kindergarten|spots|school|nursery|district|region|group|institution|organization|classifier|nomenclature/i.test(value))
      .flatMap((value) => {
        const cleaned = value.trim();
        if (cleaned.startsWith("/api/public/")) return [absoluteUrl(cleaned, KG_HOME)];
        if (cleaned.startsWith("api/public/")) return [absoluteUrl(`/${cleaned}`, KG_HOME)];
        if (/^[a-z][a-z0-9_/-]{2,90}$/i.test(cleaned)) return [`${BASE}/${cleaned}`];
        return [];
      })
  ];

  return unique(matches);
}

async function probe(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM readable route probe"
      },
      cache: "no-store"
    });
    const text = await response.text();
    return {
      url,
      ok: response.ok,
      status: response.status,
      type: response.headers.get("content-type") || "",
      sample: text.replace(/\s+/g, " ").slice(0, 240)
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      type: "error",
      sample: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

function contextLines(text: string) {
  const out: string[] = [];
  let index = 0;
  const needle = "/api/public";
  while ((index = text.indexOf(needle, index)) !== -1 && out.length < 12) {
    out.push(text.slice(Math.max(0, index - 160), Math.min(text.length, index + 240)).replace(/\s+/g, " "));
    index += needle.length;
  }
  return out;
}

export async function GET() {
  const home = await fetchText(KG_HOME);
  const scripts = extractScripts(home.text);
  const scriptPayloads = await Promise.all(
    scripts.map(async (scriptUrl) => {
      try {
        const script = await fetchText(scriptUrl);
        return script.text;
      } catch {
        return "";
      }
    })
  );

  const allText = [home.text, ...scriptPayloads].join("\n");
  const candidates = unique([...extractCandidatesFromText(allText), ...MANUAL_CANDIDATES]).slice(0, 420);
  const results = await Promise.all(candidates.map(probe));
  const interesting = results
    .filter((result) => result.ok || ![404].includes(result.status))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || a.status - b.status);

  const lines = [
    `MZM kg.sofia.bg route probe`,
    `Generated: ${new Date().toISOString()}`,
    `Scripts inspected: ${scripts.length}`,
    `Candidates tested: ${candidates.length}`,
    `Interesting results: ${interesting.length}`,
    ``,
    `=== INTERESTING PROBES (not 404) ===`,
    ...interesting.slice(0, 80).flatMap((item, index) => [
      `${index + 1}. ${item.status} ${item.ok ? "OK" : ""} ${item.url}`,
      `   type: ${item.type}`,
      `   sample: ${item.sample}`,
      ``
    ]),
    ``,
    `=== /api/public CONTEXTS ===`,
    ...contextLines(allText).map((line, index) => `${index + 1}. ${line}`),
    ``,
    `=== FIRST 80 CANDIDATES ===`,
    ...candidates.slice(0, 80).map((url, index) => `${index + 1}. ${url}`)
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
