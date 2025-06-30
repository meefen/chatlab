import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Character } from "@/types/api";

interface DiscussionSetupProps {
  selectedCharacters: Character[];
  onBack: () => void;
  onLaunch: (topic: string) => void;
}

export default function DiscussionSetup({ selectedCharacters, onBack, onLaunch }: DiscussionSetupProps) {
  const [topic, setTopic] = useState("");

  const handleLaunch = () => {
    if (topic.trim()) {
      onLaunch(topic.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discussion Setup</h1>
          <p className="text-xl text-gray-600">Set the topic to launch your discussion</p>
        </div>

        {/* Selected Theorists */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Selected Theorists:</h2>
          <div className="flex gap-6 justify-center">
            {selectedCharacters.map((character, index) => (
              <div 
                key={character.id}
                className={`p-6 rounded-xl ${
                  index === 0 ? 'bg-blue-100' : 'bg-green-100'
                } min-w-[200px] text-center`}
              >
                <div className="text-3xl mb-2">
                  {index === 0 ? '🎓' : '🌱'}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{character.name}</h3>
                <p className="text-sm text-gray-600">1859-1952</p>
              </div>
            ))}
          </div>
        </div>

        {/* Discussion Topic */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Discussion Topic:</h2>
          <Textarea
            placeholder="e.g., What is the most effective way to teach critical thinking to elementary students?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[150px] text-lg p-4 border-2 border-gray-200 rounded-xl resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Selection
          </Button>
          <Button
            onClick={handleLaunch}
            disabled={!topic.trim()}
            size="lg"
            className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Launch Discussion
          </Button>
        </div>
      </div>
    </div>
  );
}