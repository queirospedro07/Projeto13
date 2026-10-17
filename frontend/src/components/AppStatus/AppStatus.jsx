import { Component, useEffect, useState } from 'react';
import './AppStatus.css';
export class AppErrorBoundary extends Component {
  state = {
    failed: false,
  };
  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }
  componentDidCatch(error, info) {
    console.error('Application error', error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-failure" role="alert">
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
export function ConnectionStatus() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return offline ? (
    <div className="connection-status" role="status">
      Está sem ligação à Internet. As alterações só podem ser guardadas quando a ligação voltar.
    </div>
  ) : null;
}
