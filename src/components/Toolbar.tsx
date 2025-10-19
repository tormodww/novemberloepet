import React from 'react';

export default function Toolbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow flex justify-center items-center py-2 px-2 border-b border-gray-200">
      <div className="flex w-full max-w-md gap-2">
        <a href="admin.html" className="flex-1 text-center bg-gray-800 text-white px-2 py-2 rounded font-semibold text-sm sm:text-base transition hover:bg-gray-900">Admin</a>
        <a href="start.html" className="flex-1 text-center bg-blue-600 text-white px-2 py-2 rounded font-semibold text-sm sm:text-base transition hover:bg-blue-700">Registrer Start</a>
        <a href="slutt.html" className="flex-1 text-center bg-purple-700 text-white px-2 py-2 rounded font-semibold text-sm sm:text-base transition hover:bg-purple-800">Registrer Slutt</a>
      </div>
    </nav>
  );
}
