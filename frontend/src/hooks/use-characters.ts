import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/services/api";
import type { Character } from "@/types/api";
import type { InsertCharacter } from "@/schemas/character";

export function useCharacters() {
  const queryClient = useQueryClient();

  const query = useQuery<Character[]>({
    queryKey: ["characters"],
    queryFn: () => get("/api/characters/"),
  });

  const createCharacter = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      return post("/api/characters/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });

  const updateCharacter = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCharacter> }) => {
      return put(`/api/characters/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });

  const deleteCharacter = useMutation({
    mutationFn: async (id: number) => {
      return del(`/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });

  return {
    ...query,
    createCharacter,
    updateCharacter,
    deleteCharacter,
  };
}
