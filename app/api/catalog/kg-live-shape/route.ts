import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://kg.sofia.bg/api/public";

const TARGETS = [
  `${BASE}/regions/all`,
  `${BASE}/school`,
  `${BASE}/school/`,
  `${BASE}/kg/dz/by-region/all`,
  `${BASE}/kg/dz/by-type/all`,
  `${BASE}/kinderGarden/dz/by-region/all`,
  `${BASE}/kinderGarden/dz/by-type/all`,
  `${BASE}/kindergarten/dz/by-region/all`,
  `${BASE}/kindergarten/dz/by-type/all`,
  `${BASE}/nursery/dz/by-region/all`,
  `${BASE}/nursery/dz/by-type/all`,
  `${BASE}/school/dz/by-region/all`,
  `${BASE}/school/dz/by-type/all`,
  `${BASE}/preparatory/dz/by-region/all`,
  `${BASE}/preparatory/dz/by-type/all`
];

type ArraySummary = {
  path: string;
  count: number;
  sample: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findArrays(value: unknown, path = "$", found: ArraySummary[] = []) {
  if (Array.isArray(value)) {
    found.push({ path, count: value.length, sample: value.slice(0, 2) });
    value.slice(0, 2).forEach((item, index) => findArrays(item, `${path}[${index}]`, found));
    return found;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, child]) => findArrays(child, `${path}.${key}`, found));
  }

  return found;
}

function keys(value: unknown) {
  return isRecord(value) ? Object.keys(value) : [];
}

function itemKeys(value: unknown) {
  if (!isRecord(value) || !isRecord(value.items)) return [];
  return Object.keys(value.items);
}

async function inspect(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM live shape inspector"
      },
      cache: "no-store"
    });

    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      // keep text
    }

    const arrays = findArrays(payload).filter((array) => array.count > 0).slice(0, 20);

    return {
      url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      keys: keys(payload),
      itemKeys: itemKeys(payload),
      arrays,
      sample: typeof payload === "string" ? payload.slice(0, 400) : undefined
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function GET() {
  const results = await Promise.all(TARGETS.map(inspect));
  const interesting = results.filter((result) => result.ok || result.status !== 404);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    purpose: "Focused shape inspector for public regions, kindergartens/nurseries and schools/preparatory groups. Free spots are intentionally excluded for now.",
    tested: TARGETS.length,
    interesting
  });
}
