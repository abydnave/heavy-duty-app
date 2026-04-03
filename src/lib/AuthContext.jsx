import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle PKCE code exchange on redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      supabase.auth.exchangeCodeForSession(params.get('code')).then(({ data, error }) => {
        if (error) console.error('Code exchange error:', error)
        if (data?.session) {
          setUser(data.session.user)
          window.history.replaceState(null, '', window.location.pathname)
        }
        setLoading(false)
      })
    } else {
      // No code in URL — check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
    }

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
