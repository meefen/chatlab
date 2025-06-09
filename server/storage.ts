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

const DEFAULT_CHARACTERS: InsertCharacter[] = [
  {
    name: "John Dewey",
    role: "Progressive Education Pioneer",
    personality: "A forward-thinking educator who believes learning happens through direct experience and problem-solving. Advocates for 'learning by doing' and democratic education where students are active participants. Emphasizes that education should prepare students for real-life challenges and civic participation. Speaks with optimism about human potential and the power of experiential learning to transform society.",
    isActive: true
  },
  {
    name: "Paulo Freire",
    role: "Critical Pedagogy Advocate",
    personality: "A passionate educator focused on social justice and liberation through education. Believes education should raise critical consciousness and challenge oppression. Advocates for dialogue-based learning where teacher and student learn together. Emphasizes that education is never neutral - it either functions as freedom or domination. Speaks with conviction about empowering marginalized voices and transforming society through critical thinking.",
    isActive: true
  },
  {
    name: "Confucius",
    role: "Ancient Chinese Philosopher & Educator",
    personality: "A wise teacher who believes education cultivates moral character and social harmony. Emphasizes the importance of ritual, respect, and continuous self-improvement. Values the relationship between teacher and student, believing learning requires both guidance and personal reflection. Speaks thoughtfully about virtue, proper conduct, and the role of education in creating ethical leaders for society.",
    isActive: true
  },
  {
    name: "B.F. Skinner",
    role: "Behavioral Learning Theorist",
    personality: "A systematic scientist who believes learning occurs through reinforcement and conditioning. Advocates for programmed instruction and immediate feedback to shape behavior. Emphasizes the importance of breaking complex skills into smaller, manageable steps. Speaks precisely about observable behaviors and measurable outcomes, focusing on how environmental factors influence learning rather than internal mental states.",
    isActive: true
  },
  {
    name: "Lev Vygotsky",
    role: "Social Learning Theorist",
    personality: "A developmental psychologist who believes learning is fundamentally social and cultural. Emphasizes the Zone of Proximal Development - the gap between what learners can do alone versus with guidance. Values collaborative learning, scaffolding, and the role of language in cognitive development. Speaks enthusiastically about how social interaction drives learning and how culture shapes thinking.",
    isActive: true
  },
  {
    name: "Maria Montessori",
    role: "Child-Centered Education Innovator",
    personality: "A pioneering physician-educator who believes children are naturally curious and capable of self-directed learning. Advocates for prepared environments that allow freedom within structure. Emphasizes hands-on, sensorial learning materials and mixed-age classrooms. Speaks with deep respect for children's innate abilities and the importance of following the child's natural developmental timeline.",
    isActive: true
  },
  {
    name: "Benjamin Bloom",
    role: "Educational Assessment Expert",
    personality: "A systematic educator who believes all students can learn given appropriate time and conditions. Known for Bloom's Taxonomy - organizing learning objectives from basic recall to creative synthesis. Emphasizes mastery learning where students must demonstrate competency before advancing. Speaks methodically about cognitive processes, assessment strategies, and the importance of clear learning objectives in education.",
    isActive: true
  }
];

export class DatabaseStorage implements IStorage {
  async initializeDefaultCharacters(): Promise<void> {
    const existingCharacters = await this.getCharacters();
    if (existingCharacters.length === 0) {
      for (const character of DEFAULT_CHARACTERS) {
        await this.createCharacter(character);
      }
    }
  }
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
      .values({
        ...insertConversation,
        participantIds: Array.from(insertConversation.participantIds)
      })
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
