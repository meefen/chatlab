import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft, Send, Play, Download } from "lucide-react";
import { CharacterCard } from "@/components/character-card";
import { CharacterModal } from "@/components/character-modal";
import { Sidebar } from "@/components/Sidebar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useCharacters } from "@/hooks/use-characters";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/context/AuthContext";
import { get } from "@/services/api";
import type { Character, ConversationWithMessages } from "@/types/api";
import ExportModal from "@/components/ExportModal";

type ViewState = 'welcome' | 'selection' | 'setup' | 'discussion';

export default function Home() {
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [viewState, setViewState] = useState<ViewState>('welcome');
  const [showExportModal, setShowExportModal] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [discussionTopic, setDiscussionTopic] = useState("");

  const { data: characters = [], isLoading: charactersLoading } = useCharacters();
  const { 
    data: conversations = [], 
    createConversation, 
    generateResponse, 
    addUserMessage,
    deleteConversation
  } = useConversations();

  // All characters returned by the API are already filtered on the backend
  const availableCharacters = characters;
  const selectedCharacters = characters.filter(c => selectedCharacterIds.has(c.id));

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setIsCharacterModalOpen(true);
  };

  const { user } = useAuth();

  const handleEditCharacter = (character: Character) => {
    // Only allow editing of user's own characters
    // Note: This comparison needs proper user database ID mapping
    // For now, we'll check if the character has a created_by_id (user-created) 
    // and assume the current user can edit it if logged in
    if (user && character.created_by_id) {
      setEditingCharacter(character);
      setIsCharacterModalOpen(true);
    }
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

  const handleStartNewConversation = async () => {
    if (selectedCharacters.length < 1 || !discussionTopic.trim()) {
      return;
    }

    try {
      const conversation = await createConversation.mutateAsync({
        title: discussionTopic.trim(),
        participant_ids: selectedCharacters.map(c => c.id),
      });

      // Fetch the full conversation with messages
      const fullConversation = await get(`/api/conversations/${conversation.id}`);
      setCurrentConversation(fullConversation);
      setViewState('discussion');
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleSendPrompt = async () => {
    if (!currentConversation || !userPrompt.trim()) return;

    try {
      setIsGenerating(true);
      
      // Add user prompt as message
      const nextTurn = Math.max(...(currentConversation.messages?.map(m => m.turn_number) || [0]), 0) + 1;
      await addUserMessage.mutateAsync({
        conversationId: currentConversation.id,
        content: userPrompt.trim(),
        turnNumber: nextTurn,
      });

      setUserPrompt("");
      
      // Refresh conversation
      const updatedConversation = await get(`/api/conversations/${currentConversation.id}`);
      setCurrentConversation(updatedConversation);
    } catch (error) {
      console.error("Failed to send prompt:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextResponse = async (characterId?: number) => {
    if (!currentConversation || (currentConversation.participants?.length || 0) === 0) return;

    try {
      setIsGenerating(true);
      
      // Determine next character (simple round-robin or specific character)
      let nextCharacter;
      if (characterId) {
        nextCharacter = currentConversation.participants?.find(p => p.id === characterId);
      } else {
        const currentTurnIndex = currentConversation.current_turn % (currentConversation.participants?.length || 1);
        nextCharacter = currentConversation.participants?.[currentTurnIndex];
      }

      if (!nextCharacter) return;

      // Determine what prompt to use for AI
      const recentUserPrompts = currentConversation.messages
        ?.filter(m => m.is_user_prompt)
        .sort((a, b) => b.turn_number - a.turn_number);
      
      // If no user messages yet, use the discussion topic from the conversation title
      const userPrompt = recentUserPrompts && recentUserPrompts.length > 0 
        ? recentUserPrompts[0].content 
        : currentConversation.title || "Please share your thoughts on the topic being discussed.";

      await generateResponse.mutateAsync({
        conversationId: currentConversation.id,
        characterId: nextCharacter.id,
        userPrompt: userPrompt,
      });

      // Refresh conversation
      const updatedConversation = await get(`/api/conversations/${currentConversation.id}`);
      setCurrentConversation(updatedConversation);
    } catch (error) {
      console.error("Failed to generate next turn:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConversationSelect = async (conversationId: number) => {
    try {
      const conversation = await get(`/api/conversations/${conversationId}`);
      setCurrentConversation(conversation);
      setViewState('discussion');
      
      // Set selected characters to match the conversation participants
      const participantIds = new Set<number>(conversation.participants?.map((p: any) => p.id) || []);
      setSelectedCharacterIds(participantIds);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversation.mutateAsync(conversationId);
      // If the deleted conversation was currently selected, go back to welcome
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setViewState('welcome');
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setSelectedCharacterIds(new Set());
    setDiscussionTopic("");
    setUserPrompt("");
    setViewState('selection');
  };

  const getNextCharacter = () => {
    if (!currentConversation?.participants?.length) return null;
    const currentIndex = currentConversation.current_turn % currentConversation.participants.length;
    return currentConversation.participants[currentIndex];
  };

  // Main content renderer
  const renderMainContent = () => {
    switch (viewState) {
      case 'welcome':
        return <WelcomeScreen />;
      
      case 'selection':
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Select Characters</h2>
                  <p className="text-gray-600 mt-1">Choose 1 or more educational theorists to join your conversation</p>
                </div>
                <Button onClick={handleCreateCharacter} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Character
                </Button>
              </div>

              {/* Selection Status */}
              {selectedCharacters.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Selected Characters ({selectedCharacters.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacters.map(character => (
                      <span key={character.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {character.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Character Grid */}
              {charactersLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading characters...</p>
                </div>
              ) : availableCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No educational theorists available.</p>
                  <Button onClick={handleCreateCharacter} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Theorist
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {availableCharacters.map(character => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onEdit={() => handleEditCharacter(character)}
                      isSelected={selectedCharacterIds.has(character.id)}
                      onToggleSelection={() => handleToggleCharacterSelection(character.id)}
                      showSelection={true}
                    />
                  ))}
                </div>
              )}

              {/* Continue Button */}
              {selectedCharacters.length > 0 && (
                <div className="text-center">
                  <Button
                    onClick={() => setViewState('setup')}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Topic Setup
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Discussion Setup</h2>
                  <p className="text-gray-600">Set the topic for your conversation</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setViewState('selection')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* Selected Characters Display */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Characters</h3>
                <div className="flex flex-wrap gap-4">
                  {selectedCharacters.map((character, index) => (
                    <div key={character.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {index === 0 ? '🎓' : index === 1 ? '🌱' : index === 2 ? '📚' : '🔬'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{character.name}</p>
                        <p className="text-sm text-gray-600">{character.personality?.slice(0, 50)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discussion Topic</h3>
                <Textarea
                  placeholder="Enter the topic or question you'd like the theorists to discuss. For example: 'How should we approach personalized learning in the digital age?'"
                  value={discussionTopic}
                  onChange={(e) => setDiscussionTopic(e.target.value)}
                  className="min-h-[120px] mb-4"
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleStartNewConversation}
                    disabled={!discussionTopic.trim()}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Launch Discussion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'discussion':
        if (!currentConversation) return <WelcomeScreen />;
        
        const nextCharacter = getNextCharacter();

        return (
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{currentConversation.title}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex -space-x-1">
                      {currentConversation.participants?.map((participant, index) => (
                        <div
                          key={participant.id}
                          className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-700"
                          title={participant.name}
                        >
                          {index === 0 ? '🎓' : index === 1 ? '🌱' : index === 2 ? '📚' : '🔬'}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{currentConversation.participants?.length || 0} participants</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.messages
                ?.sort((a, b) => a.turn_number - b.turn_number)
                .map((message) => (
                <div 
                  key={message.id}
                  className={message.is_user_prompt 
                    ? "bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg"
                    : "bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">
                      {message.is_user_prompt ? "🎓" : "💬"}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {message.character?.name || "You"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{message.content}</p>
                </div>
              ))}
              
              {isGenerating && (
                <div className="bg-gray-100 border-l-4 border-gray-400 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🤔</div>
                    <span className="font-semibold text-gray-600">Thinking...</span>
                  </div>
                  <p className="text-gray-600 italic">Generating response...</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Add your thoughts or questions to guide the discussion..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="flex-1 min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendPrompt}
                      disabled={!userPrompt.trim() || isGenerating}
                      className="px-6"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>

                {/* Next Response Button */}
                {nextCharacter && (
                  <Button
                    onClick={() => handleNextResponse(nextCharacter.id)}
                    disabled={isGenerating}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Get Response from {nextCharacter.name}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewChat={handleNewChat}
        onConversationSelect={handleConversationSelect}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content */}
      {renderMainContent()}

      {/* Character Modal */}
      <CharacterModal
        open={isCharacterModalOpen}
        onOpenChange={setIsCharacterModalOpen}
        character={editingCharacter}
      />

      {/* Export Modal */}
      {currentConversation && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          conversation={currentConversation}
        />
      )}
    </div>
  );
}