import { User } from "lucide-react";
import type { Message, Character } from "@shared/schema";

interface MessageItemProps {
  message: Message & { character?: Character };
}

export function MessageItem({ message }: MessageItemProps) {
  if (message.isUserPrompt) {
    return (
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">You</span>
            <span className="text-xs text-gray-500">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
            <p className="text-gray-800 leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!message.character) {
    return null;
  }

  // Generate color based on character name for consistent styling
  const getCharacterColor = (name: string) => {
    const colors = [
      'bg-blue-50 border-blue-100',
      'bg-purple-50 border-purple-100', 
      'bg-green-50 border-green-100',
      'bg-orange-50 border-orange-100',
      'bg-pink-50 border-pink-100',
      'bg-indigo-50 border-indigo-100',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getCharacterColor(message.character.name);

  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0 mt-1">
        {message.character.name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900">{message.character.name}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <div className={`rounded-lg p-3 border ${colorClass}`}>
          <p className="text-gray-800 leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
