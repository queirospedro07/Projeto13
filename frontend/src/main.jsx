import './index.css';
import './styles/responsive.css';
import './styles/identity.css';
import './styles/editor-management.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Aplicacao from './App';
import { ProtecaoErrosAplicacao, EstadoLigacao } from './components/AppState';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProtecaoErrosAplicacao>
      <EstadoLigacao />
      <Aplicacao />
    </ProtecaoErrosAplicacao>
  </React.StrictMode>,
);
