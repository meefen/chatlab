import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, History, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { UserMenu } from '@/components/auth/UserMenu'
import ConversationCard from '@/components/ConversationCard'
import type { Conversation, ConversationWithMessages } from '@/types/api'

interface SidebarProps {
  conversations: Conversation[]
  currentConversation: ConversationWithMessages | null
  onNewChat: () => void
  onConversationSelect: (conversationId: number) => void
  onDeleteConversation: (conversationId: number) => void
}

export function Sidebar({ 
  conversations, 
  currentConversation, 
  onNewChat, 
  onConversationSelect, 
  onDeleteConversation 
}: SidebarProps) {
  const { user } = useAuth()

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">ChatLab</h1>
          <UserMenu />
        </div>
        
        {/* New Chat Button */}
        <Button 
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Recent Chats</span>
          </div>
          
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                    currentConversation?.id === conversation.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.participant_ids?.length || 0} participants
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Delete button - only show on hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}