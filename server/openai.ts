import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-fake-key-for-development"
});

export interface CharacterResponse {
  content: string;
  shouldContinue: boolean;
}

export async function generateCharacterResponse(
  characterName: string,
  characterPersonality: string,
  conversationHistory: string,
  userPrompt?: string
): Promise<CharacterResponse> {
  try {
    const systemPrompt = `You are ${characterName}. ${characterPersonality}

Instructions:
- Stay in character at all times
- Respond naturally as ${characterName} would, considering your personality and expertise
- Keep responses conversational but substantial (2-4 sentences typically)
- Build on previous messages in the conversation
- Ask questions or make points that could lead to interesting dialogue
- Respond in JSON format: {"content": "your response", "shouldContinue": true/false}
- Set shouldContinue to true if the conversation should naturally continue, false if it feels like a natural ending point`;

    let userMessage = `Conversation so far:\n${conversationHistory}`;
    if (userPrompt) {
      userMessage += `\n\nUser prompt: ${userPrompt}`;
    }
    userMessage += `\n\nPlease respond as ${characterName}:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"content": "I need a moment to think.", "shouldContinue": false}');
    
    return {
      content: result.content || "I need a moment to think.",
      shouldContinue: result.shouldContinue !== false,
    };
  } catch (error) {
    console.error("Error generating character response:", error);
    throw new Error(`Failed to generate response for ${characterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateConversationTitle(firstFewMessages: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a concise, engaging title (2-6 words) for this conversation. Respond in JSON format: {\"title\": \"your title\"}"
        },
        {
          role: "user",
          content: `Conversation excerpt:\n${firstFewMessages}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"title": "Untitled Conversation"}');
    return result.title || "Untitled Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "Untitled Conversation";
  }
}
