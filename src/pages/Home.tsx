import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCode, saveSessionToCloud, loadSessionFromCloud } from '../firebase'
import './Home.css'

interface Bet {
  id: number
  team1: string
  team2: string
  amount: number
  winner: string | null
}

interface Expense {
  id: number
  paidBy: string
  description: string
  amount: number
  splitAmong: string[]
}

interface Session {
  id: number
  name: string
  bets: Bet[]
  expenses?: Expense[]
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
  const [showShareModal, setShowShareModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [shareError, setShareError] = useState('')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    let loadedSessions: Session[] = []
    const savedSessions = localStorage.getItem(SESSIONS_KEY)
    if (savedSessions) {
      loadedSessions = JSON.parse(savedSessions)
      setSessions(loadedSessions)
    }

    const savedCurrent = localStorage.getItem(CURRENT_SESSION_KEY)
    if (savedCurrent) {
      setCurrentSession(JSON.parse(savedCurrent))
    } else {
      // Auto-create a session if none exists
      const today = new Date()
      const newSession: Session = {
        id: Date.now(),
        name: `${today.getMonth() + 1}/${today.getDate()} bets`,
        bets: [],
        createdAt: new Date().toISOString()
      }
      const newSessions = [newSession, ...loadedSessions]
      setSessions(newSessions)
      setCurrentSession(newSession)
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions))
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newSession))
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
    // Read the latest session data from localStorage (may have been updated by other pages)
    const latestSessionData = localStorage.getItem(CURRENT_SESSION_KEY)
    if (!latestSessionData) return

    const latestSession: Session = JSON.parse(latestSessionData)

    // Read latest sessions list from localStorage too
    const latestSessionsData = localStorage.getItem(SESSIONS_KEY)
    const latestSessions: Session[] = latestSessionsData ? JSON.parse(latestSessionsData) : []

    // Update or add the session in the list
    const exists = latestSessions.some(s => s.id === latestSession.id)
    const updatedSessions = exists
      ? latestSessions.map(s => s.id === latestSession.id ? latestSession : s)
      : [latestSession, ...latestSessions]

    // Save and update state
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
    setSessions(updatedSessions)
    setCurrentSession(latestSession)
  }

  const deleteSession = (sessionId: number) => {
    const newSessions = sessions.filter(s => s.id !== sessionId)
    saveSessions(newSessions)
    if (currentSession?.id === sessionId) {
      saveCurrentSession(null)
    }
  }

  const handleShare = async () => {
    if (!currentSession) return

    setIsSharing(true)
    setShareError('')

    try {
      const code = generateCode()
      await saveSessionToCloud(code, currentSession)
      setShareCode(code)
    } catch (error) {
      console.error('Error sharing session:', error)
      setShareError('Failed to share. Check your connection.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleJoin = async () => {
    if (joinCode.length !== 4) {
      setJoinError('Please enter a 4-digit code')
      return
    }

    setIsJoining(true)
    setJoinError('')

    try {
      const loadedSession = await loadSessionFromCloud(joinCode) as Session | null

      if (loadedSession) {
        // Add to sessions list if not already there
        const exists = sessions.some(s => s.id === loadedSession.id)
        if (!exists) {
          const newSessions = [loadedSession, ...sessions]
          saveSessions(newSessions)
        }

        saveCurrentSession(loadedSession)
        setShowJoinModal(false)
        setJoinCode('')
      } else {
        setJoinError('Session not found. Check the code.')
      }
    } catch (error) {
      console.error('Error joining session:', error)
      setJoinError('Failed to join. Check your connection.')
    } finally {
      setIsJoining(false)
    }
  }

  const openShareModal = () => {
    setShareCode('')
    setShareError('')
    setShowShareModal(true)
  }

  const openJoinModal = () => {
    setJoinCode('')
    setJoinError('')
    setShowJoinModal(true)
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
          <span>New</span>
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

      <div className="session-buttons">
        <button
          className="session-btn share"
          onClick={openShareModal}
          disabled={!currentSession}
        >
          <span className="btn-icon">&#128279;</span>
          <span>Share</span>
        </button>
        <button className="session-btn join" onClick={openJoinModal}>
          <span className="btn-icon">&#128229;</span>
          <span>Join</span>
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

      {/* New Session Modal */}
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

      {/* Load Session Modal */}
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

      {/* Share Session Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Share Session</h3>
            {shareCode ? (
              <div className="share-code-display">
                <p className="share-label">Share this code:</p>
                <div className="share-code">{shareCode}</div>
                <p className="share-hint">Code expires in 24 hours</p>
              </div>
            ) : (
              <div className="share-prompt">
                <p>Generate a 4-digit code to share "{currentSession?.name}" with others.</p>
                {shareError && <p className="error-msg">{shareError}</p>}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowShareModal(false)}>
                {shareCode ? 'Done' : 'Cancel'}
              </button>
              {!shareCode && (
                <button
                  className="modal-btn confirm"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  {isSharing ? 'Generating...' : 'Generate Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Join Session</h3>
            <p className="join-prompt">Enter the 4-digit code to join a session:</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              className="modal-input code-input"
              maxLength={4}
              autoFocus
            />
            {joinError && <p className="error-msg">{joinError}</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowJoinModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleJoin}
                disabled={isJoining || joinCode.length !== 4}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
