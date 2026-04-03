import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Unregister stale service workers on first load
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }

    // Handle PKCE code exchange on redirect
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      console.log('[Auth] PKCE code found, exchanging...')
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('[Auth] Code exchange error:', error)
        }
        if (data?.session) {
          console.log('[Auth] Session established!')
          setUser(data.session.user)
        }
        window.history.replaceState(null, '', window.location.pathname)
        setLoading(false)
      })
      return
    }

    // Handle implicit flow hash fragment
    if (window.location.hash?.includes('access_token')) {
      console.log('[Auth] Hash token found, letting Supabase handle...')
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Existing session:', session ? 'yes' : 'no')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change:', event)
        setUser(session?.user ?? null)
        if (event === 'SIGNED_IN') {
          setLoading(false)
          window.history.replaceState(null, '', window.location.pathname)
        }
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
