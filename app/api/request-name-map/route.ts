import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RequestRow = {
  id: string;
  from_kindergarten_id: string;
  child_group_year_or_age_group: string | null;
  is_locked?: boolean | null;
};

type WantedRow = {
  request_id: string;
  wanted_kindergarten_id: string;
  priority_order: number | null;
};

type KindergartenRow = {
  id: string;
  name: string;
  district: string | null;
  address: string | null;
};

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestIds = uniq((url.searchParams.get("requestIds") || "").split(",").map((id) => id.trim()));

    if (!requestIds.length) {
      return NextResponse.json({ requests: {} }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const supabase = createSupabaseAdminClient();

    const [requestsResult, wantedResult] = await Promise.all([
      supabase
        .from("swap_requests")
        .select("id, from_kindergarten_id, child_group_year_or_age_group, is_locked")
        .in("id", requestIds),
      supabase
        .from("swap_request_wanted_kindergartens")
        .select("request_id, wanted_kindergarten_id, priority_order")
        .in("request_id", requestIds)
        .order("priority_order")
    ]);

    if (requestsResult.error) throw new Error(requestsResult.error.message);
    if (wantedResult.error) throw new Error(wantedResult.error.message);

    const requestRows = (requestsResult.data || []) as RequestRow[];
    const wantedRows = (wantedResult.data || []) as WantedRow[];
    const firstWantedByRequest = new Map<string, WantedRow>();

    wantedRows.forEach((wanted) => {
      if (!firstWantedByRequest.has(wanted.request_id)) firstWantedByRequest.set(wanted.request_id, wanted);
    });

    const kindergartenIds = uniq([
      ...requestRows.map((row) => row.from_kindergarten_id),
      ...wantedRows.map((row) => row.wanted_kindergarten_id)
    ]);

    const kindergartenRows: KindergartenRow[] = [];
    if (kindergartenIds.length) {
      const kindergartensResult = await supabase
        .from("kindergartens")
        .select("id, name, district, address")
        .in("id", kindergartenIds);
      if (kindergartensResult.error) throw new Error(kindergartensResult.error.message);
      kindergartenRows.push(...((kindergartensResult.data || []) as KindergartenRow[]));
    }

    const kindergartenById = new Map(kindergartenRows.map((kg) => [kg.id, kg]));
    const response: Record<string, { fromText: string; wantedText: string; ageGroup: string; locked: boolean }> = {};

    requestRows.forEach((row) => {
      const wanted = firstWantedByRequest.get(row.id);
      const from = kindergartenById.get(row.from_kindergarten_id);
      const wantedKg = wanted ? kindergartenById.get(wanted.wanted_kindergarten_id) : undefined;

      response[row.id] = {
        fromText: from?.name || "Избрана градина",
        wantedText: wantedKg?.name || "Желана градина",
        ageGroup: row.child_group_year_or_age_group || "—",
        locked: Boolean(row.is_locked)
      };
    });

    return NextResponse.json({ requests: response }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown request name map error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
