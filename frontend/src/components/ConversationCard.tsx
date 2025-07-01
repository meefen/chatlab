import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Users, Calendar } from "lucide-react";
import type { Conversation } from "@/types/api";

interface ConversationCardProps {
  conversation: Conversation;
  onSelect: (id: number) => void;
  onDelete?: (id: number) => void;
  isSelected?: boolean;
}

export default function ConversationCard({ 
  conversation, 
  onSelect, 
  onDelete, 
  isSelected = false 
}: ConversationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection when clicking delete
    
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`group relative bg-white rounded-lg p-4 border transition-all cursor-pointer hover:shadow-sm ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Delete button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}

      {/* Conversation content */}
      <div className="pr-8"> {/* Add right padding for delete button */}
        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
          {conversation.title}
        </h4>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{conversation.participant_ids.length}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Turn {conversation.current_turn}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(conversation.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}