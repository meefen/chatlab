import React from 'react'
import { useAuth } from '@/context/AuthContext'

export function WelcomeScreen() {
  const { user } = useAuth()
  
  // Extract first name from user metadata or email
  const getFirstName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="max-w-2xl mx-auto text-center px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Hello, {getFirstName()}
          </h1>
          
          <div className="text-lg text-gray-600 space-y-4">
            <p>
              Welcome to ChatLab, where you can engage in thoughtful discussions 
              with some of history's most influential educational theorists.
            </p>
            
            <p>
              Select educational thinkers like Dewey, Montessori, Piaget, Vygotsky, 
              or Freire, set a discussion topic, and watch as they engage in 
              collaborative dialogue based on their key educational philosophies.
            </p>
            
            <p className="text-base text-gray-500 mt-6">
              Click <strong>"New Chat"</strong> in the sidebar to start your first conversation.
            </p>
          </div>
        </div>
        
        {/* Optional: Add some visual elements */}
        <div className="flex justify-center space-x-8 text-6xl opacity-20">
          <span>🎓</span>
          <span>🌱</span>
          <span>📚</span>
          <span>🔬</span>
        </div>
      </div>
    </div>
  )
}