import { useState } from 'react'
import './TeamPicker.css'

type DistributionMode = 'teams' | 'maxPerGroup'

function TeamPicker() {
  const [nameInput, setNameInput] = useState('')
  const [names, setNames] = useState<string[]>([])
  const [numTeams, setNumTeams] = useState(2)
  const [maxPerGroup, setMaxPerGroup] = useState(4)
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('teams')
  const [teams, setTeams] = useState<string[][]>([])
  const [bench, setBench] = useState<string[]>([])
  const [isShuffling, setIsShuffling] = useState(false)

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
    if (distributionMode === 'teams' && names.length < numTeams) return

    setIsShuffling(true)

    setTimeout(() => {
      const shuffled = shuffleArray(names)
      let newTeams: string[][]
      let newBench: string[] = []

      if (distributionMode === 'teams') {
        newTeams = Array.from({ length: numTeams }, () => [])
        shuffled.forEach((name, index) => {
          newTeams[index % numTeams].push(name)
        })
      } else {
        const fullTeamCount = Math.floor(names.length / maxPerGroup)

        if (fullTeamCount === 0) {
          newTeams = []
          newBench = [...shuffled]
        } else {
          newTeams = Array.from({ length: fullTeamCount }, () => [])
          shuffled.forEach((name, index) => {
            if (index < fullTeamCount * maxPerGroup) {
              newTeams[Math.floor(index / maxPerGroup)].push(name)
            } else {
              newBench.push(name)
            }
          })
        }
      }

      setTeams(newTeams)
      setBench(newBench)
      setIsShuffling(false)
    }, 500)
  }

  const canGenerate = () => {
    if (names.length === 0) return false
    if (distributionMode === 'teams') return names.length >= numTeams
    return true
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
        <div className="mode-toggle">
          <button
            className={`mode-btn ${distributionMode === 'teams' ? 'active' : ''}`}
            onClick={() => setDistributionMode('teams')}
          >
            # of Teams
          </button>
          <button
            className={`mode-btn ${distributionMode === 'maxPerGroup' ? 'active' : ''}`}
            onClick={() => setDistributionMode('maxPerGroup')}
          >
            Max per Group
          </button>
        </div>

        {distributionMode === 'teams' ? (
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
        ) : (
          <div className="team-count-control">
            <label>Max per Group</label>
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
        )}

        <button
          onClick={generateTeams}
          disabled={!canGenerate() || isShuffling}
          className={`generate-btn ${isShuffling ? 'shuffling' : ''}`}
        >
          {isShuffling ? 'Shuffling...' : 'Generate Teams'}
        </button>
      </div>

      {(teams.length > 0 || bench.length > 0) && (
        <div className="results-section">
          <div className="results-header">
            <h3>Generated Teams</h3>
            <button onClick={exportToCSV} className="export-btn">Export CSV</button>
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
        </div>
      )}
    </div>
  )
}

export default TeamPicker
