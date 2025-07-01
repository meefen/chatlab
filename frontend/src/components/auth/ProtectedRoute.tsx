import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'wouter'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  React.useEffect(() => {
    if (!loading && requireAuth && !user) {
      setLocation('/auth')
    }
  }, [user, loading, requireAuth, setLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect to auth page
  }

  return <>{children}</>
}

export default ProtectedRoute