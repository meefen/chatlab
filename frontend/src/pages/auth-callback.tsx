import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const [, setLocation] = useLocation()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    let subscription: any
    
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded')
        console.log('Current URL:', window.location.href)
        
        // Listen for auth state changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email)
            setIsProcessing(false)
            
            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in successfully')
              setLocation('/')
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, redirecting to auth')
              setLocation('/auth')
            }
          }
        )
        
        subscription = authSubscription

        // Handle OAuth callback URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        console.log('URL params:', Object.fromEntries(urlParams.entries()))
        console.log('Hash params:', Object.fromEntries(hashParams.entries()))
        
        // Check for OAuth errors first
        const error = urlParams.get('error') || hashParams.get('error')
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')
        
        if (error) {
          console.error('OAuth error:', {
            error,
            errorCode,
            errorDescription: decodeURIComponent(errorDescription || '')
          })
          
          // Store error info for display on auth page
          sessionStorage.setItem('oauth_error', JSON.stringify({
            error,
            errorCode,
            errorDescription: decodeURIComponent(errorDescription || '')
          }))
          
          setLocation('/auth')
          return
        }

        // Check if there's already a session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setLocation('/auth')
          return
        }

        if (data.session) {
          console.log('Existing session found')
          setLocation('/')
        } else {
          // Wait a bit longer for OAuth callback to process
          setTimeout(() => {
            if (isProcessing) {
              console.log('No session found after timeout, redirecting to auth')
              setLocation('/auth')
            }
          }, 3000)
        }

      } catch (error) {
        console.error('Auth callback error:', error)
        setLocation('/auth')
      }
    }

    handleAuthCallback()
    
    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [setLocation, isProcessing])

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