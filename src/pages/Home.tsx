import './Home.css'

function Home() {
  return (
    <div className="home">
      <section className="balance-card">
        <span className="balance-label">Your Balance</span>
        <span className="balance-amount">$1,250.00</span>
      </section>

      <section className="quick-actions">
        <button className="action-btn deposit">Deposit</button>
        <button className="action-btn withdraw">Withdraw</button>
      </section>

      <section className="section">
        <h2 className="section-title">Live Events</h2>
        <div className="events-list">
          <div className="event-card">
            <div className="event-teams">
              <span>Lakers</span>
              <span className="vs">vs</span>
              <span>Celtics</span>
            </div>
            <div className="event-odds">
              <button className="odd-btn">1.85</button>
              <button className="odd-btn">3.50</button>
              <button className="odd-btn">2.10</button>
            </div>
          </div>
          <div className="event-card">
            <div className="event-teams">
              <span>Man City</span>
              <span className="vs">vs</span>
              <span>Liverpool</span>
            </div>
            <div className="event-odds">
              <button className="odd-btn">2.00</button>
              <button className="odd-btn">3.25</button>
              <button className="odd-btn">2.15</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
