import React, { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setLocation('/auth')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          setLocation('/')
        } else {
          // No session, redirect to auth
          setLocation('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setLocation('/auth')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

export default AuthCallback