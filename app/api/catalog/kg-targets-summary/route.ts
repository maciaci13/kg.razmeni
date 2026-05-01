import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TARGETS = [
  "https://kg.sofia.bg/api/public/school",
  "https://kg.sofia.bg/api/public/kindergarten",
  "https://kg.sofia.bg/api/public/kindergartens",
  "https://kg.sofia.bg/api/public/app-kindergartens",
  "https://kg.sofia.bg/api/public/app-kindergarten-search-results",
  "https://kg.sofia.bg/api/public/nursery",
  "https://kg.sofia.bg/api/public/app-preparatory-groups",
  "https://kg.sofia.bg/api/public/preparatory-groups",
  "https://kg.sofia.bg/api/public/spots",
  "https://kg.sofia.bg/api/public/groups-info",
  "https://kg.sofia.bg/api/public/groupAcceptedAt",
  "https://kg.sofia.bg/api/public/kgGroup",
  "https://kg.sofia.bg/api/public/by_region"
];

type SummaryArray = {
  path: string;
  count: number;
  sample: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findArrays(value: unknown, path = "$", found: SummaryArray[] = []) {
  if (Array.isArray(value)) {
    found.push({ path, count: value.length, sample: value.slice(0, 2) });
    value.slice(0, 2).forEach((item, index) => findArrays(item, `${path}[${index}]`, found));
    return found;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, childValue]) => findArrays(childValue, `${path}.${key}`, found));
  }

  return found;
}

function topKeys(value: unknown) {
  if (!isRecord(value)) return [];
  return Object.keys(value);
}

function itemKeys(value: unknown) {
  if (!isRecord(value)) return [];
  const items = value.items;
  if (!isRecord(items)) return [];
  return Object.keys(items);
}

function compactArrays(arrays: SummaryArray[]) {
  return arrays
    .filter((array) => array.count > 0)
    .map((array) => ({
      path: array.path,
      count: array.count,
      sample: array.sample
    }))
    .slice(0, 20);
}

async function inspectTarget(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MZM kg target summary"
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
      contentType: response.headers.get("content-type"),
      topKeys: topKeys(payload),
      itemKeys: itemKeys(payload),
      arrays: compactArrays(findArrays(payload)),
      sample: typeof payload === "string" ? payload.slice(0, 500) : undefined
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
  const results = await Promise.all(TARGETS.map(inspectTarget));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    results
  });
}
