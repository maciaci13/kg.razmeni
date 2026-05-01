import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KG_SCHOOL_URL = "https://kg.sofia.bg/api/public/school";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarizeValue(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) {
    return {
      type: "array",
      count: value.length,
      sample: value.slice(0, 2).map((item) => summarizeValue(item, depth + 1))
    };
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    const summary: Record<string, unknown> = {
      type: "object",
      keys: entries.map(([key]) => key)
    };

    if (depth < 3) {
      summary.children = Object.fromEntries(
        entries.slice(0, 30).map(([key, childValue]) => [key, summarizeValue(childValue, depth + 1)])
      );
    }

    return summary;
  }

  return {
    type: value === null ? "null" : typeof value,
    value: typeof value === "string" ? value.slice(0, 160) : value
  };
}

function findArrays(value: unknown, path = "$", found: Array<{ path: string; count: number; sample: unknown[] }> = []) {
  if (Array.isArray(value)) {
    found.push({
      path,
      count: value.length,
      sample: value.slice(0, 2)
    });
    value.slice(0, 4).forEach((item, index) => findArrays(item, `${path}[${index}]`, found));
    return found;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, childValue]) => findArrays(childValue, `${path}.${key}`, found));
  }

  return found;
}

export async function GET() {
  const response = await fetch(KG_SCHOOL_URL, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MZM kg school summary"
    },
    cache: "no-store"
  });

  const text = await response.text();
  let payload: JsonValue | string = text;

  try {
    payload = JSON.parse(text) as JsonValue;
  } catch {
    // keep text
  }

  const arrays = isRecord(payload) || Array.isArray(payload) ? findArrays(payload) : [];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sourceUrl: KG_SCHOOL_URL,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
    topLevel: summarizeValue(payload),
    arrays: arrays.map((array) => ({
      path: array.path,
      count: array.count,
      sample: array.sample
    }))
  });
}
