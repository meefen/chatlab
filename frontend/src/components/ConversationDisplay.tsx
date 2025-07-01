import type { ConversationWithMessages } from "@/types/api";

interface ConversationDisplayProps {
  conversation: ConversationWithMessages;
  isGenerating: boolean;
}

export default function ConversationDisplay({ conversation, isGenerating }: ConversationDisplayProps) {
  // Sort messages by turn number
  const sortedMessages = conversation.messages.sort((a, b) => a.turn_number - b.turn_number);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {sortedMessages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${message.is_user_prompt ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[70%] rounded-lg p-4 ${
              message.is_user_prompt 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium">
                {message.is_user_prompt ? 'You' : message.character?.name || 'Character'}
              </div>
              <div className="text-xs opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      ))}
      
      {isGenerating && (
        <div className="flex justify-start">
          <div className="max-w-[70%] rounded-lg p-4 bg-gray-100 text-gray-900 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium">Thinking...</div>
            </div>
            <div className="text-sm text-gray-600">
              Generating response...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}