import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSofiaCatalog } from "@/lib/sofia/catalog";

export const dynamic = "force-dynamic";

type SyncResult = {
  inserted: number;
  updated: number;
  skipped: number;
  checkedAt: string;
  sources: Awaited<ReturnType<typeof getSofiaCatalog>>["sources"];
};

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[„“”]/g, '"');
}

function isAuthorized(request: Request) {
  const secret = process.env.CATALOG_SYNC_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : request.headers.get("x-sync-secret");
  return token === secret;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized catalog sync" }, { status: 401 });
    }

    const catalog = await getSofiaCatalog();
    const supabase = createSupabaseAdminClient();
    const checkedAt = new Date().toISOString();

    const result: SyncResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      checkedAt,
      sources: catalog.sources
    };

    for (const institution of catalog.institutions) {
      if (institution.source === "fallback") {
        result.skipped += 1;
        continue;
      }

      const normalizedName = normalizeName(institution.name);
      const district = institution.district || null;

      const existing = await supabase
        .from("kindergartens")
        .select("id")
        .eq("normalized_name", normalizedName)
        .eq("district", district)
        .maybeSingle();

      if (existing.error) throw new Error(existing.error.message);

      const payload = {
        name: institution.name,
        normalized_name: normalizedName,
        district,
        address: institution.address || null,
        phone: institution.phone || null,
        email: institution.email || null,
        website: institution.website || null,
        is_active: true,
        source_name: institution.source,
        source_url: institution.sourceUrl,
        source_updated_at: checkedAt,
        last_verified_at: checkedAt
      };

      if (existing.data?.id) {
        const { error } = await supabase.from("kindergartens").update(payload).eq("id", existing.data.id);
        if (error) throw new Error(error.message);
        result.updated += 1;
      } else {
        const { error } = await supabase.from("kindergartens").insert(payload);
        if (error) throw new Error(error.message);
        result.inserted += 1;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown catalog sync error" },
      { status: 500 }
    );
  }
}
