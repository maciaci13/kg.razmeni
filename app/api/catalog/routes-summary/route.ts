import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KG_HOME = "https://kg.sofia.bg/";

const IMPORTANT_WORDS = [
  "kindergarten",
  "kindergartens",
  "children-garden",
  "garden",
  "nursery",
  "school",
  "spots",
  "vacancies",
  "available",
  "free",
  "places",
  "groups",
  "region",
  "regions",
  "district",
  "districts",
  "settlement",
  "organization",
  "institution",
  "classifier",
  "nomenclature"
];

function absoluteUrl(src: string, base: string) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/javascript,application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM compact route inspector"
    },
    cache: "no-store"
  });

  return {
    url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type"),
    text: await response.text()
  };
}

function extractScripts(html: string, base: string) {
  return unique(
    Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => absoluteUrl(match[1], base))
  );
}

function extractStringFragments(text: string) {
  const fragments = Array.from(text.matchAll(/["'`]([^"'`]{2,260})["'`]/g)).map((match) => match[1]);

  return unique(
    fragments
      .map((fragment) => fragment.replace(/\\\//g, "/").trim())
      .filter((fragment) => {
        const lower = fragment.toLowerCase();
        return lower.includes("api/public") || IMPORTANT_WORDS.some((word) => lower.includes(word));
      })
  ).slice(0, 900);
}

function getContexts(text: string, needle: string, radius = 220) {
  const contexts: string[] = [];
  let index = 0;

  while ((index = text.indexOf(needle, index)) !== -1 && contexts.length < 40) {
    contexts.push(text.slice(Math.max(0, index - radius), Math.min(text.length, index + needle.length + radius)).replace(/\s+/g, " "));
    index += needle.length;
  }

  return contexts;
}

function combinePath(base: string, path: string) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

function buildCandidates(fragments: string[], contexts: string[]) {
  const candidates: string[] = [];
  const all = [...fragments, ...contexts];

  for (const value of all) {
    const cleaned = value.replace(/\\\//g, "/").trim();

    if (cleaned.includes("/api/public/")) {
      const matches = cleaned.match(/\/api\/public\/[a-zA-Z0-9_./?=&{}:-]+/g) || [];
      for (const match of matches) candidates.push(absoluteUrl(match, KG_HOME));
    }

    if (cleaned.includes("api/public/")) {
      const matches = cleaned.match(/api\/public\/[a-zA-Z0-9_./?=&{}:-]+/g) || [];
      for (const match of matches) candidates.push(absoluteUrl(`/${match}`, KG_HOME));
    }

    if (cleaned.startsWith("/")) candidates.push(absoluteUrl(cleaned, KG_HOME));
    if (cleaned.startsWith("api/")) candidates.push(absoluteUrl(`/${cleaned}`, KG_HOME));

    if (/^[a-z][a-z0-9_/-]{2,80}$/i.test(cleaned) && IMPORTANT_WORDS.some((word) => cleaned.toLowerCase().includes(word))) {
      candidates.push(combinePath("https://kg.sofia.bg/api/public", cleaned));
      candidates.push(combinePath("https://kg.sofia.bg/api/public/", cleaned));
    }
  }

  const manualCandidates = IMPORTANT_WORDS.flatMap((word) => [
    `https://kg.sofia.bg/api/public/${word}`,
    `https://kg.sofia.bg/api/public/${word}/`,
    `https://kg.sofia.bg/api/public/v1/${word}`,
    `https://kg.sofia.bg/api/public/classifiers/${word}`,
    `https://kg.sofia.bg/api/public/nomenclatures/${word}`
  ]);

  return unique([...candidates, ...manualCandidates])
    .filter((url) => url.startsWith("https://kg.sofia.bg/"))
    .filter((url) => url.includes("/api/public/"))
    .slice(0, 260);
}

async function probe(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM compact route inspector"
      },
      cache: "no-store"
    });
    const text = await response.text();
    return {
      url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      sample: text.slice(0, 280)
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown probe error"
    };
  }
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const home = await fetchText(KG_HOME);
  const scripts = extractScripts(home.text, KG_HOME);

  const scriptPayloads = await Promise.all(
    scripts.map((script) => fetchText(script).catch((error) => ({
      url: script,
      ok: false,
      status: 0,
      contentType: null,
      text: String(error)
    })))
  );

  const allText = [home.text, ...scriptPayloads.map((script) => script.text)].join("\n");
  const contexts = getContexts(allText, "/api/public");
  const fragments = extractStringFragments(allText);
  const endpointCandidates = buildCandidates(fragments, contexts);
  const probes = await Promise.all(endpointCandidates.map(probe));

  const interestingProbes = probes
    .filter((item) => item.ok || ![404].includes(item.status))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || a.status - b.status)
    .slice(0, 80);

  return NextResponse.json({
    generatedAt,
    scripts: scriptPayloads.map((script) => ({ url: script.url, ok: script.ok, status: script.status, length: script.text.length })),
    apiPublicContexts: contexts,
    endpointCandidatesCount: endpointCandidates.length,
    endpointCandidates: endpointCandidates.slice(0, 80),
    interestingProbes,
    fragments: fragments.slice(0, 160)
  });
}
