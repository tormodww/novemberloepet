import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import Toolbar from './components/Toolbar';
import AdminResults from './components/AdminResults';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <Toolbar />
      <div className="pt-20">
        <AdminResults />
      </div>
    </>
  </React.StrictMode>
);
