import { 
  characters, 
  conversations, 
  messages,
  type Character, 
  type InsertCharacter,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ConversationWithMessages
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Characters
  getCharacter(id: number): Promise<Character | undefined>;
  getCharacters(): Promise<Character[]>;
  getActiveCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;

  // Conversations
  getConversation(id: number): Promise<ConversationWithMessages | undefined>;
  getConversations(): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;

  // Messages
  getMessages(conversationId: number): Promise<(Message & { character?: Character })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(characters.createdAt);
  }

  async getActiveCharacters(): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.isActive, true)).orderBy(characters.createdAt);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }

  async updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return character || undefined;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    const result = await db.delete(characters).where(eq(characters.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getConversation(id: number): Promise<ConversationWithMessages | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation) return undefined;

    const conversationMessages = await this.getMessages(id);
    const participants = await Promise.all(
      conversation.participantIds.map(async (pid) => await this.getCharacter(pid))
    );

    return {
      ...conversation,
      messages: conversationMessages,
      participants: participants.filter(Boolean) as Character[],
    };
  }

  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(conversations.updatedAt);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async getMessages(conversationId: number): Promise<(Message & { character?: Character })[]> {
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.turnNumber);

    return Promise.all(
      conversationMessages.map(async (message) => ({
        ...message,
        character: message.characterId ? await this.getCharacter(message.characterId) : undefined,
      }))
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, insertMessage.conversationId));

    return message;
  }
}

export const storage = new DatabaseStorage();
