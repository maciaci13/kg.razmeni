import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlaygroundCycleSize, PlaygroundSnapshot } from "@/lib/playground";
import { getSofiaCatalog } from "@/lib/sofia/catalog";

export const dynamic = "force-dynamic";

type PlaygroundAction =
  | { action: "snapshot" }
  | { action: "reset" }
  | { action: "setupBase" }
  | { action: "seed"; cycleSize: PlaygroundCycleSize }
  | { action: "confirm"; matchId: string; userId: string }
  | { action: "decline"; matchId: string; userId: string }
  | { action: "leave"; matchId: string; userId: string; keepChat: boolean }
  | { action: "status"; matchId: string; userId: string; status: string }
  | { action: "message"; chatId: string; userId: string; body: string }
  | { action: "createRequest"; userId: string; fromKindergartenId: string; wantedKindergartenId: string; ageGroup?: string }
  | { action: "deactivateRequest"; requestId: string }
  | { action: "deleteRequest"; requestId: string };

function assertPlaygroundEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND !== "true") {
    throw new Error("Playground is disabled. Set NEXT_PUBLIC_ENABLE_PLAYGROUND=true in env.");
  }
}

function isMissingDirectChatMigration(message: string) {
  return message.includes("ensure_match_direct_chats") || message.includes("direct_user_1_id") || message.includes("direct_user_2_id");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[„“”]/g, '"');
}

function extractOfficialNumber(value: string) {
  return value.match(/(?:№|No|N|ДГ|СДЯ)\s*[- ]?\s*(\d{1,3})/i)?.[1] ?? null;
}

async function getPdfKindergartenOptions() {
  const catalog = await getSofiaCatalog();
  return catalog.institutions.map((institution) => ({
    id: `catalog:${institution.id}`,
    name: institution.name,
    district: institution.district ?? null
  }));
}

async function resolveKindergartenId(supabase: ReturnType<typeof createSupabaseAdminClient>, submittedId: string) {
  if (!submittedId.startsWith("catalog:")) return submittedId;

  const catalogId = submittedId.slice("catalog:".length);
  const catalog = await getSofiaCatalog();
  const institution = catalog.institutions.find((item) => item.id === catalogId);
  if (!institution) throw new Error("Избраното заведение не беше намерено в PDF каталога.");

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

  const payload = {
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
  };

  const inserted = await supabase.from("kindergartens").insert(payload).select("id").single();
  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data.id as string;
}

async function ensurePlaygroundBase(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const users = await supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_playground", true);
  if (users.error) throw new Error(users.error.message);
  if ((users.count ?? 0) >= 4) return;

  const { error } = await supabase.rpc("seed_playground_base");
  if (error) throw new Error(error.message);
}

async function leaveMatchDirectly(supabase: ReturnType<typeof createSupabaseAdminClient>, matchId: string, userId: string, keepChat: boolean) {
  const { data: participant, error: participantError } = await supabase
    .from("match_participants")
    .select("id, confirmation_status")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .single();

  if (participantError) throw new Error(participantError.message);
  if (!participant) throw new Error("Participant not found for this match/user");

  const { error: participantUpdateError } = await supabase
    .from("match_participants")
    .update({
      coordination_status: "dropped_out",
      confirmation_status: participant.confirmation_status === "pending" ? "declined" : participant.confirmation_status,
      coordination_updated_at: new Date().toISOString(),
      declined_at: participant.confirmation_status === "pending" ? new Date().toISOString() : null
    })
    .eq("id", participant.id);
  if (participantUpdateError) throw new Error(participantUpdateError.message);

  const { data: participantRows, error: participantRowsError } = await supabase
    .from("match_participants")
    .select("request_id, user_id")
    .eq("match_id", matchId);
  if (participantRowsError) throw new Error(participantRowsError.message);

  const requestIds = (participantRows ?? []).map((row) => row.request_id).filter(Boolean);
  if (requestIds.length > 0) {
    const { error: unlockRequestsError } = await supabase
      .from("swap_requests")
      .update({ is_active: true, is_locked: false, lock_reason: null })
      .in("id", requestIds);
    if (unlockRequestsError) throw new Error(unlockRequestsError.message);
  }

  const { error: matchUpdateError } = await supabase
    .from("matches")
    .update({ status: keepChat ? "at_risk" : "cancelled", failure_reason: "participant_left_match", cancelled_at: keepChat ? null : new Date().toISOString() })
    .eq("id", matchId);
  if (matchUpdateError) throw new Error(matchUpdateError.message);

  const { error: chatUpdateError } = await supabase
    .from("chats")
    .update(keepChat ? { status: "active", unlocked_at: new Date().toISOString(), archived_at: null } : { status: "archived", archived_at: new Date().toISOString() })
    .eq("match_id", matchId);
  if (chatUpdateError) throw new Error(chatUpdateError.message);

  await supabase.from("match_progress_events").insert({ match_id: matchId, user_id: userId, participant_id: participant.id, event_type: "participant_left", event_label: "Участник се отказа от координацията" });

  const notifyUsers = (participantRows ?? []).filter((row) => row.user_id !== userId).map((row) => ({ user_id: row.user_id, type: "participant_left", title: "Участник се отказа", body: "Една от страните се отказа от потенциалното съвпадение.", match_id: matchId }));
  if (notifyUsers.length > 0) await supabase.from("notifications").insert(notifyUsers);
}

async function getSnapshot(): Promise<PlaygroundSnapshot> {
  const supabase = createSupabaseAdminClient();
  const pdfKindergartens = await getPdfKindergartenOptions();

  const users = await supabase.from("app_users").select("id, display_name, email").eq("is_playground", true).order("display_name");
  if (users.error) throw new Error(users.error.message);

  const userIds = (users.data ?? []).map((user) => user.id);

  const [requests, matches, participants] = await Promise.all([
    userIds.length > 0
      ? supabase.from("swap_requests").select("id, user_id, from_kindergarten_id, request_type, status, is_active, is_locked, child_group_year_or_age_group").in("user_id", userIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("matches").select("id, match_type, status, confidence_score, created_at").order("created_at", { ascending: false }).limit(40),
    supabase.from("match_participants").select("id, match_id, user_id, participant_label, participant_order, confirmation_status, coordination_status, from_kindergarten_id, wants_kindergarten_id").order("participant_order")
  ]);

  const firstErrors = [requests, matches, participants].map((result) => result.error).filter(Boolean);
  if (firstErrors.length > 0) throw new Error(firstErrors.map((error) => error?.message).join(" | "));

  const confirmedMatchIds = (matches.data ?? [])
    .filter((match) => ["confirmed", "at_risk"].includes(match.status))
    .filter((match) => (participants.data ?? []).filter((participant) => participant.match_id === match.id).length > 1)
    .map((match) => match.id);

  let directChatsMigrationAvailable = true;

  if (confirmedMatchIds.length > 0) {
    for (const matchId of confirmedMatchIds) {
      const { error } = await supabase.rpc("ensure_match_direct_chats", { p_match_id: matchId });
      if (error) {
        if (isMissingDirectChatMigration(error.message)) {
          directChatsMigrationAvailable = false;
          break;
        }
        throw new Error(error.message);
      }
    }

    if (directChatsMigrationAvailable) {
      const { error: activateDirectChatsError } = await supabase
        .from("chats")
        .update({ status: "active" })
        .in("match_id", confirmedMatchIds)
        .eq("chat_type", "direct")
        .neq("status", "archived");

      if (activateDirectChatsError) throw new Error(activateDirectChatsError.message);
    }
  }

  const chatsQuery = directChatsMigrationAvailable
    ? supabase.from("chats").select("id, match_id, chat_type, status, direct_user_1_id, direct_user_2_id").order("created_at", { ascending: false }).limit(80)
    : supabase.from("chats").select("id, match_id, chat_type, status").order("created_at", { ascending: false }).limit(80);

  const [chats, messages] = await Promise.all([
    chatsQuery,
    supabase.from("messages").select("id, chat_id, sender_user_id, body, moderation_flag, created_at").order("created_at", { ascending: true }).limit(200)
  ]);

  const secondErrors = [chats, messages].map((result) => result.error).filter(Boolean);
  if (secondErrors.length > 0) throw new Error(secondErrors.map((error) => error?.message).join(" | "));

  const requestIds = (requests.data ?? []).map((request) => request.id);
  const wantedKindergartens = requestIds.length > 0
    ? await supabase.from("swap_request_wanted_kindergartens").select("id, request_id, wanted_kindergarten_id, priority_order").in("request_id", requestIds).order("priority_order")
    : { data: [], error: null };

  if (wantedKindergartens.error) throw new Error(wantedKindergartens.error.message);

  const normalizedChats = (chats.data ?? []).map((chat) => ({ direct_user_1_id: null, direct_user_2_id: null, ...chat }));

  return {
    users: users.data ?? [],
    kindergartens: pdfKindergartens,
    requests: requests.data ?? [],
    wantedKindergartens: wantedKindergartens.data ?? [],
    matches: matches.data ?? [],
    participants: participants.data ?? [],
    chats: normalizedChats,
    messages: messages.data ?? []
  } as PlaygroundSnapshot;
}

export async function GET() {
  try {
    assertPlaygroundEnabled();
    return NextResponse.json(await getSnapshot());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    assertPlaygroundEnabled();
    const body = (await request.json()) as PlaygroundAction;
    const supabase = createSupabaseAdminClient();

    if (body.action === "snapshot") return NextResponse.json(await getSnapshot());
    if (body.action === "reset") {
      const { error } = await supabase.rpc("reset_playground_data");
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "setupBase") {
      await ensurePlaygroundBase(supabase);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "seed") {
      const { error } = await supabase.rpc("seed_playground_cycle", { p_cycle_size: body.cycleSize });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "createRequest") {
      const fromKindergartenId = await resolveKindergartenId(supabase, body.fromKindergartenId);
      const wantedKindergartenId = await resolveKindergartenId(supabase, body.wantedKindergartenId);

      const { data: requestRow, error: requestError } = await supabase
        .from("swap_requests")
        .insert({ user_id: body.userId, from_kindergarten_id: fromKindergartenId, request_type: "kindergarten", child_group_year_or_age_group: body.ageGroup ?? "2019", status: "enrolled" })
        .select("id")
        .single();
      if (requestError) throw new Error(requestError.message);

      const { error: wantedError } = await supabase.from("swap_request_wanted_kindergartens").insert({ request_id: requestRow.id, wanted_kindergarten_id: wantedKindergartenId, priority_order: 1 });
      if (wantedError) throw new Error(wantedError.message);

      const { error: matchError } = await supabase.rpc("find_potential_matches_for_request", { p_request_id: requestRow.id });
      if (matchError) throw new Error(matchError.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "deactivateRequest") {
      const { error } = await supabase.from("swap_requests").update({ is_active: false, is_locked: false, lock_reason: null }).eq("id", body.requestId);
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "deleteRequest") {
      const { error } = await supabase.from("swap_requests").delete().eq("id", body.requestId);
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "confirm") {
      const { error } = await supabase.rpc("confirm_match_participant", { p_match_id: body.matchId, p_user_id: body.userId });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "decline") {
      const { error } = await supabase.rpc("decline_match_participant", { p_match_id: body.matchId, p_user_id: body.userId });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "leave") {
      await leaveMatchDirectly(supabase, body.matchId, body.userId, body.keepChat);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "status") {
      const { error } = await supabase.rpc("update_my_coordination_status", { p_match_id: body.matchId, p_user_id: body.userId, p_status: body.status });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "message") {
      const { error } = await supabase.rpc("send_chat_message", { p_chat_id: body.chatId, p_sender_user_id: body.userId, p_body: body.body });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
