import { useNavigate, useSearchParams } from 'react-router-dom'
import { stages } from '../data/stages'

export default function StageSelector() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const type = params.get('type') || 'start'

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Velg etappe</h2>
      <div className="flex flex-col gap-3">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => navigate(`/participant?stage=${encodeURIComponent(stage)}&type=${type}`)}
            className="bg-gray-200 hover:bg-blue-600 hover:text-white py-3 rounded-md font-medium"
          >
            {stage}
          </button>
        ))}
      </div>
    </div>
  )
}
