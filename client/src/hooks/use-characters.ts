import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Character, InsertCharacter } from "@shared/schema";

export function useCharacters() {
  const queryClient = useQueryClient();

  const query = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const createCharacter = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const response = await apiRequest("POST", "/api/characters", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const updateCharacter = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCharacter> }) => {
      const response = await apiRequest("PUT", `/api/characters/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const deleteCharacter = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  return {
    ...query,
    createCharacter,
    updateCharacter,
    deleteCharacter,
  };
}
