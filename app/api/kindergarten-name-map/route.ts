import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSofiaCatalog } from "@/lib/sofia/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ids = uniq((url.searchParams.get("ids") || "").split(","));

    if (!ids.length) {
      return NextResponse.json({ kindergartens: {} }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const response: Record<string, { name: string; district: string | null; address?: string | null }> = {};
    const dbIds = ids.filter((id) => !id.startsWith("catalog:"));
    const catalogIds = ids.filter((id) => id.startsWith("catalog:")).map((id) => id.slice("catalog:".length));

    if (dbIds.length) {
      const supabase = createSupabaseAdminClient();
      const result = await supabase
        .from("kindergartens")
        .select("id, name, district, address")
        .in("id", dbIds);

      if (result.error) throw new Error(result.error.message);

      (result.data || []).forEach((kg) => {
        response[kg.id] = { name: kg.name, district: kg.district, address: kg.address };
      });
    }

    if (catalogIds.length) {
      const catalog = await getSofiaCatalog();
      catalogIds.forEach((id) => {
        const institution = catalog.institutions.find((item) => item.id === id);
        if (!institution) return;
        response[`catalog:${id}`] = {
          name: institution.name,
          district: institution.district || null,
          address: institution.address || null
        };
      });
    }

    return NextResponse.json({ kindergartens: response }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown kindergarten name map error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
