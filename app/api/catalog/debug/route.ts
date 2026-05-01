import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DebugSource = {
  url: string;
  ok: boolean;
  status?: number;
  contentType?: string | null;
  length?: number;
  title?: string | null;
  scripts?: string[];
  apiCandidates?: string[];
  error?: string;
};

const SOURCE_URLS = [
  "https://kg.sofia.bg/",
  "https://kg.sofia.bg/#/kindergartens",
  "https://kg.sofia.bg/#/spots",
  "https://urbandata.sofia.bg/api/3/action/package_show?id=kindergartens"
];

function absoluteUrl(src: string, base: string) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() ?? null;
}

function extractScripts(html: string, base: string) {
  return unique(
    Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => absoluteUrl(match[1], base))
  );
}

function extractApiCandidates(text: string, base: string) {
  const raw = [
    ...Array.from(text.matchAll(/https?:\/\/[^"'\s)]+/gi)).map((match) => match[0]),
    ...Array.from(text.matchAll(/["']((?:\/api|api|\/rest|rest|\/services|services|\/odata|odata|\/resources|resources)[^"']+)["']/gi)).map((match) => match[1])
  ];

  return unique(raw.map((value) => absoluteUrl(value, base))).filter((url) =>
    /api|rest|service|odata|resource|kindergarten|spots|candidate|ranking|kg/i.test(url)
  ).slice(0, 120);
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM catalog debug"
    },
    cache: "no-store"
  });
  const text = await response.text();
  return { response, text };
}

async function inspectSource(url: string): Promise<DebugSource> {
  try {
    const { response, text } = await fetchText(url);
    const contentType = response.headers.get("content-type");
    const scripts = contentType?.includes("html") ? extractScripts(text, url) : [];

    const scriptPayloads = await Promise.all(
      scripts.slice(0, 12).map(async (scriptUrl) => {
        try {
          const script = await fetchText(scriptUrl);
          return script.text.slice(0, 250_000);
        } catch {
          return "";
        }
      })
    );

    const apiCandidates = unique([
      ...extractApiCandidates(text, url),
      ...scriptPayloads.flatMap((scriptText, index) => extractApiCandidates(scriptText, scripts[index] ?? url))
    ]).slice(0, 160);

    return {
      url,
      ok: response.ok,
      status: response.status,
      contentType,
      length: text.length,
      title: contentType?.includes("html") ? extractTitle(text) : null,
      scripts,
      apiCandidates
    };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const sources = await Promise.all(SOURCE_URLS.map(inspectSource));

  return NextResponse.json({
    generatedAt,
    purpose: "Temporary public-source inspector for kg.sofia.bg and UrbanData. It returns public script/API candidates only, no personal data.",
    sources
  });
}
