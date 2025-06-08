import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, InsertConversation, InsertMessage } from "@shared/schema";

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversation = useMutation({
    mutationFn: async (data: InsertConversation) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const addUserMessage = useMutation({
    mutationFn: async ({ conversationId, content, turnNumber }: { 
      conversationId: number; 
      content: string; 
      turnNumber: number; 
    }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
        isUserPrompt: true,
        turnNumber,
        characterId: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const generateResponse = useMutation({
    mutationFn: async ({ conversationId, characterId, userPrompt }: { 
      conversationId: number; 
      characterId: number; 
      userPrompt?: string; 
    }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/generate-response`, {
        characterId,
        userPrompt,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const generateTitle = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/generate-title`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
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
