import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Bets.css'

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

interface LocationState {
  team1?: string
  team2?: string
}

function Bets() {
  const location = useLocation()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [amount, setAmount] = useState('')
  const [bets, setBets] = useState<Bet[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionName, setSessionName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)

  // Load sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSIONS_KEY)
    if (saved) {
      setSessions(JSON.parse(saved))
    }
  }, [])

  // Load current session when navigating to this page
  useEffect(() => {
    const currentSession = localStorage.getItem(CURRENT_SESSION_KEY)
    if (currentSession) {
      const session = JSON.parse(currentSession)
      setCurrentSessionId(session.id)
      setSessionName(session.name)
      setBets(session.bets || [])
    }
  }, [location])

  // Check for pending bet from Team Picker via navigation state
  useEffect(() => {
    const state = location.state as LocationState
    if (state?.team1 && state?.team2) {
      setTeam1(state.team1)
      setTeam2(state.team2)
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const saveSessions = (newSessions: Session[]) => {
    setSessions(newSessions)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions))
  }

  const updateCurrentSession = (newBets: Bet[]) => {
    if (!currentSessionId) return

    // Update current session in localStorage
    const currentSession = localStorage.getItem(CURRENT_SESSION_KEY)
    if (currentSession) {
      const session = JSON.parse(currentSession)
      session.bets = newBets
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))

      // Also update in sessions list
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (sessionsData) {
        const allSessions = JSON.parse(sessionsData)
        const updatedSessions = allSessions.map((s: Session) =>
          s.id === currentSessionId ? { ...s, bets: newBets } : s
        )
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
        setSessions(updatedSessions)
      }
    }
  }

  const addBet = () => {
    if (!team1.trim() || !team2.trim() || !amount) return

    const newBet: Bet = {
      id: Date.now(),
      team1: team1.trim(),
      team2: team2.trim(),
      amount: parseFloat(amount),
      winner: null
    }

    const newBets = [newBet, ...bets]
    setBets(newBets)
    updateCurrentSession(newBets)
    setTeam1('')
    setTeam2('')
    setAmount('')
  }

  const selectWinner = (betId: number, winner: string) => {
    const newBets = bets.map(bet =>
      bet.id === betId ? { ...bet, winner } : bet
    )
    setBets(newBets)
    updateCurrentSession(newBets)
  }

  const deleteBet = (betId: number) => {
    const newBets = bets.filter(bet => bet.id !== betId)
    setBets(newBets)
    updateCurrentSession(newBets)
  }

  const saveSession = () => {
    if (!sessionName.trim() || bets.length === 0) return

    const newSession: Session = {
      id: currentSessionId || Date.now(),
      name: sessionName.trim(),
      bets: bets,
      createdAt: new Date().toISOString()
    }

    let newSessions: Session[]
    if (currentSessionId) {
      newSessions = sessions.map(s => s.id === currentSessionId ? newSession : s)
    } else {
      newSessions = [newSession, ...sessions]
    }

    saveSessions(newSessions)
    setCurrentSessionId(newSession.id)
    setShowSaveModal(false)
  }

  const loadSession = (session: Session) => {
    setBets(session.bets)
    setSessionName(session.name)
    setCurrentSessionId(session.id)
    setShowSessionsModal(false)
  }

  const deleteSession = (sessionId: number) => {
    const newSessions = sessions.filter(s => s.id !== sessionId)
    saveSessions(newSessions)
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
      setSessionName('')
    }
  }

  const newSession = () => {
    setBets([])
    setSessionName('')
    setCurrentSessionId(null)
  }

  const pendingBets = bets.filter(b => !b.winner)
  const settledBets = bets.filter(b => b.winner)

  return (
    <div className="bets">
      <div className="session-bar">
        <span className="session-name">
          {currentSessionId ? sessionName : 'New Session'}
        </span>
        <div className="session-actions">
          <button className="session-btn" onClick={() => setShowSessionsModal(true)}>
            Load
          </button>
          <button
            className="session-btn save"
            onClick={() => {
              if (!sessionName && bets.length > 0) {
                const today = new Date()
                setSessionName(`${today.getMonth() + 1}/${today.getDate()} bets`)
              }
              setShowSaveModal(true)
            }}
            disabled={bets.length === 0}
          >
            Save
          </button>
          <button className="session-btn new" onClick={newSession}>
            New
          </button>
        </div>
      </div>

      <div className="bet-form">
        <div className="teams-input">
          <input
            type="text"
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            placeholder="Team 1 (e.g., A+B)"
            className="team-input"
          />
          <span className="vs-label">vs</span>
          <input
            type="text"
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            placeholder="Team 2 (e.g., C+D)"
            className="team-input"
          />
        </div>

        <div className="amount-input-row">
          <span className="currency">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="amount-input"
            min="0"
            step="0.01"
          />
        </div>

        <button
          onClick={addBet}
          disabled={!team1.trim() || !team2.trim() || !amount}
          className="add-bet-btn"
        >
          Add Bet
        </button>
      </div>

      {pendingBets.length > 0 && (
        <div className="bets-section">
          <h3 className="section-title">Pending Bets</h3>
          <div className="bets-list">
            {pendingBets.map(bet => (
              <div key={bet.id} className="bet-card">
                <div className="bet-info">
                  <span className="bet-matchup">{bet.team1} vs {bet.team2}</span>
                  <span className="bet-amount">${bet.amount.toFixed(2)}</span>
                </div>
                <div className="bet-actions">
                  <span className="winner-label">Winner:</span>
                  <button
                    className="winner-btn"
                    onClick={() => selectWinner(bet.id, bet.team1)}
                  >
                    {bet.team1}
                  </button>
                  <button
                    className="winner-btn"
                    onClick={() => selectWinner(bet.id, bet.team2)}
                  >
                    {bet.team2}
                  </button>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteBet(bet.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {settledBets.length > 0 && (
        <div className="bets-section">
          <h3 className="section-title">Settled Bets</h3>
          <div className="bets-list">
            {settledBets.map(bet => (
              <div key={bet.id} className="bet-card settled">
                <div className="bet-info">
                  <span className="bet-matchup">{bet.team1} vs {bet.team2}</span>
                  <span className="bet-amount">${bet.amount.toFixed(2)}</span>
                </div>
                <div className="bet-actions">
                  <span className="winner-label">Winner:</span>
                  <button
                    className={`winner-btn ${bet.winner === bet.team1 ? 'selected' : ''}`}
                    onClick={() => selectWinner(bet.id, bet.team1)}
                  >
                    {bet.team1}
                  </button>
                  <button
                    className={`winner-btn ${bet.winner === bet.team2 ? 'selected' : ''}`}
                    onClick={() => selectWinner(bet.id, bet.team2)}
                  >
                    {bet.team2}
                  </button>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteBet(bet.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {bets.length === 0 && (
        <p className="empty-state">No bets yet. Create one above!</p>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Save Session</h3>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name (e.g., 1/11 bets)"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn save"
                onClick={saveSession}
                disabled={!sessionName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionsModal && (
        <div className="modal-overlay" onClick={() => setShowSessionsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Saved Sessions</h3>
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
              <button className="modal-btn cancel" onClick={() => setShowSessionsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bets
