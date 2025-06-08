import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Save, Settings, Forward, Trash2, Download } from "lucide-react";
import { CharacterCard } from "@/components/character-card";
import { CharacterModal } from "@/components/character-modal";
import { ConversationDisplay } from "@/components/conversation-display";
import { useCharacters } from "@/hooks/use-characters";
import { useConversations } from "@/hooks/use-conversations";
import type { Character, ConversationWithMessages } from "@shared/schema";

export default function Home() {
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: characters = [], isLoading: charactersLoading } = useCharacters();
  const { 
    data: conversations = [], 
    createConversation, 
    generateResponse, 
    addUserMessage,
    generateTitle 
  } = useConversations();

  const activeCharacters = characters.filter(c => c.isActive);

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setIsCharacterModalOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsCharacterModalOpen(true);
  };

  const handleStartConversation = async () => {
    if (activeCharacters.length < 2) {
      return;
    }

    try {
      const conversation = await createConversation.mutateAsync({
        title: "New Conversation",
        participantIds: activeCharacters.map(c => c.id),
        isAutonomous: false,
        currentTurn: 0,
      });

      // Fetch the full conversation with messages
      const fullConversation = await fetch(`/api/conversations/${conversation.id}`).then(r => r.json());
      setCurrentConversation(fullConversation);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleSendPrompt = async () => {
    if (!currentConversation || !userPrompt.trim()) return;

    try {
      setIsGenerating(true);
      
      // Add user prompt as message
      const nextTurn = Math.max(...currentConversation.messages.map(m => m.turnNumber), 0) + 1;
      await addUserMessage.mutateAsync({
        conversationId: currentConversation.id,
        content: userPrompt.trim(),
        turnNumber: nextTurn,
      });

      // Generate title if this is the first message
      if (currentConversation.messages.length === 0) {
        await generateTitle.mutateAsync(currentConversation.id);
      }

      setUserPrompt("");
      
      // Refresh conversation
      const updatedConversation = await fetch(`/api/conversations/${currentConversation.id}`).then(r => r.json());
      setCurrentConversation(updatedConversation);
    } catch (error) {
      console.error("Failed to send prompt:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextTurn = async () => {
    if (!currentConversation || currentConversation.participants.length === 0) return;

    try {
      setIsGenerating(true);
      
      // Determine next character (simple round-robin)
      const currentTurnIndex = currentConversation.currentTurn % currentConversation.participants.length;
      const nextCharacter = currentConversation.participants[currentTurnIndex];

      await generateResponse.mutateAsync({
        conversationId: currentConversation.id,
        characterId: nextCharacter.id,
      });

      // Refresh conversation
      const updatedConversation = await fetch(`/api/conversations/${currentConversation.id}`).then(r => r.json());
      setCurrentConversation(updatedConversation);
    } catch (error) {
      console.error("Failed to generate next turn:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConversationSelect = async (conversationId: number) => {
    try {
      const conversation = await fetch(`/api/conversations/${conversationId}`).then(r => r.json());
      setCurrentConversation(conversation);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">DialogueCraft</h1>
          <p className="text-sm text-gray-600 mt-1">AI Character Conversations</p>
        </div>

        {/* Character Management */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Characters</h2>
            <Button
              onClick={handleCreateCharacter}
              size="sm"
              className="bg-primary hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {charactersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No characters created yet</p>
              <Button onClick={handleCreateCharacter} variant="outline">
                Create your first character
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {characters.map(character => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onEdit={() => handleEditCharacter(character)}
                />
              ))}
            </div>
          )}

          {/* Start Conversation Button */}
          {activeCharacters.length >= 2 && (
            <div className="mt-6">
              <Button
                onClick={handleStartConversation}
                className="w-full bg-accent hover:bg-green-600"
                disabled={createConversation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          )}

          {/* Conversation History */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h2>
            
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className="bg-white rounded-lg p-3 border border-gray-200 hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{conversation.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {conversation.participantIds.length} participants
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentConversation.title}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">Participants:</span>
                    <div className="flex -space-x-1">
                      {currentConversation.participants.map(participant => (
                        <div
                          key={participant.id}
                          className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                          title={participant.name}
                        >
                          {participant.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{currentConversation.participants.length} active</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleNextTurn}
                    disabled={isGenerating || currentConversation.participants.length === 0}
                    className="bg-accent hover:bg-green-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Auto Mode
                  </Button>
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conversation Display */}
            <ConversationDisplay
              conversation={currentConversation}
              isGenerating={isGenerating}
            />

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a prompt to guide the conversation, or let the characters continue autonomously..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleSendPrompt}
                    disabled={!userPrompt.trim() || isGenerating}
                    className="bg-primary hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleNextTurn}
                    disabled={isGenerating || currentConversation.participants.length === 0}
                    variant="outline"
                  >
                    <Forward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Conversation Controls */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Turn {currentConversation.currentTurn} of ongoing conversation</span>
                  <span>•</span>
                  <span>{currentConversation.messages.length} messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to DialogueCraft</h3>
              <p className="text-gray-600 mb-6">Create characters and start a conversation to begin</p>
              {activeCharacters.length < 2 ? (
                <p className="text-sm text-gray-500">You need at least 2 active characters to start a conversation</p>
              ) : (
                <Button onClick={handleStartConversation} className="bg-primary hover:bg-blue-600">
                  <Play className="w-4 h-4 mr-2" />
                  Start Conversation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Character Modal */}
      <CharacterModal
        open={isCharacterModalOpen}
        onOpenChange={setIsCharacterModalOpen}
        character={editingCharacter}
      />
    </div>
  );
}
