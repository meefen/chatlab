import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/services/api";
import type { Conversation } from "@/types/api";

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => get("/api/conversations/"),
  });

  const createConversation = useMutation({
    mutationFn: async (data: { title: string; participant_ids: number[] }) => {
      return post("/api/conversations/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const addUserMessage = useMutation({
    mutationFn: async ({ conversationId, content, turnNumber }: { 
      conversationId: number; 
      content: string; 
      turnNumber: number; 
    }) => {
      return post(`/api/conversations/${conversationId}/messages`, {
        content,
        is_user_prompt: true,
        turn_number: turnNumber,
        character_id: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const generateResponse = useMutation({
    mutationFn: async ({ conversationId, characterId, userPrompt }: { 
      conversationId: number; 
      characterId: number; 
      userPrompt?: string; 
    }) => {
      return post(`/api/ai/conversations/${conversationId}/generate-response`, {
        character_id: characterId,
        user_prompt: userPrompt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const generateTitle = useMutation({
    mutationFn: async (conversationId: number) => {
      return post(`/api/ai/conversations/${conversationId}/generate-title`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    ...query,
    createConversation,
    addUserMessage,
    generateResponse,
    generateTitle,
  };
}
