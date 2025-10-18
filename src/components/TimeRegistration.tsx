import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { participants } from '../data/participants'

export default function TimeRegistration() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const stage = params.get('stage') || ''
  const participant = params.get('participant') || ''
  const type = params.get('type') || 'start'
  const [confirmed, setConfirmed] = useState(false)
  const [manualTime, setManualTime] = useState('')
  const [registeredTime, setRegisteredTime] = useState('')
  // Lagre registrert tid per deltaker
  const [participantTimes, setParticipantTimes] = useState<{ [id: string]: string }>({})

  const handleRegister = () => {
    let timestamp = ''
    if (manualTime) {
      timestamp = manualTime
    } else {
      timestamp = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    }
    setRegisteredTime(timestamp)
    setConfirmed(true)
    setParticipantTimes(prev => ({ ...prev, [participant]: timestamp }))
    console.log({ stage, participant, type, timestamp })
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="mb-4">
        <label htmlFor="participant-select" className="block mb-1 font-semibold">Velg deltaker:</label>
        <select
          id="participant-select"
          value={participant}
          onChange={e => {
            setManualTime('');
            setConfirmed(false);
            setRegisteredTime('');
            navigate(`/time?stage=${encodeURIComponent(stage)}&type=${type}&participant=${e.target.value}`)
          }}
          className="w-full border rounded-md px-2 py-2 mb-2"
        >
          <option value="">Startnummer eller navn</option>
          {participants.map(p => (
            <option key={p.id} value={p.id}>
              #{p.id} - {p.name}
              {participantTimes[p.id] ? ` (tid: ${participantTimes[p.id]})` : ''}
            </option>
          ))}
        </select>
      </div>
      <h2 className="text-xl font-semibold mb-4">
        {type === 'start' ? 'Registrer Starttid' : 'Registrer Sluttid'}
      </h2>
      <p className="mb-2">Etappe: {stage}</p>
      <p className="mb-4">Deltaker #{participant}</p>
      {!confirmed ? (
        <>
          <div className="mb-4">
            <label htmlFor="manual-time" className="block mb-1">Manuell tid (hh:mm):</label>
            <input
              id="manual-time"
              type="time"
              value={manualTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualTime(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
          <button
            onClick={handleRegister}
            className="bg-green-600 text-white px-6 py-3 rounded-md"
          >
            {manualTime ? 'Registrer manuell tid' : 'Registrer tid nå'}
          </button>
        </>
      ) : (
        <div className="p-4 bg-green-100 border border-green-400 rounded-md">
          Tid registrert for #{participant} kl. {registeredTime}
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
