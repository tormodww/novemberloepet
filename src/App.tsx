import { Routes, Route, useLocation } from 'react-router-dom';
import HomeScreen from './components/HomeScreen'
import StageSelector from './components/StageSelector'
import ParticipantSelector from './components/ParticipantSelector'
import TimeRegistration from './components/TimeRegistration'
import Admin from './components/Admin'
import AdminParticipants from './components/AdminParticipants'

import AdminStages from './components/AdminStages'
import AdminResults from './components/AdminResults'

export default function App() {
  const location = useLocation();
  // Sjekk path og query for å markere valgt side
  const isStart = location.pathname === '/stage' && location.search.includes('type=start');
  const isStop = location.pathname === '/stage' && location.search.includes('type=end');
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-100 border-b px-4 py-2 flex gap-4 items-center justify-center">
        <a
          href="/stage?type=start"
          className={
            `font-semibold hover:underline px-3 py-1 rounded ${isStart ? 'bg-blue-600 text-white' : 'text-blue-700'}`
          }
        >Registrer start</a>
        <a
          href="/stage?type=end"
          className={
            `font-semibold hover:underline px-3 py-1 rounded ${isStop ? 'bg-purple-700 text-white' : 'text-purple-700'}`
          }
        >Registrer slutt</a>
        <a
          href="/admin"
          className={
            `font-semibold hover:underline px-3 py-1 rounded ${isAdmin ? 'bg-gray-800 text-white' : 'text-gray-800'}`
          }
        >Admin</a>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/stage" element={<StageSelector />} />
          <Route path="/participant" element={<ParticipantSelector />} />
          <Route path="/time" element={<TimeRegistration />} />
          <Route path="/admin" element={<Admin />} />
          {/* Placeholder-komponenter for undersider */}
          <Route path="/admin/participants" element={<AdminParticipants />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/stages" element={<AdminStages />} />
        </Routes>
      </div>
    </div>
  )
}
