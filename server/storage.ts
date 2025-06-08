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

export class MemStorage implements IStorage {
  private characters: Map<number, Character>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private currentCharacterId: number;
  private currentConversationId: number;
  private currentMessageId: number;

  constructor() {
    this.characters = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.currentCharacterId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
  }

  // Characters
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => c.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.currentCharacterId++;
    const character: Character = {
      ...insertCharacter,
      id,
      createdAt: new Date(),
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: number, updates: Partial<InsertCharacter>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;

    const updated: Character = { ...character, ...updates };
    this.characters.set(id, updated);
    return updated;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    return this.characters.delete(id);
  }

  // Conversations
  async getConversation(id: number): Promise<ConversationWithMessages | undefined> {
    const conversation = this.conversations.get(id);
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
    return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updated: Conversation = { 
      ...conversation, 
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  // Messages
  async getMessages(conversationId: number): Promise<(Message & { character?: Character })[]> {
    const conversationMessages = Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.turnNumber - b.turnNumber);

    return Promise.all(
      conversationMessages.map(async (message) => ({
        ...message,
        character: message.characterId ? await this.getCharacter(message.characterId) : undefined,
      }))
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);

    // Update conversation's updatedAt timestamp
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      this.conversations.set(insertMessage.conversationId, {
        ...conversation,
        updatedAt: new Date(),
      });
    }

    return message;
  }
}

export const storage = new MemStorage();
