import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlaygroundCycleSize, PlaygroundSnapshot } from "@/lib/playground";

export const dynamic = "force-dynamic";

type PlaygroundAction =
  | { action: "snapshot" }
  | { action: "reset" }
  | { action: "seed"; cycleSize: PlaygroundCycleSize }
  | { action: "confirm"; matchId: string; userId: string }
  | { action: "decline"; matchId: string; userId: string }
  | { action: "status"; matchId: string; userId: string; status: string }
  | { action: "message"; chatId: string; userId: string; body: string };

function assertPlaygroundEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND !== "true") {
    throw new Error("Playground is disabled. Set NEXT_PUBLIC_ENABLE_PLAYGROUND=true in env.");
  }
}

async function getSnapshot(): Promise<PlaygroundSnapshot> {
  const supabase = createSupabaseAdminClient();

  const users = await supabase
    .from("app_users")
    .select("id, display_name, email")
    .eq("is_playground", true)
    .order("display_name");

  if (users.error) throw new Error(users.error.message);

  const userIds = (users.data ?? []).map((user) => user.id);

  const [kindergartens, requests, matches, participants, chats, messages] = await Promise.all([
    supabase.from("kindergartens").select("id, name, district").eq("source_name", "playground").order("official_number"),
    userIds.length > 0
      ? supabase
          .from("swap_requests")
          .select("id, user_id, from_kindergarten_id, is_active, is_locked, child_group_year_or_age_group")
          .in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("matches").select("id, match_type, status, confidence_score, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("match_participants").select("id, match_id, user_id, participant_label, participant_order, confirmation_status, coordination_status, from_kindergarten_id, wants_kindergarten_id").order("participant_order"),
    supabase.from("chats").select("id, match_id, chat_type, status").order("created_at", { ascending: false }).limit(20),
    supabase.from("messages").select("id, chat_id, sender_user_id, body, moderation_flag, created_at").order("created_at", { ascending: true }).limit(100)
  ]);

  const errors = [kindergartens, requests, matches, participants, chats, messages]
    .map((result) => result.error)
    .filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join(" | "));
  }

  return {
    users: users.data ?? [],
    kindergartens: kindergartens.data ?? [],
    requests: requests.data ?? [],
    matches: matches.data ?? [],
    participants: participants.data ?? [],
    chats: chats.data ?? [],
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

    if (body.action === "snapshot") {
      return NextResponse.json(await getSnapshot());
    }

    if (body.action === "reset") {
      const { error } = await supabase.rpc("reset_playground_data");
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }

    if (body.action === "seed") {
      const { error } = await supabase.rpc("seed_playground_cycle", { p_cycle_size: body.cycleSize });
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

    if (body.action === "status") {
      const { error } = await supabase.rpc("update_my_coordination_status", {
        p_match_id: body.matchId,
        p_user_id: body.userId,
        p_status: body.status
      });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }

    if (body.action === "message") {
      const { error } = await supabase.rpc("send_chat_message", {
        p_chat_id: body.chatId,
        p_sender_user_id: body.userId,
        p_body: body.body
      });
      if (error) throw new Error(error.message);
      return NextResponse.json(await getSnapshot());
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
