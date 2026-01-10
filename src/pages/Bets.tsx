import './Bets.css'

function Bets() {
  const bets = [
    { id: 1, match: 'Lakers vs Celtics', pick: 'Lakers', odds: 1.85, stake: 50, status: 'pending' },
    { id: 2, match: 'Man City vs Liverpool', pick: 'Draw', odds: 3.25, stake: 25, status: 'won' },
    { id: 3, match: 'Bayern vs Dortmund', pick: 'Bayern', odds: 1.55, stake: 100, status: 'lost' },
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'won': return 'status-won'
      case 'lost': return 'status-lost'
      default: return 'status-pending'
    }
  }

  return (
    <div className="bets">
      <h2 className="page-title">My Bets</h2>

      <div className="bets-list">
        {bets.map(bet => (
          <div key={bet.id} className="bet-card">
            <div className="bet-header">
              <span className="bet-match">{bet.match}</span>
              <span className={`bet-status ${getStatusClass(bet.status)}`}>
                {bet.status}
              </span>
            </div>
            <div className="bet-details">
              <div className="bet-info">
                <span className="label">Pick</span>
                <span className="value">{bet.pick}</span>
              </div>
              <div className="bet-info">
                <span className="label">Odds</span>
                <span className="value">{bet.odds}</span>
              </div>
              <div className="bet-info">
                <span className="label">Stake</span>
                <span className="value">${bet.stake}</span>
              </div>
              <div className="bet-info">
                <span className="label">Potential</span>
                <span className="value">${(bet.odds * bet.stake).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Bets
