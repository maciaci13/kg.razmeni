import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://kg.sofia.bg/api/public";
const REGION_IDS = [24, 17, 20, 12, 3, 18];
const MODES = ["kinderGarden", "kindergarten", "preparative", "nursery"];
const BY_GROUP_TYPES = [0, 1, 2, 3, "all"];
const FILTER_TYPES = [0, 1, 2, 3, "all"];
const KG_TYPES = [0, 1, 2, 3, 4, 5, 8, 9, 10, "all"];

type ProbeResult = {
  url: string;
  ok: boolean;
  status: number;
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

function getItemKeys(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.items)) return [];
  return Object.keys(payload.items);
}

async function probe(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM kg type probe"
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

    return {
      url,
      ok: response.ok,
      status: response.status,
      itemKeys: getItemKeys(payload),
      arrays: findArrays(payload).filter((a) => a.count > 0).slice(0, 10),
      sample: typeof payload === "string" ? payload.slice(0, 220) : undefined
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

function buildCandidates() {
  const urls: string[] = [];

  for (const mode of MODES) {
    for (const groupType of BY_GROUP_TYPES) {
      for (const filterType of FILTER_TYPES) {
        for (const kgType of KG_TYPES) {
          for (const regionId of REGION_IDS) {
            urls.push(`${BASE}/kg/type/${mode}/${groupType}?filterType=${filterType}&kgType=${kgType}&regionId=${regionId}`);
          }
        }
      }
    }
  }

  return Array.from(new Set(urls));
}

export async function GET() {
  const all = buildCandidates();
  const candidates = all.slice(0, 900);
  const results = await Promise.all(candidates.map(probe));
  const interesting = results
    .filter((result) => {
      const arrayCount = result.arrays?.reduce((sum, item) => sum + item.count, 0) ?? 0;
      return result.ok || (result.status !== 404 && result.status !== 400) || arrayCount > 0;
    })
    .sort((a, b) => Number(b.ok) - Number(a.ok) || (b.arrays?.[0]?.count ?? 0) - (a.arrays?.[0]?.count ?? 0))
    .slice(0, 120);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    tested: candidates.length,
    totalCandidateSpace: all.length,
    interestingCount: interesting.length,
    interesting
  });
}
