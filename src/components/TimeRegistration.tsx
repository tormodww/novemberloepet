import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function TimeRegistration() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const stage = params.get('stage') || ''
  const participant = params.get('participant') || ''
  const type = params.get('type') || 'start'
  const [confirmed, setConfirmed] = useState(false)

  const handleRegister = () => {
    const timestamp = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    setConfirmed(true)
    console.log({ stage, participant, type, timestamp })
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <h2 className="text-xl font-semibold mb-4">
        {type === 'start' ? 'Registrer Starttid' : 'Registrer Sluttid'}
      </h2>
      <p className="mb-2">Etappe: {stage}</p>
      <p className="mb-4">Deltaker #{participant}</p>
      {!confirmed ? (
        <button
          onClick={handleRegister}
          className="bg-green-600 text-white px-6 py-3 rounded-md"
        >
          Registrer tid nå
        </button>
      ) : (
        <div className="p-4 bg-green-100 border border-green-400 rounded-md">
          Tid registrert for #{participant} kl. {new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <button
        className="block mt-6 text-blue-600 underline"
        onClick={() => navigate('/')}
      >
        Tilbake til start
      </button>
    </div>
  )
}
