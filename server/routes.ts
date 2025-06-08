import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateCharacterResponse, generateConversationTitle } from "./openai";
import { insertCharacterSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Character routes
  app.get("/api/characters", async (req, res) => {
    try {
      const characters = await storage.getCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.get("/api/characters/active", async (req, res) => {
    try {
      const characters = await storage.getActiveCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active characters" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      res.status(400).json({ message: "Invalid character data" });
    }
  });

  app.put("/api/characters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCharacterSchema.partial().parse(req.body);
      const character = await storage.updateCharacter(id, updates);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(400).json({ message: "Invalid character data" });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCharacter(id);
      if (!deleted) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data" });
    }
  });

  // Message routes
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // AI response generation
  app.post("/api/conversations/:id/generate-response", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { characterId, userPrompt } = req.body;

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Build conversation history
      const conversationHistory = conversation.messages
        .map(msg => {
          if (msg.isUserPrompt) {
            return `User: ${msg.content}`;
          } else if (msg.character) {
            return `${msg.character.name}: ${msg.content}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      // Generate AI response
      const aiResponse = await generateCharacterResponse(
        character.name,
        character.personality,
        conversationHistory,
        userPrompt
      );

      // Save the response as a message
      const nextTurn = Math.max(...conversation.messages.map(m => m.turnNumber), 0) + 1;
      const message = await storage.createMessage({
        conversationId,
        characterId,
        content: aiResponse.content,
        isUserPrompt: false,
        turnNumber: nextTurn,
      });

      // Update conversation's current turn
      await storage.updateConversation(conversationId, {
        currentTurn: nextTurn,
      });

      res.json({ message, shouldContinue: aiResponse.shouldContinue });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  // Auto-generate conversation title
  app.post("/api/conversations/:id/generate-title", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.messages.length === 0) {
        return res.status(404).json({ message: "Conversation not found or empty" });
      }

      const firstMessages = conversation.messages
        .slice(0, 3)
        .map(msg => {
          if (msg.character) {
            return `${msg.character.name}: ${msg.content}`;
          }
          return `User: ${msg.content}`;
        })
        .join("\n");

      const title = await generateConversationTitle(firstMessages);
      
      const updatedConversation = await storage.updateConversation(conversationId, { title });
      res.json({ title });
    } catch (error) {
      console.error("Error generating title:", error);
      res.status(500).json({ message: "Failed to generate conversation title" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
