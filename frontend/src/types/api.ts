export interface CreatorInfo {
  id: number;
  full_name?: string;
}

export interface Character {
  id: number;
  name: string;
  role: string;
  personality: string;
  avatar_url?: string;
  is_public: boolean;
  created_by_id?: number;
  created_by?: CreatorInfo;
  created_at: string;
}

export interface CharacterCreate {
  name: string;
  role: string;
  personality: string;
  avatar_url?: string;
  is_public?: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  participant_ids: number[];
  is_autonomous: boolean;
  current_turn: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  character_id?: number;
  content: string;
  is_user_prompt: boolean;
  turn_number: number;
  created_at: string;
  character?: Character;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  participants: Character[];
}