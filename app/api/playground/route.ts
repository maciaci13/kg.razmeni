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
  | { action: "seedRandomCycle"; cycleSize: PlaygroundCycleSize; district?: string; resetFirst?: boolean; cycleCount?: number; ageGroup?: string }
  | { action: "seedRadarDemo"; district?: string; resetFirst?: boolean; requestCount?: number; ageGroup?: string }
  | { action: "confirm"; matchId: string; userId: string }
  | { action: "decline"; matchId: string; userId: string }
  | { action: "leave"; matchId: string; userId: string; keepChat: boolean; reason?: string }
  | { action: "status"; matchId: string; userId: string; status: string }
  | { action: "message"; chatId: string; userId: string; body: string }
  | { action: "createRequest"; userId: string; fromKindergartenId: string; wantedKindergartenId: string; ageGroup?: string }
  | { action: "deactivateRequest"; requestId: string }
  | { action: "deleteRequest"; requestId: string };

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;
type CatalogOption = { id: string; name: string; district: string | null; address?: string | null; phone?: string | null; email?: string | null; website?: string | null; source?: string; sourceUrl?: string };
type DbKindergarten = { id: string; name: string; district: string | null; address: string | null };

const ALL_DISTRICTS = "__all__";
const DEMO_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"];

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

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clampCount(value: number | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function asCatalogId(id: string) {
  if (!id) return id;
  return id.startsWith("catalog:") ? id : `catalog:${id}`;
}

function byOfficialKey(value: { name: string; district?: string | null }) {
  return `${normalizeName(value.name)}::${value.district || ""}`;
}

async function getCatalog() {
  return await getSofiaCatalog();
}

async function getPdfKindergartenOptions() {
  const catalog = await getCatalog();
  return catalog.institutions.map((institution) => ({
    id: `catalog:${institution.id}`,
    name: institution.name,
    district: institution.district ?? null,
    address: institution.address ?? null
  }));
}

async function getRandomCatalogOptions(district?: string | null) {
  const catalog = await getCatalog();
  const normalizedDistrict = district && district !== ALL_DISTRICTS ? district : "";
  const options = catalog.institutions
    .filter((institution) => !normalizedDistrict || institution.district === normalizedDistrict)
    .map((institution) => ({
      id: `catalog:${institution.id}`,
      name: institution.name,
      district: institution.district ?? null,
      address: institution.address ?? null,
      phone: institution.phone ?? null,
      email: institution.email ?? null,
      website: institution.website ?? null,
      source: institution.source,
      sourceUrl: institution.sourceUrl
    }));

  if (options.length < 2) {
    throw new Error("Няма достатъчно градини за избрания район. Избери друг район или всички райони.");
  }

  return shuffle(options);
}

async function resolveKindergartenId(supabase: SupabaseAdmin, submittedId: string) {
  if (!submittedId.startsWith("catalog:")) return submittedId;

  const catalogId = submittedId.slice("catalog:".length);
  const catalog = await getCatalog();
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

async function ensurePlaygroundBase(supabase: SupabaseAdmin) {
  const users = await supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_playground", true);
  if (users.error) throw new Error(users.error.message);
  if ((users.count ?? 0) >= 4) return;

  const { error } = await supabase.rpc("seed_playground_base");
  if (error) throw new Error(error.message);
}

async function getPlaygroundUsers(supabase: SupabaseAdmin) {
  await ensurePlaygroundBase(supabase);
  const users = await supabase.from("app_users").select("id, display_name, email").eq("is_playground", true).order("display_name");
  if (users.error) throw new Error(users.error.message);
  return users.data ?? [];
}

async function insertPlaygroundRequest(supabase: SupabaseAdmin, userId: string, fromKindergartenId: string, wantedKindergartenId: string, ageGroup: string) {
  const resolvedFromId = await resolveKindergartenId(supabase, fromKindergartenId);
  const resolvedWantedId = await resolveKindergartenId(supabase, wantedKindergartenId);

  const { data: requestRow, error: requestError } = await supabase
    .from("swap_requests")
    .insert({ user_id: userId, from_kindergarten_id: resolvedFromId, request_type: "kindergarten", child_group_year_or_age_group: ageGroup, status: "enrolled" })
    .select("id")
    .single();
  if (requestError) throw new Error(requestError.message);

  const { error: wantedError } = await supabase
    .from("swap_request_wanted_kindergartens")
    .insert({ request_id: requestRow.id, wanted_kindergarten_id: resolvedWantedId, priority_order: 1 });
  if (wantedError) throw new Error(wantedError.message);

  return requestRow.id as string;
}

async function resetIfNeeded(supabase: SupabaseAdmin, resetFirst?: boolean) {
  if (!resetFirst) return;
  const { error } = await supabase.rpc("reset_playground_data");
  if (error) throw new Error(error.message);
  await ensurePlaygroundBase(supabase);
}

async function seedRandomCycle(supabase: SupabaseAdmin, params: { cycleSize: PlaygroundCycleSize; district?: string; resetFirst?: boolean; cycleCount?: number; ageGroup?: string }) {
  await resetIfNeeded(supabase, params.resetFirst ?? true);
  const users = await getPlaygroundUsers(supabase);
  const cycleSize = params.cycleSize;
  const cycleCount = clampCount(params.cycleCount, 2, 1, 6);
  const ageGroup = params.ageGroup || DEMO_YEARS[randomInt(DEMO_YEARS.length)];
  const options = await getRandomCatalogOptions(params.district);

  if (users.length < cycleSize) throw new Error("Няма достатъчно playground родители за този цикъл.");
  if (options.length < cycleSize * cycleCount) throw new Error("Няма достатъчно различни градини за избраните настройки.");

  const requestIds: string[] = [];

  for (let cycleIndex = 0; cycleIndex < cycleCount; cycleIndex += 1) {
    const offset = cycleIndex * cycleSize;
    const cycleKgs = options.slice(offset, offset + cycleSize);
    const cycleYear = cycleIndex === 0 ? ageGroup : DEMO_YEARS[(randomInt(DEMO_YEARS.length) + cycleIndex) % DEMO_YEARS.length];

    for (let index = 0; index < cycleSize; index += 1) {
      const user = users[index];
      const from = cycleKgs[index];
      const wanted = cycleKgs[(index + 1) % cycleSize];
      const requestId = await insertPlaygroundRequest(supabase, user.id, from.id, wanted.id, cycleYear);
      requestIds.push(requestId);
    }
  }

  for (const requestId of requestIds) {
    const { error } = await supabase.rpc("find_potential_matches_for_request", { p_request_id: requestId });
    if (error) throw new Error(error.message);
  }
}

async function seedRadarDemo(supabase: SupabaseAdmin, params: { district?: string; resetFirst?: boolean; requestCount?: number; ageGroup?: string }) {
  await resetIfNeeded(supabase, params.resetFirst ?? true);
  const users = await getPlaygroundUsers(supabase);
  const requestCount = clampCount(params.requestCount, 18, 6, 60);
  const options = await getRandomCatalogOptions(params.district);

  if (users.length < 2) throw new Error("Няма достатъчно playground родители за radar seed.");
  if (options.length < 4) throw new Error("Няма достатъчно градини за radar seed.");

  for (let index = 0; index < requestCount; index += 1) {
    const user = users[index % users.length];
    const from = options[index % options.length];
    const wantedOffset = 1 + randomInt(Math.min(7, options.length - 1));
    const wanted = options[(index + wantedOffset) % options.length];
    const ageGroup = params.ageGroup || DEMO_YEARS[(index + randomInt(DEMO_YEARS.length)) % DEMO_YEARS.length];
    await insertPlaygroundRequest(supabase, user.id, from.id, wanted.id, ageGroup);
  }
}

async function leaveMatchDirectly(supabase: SupabaseAdmin, matchId: string, userId: string, keepChat: boolean, reason?: string) {
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
    .update({ status: keepChat ? "at_risk" : "cancelled", failure_reason: reason || "participant_left_match", cancelled_at: keepChat ? null : new Date().toISOString() })
    .eq("id", matchId);
  if (matchUpdateError) throw new Error(matchUpdateError.message);

  const { error: chatUpdateError } = await supabase
    .from("chats")
    .update(keepChat ? { status: "active", unlocked_at: new Date().toISOString(), archived_at: null } : { status: "archived", archived_at: new Date().toISOString() })
    .eq("match_id", matchId);
  if (chatUpdateError) throw new Error(chatUpdateError.message);

  await supabase.from("match_progress_events").insert({ match_id: matchId, user_id: userId, participant_id: participant.id, event_type: "participant_left", event_label: reason ? `Участник се отказа: ${reason}` : "Участник се отказа от координацията" });

  const notifyUsers = (participantRows ?? []).filter((row) => row.user_id !== userId).map((row) => ({ user_id: row.user_id, type: "participant_left", title: "Участник се отказа", body: "Една от страните се отказа от потенциалното съвпадение.", match_id: matchId }));
  if (notifyUsers.length > 0) await supabase.from("notifications").insert(notifyUsers);
}

async function getSnapshot(): Promise<PlaygroundSnapshot> {
  const supabase = createSupabaseAdminClient();
  const catalog = await getCatalog();
  const pdfKindergartens = catalog.institutions.map((institution) => ({
    id: `catalog:${institution.id}`,
    name: institution.name,
    district: institution.district ?? null,
    address: institution.address ?? null
  }));
  const officialByKey = new Map(catalog.institutions.map((institution) => [byOfficialKey(institution), `catalog:${institution.id}`]));

  const users = await supabase.from("app_users").select("id, display_name, email").eq("is_playground", true).order("display_name");
  if (users.error) throw new Error(users.error.message);

  const userIds = (users.data ?? []).map((user) => user.id);

  const [requests, rawMatches, rawParticipants] = await Promise.all([
    userIds.length > 0
      ? supabase.from("swap_requests").select("id, user_id, from_kindergarten_id, request_type, status, is_active, is_locked, child_group_year_or_age_group").in("user_id", userIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("matches").select("id, match_type, status, confidence_score, created_at").order("created_at", { ascending: false }).limit(160),
    userIds.length > 0
      ? supabase.from("match_participants").select("id, match_id, user_id, participant_label, participant_order, confirmation_status, coordination_status, from_kindergarten_id, wants_kindergarten_id, request_id").in("user_id", userIds).order("participant_order")
      : Promise.resolve({ data: [], error: null })
  ]);

  const firstErrors = [requests, rawMatches, rawParticipants].map((result) => result.error).filter(Boolean);
  if (firstErrors.length > 0) throw new Error(firstErrors.map((error) => error?.message).join(" | "));

  const playgroundMatchIds = new Set((rawParticipants.data ?? []).map((participant) => participant.match_id));
  const matchesData = (rawMatches.data ?? []).filter((match) => playgroundMatchIds.has(match.id));
  const matchIds = matchesData.map((match) => match.id);
  const participantsData = (rawParticipants.data ?? []).filter((participant) => playgroundMatchIds.has(participant.match_id));

  const confirmedMatchIds = matchesData
    .filter((match) => ["confirmed", "at_risk"].includes(match.status))
    .filter((match) => participantsData.filter((participant) => participant.match_id === match.id).length > 1)
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

  const chatsQuery = matchIds.length > 0
    ? directChatsMigrationAvailable
      ? supabase.from("chats").select("id, match_id, chat_type, status, direct_user_1_id, direct_user_2_id").in("match_id", matchIds).order("created_at", { ascending: false }).limit(160)
      : supabase.from("chats").select("id, match_id, chat_type, status").in("match_id", matchIds).order("created_at", { ascending: false }).limit(160)
    : Promise.resolve({ data: [], error: null });

  const chats = await chatsQuery;
  if (chats.error) throw new Error(chats.error.message);

  const chatIds = (chats.data ?? []).map((chat) => chat.id);
  const messages = chatIds.length > 0
    ? await supabase.from("messages").select("id, chat_id, sender_user_id, body, moderation_flag, created_at").in("chat_id", chatIds).order("created_at", { ascending: true }).limit(300)
    : { data: [], error: null };

  if (messages.error) throw new Error(messages.error.message);

  const requestIds = (requests.data ?? []).map((request) => request.id);
  const wantedKindergartens = requestIds.length > 0
    ? await supabase.from("swap_request_wanted_kindergartens").select("id, request_id, wanted_kindergarten_id, priority_order").in("request_id", requestIds).order("priority_order")
    : { data: [], error: null };

  if (wantedKindergartens.error) throw new Error(wantedKindergartens.error.message);

  const dbKindergartenIds = Array.from(new Set([
    ...(requests.data ?? []).map((request) => request.from_kindergarten_id),
    ...(wantedKindergartens.data ?? []).map((wanted) => wanted.wanted_kindergarten_id),
    ...participantsData.flatMap((participant) => [participant.from_kindergarten_id, participant.wants_kindergarten_id])
  ].filter(Boolean)));

  const dbKindergartens = dbKindergartenIds.length > 0
    ? await supabase.from("kindergartens").select("id, name, district, address").in("id", dbKindergartenIds)
    : { data: [], error: null };
  if (dbKindergartens.error) throw new Error(dbKindergartens.error.message);

  const officialIdByDbId = new Map<string, string>();
  (dbKindergartens.data ?? []).forEach((item: DbKindergarten) => {
    const officialId = officialByKey.get(byOfficialKey(item));
    if (officialId) officialIdByDbId.set(item.id, officialId);
  });

  const mapId = (id: string | null | undefined) => {
    if (!id) return id;
    if (id.startsWith("catalog:")) return id;
    return officialIdByDbId.get(id) || null;
  };

  const mappedRequests = (requests.data ?? [])
    .map((request) => ({ ...request, from_kindergarten_id: mapId(request.from_kindergarten_id) }))
    .filter((request) => Boolean(request.from_kindergarten_id));
  const validRequestIds = new Set(mappedRequests.map((request) => request.id));

  const mappedWantedKindergartens = (wantedKindergartens.data ?? [])
    .map((wanted) => ({ ...wanted, wanted_kindergarten_id: mapId(wanted.wanted_kindergarten_id) }))
    .filter((wanted) => validRequestIds.has(wanted.request_id) && Boolean(wanted.wanted_kindergarten_id));

  const mappedParticipants = participantsData
    .map((participant) => ({
      ...participant,
      from_kindergarten_id: mapId(participant.from_kindergarten_id),
      wants_kindergarten_id: mapId(participant.wants_kindergarten_id)
    }))
    .filter((participant) => Boolean(participant.from_kindergarten_id) && Boolean(participant.wants_kindergarten_id));
  const validMatchIds = new Set(mappedParticipants.map((participant) => participant.match_id));
  const mappedMatches = matchesData.filter((match) => validMatchIds.has(match.id));

  const normalizedChats = (chats.data ?? []).map((chat) => ({ direct_user_1_id: null, direct_user_2_id: null, ...chat }));

  return {
    users: users.data ?? [],
    kindergartens: pdfKindergartens,
    requests: mappedRequests,
    wantedKindergartens: mappedWantedKindergartens,
    matches: mappedMatches,
    participants: mappedParticipants,
    chats: normalizedChats.filter((chat) => validMatchIds.has(chat.match_id)),
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
      await seedRandomCycle(supabase, { cycleSize: body.cycleSize, resetFirst: true, cycleCount: 1 });
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "seedRandomCycle") {
      await seedRandomCycle(supabase, body);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "seedRadarDemo") {
      await seedRadarDemo(supabase, body);
      return NextResponse.json(await getSnapshot());
    }
    if (body.action === "createRequest") {
      const playgroundUsers = await getPlaygroundUsers(supabase);
      if (!playgroundUsers.some((user) => user.id === body.userId)) throw new Error("Само playground потребители могат да създават playground заявки.");
      const requestId = await insertPlaygroundRequest(supabase, body.userId, body.fromKindergartenId, body.wantedKindergartenId, body.ageGroup ?? "2019");
      const { error: matchError } = await supabase.rpc("find_potential_matches_for_request", { p_request_id: requestId });
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
      await leaveMatchDirectly(supabase, body.matchId, body.userId, body.keepChat, body.reason);
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
