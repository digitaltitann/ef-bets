import { useState, useEffect } from 'react'
import './TeamPicker.css'

interface TeamRound {
  id: number
  teams: string[][]
  bench: string[]
  createdAt: string
}

interface Session {
  id: number
  name: string
  bets: unknown[]
  teamRounds: TeamRound[]
  createdAt: string
}

const CURRENT_SESSION_KEY = 'ef-bets-current-session'
const SESSIONS_KEY = 'ef-bets-sessions'
const TEAM_PICKER_STATE_KEY = 'ef-bets-team-picker-state'

interface TeamPickerState {
  names: string[]
  teams: string[][]
  bench: string[]
  numTeams: number
  maxPerGroup: number
  sessionId: number | null
}

function TeamPicker() {
  const [nameInput, setNameInput] = useState('')
  const [names, setNames] = useState<string[]>([])
  const [numTeams, setNumTeams] = useState(2)
  const [maxPerGroup, setMaxPerGroup] = useState(4)
  const [teams, setTeams] = useState<string[][]>([])
  const [bench, setBench] = useState<string[]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)

  // Load session and persisted state on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(CURRENT_SESSION_KEY)
    let session: Session | null = null

    if (savedSession) {
      session = JSON.parse(savedSession)
      if (session && !session.teamRounds) {
        session.teamRounds = []
      }
      if (session && !session.bets) {
        session.bets = []
      }
      setCurrentSession(session)
    } else {
      // Auto-create a session if none exists
      const today = new Date()
      const newSession: Session = {
        id: Date.now(),
        name: `${today.getMonth() + 1}/${today.getDate()} bets`,
        bets: [],
        teamRounds: [],
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      const savedSessions = localStorage.getItem(SESSIONS_KEY)
      const sessions = savedSessions ? JSON.parse(savedSessions) : []
      const newSessions = [newSession, ...sessions]
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions))
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newSession))

      session = newSession
      setCurrentSession(newSession)
    }

    // Load persisted team picker state
    const savedState = localStorage.getItem(TEAM_PICKER_STATE_KEY)
    if (savedState) {
      const state: TeamPickerState = JSON.parse(savedState)
      // Only restore if it's for the same session (or both null)
      if (state.sessionId === (session?.id ?? null)) {
        setNames(state.names)
        setTeams(state.teams)
        setBench(state.bench)
        setNumTeams(state.numTeams)
        setMaxPerGroup(state.maxPerGroup)
      } else {
        // Different session, clear saved state
        localStorage.removeItem(TEAM_PICKER_STATE_KEY)
      }
    }
  }, [])

  // Persist state whenever it changes
  useEffect(() => {
    const state: TeamPickerState = {
      names,
      teams,
      bench,
      numTeams,
      maxPerGroup,
      sessionId: currentSession?.id ?? null
    }
    localStorage.setItem(TEAM_PICKER_STATE_KEY, JSON.stringify(state))
  }, [names, teams, bench, numTeams, maxPerGroup, currentSession])

  const addName = () => {
    const trimmed = nameInput.trim()
    if (trimmed && !names.includes(trimmed)) {
      setNames([...names, trimmed])
      setNameInput('')
    }
  }

  const addMultipleNames = (text: string) => {
    const newNames = text
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n && !names.includes(n))
    if (newNames.length > 0) {
      setNames([...names, ...newNames])
    }
  }

  const removeName = (index: number) => {
    setNames(names.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setNames([])
    setTeams([])
    setBench([])
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const generateTeams = () => {
    if (names.length === 0) return
    if (names.length < numTeams) return

    setIsShuffling(true)

    setTimeout(() => {
      const shuffled = shuffleArray(names)
      const newTeams: string[][] = Array.from({ length: numTeams }, () => [])
      const newBench: string[] = []
      const maxCapacity = numTeams * maxPerGroup

      shuffled.forEach((name, index) => {
        if (index < maxCapacity) {
          // Distribute evenly across teams up to maxPerGroup each
          const teamIndex = index % numTeams
          if (newTeams[teamIndex].length < maxPerGroup) {
            newTeams[teamIndex].push(name)
          } else {
            // Find a team with space
            const teamWithSpace = newTeams.findIndex(t => t.length < maxPerGroup)
            if (teamWithSpace !== -1) {
              newTeams[teamWithSpace].push(name)
            } else {
              newBench.push(name)
            }
          }
        } else {
          newBench.push(name)
        }
      })

      setTeams(newTeams)
      setBench(newBench)
      setIsShuffling(false)
    }, 500)
  }

  const formatTeamName = (team: string[]): string => {
    return team.join('+')
  }

  const submitTeams = () => {
    if (teams.length < 2) return

    // Save team round to session if one exists
    if (currentSession) {
      const newRound: TeamRound = {
        id: Date.now(),
        teams: teams,
        bench: bench,
        createdAt: new Date().toISOString()
      }

      const updatedSession: Session = {
        ...currentSession,
        teamRounds: [...(currentSession.teamRounds || []), newRound]
      }

      // Update current session
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(updatedSession))
      setCurrentSession(updatedSession)

      // Update in sessions list
      const sessionsData = localStorage.getItem(SESSIONS_KEY)
      if (sessionsData) {
        const sessions: Session[] = JSON.parse(sessionsData)
        const updatedSessions = sessions.map(s =>
          s.id === currentSession.id ? updatedSession : s
        )
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
      }
    }

    // Save pending bet to localStorage and navigate to Bets page
    localStorage.setItem('ef-bets-pending-bet', JSON.stringify({
      team1: formatTeamName(teams[0]),
      team2: formatTeamName(teams[1])
    }))
    // Use window.location for guaranteed navigation
    window.location.href = '/bets'
  }

  const canGenerate = () => {
    if (names.length === 0) return false
    return names.length >= numTeams
  }

  const exportToCSV = () => {
    if (teams.length === 0 && bench.length === 0) return

    const allGroups = bench.length > 0 ? [...teams, bench] : teams
    const maxLength = Math.max(...allGroups.map(t => t.length))
    const headers = [
      ...teams.map((_, i) => `Team ${i + 1}`),
      ...(bench.length > 0 ? ['Bench'] : [])
    ].join(',')
    const rows = Array.from({ length: maxLength }, (_, rowIndex) => {
      return allGroups.map(group => group[rowIndex] || '').join(',')
    })

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teams.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addName()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text')
    if (text.includes('\n') || text.includes(',')) {
      e.preventDefault()
      addMultipleNames(text)
    }
  }

  return (
    <div className="team-picker">
      <h2 className="page-title">Random Team Picker</h2>

      {currentSession && (
        <div className="session-indicator">
          Session: <span>{currentSession.name}</span>
          {currentSession.teamRounds?.length > 0 && (
            <span className="round-count">({currentSession.teamRounds.length} rounds)</span>
          )}
        </div>
      )}

      {!currentSession && (
        <div className="no-session-warning">
          No active session. Start one from Home to save teams.
        </div>
      )}

      <div className="input-section">
        <div className="input-row">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder="Enter a name..."
            className="name-input"
          />
          <button onClick={addName} className="add-btn">Add</button>
        </div>
        <p className="hint">Tip: Paste multiple names separated by commas or new lines</p>
      </div>

      {names.length > 0 && (
        <div className="names-section">
          <div className="names-header">
            <span className="names-count">{names.length} participants</span>
            <button onClick={clearAll} className="clear-btn">Clear All</button>
          </div>
          <div className="names-list">
            {names.map((name, index) => (
              <div key={index} className="name-chip">
                <span>{name}</span>
                <button onClick={() => removeName(index)} className="remove-btn">&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="controls-section">
        <div className="team-count-control">
          <label>Number of Teams</label>
          <div className="counter">
            <button
              onClick={() => setNumTeams(Math.max(2, numTeams - 1))}
              className="counter-btn"
            >
              -
            </button>
            <span className="counter-value">{numTeams}</span>
            <button
              onClick={() => setNumTeams(Math.min(names.length || 10, numTeams + 1))}
              className="counter-btn"
            >
              +
            </button>
          </div>
        </div>

        <div className="team-count-control">
          <label>Max per Team</label>
          <div className="counter">
            <button
              onClick={() => setMaxPerGroup(Math.max(2, maxPerGroup - 1))}
              className="counter-btn"
            >
              -
            </button>
            <span className="counter-value">{maxPerGroup}</span>
            <button
              onClick={() => setMaxPerGroup(maxPerGroup + 1)}
              className="counter-btn"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={generateTeams}
          disabled={!canGenerate() || isShuffling}
          className={`generate-btn ${isShuffling ? 'shuffling' : ''}`}
        >
          {isShuffling ? 'Shuffling...' : 'Randomize'}
        </button>
      </div>

      {(teams.length > 0 || bench.length > 0) && (
        <div className="results-section">
          <div className="results-header">
            <h3>Generated Teams</h3>
            <div className="results-actions">
              <button onClick={exportToCSV} className="export-btn">Export CSV</button>
            </div>
          </div>
          <div className="teams-grid">
            {teams.map((team, index) => (
              <div key={index} className="team-card">
                <div className="team-header">Team {index + 1}</div>
                <div className="team-members">
                  {team.map((member, mIndex) => (
                    <div key={mIndex} className="team-member">{member}</div>
                  ))}
                </div>
              </div>
            ))}
            {bench.length > 0 && (
              <div className="team-card bench-card">
                <div className="team-header bench-header">Bench</div>
                <div className="team-members">
                  {bench.map((member, mIndex) => (
                    <div key={mIndex} className="team-member">{member}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {teams.length >= 2 && (
            <div className="bet-section">
              <div className="bet-preview">
                <span className="bet-team">{formatTeamName(teams[0])}</span>
                <span className="bet-vs">vs</span>
                <span className="bet-team">{formatTeamName(teams[1])}</span>
              </div>
              <button onClick={submitTeams} className="submit-btn">
                Submit to Bets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeamPicker
