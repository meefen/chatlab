import { Edit, Globe, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Character } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

interface CharacterCardProps {
  character: Character;
  onEdit: () => void;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showSelection?: boolean;
}

export function CharacterCard({ 
  character, 
  onEdit, 
  isSelected = false, 
  onToggleSelection, 
  showSelection = false 
}: CharacterCardProps) {
  const { user } = useAuth();
  
  // Determine character type
  const isBuiltIn = character.created_by_id === null;
  // Note: This comparison needs proper user database ID mapping
  // For now, we'll assume user can edit if they're logged in and character has created_by_id
  const isOwnedByUser = user && character.created_by_id !== null;
  const isPublic = character.is_public;
  
  // Get creator's first name for display
  const getCreatorFirstName = () => {
    if (!character.created_by?.full_name) return null;
    return character.created_by.full_name.split(' ')[0];
  };
  
  const getCharacterTypeInfo = () => {
    if (isBuiltIn) {
      return {
        icon: Star,
        label: "Built-in",
        color: "bg-yellow-100 text-yellow-800",
        iconColor: "text-yellow-600"
      };
    } else if (isPublic) {
      return {
        icon: Globe,
        label: "Public",
        color: "bg-green-100 text-green-800",
        iconColor: "text-green-600"
      };
    } else {
      return {
        icon: Lock,
        label: "Private",
        color: "bg-gray-100 text-gray-800",
        iconColor: "text-gray-600"
      };
    }
  };
  
  const typeInfo = getCharacterTypeInfo();
  const IconComponent = typeInfo.icon;
  
  return (
    <div className={`bg-gray-50 rounded-lg p-4 border transition-colors ${
      isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary'
    }`}>
      <div className="flex items-start space-x-3">
        {showSelection && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="mt-2"
          />
        )}
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-medium text-gray-700 flex-shrink-0">
          {character.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{character.name}</h3>
          <p className="text-sm text-gray-600 truncate">{character.role}</p>
          
          {/* Creator info for public characters */}
          {isPublic && !isBuiltIn && getCreatorFirstName() && (
            <p className="text-xs text-gray-500 mt-1">
              by {getCreatorFirstName()}
            </p>
          )}
          
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
              <IconComponent className={`w-3 h-3 mr-1 ${typeInfo.iconColor}`} />
              {typeInfo.label}
            </span>
          </div>
        </div>
        {/* Only show edit button for user's own characters */}
        {isOwnedByUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
