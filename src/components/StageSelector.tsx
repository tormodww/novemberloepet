import { useNavigate, useSearchParams } from 'react-router-dom'
import { stages } from '../data/stages'

type Props = {
  type?: string
}

export default function StageSelector({ type }: Props) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const routeType = type || params.get('type') || 'start'

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Velg etappe ({routeType === 'start' ? 'Start' : routeType === 'slutt' ? 'Slutt' : routeType})</h2>
      <div className="flex flex-col gap-3">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => navigate(`/participant?stage=${encodeURIComponent(stage)}&type=${routeType}`)}
            className="bg-gray-200 hover:bg-blue-600 hover:text-white py-3 rounded-md font-medium"
          >
            {stage}
          </button>
        ))}
      </div>
    </div>
  )
}
