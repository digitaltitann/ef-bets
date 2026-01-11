import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

interface Bet {
  id: number
  team1: string
  team2: string
  amount: number
  winner: string | null
}

interface Session {
  id: number
  name: string
  bets: Bet[]
  createdAt: string
}

const SESSIONS_KEY = 'ef-bets-sessions'
const CURRENT_SESSION_KEY = 'ef-bets-current-session'

function Home() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')

  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY)
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions))
    }
    const savedCurrent = localStorage.getItem(CURRENT_SESSION_KEY)
    if (savedCurrent) {
      setCurrentSession(JSON.parse(savedCurrent))
    }
  }, [])

  const saveSessions = (newSessions: Session[]) => {
    setSessions(newSessions)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions))
  }

  const saveCurrentSession = (session: Session | null) => {
    setCurrentSession(session)
    if (session) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY)
    }
  }

  const startNewSession = () => {
    if (!newSessionName.trim()) return

    const newSession: Session = {
      id: Date.now(),
      name: newSessionName.trim(),
      bets: [],
      createdAt: new Date().toISOString()
    }

    const newSessions = [newSession, ...sessions]
    saveSessions(newSessions)
    saveCurrentSession(newSession)
    setNewSessionName('')
    setShowNewModal(false)
  }

  const loadSession = (session: Session) => {
    saveCurrentSession(session)
    setShowLoadModal(false)
  }

  const saveSession = () => {
    if (!currentSession) return

    const updatedSessions = sessions.map(s =>
      s.id === currentSession.id ? currentSession : s
    )
    saveSessions(updatedSessions)
  }

  const deleteSession = (sessionId: number) => {
    const newSessions = sessions.filter(s => s.id !== sessionId)
    saveSessions(newSessions)
    if (currentSession?.id === sessionId) {
      saveCurrentSession(null)
    }
  }

  return (
    <div className="home">
      <img src="/ef.jpg" alt="EF Bets" className="hero-image" />
      <h1 className="hero-title">EF Bets</h1>

      {currentSession && (
        <div className="current-session">
          <span className="current-label">Current Session</span>
          <span className="current-name">{currentSession.name}</span>
        </div>
      )}

      <div className="session-buttons">
        <button className="session-btn new" onClick={() => {
          const today = new Date()
          setNewSessionName(`${today.getMonth() + 1}/${today.getDate()} bets`)
          setShowNewModal(true)
        }}>
          <span className="btn-icon">+</span>
          <span>New Session</span>
        </button>
        <button
          className="session-btn save"
          onClick={saveSession}
          disabled={!currentSession}
        >
          <span className="btn-icon">&#128190;</span>
          <span>Save</span>
        </button>
        <button className="session-btn load" onClick={() => setShowLoadModal(true)}>
          <span className="btn-icon">&#128194;</span>
          <span>Load</span>
        </button>
      </div>

      <div className="menu-buttons">
        <button className="menu-btn" onClick={() => navigate('/randomizer')}>
          <span className="menu-icon">&#127919;</span>
          <span className="menu-label">Team Randomizer</span>
        </button>
        <button className="menu-btn" onClick={() => navigate('/bets')}>
          <span className="menu-icon">&#127918;</span>
          <span className="menu-label">Bets</span>
        </button>
        <button className="menu-btn" onClick={() => navigate('/settlements')}>
          <span className="menu-icon">&#128176;</span>
          <span className="menu-label">Settlements</span>
        </button>
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New Session</h3>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Session name (e.g., 1/11 bets)"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={startNewSession}
                disabled={!newSessionName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Load Session</h3>
            {sessions.length === 0 ? (
              <p className="modal-empty">No saved sessions yet</p>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session.id} className="session-item">
                    <div className="session-item-info" onClick={() => loadSession(session)}>
                      <span className="session-item-name">{session.name}</span>
                      <span className="session-item-count">{session.bets.length} bets</span>
                    </div>
                    <button
                      className="session-item-delete"
                      onClick={() => deleteSession(session.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowLoadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
