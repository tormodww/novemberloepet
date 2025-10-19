import Toolbar from './Toolbar';

export default function HomeScreen() {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <Toolbar />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8">Velkommen til Novemberløpet {currentYear}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
          <div className="bg-white shadow p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Registrer Start-tid</h2>
            <p className="text-sm mb-4">Registrer start-tid for deltakere på hver etappe</p>
            <a
              className="bg-blue-600 text-white px-4 py-2 rounded-md w-full block text-center"
              href="start.html"
            >
              GÅ TIL REGISTRER START-TID
            </a>
          </div>
          <div className="bg-white shadow p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Registrer Slutt-tid</h2>
            <p className="text-sm mb-4">Registrer slutt-tid for deltakere på hver etappe</p>
            <a
              className="bg-purple-700 text-white px-4 py-2 rounded-md w-full block text-center"
              href="slutt.html"
            >
              GÅ TIL REGISTRER SLUTT-TID
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
