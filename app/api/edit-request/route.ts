import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSofiaCatalog } from "@/lib/sofia/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EditRequestBody = {
  requestId?: string;
  fromKindergartenId?: string;
  wantedKindergartenId?: string;
  ageGroup?: string;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[„“”]/g, '"');
}

function extractOfficialNumber(value: string) {
  return value.match(/(?:№|No|N|ДГ|СДЯ)\s*[- ]?\s*(\d{1,3})/i)?.[1] ?? null;
}

async function resolveKindergartenId(supabase: ReturnType<typeof createSupabaseAdminClient>, submittedId: string) {
  if (!submittedId.startsWith("catalog:")) return submittedId;

  const catalogId = submittedId.slice("catalog:".length);
  const catalog = await getSofiaCatalog();
  const institution = catalog.institutions.find((item) => item.id === catalogId);
  if (!institution) throw new Error("Избраното заведение не беше намерено в каталога.");

  const normalizedName = normalizeName(institution.name);
  const district = institution.district || null;

  const existing = await supabase
    .from("kindergartens")
    .select("id")
    .eq("normalized_name", normalizedName)
    .eq("district", district)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return existing.data.id as string;

  const inserted = await supabase
    .from("kindergartens")
    .insert({
      official_number: extractOfficialNumber(institution.name),
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
      source_updated_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data.id as string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EditRequestBody;
    if (!body.requestId || !body.fromKindergartenId || !body.wantedKindergartenId) {
      return NextResponse.json({ error: "Липсват данни за редакция." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const fromKindergartenId = await resolveKindergartenId(supabase, body.fromKindergartenId);
    const wantedKindergartenId = await resolveKindergartenId(supabase, body.wantedKindergartenId);

    const updated = await supabase
      .from("swap_requests")
      .update({
        from_kindergarten_id: fromKindergartenId,
        child_group_year_or_age_group: body.ageGroup || "—",
        is_active: true,
        is_locked: false,
        lock_reason: null
      })
      .eq("id", body.requestId);

    if (updated.error) throw new Error(updated.error.message);

    const deletedWanted = await supabase
      .from("swap_request_wanted_kindergartens")
      .delete()
      .eq("request_id", body.requestId);

    if (deletedWanted.error) throw new Error(deletedWanted.error.message);

    const insertedWanted = await supabase
      .from("swap_request_wanted_kindergartens")
      .insert({ request_id: body.requestId, wanted_kindergarten_id: wantedKindergartenId, priority_order: 1 });

    if (insertedWanted.error) throw new Error(insertedWanted.error.message);

    await supabase.rpc("find_potential_matches_for_request", { p_request_id: body.requestId });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown edit request error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
