import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { AuthFlow } from './pages/AuthFlow'
import { EconomistWorkspace } from './pages/EconomistWorkspace'
import { DepartmentWorkspace } from './pages/DepartmentWorkspace'
import { Welcome } from './components/Welcome'
import { ErrorBoundary } from './components/ErrorBoundary'
import { getSession, clearSession, type Session } from './lib/session'

export function App() {
  const [session, setSession] = useState<Session | null>(getSession())
  const [welcoming, setWelcoming] = useState(false)

  const handleAuth = (s: Session) => {
    setSession(s)
    setWelcoming(true)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

  if (!session) {
    return <AuthFlow onDone={handleAuth} />
  }

  return (
    <ErrorBoundary onLogout={handleLogout}>
      <AnimatePresence>
        {welcoming && (
          <Welcome key="welcome" name={session.member.full_name} onDone={() => setWelcoming(false)} />
        )}
      </AnimatePresence>

      {session.member.role === 'economist' ? (
        <EconomistWorkspace session={session} onLogout={handleLogout} />
      ) : (
        <DepartmentWorkspace session={session} onSession={setSession} onLogout={handleLogout} />
      )}
    </ErrorBoundary>
  )
}
