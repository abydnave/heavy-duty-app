import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Capture hash IMMEDIATELY before React or extensions can clear it
const initialHash = window.location.hash

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const didInit = useRef(false)

  useEffect(() => {
    // Prevent double-run in StrictMode
    if (didInit.current) return
    didInit.current = true

    // Unregister stale service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }

    async function init() {
      // If we captured a hash with access_token, manually set the session
      if (initialHash && initialHash.includes('access_token')) {
        const params = new URLSearchParams(initialHash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken) {
          console.log('[Auth] Found access_token in hash, setting session...')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          console.log('[Auth] setSession result:', { user: data?.session?.user?.email, error })

          if (data?.session) {
            setUser(data.session.user)
          }
          // Clean URL
          window.history.replaceState(null, '', window.location.pathname)
          setLoading(false)
          return
        }
      }

      // No hash — check existing session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Auth] Existing session:', session?.user?.email || 'none')
      setUser(session?.user ?? null)
      setLoading(false)
    }

    init()

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
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
