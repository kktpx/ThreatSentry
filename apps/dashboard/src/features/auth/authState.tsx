import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '../../lib/supabase'

type AuthContextValue = {
  isLoading: boolean
  session: Session | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        if (error) {
          console.error('Supabase getSession error:', error)
          setSession(null)
        } else {
          setSession(data.session)
        }
        setIsLoading(false)
      }
    }).catch(error => {
      if (active) {
        console.error('Supabase getSession rejected:', error)
        setSession(null)
        setIsLoading(false)
      }
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setIsLoading(false)
      }
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ isLoading, session, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
