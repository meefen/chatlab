import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCharacterSchema, type InsertCharacter } from "@/schemas/character";
import { type Character } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, User, Upload } from "lucide-react";
import { useCharacters } from "@/hooks/use-characters";
import { useToast } from "@/hooks/use-toast";

interface CharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character?: Character | null;
}

export function CharacterModal({ open, onOpenChange, character }: CharacterModalProps) {
  const { createCharacter, updateCharacter } = useCharacters();
  const { toast } = useToast();
  
  const form = useForm<InsertCharacter>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      role: "",
      personality: "",
      avatar_url: "",
      is_public: false,
    },
  });

  useEffect(() => {
    if (character) {
      form.reset({
        name: character.name,
        role: character.role,
        personality: character.personality,
        avatar_url: character.avatar_url || "",
        is_public: character.is_public,
      });
    } else {
      form.reset({
        name: "",
        role: "",
        personality: "",
        avatar_url: "",
        is_public: false,
      });
    }
  }, [character, form]);

  const onSubmit = async (data: InsertCharacter) => {
    try {
      if (character) {
        await updateCharacter.mutateAsync({ id: character.id, data });
        toast({
          title: "Character updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        await createCharacter.mutateAsync(data);
        toast({
          title: "Character created",
          description: `${data.name} has been created successfully.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save character. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle>
            {character ? "Edit Educator" : "Add New Educator"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Albert Einstein" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role/Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Theoretical Physicist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality & Background</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the character's personality, expertise, speaking style, and background. This will guide how they participate in conversations..."
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar Image</FormLabel>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <FormControl>
                      <Input placeholder="Image URL (optional)" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Make Public</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Public characters can be used by other users
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-blue-600"
                disabled={createCharacter.isPending || updateCharacter.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {character ? "Update" : "Create"} Character
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
