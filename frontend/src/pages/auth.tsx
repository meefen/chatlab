import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'
import { useLocation, useRoute } from 'wouter'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [, setLocation] = useLocation()
  const { user } = useAuth()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      setLocation('/')
    }
  }, [user, setLocation])

  const handleSuccess = () => {
    setLocation('/')
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        ) : (
          <SignUpForm onToggleMode={toggleMode} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}

export default AuthPage