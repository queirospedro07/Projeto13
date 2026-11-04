import { Component, useEffect, useState } from 'react';
import './AppState.css';

export class ProtecaoErrosAplicacao extends Component {
  state = {
    failed: false,
  };
  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }
  componentDidCatch(erro, info) {
    console.error('Application error', erro, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main
          className="app-failure"
          role="alert"
        >
          <span>NEXO</span>
          <h1>Não foi possível mostrar esta página.</h1>
          <p>
            Recarregue a aplicação para tentar novamente. Se o problema continuar, contacte o
            suporte.
          </p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
          <a href="/">Ir para o início</a>
        </main>
      );

    return this.props.children;
  }
}

export function EstadoLigacao() {
  const [offline, definirOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const atualizar = () => definirOffline(!navigator.onLine);

    window.addEventListener('online', atualizar);
    window.addEventListener('offline', atualizar);

    return () => {
      window.removeEventListener('online', atualizar);
      window.removeEventListener('offline', atualizar);
    };
  }, []);

  return offline ? (
    <div
      className="connection-status"
      role="status"
    >
      Está sem ligação à Internet. As alterações só podem ser guardadas quando a ligação voltar.
    </div>
  ) : null;
}
