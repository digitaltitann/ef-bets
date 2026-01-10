import './Profile.css'

function Profile() {
  return (
    <div className="profile">
      <div className="profile-header">
        <div className="avatar">JD</div>
        <h2 className="username">John Doe</h2>
        <span className="member-since">Member since 2024</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">47</span>
          <span className="stat-label">Total Bets</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">68%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">$892</span>
          <span className="stat-label">Profit</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">12</span>
          <span className="stat-label">Win Streak</span>
        </div>
      </div>

      <div className="menu-section">
        <button className="menu-item">
          <span>Account Settings</span>
          <span className="arrow">&#8250;</span>
        </button>
        <button className="menu-item">
          <span>Transaction History</span>
          <span className="arrow">&#8250;</span>
        </button>
        <button className="menu-item">
          <span>Notifications</span>
          <span className="arrow">&#8250;</span>
        </button>
        <button className="menu-item">
          <span>Help & Support</span>
          <span className="arrow">&#8250;</span>
        </button>
        <button className="menu-item logout">
          <span>Log Out</span>
          <span className="arrow">&#8250;</span>
        </button>
      </div>
    </div>
  )
}

export default Profile
