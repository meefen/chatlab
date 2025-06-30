import { MessageItem } from "./message-item";
import { Clock } from "lucide-react";
import type { ConversationWithMessages } from "@/types/api";

interface ConversationDisplayProps {
  conversation: ConversationWithMessages;
  isGenerating?: boolean;
}

export function ConversationDisplay({ conversation, isGenerating }: ConversationDisplayProps) {
  if (conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start the Conversation</h3>
          <p className="text-gray-600">Add a prompt below or let the characters begin autonomously</p>
        </div>
      </div>
    );
  }

  const getCurrentTurnCharacter = () => {
    if (conversation.participants.length === 0) return null;
    const currentIndex = conversation.currentTurn % conversation.participants.length;
    return conversation.participants[currentIndex];
  };

  const currentTurnCharacter = getCurrentTurnCharacter();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {conversation.messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {/* Current Turn Indicator */}
      {isGenerating && currentTurnCharacter && (
        <div className="flex items-center justify-center py-4">
          <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {currentTurnCharacter.name} is thinking
            <div className="ml-2 flex space-x-1">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
