import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://kg.sofia.bg/api/public";

function years() {
  const current = new Date().getFullYear();
  const out: number[] = [];
  for (let y = current; y >= current - 6; y -= 1) out.push(y);
  return out;
}

const REGION_IDS = [24, 17, 20, 12, 3, 18]; // Банкя, Витоша, Връбница + няколко често срещани
const TEST_YEARS = years();

type Probe = {
  url: string;
  ok: boolean;
  status: number;
  type?: string | null;
  keys?: string[];
  itemKeys?: string[];
  arrays?: Array<{ path: string; count: number; sample: unknown[] }>;
  sample?: string;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findArrays(value: unknown, path = "$", found: Array<{ path: string; count: number; sample: unknown[] }> = []) {
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

function itemKeys(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.items)) return [];
  return Object.keys(payload.items);
}

async function probe(url: string): Promise<Probe> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM derived kg probe"
      },
      cache: "no-store"
    });
    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      // keep as text
    }

    return {
      url,
      ok: response.ok,
      status: response.status,
      type: response.headers.get("content-type"),
      keys: isRecord(payload) ? Object.keys(payload) : [],
      itemKeys: itemKeys(payload),
      arrays: findArrays(payload).filter((a) => a.count > 0).slice(0, 12),
      sample: typeof payload === "string" ? payload.slice(0, 260) : undefined
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

function buildCandidates() {
  const urls: string[] = [
    `${BASE}/regions/all`,
    `${BASE}/school`,
    `${BASE}/school/`,
  ];

  for (const year of TEST_YEARS) {
    urls.push(`${BASE}/school/draft/${year}`);
    urls.push(`${BASE}/free/spots/${year}`);
    urls.push(`${BASE}/free/spots/${year}?timeMode=0&draft=false`);
    urls.push(`${BASE}/free/spots/${year}?timeMode=1&draft=false`);

    for (const regionId of REGION_IDS) {
      urls.push(`${BASE}/kg/draft/${year}/${regionId}`);
      urls.push(`${BASE}/kg/type/${year}/kindergarten?filterType=0&kgType=kindergarten&regionId=${regionId}`);
      urls.push(`${BASE}/kg/type/${year}/nursery?filterType=0&kgType=nursery&regionId=${regionId}`);
      urls.push(`${BASE}/free/spots/${year}?timeMode=0&draft=false&regionId=${regionId}`);
      urls.push(`${BASE}/free/spots/${year}?timeMode=1&draft=false&regionId=${regionId}`);
    }
  }

  return Array.from(new Set(urls));
}

export async function GET() {
  const candidates = buildCandidates();
  const results = await Promise.all(candidates.map(probe));
  const interesting = results
    .filter((r) => r.ok || ![404].includes(r.status))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || a.status - b.status);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    tested: candidates.length,
    interestingCount: interesting.length,
    interesting
  });
}
