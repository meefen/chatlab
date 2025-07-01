import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import type { ConversationWithMessages } from "@/types/api";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationWithMessages;
}

export default function ExportModal({ isOpen, onClose, conversation }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    const topic = conversation.messages.find(m => m.is_user_prompt)?.content || conversation.title;
    const participants = conversation.participants.map(p => p.name).join(", ");
    
    let markdown = `# Chat Discussion Export\n\n`;
    markdown += `**Topic:** ${topic}\n\n`;
    markdown += `**Participants:** ${participants}\n\n`;
    markdown += `**Date:** ${new Date(conversation.created_at).toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;

    // Sort messages by turn number
    const sortedMessages = conversation.messages.sort((a, b) => a.turn_number - b.turn_number);

    sortedMessages.forEach((message, index) => {
      const speaker = message.character?.name || "You";
      const timestamp = new Date(message.created_at).toLocaleTimeString();
      
      markdown += `## ${speaker} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (index < sortedMessages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    return markdown;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={generateMarkdown()}
            readOnly
            className="h-full min-h-[400px] font-mono text-sm resize-none"
            placeholder="Markdown content will appear here..."
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button onClick={handleDownload}>
            Download as .md file
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}