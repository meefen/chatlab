import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, RotateCcw, Send, Play } from "lucide-react";
import type { Character, ConversationWithMessages } from "@/types/api";

interface DiscussionProps {
  conversation: ConversationWithMessages;
  onNewDiscussion: () => void;
  onSendMessage: (message: string) => void;
  onNextResponse: (characterId: number) => void;
  isGenerating: boolean;
}

export default function Discussion({ 
  conversation, 
  onNewDiscussion, 
  onSendMessage, 
  onNextResponse,
  isGenerating 
}: DiscussionProps) {
  const [userInput, setUserInput] = useState("");

  const handleSend = () => {
    if (userInput.trim()) {
      onSendMessage(userInput.trim());
      setUserInput("");
    }
  };

  const getNextCharacter = () => {
    if (!conversation.participants.length) return null;
    const currentIndex = conversation.current_turn % conversation.participants.length;
    return conversation.participants[currentIndex];
  };

  const nextCharacter = getNextCharacter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Discussion in Progress</h1>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={onNewDiscussion}
              variant="secondary" 
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Discussion Topic */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Discussion Topic:</h3>
          <p className="text-blue-800">
            {conversation.messages.find(m => m.is_user_prompt)?.content || conversation.title}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {conversation.messages
            .sort((a, b) => a.turn_number - b.turn_number)
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
                  {message.is_user_prompt ? "💬" : "🎓"}
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
        <div className="space-y-4">
          <div className="flex gap-3">
            <Textarea
              placeholder="Add your thoughts or questions to guide the discussion..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={!userInput.trim() || isGenerating}
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
              onClick={() => onNextResponse(nextCharacter.id)}
              disabled={isGenerating}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="w-5 h-5 mr-2" />
              Get Response from {nextCharacter.name}
            </Button>
          )}

          {/* Discussion Panel */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Current Discussion Panel:</p>
            <div className="flex gap-3 justify-center">
              {conversation.participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    participant.id === nextCharacter?.id
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="mr-2">{index === 0 ? '🎓' : '🌱'}</span>
                  {participant.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}