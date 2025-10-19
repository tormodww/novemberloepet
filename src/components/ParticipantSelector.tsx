import { useNavigate, useSearchParams } from 'react-router-dom'
import { participants } from '../data/participants'

export default function ParticipantSelector() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const stage = params.get('stage') || ''
  const type = params.get('type') || 'start'

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Etappe: {stage}</h2>
      <p className="mb-2">Velg deltaker</p>
      <button
        onClick={() => navigate(`/stage?type=${type}`)}
        className="mb-4 border px-3 py-1 text-blue-600 border-blue-400 rounded-md"
      >
        BYTT ETAPPE
      </button>
      <select
        onChange={(e) => navigate(`/time?stage=${encodeURIComponent(stage)}&type=${type}&participant=${e.target.value}`)}
        className="w-full border rounded-md px-2 py-2"
      >
        <option value="">Startnummer eller navn</option>
        {participants.map(p => (
          <option key={p.id} value={p.id}>
            #{p.id} - {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
