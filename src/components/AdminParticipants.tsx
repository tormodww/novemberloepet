import { useNavigate } from 'react-router-dom';
import { participants } from '../data/participants';

export default function AdminParticipants() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-md mx-auto text-center px-2 py-8">
      <h1 className="text-2xl font-bold mb-8">Deltagere</h1>
      <ul className="mb-8">
        {participants.map((p: { id: string; name: string }) => (
          <li key={p.id} className="py-2 border-b last:border-b-0 flex items-center justify-between">
            <span>{p.name}</span>
            <span className="text-gray-400 text-sm">#{p.id}</span>
          </li>
        ))}
      </ul>
      <button
        className="block mt-6 text-blue-600 underline w-full sm:w-auto text-base sm:text-lg"
        onClick={() => navigate('/admin')}
      >
        Tilbake til admin
      </button>
    </div>
  );
}
