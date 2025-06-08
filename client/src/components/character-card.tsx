import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Character } from "@shared/schema";

interface CharacterCardProps {
  character: Character;
  onEdit: () => void;
}

export function CharacterCard({ character, onEdit }: CharacterCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary transition-colors">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-medium text-gray-700 flex-shrink-0">
          {character.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{character.name}</h3>
          <p className="text-sm text-gray-600 truncate">{character.role}</p>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              character.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                character.isActive ? 'bg-green-400' : 'bg-gray-400'
              }`}></span>
              {character.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 text-gray-400 hover:text-gray-600"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
