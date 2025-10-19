import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Toolbar from './components/Toolbar';
import Admin from './components/Admin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <Toolbar />
      <div className="pt-20">
        <Admin />
      </div>
    </>
  </React.StrictMode>
);
