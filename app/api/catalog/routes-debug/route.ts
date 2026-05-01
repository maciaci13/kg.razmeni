import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KG_HOME = "https://kg.sofia.bg/";

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
      accept: "text/html,application/javascript,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM route inspector"
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

function getContexts(text: string, needle: string, radius = 260) {
  const contexts: string[] = [];
  let index = 0;

  while ((index = text.indexOf(needle, index)) !== -1 && contexts.length < 80) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + needle.length + radius);
    contexts.push(text.slice(start, end).replace(/\s+/g, " "));
    index += needle.length;
  }

  return contexts;
}

function extractQuotedFragments(text: string) {
  const fragments = Array.from(text.matchAll(/["'`]([^"'`]{1,220})["'`]/g)).map((match) => match[1]);
  return unique(fragments)
    .filter((fragment) =>
      /api\/public|\/public\/|kindergarten|spots|groups|district|region|school|nursery|vacanc|free|places|candidate|ranking|nomenclature|institution|organization/i.test(fragment)
    )
    .slice(0, 500);
}

function buildEndpointCandidates(fragments: string[]) {
  const candidates = fragments.flatMap((fragment) => {
    const cleaned = fragment.replace(/\\\//g, "/").trim();
    const out: string[] = [];

    if (cleaned.startsWith("http")) out.push(cleaned);
    if (cleaned.startsWith("/")) out.push(absoluteUrl(cleaned, KG_HOME));
    if (cleaned.startsWith("api/")) out.push(absoluteUrl(`/${cleaned}`, KG_HOME));
    if (cleaned.includes("api/public")) {
      const index = cleaned.indexOf("api/public");
      out.push(absoluteUrl(`/${cleaned.slice(index)}`, KG_HOME));
    }
    if (/^[a-z0-9-_/{}?=&.]+$/i.test(cleaned) && !cleaned.startsWith("http") && !cleaned.startsWith("/")) {
      out.push(absoluteUrl(`/api/public/${cleaned.replace(/^public\/?/, "")}`, KG_HOME));
    }

    return out;
  });

  return unique(candidates)
    .filter((url) => url.startsWith("https://kg.sofia.bg/"))
    .filter((url) => /api|public|kindergarten|spots|group|district|school|nursery|candidate|ranking|institution/i.test(url))
    .slice(0, 300);
}

async function probeCandidates(candidates: string[]) {
  const likely = candidates.filter((url) => url.includes("/api/")).slice(0, 60);
  const probed = await Promise.all(
    likely.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: { accept: "application/json,text/plain,*/*", "user-agent": "Mozilla/5.0 MZM route inspector" },
          cache: "no-store"
        });
        const contentType = response.headers.get("content-type");
        const text = await response.text();
        return {
          url,
          ok: response.ok,
          status: response.status,
          contentType,
          sample: text.slice(0, 320)
        };
      } catch (error) {
        return { url, ok: false, error: error instanceof Error ? error.message : "Unknown probe error" };
      }
    })
  );

  return probed.filter((item) => item.status !== 404 || item.ok).slice(0, 120);
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const home = await fetchText(KG_HOME);
  const scripts = extractScripts(home.text, KG_HOME);
  const scriptPayloads = await Promise.all(scripts.map((script) => fetchText(script).catch((error) => ({ url: script, ok: false, status: 0, contentType: null, text: String(error) }))));

  const allText = [home.text, ...scriptPayloads.map((payload) => payload.text)].join("\n/* ---- bundle split ---- */\n");
  const apiPublicContexts = getContexts(allText, "/api/public");
  const fragments = extractQuotedFragments(allText);
  const endpointCandidates = buildEndpointCandidates(fragments);
  const probes = await probeCandidates(endpointCandidates);

  return NextResponse.json({
    generatedAt,
    home: {
      ok: home.ok,
      status: home.status,
      contentType: home.contentType,
      length: home.text.length
    },
    scripts: scriptPayloads.map((script) => ({
      url: script.url,
      ok: script.ok,
      status: script.status,
      contentType: script.contentType,
      length: script.text.length
    })),
    apiPublicContexts,
    fragments,
    endpointCandidates,
    probes
  });
}
