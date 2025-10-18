import { Routes, Route } from 'react-router-dom'
import HomeScreen from './components/HomeScreen'
import StageSelector from './components/StageSelector'
import ParticipantSelector from './components/ParticipantSelector'
import TimeRegistration from './components/TimeRegistration'

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/stage" element={<StageSelector />} />
        <Route path="/participant" element={<ParticipantSelector />} />
        <Route path="/time" element={<TimeRegistration />} />
      </Routes>
    </div>
  )
}
