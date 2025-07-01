import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CharacterCard } from "@/components/character-card";
import { CharacterModal } from "@/components/character-modal";
import { UserMenu } from "@/components/auth/UserMenu";
import DiscussionSetup from "./discussion-setup";
import Discussion from "./discussion";
import { useCharacters } from "@/hooks/use-characters";
import { useConversations } from "@/hooks/use-conversations";
import { get } from "@/services/api";
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
  const { createConversation, generateResponse, addUserMessage } = useConversations();

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

  const handleProceedToSetup = () => {
    if (selectedCharacters.length >= 2) {
      setViewState('setup');
    }
  };

  const handleBackToSelection = () => {
    setViewState('selection');
  };

  const handleLaunchDiscussion = async (topic: string) => {
    try {
      const conversation = await createConversation.mutateAsync({
        title: topic,
        participant_ids: selectedCharacters.map(c => c.id),
      });

      // Create conversation object without any initial messages
      const newConversation: ConversationWithMessages = {
        ...conversation,
        messages: [], // Start with empty messages array
        participants: selectedCharacters,
      };

      setCurrentConversation(newConversation);
      setViewState('discussion');
    } catch (error) {
      console.error("Failed to launch discussion:", error);
    }
  };

  const handleNewDiscussion = () => {
    setCurrentConversation(null);
    setSelectedCharacterIds(new Set());
    setViewState('selection');
  };

  const handleSendMessage = async (message: string) => {
    if (!currentConversation) return;
    
    try {
      // Add user message to the conversation
      const nextTurn = Math.max(...currentConversation.messages.map(m => m.turn_number), 0) + 1;
      
      console.log("Sending user message:", {
        conversationId: currentConversation.id,
        content: message,
        turnNumber: nextTurn,
      });
      
      // Save to database first
      const result = await addUserMessage.mutateAsync({
        conversationId: currentConversation.id,
        content: message,
        turnNumber: nextTurn,
      });
      
      console.log("User message saved:", result);

      // Refresh the conversation to get the saved message
      const updatedConversation = await get(`/api/conversations/${currentConversation.id}`);
      console.log("Updated conversation:", updatedConversation);
      setCurrentConversation(updatedConversation);
      
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(`Failed to send message: ${error}`);
    }
  };

  const handleNextResponse = async (characterId: number) => {
    if (!currentConversation) return;
    setIsGenerating(true);
    
    try {
      // Find the most recent user prompt to use as context
      const recentUserPrompts = currentConversation.messages
        .filter(m => m.is_user_prompt)
        .sort((a, b) => b.turn_number - a.turn_number);
      
      // If no user messages yet, use the discussion topic from the conversation title
      const mostRecentPrompt = recentUserPrompts.length > 0 
        ? recentUserPrompts[0].content 
        : currentConversation.title || "Please share your thoughts on the topic being discussed.";

      console.log("Using prompt for AI:", mostRecentPrompt);

      // Generate response using the real API with the most recent user input or topic
      const result = await generateResponse.mutateAsync({
        conversationId: currentConversation.id,
        characterId,
        userPrompt: mostRecentPrompt,
      });

      // Refresh the conversation to get the new message
      const updatedConversation = await get(`/api/conversations/${currentConversation.id}`);
      setCurrentConversation(updatedConversation);
      
    } catch (error) {
      console.error("Failed to generate response:", error);
      // Show user-friendly error message
      alert("Failed to generate response. Please try again.");
    }
    
    setIsGenerating(false);
  };

  // Render based on view state
  if (viewState === 'setup') {
    return (
      <DiscussionSetup
        selectedCharacters={selectedCharacters}
        onBack={handleBackToSelection}
        onLaunch={handleLaunchDiscussion}
      />
    );
  }

  if (viewState === 'discussion' && currentConversation) {
    return (
      <Discussion
        conversation={currentConversation}
        onNewDiscussion={handleNewDiscussion}
        onSendMessage={handleSendMessage}
        onNextResponse={handleNextResponse}
        isGenerating={isGenerating}
      />
    );
  }

  // Character selection view
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ChatLab</h1>
            <p className="text-xl text-gray-600">Invite educators to chat</p>
          </div>
          <div className="ml-4">
            <UserMenu />
          </div>
        </div>

        {/* Character Management */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Educators</h2>
            <Button
              onClick={handleCreateCharacter}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Participant Selection */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Select Participants</h3>
            <p className="text-sm text-blue-700 mb-2">Choose 2 or more educators to include in your conversation</p>
            <div className="text-sm text-blue-600">
              {selectedCharacters.length} selected
              {selectedCharacters.length >= 2 && " • Ready to start conversation"}
            </div>
          </div>

          {charactersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleProceedToSetup}
              disabled={selectedCharacters.length < 2}
              size="lg"
              className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700"
            >
              {selectedCharacters.length < 2 
                ? `Select ${2 - selectedCharacters.length} more character${2 - selectedCharacters.length === 1 ? '' : 's'}` 
                : `Continue with ${selectedCharacters.length} participants`}
            </Button>
          </div>
        </div>
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