import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CharacterCard } from "@/components/character-card";
import { CharacterModal } from "@/components/character-modal";
import DiscussionSetup from "./discussion-setup";
import Discussion from "./discussion";
import { useCharacters } from "@/hooks/use-characters";
import { useConversations } from "@/hooks/use-conversations";
import type { Character, ConversationWithMessages } from "@/types/api";

type ViewState = 'selection' | 'setup' | 'discussion';

export default function Home() {
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [viewState, setViewState] = useState<ViewState>('selection');

  const { data: characters = [], isLoading: charactersLoading } = useCharacters();
  const { 
    data: conversations = [], 
    createConversation, 
    generateResponse, 
    addUserMessage,
    generateTitle 
  } = useConversations();

  const activeCharacters = characters.filter(c => c.is_active);
  const selectedCharacters = characters.filter(c => selectedCharacterIds.has(c.id));

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setIsCharacterModalOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsCharacterModalOpen(true);
  };

  const handleToggleCharacterSelection = (characterId: number) => {
    setSelectedCharacterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const handleStartConversation = async () => {
    if (selectedCharacters.length < 2) {
      return;
    }

    try {
      const conversation = await createConversation.mutateAsync({
        title: "New Conversation",
        participant_ids: selectedCharacters.map(c => c.id),
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
      const nextTurn = Math.max(...currentConversation.messages.map(m => m.turn_number), 0) + 1;
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
      const currentTurnIndex = currentConversation.current_turn % currentConversation.participants.length;
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
          <h1 className="text-xl font-bold text-gray-900">ChatLab</h1>
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

          {/* Participant Selection */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Select Conversation Participants</h3>
            <p className="text-xs text-blue-700 mb-2">Choose 2 or more characters to include in your conversation</p>
            <div className="text-xs text-blue-600">
              {selectedCharacters.length} selected
              {selectedCharacters.length >= 2 && " • Ready to start conversation"}
            </div>
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
                  showSelection={true}
                  isSelected={selectedCharacterIds.has(character.id)}
                  onToggleSelection={() => handleToggleCharacterSelection(character.id)}
                />
              ))}
            </div>
          )}

          {/* Start Conversation Button */}
          <div className="mt-6">
            <Button
              onClick={handleStartConversation}
              className="w-full bg-accent hover:bg-green-600"
              disabled={selectedCharacters.length < 2 || createConversation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              {selectedCharacters.length < 2 
                ? `Select ${2 - selectedCharacters.length} more character${2 - selectedCharacters.length === 1 ? '' : 's'}` 
                : `Start New Conversation (${selectedCharacters.length} participants)`}
            </Button>
          </div>

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
                          {conversation.participant_ids.length} participants
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.updated_at).toLocaleDateString()}
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
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Export
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
                    placeholder="Add a prompt to guide the conversation, or click 'Next Turn' to let characters continue autonomously..."
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
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSendPrompt}
                    disabled={!userPrompt.trim() || isGenerating}
                    className="bg-primary hover:bg-blue-600"
                    title="Send your prompt to guide the conversation"
                  >
                    Send Prompt
                  </Button>
                  <Button
                    onClick={handleNextTurn}
                    disabled={isGenerating || currentConversation.participants.length === 0}
                    className="bg-accent hover:bg-green-600"
                    title="Let the next character respond autonomously"
                  >
                    Next Turn
                  </Button>
                </div>
              </div>
              
              {/* Button Explanation */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Send Prompt:</strong> Add your input to guide the conversation direction</div>
                  <div><strong>Next Turn:</strong> Let the next character respond autonomously without your input</div>
                </div>
              </div>
              
              {/* Conversation Controls */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Turn {currentConversation.current_turn} of ongoing conversation</span>
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
