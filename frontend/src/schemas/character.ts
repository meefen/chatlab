import { z } from "zod";

export const insertCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  personality: z.string().min(1, "Personality is required"),
  avatar_url: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;