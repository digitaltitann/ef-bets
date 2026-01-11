import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TeamPicker from './pages/TeamPicker'
import Bets from './pages/Bets'
import Settlements from './pages/Settlements'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="randomizer" element={<TeamPicker />} />
        <Route path="bets" element={<Bets />} />
        <Route path="settlements" element={<Settlements />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
