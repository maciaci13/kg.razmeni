export type PlaygroundCycleSize = 2 | 3 | 4;

export type PlaygroundSnapshot = {
  users: Array<{
    id: string;
    display_name: string;
    email: string | null;
  }>;
  kindergartens: Array<{
    id: string;
    name: string;
    district: string | null;
  }>;
  requests: Array<{
    id: string;
    user_id: string;
    from_kindergarten_id: string;
    request_type: string;
    status: string;
    is_active: boolean;
    is_locked: boolean;
    child_group_year_or_age_group: string;
  }>;
  wantedKindergartens: Array<{
    id: string;
    request_id: string;
    wanted_kindergarten_id: string;
    priority_order: number;
  }>;
  matches: Array<{
    id: string;
    match_type: "direct_2" | "cycle_3" | "cycle_4";
    status: string;
    confidence_score: number;
    created_at: string;
  }>;
  participants: Array<{
    id: string;
    match_id: string;
    user_id: string;
    participant_label: string;
    participant_order: number;
    confirmation_status: string;
    coordination_status: string;
    from_kindergarten_id: string;
    wants_kindergarten_id: string;
  }>;
  chats: Array<{
    id: string;
    match_id: string;
    chat_type: string;
    status: string;
  }>;
  messages: Array<{
    id: string;
    chat_id: string;
    sender_user_id: string;
    body: string;
    moderation_flag: boolean;
    created_at: string;
  }>;
};
