import { useNavigate } from 'react-router-dom'

export default function HomeScreen() {
  const navigate = useNavigate()
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-8">Velkommen til Novemberløpet</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
        <div className="bg-white shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Registrer Start-tid</h2>
          <p className="text-sm mb-4">Registrer start-tid for deltakere på hver etappe</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
            onClick={() => navigate('/stage?type=start')}
          >
            GÅ TIL REGISTRER START-TID
          </button>
        </div>
        <div className="bg-white shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Registrer Slutt-tid</h2>
          <p className="text-sm mb-4">Registrer slutt-tid for deltakere på hver etappe</p>
          <button
            className="bg-purple-700 text-white px-4 py-2 rounded-md w-full"
            onClick={() => navigate('/stage?type=end')}
          >
            GÅ TIL REGISTRER SLUTT-TID
          </button>
        </div>
      </div>
    </div>
  )
}
