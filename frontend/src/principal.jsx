import './index.css';
import './estilos/responsivo.css';
import './estilos/identidade.css';
import './estilos/gestao-editor.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Aplicacao from './Aplicacao';
import { ProtecaoErrosAplicacao, EstadoLigacao } from './componentes/EstadoAplicacao';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProtecaoErrosAplicacao>
      <EstadoLigacao />
      <Aplicacao />
    </ProtecaoErrosAplicacao>
  </React.StrictMode>,
);
