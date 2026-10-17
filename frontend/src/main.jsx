import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary, ConnectionStatus } from './components/AppStatus';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ConnectionStatus />
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
