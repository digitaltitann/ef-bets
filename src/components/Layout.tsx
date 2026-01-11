import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">EF Bets</h1>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#127968;</span>
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/randomizer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#127922;</span>
          <span className="nav-label">Randomizer</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128100;</span>
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default Layout
