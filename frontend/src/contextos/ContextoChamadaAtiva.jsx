import { lerJsonCompativel } from '../utilitarios/compatibilidadeCampos.js';
import { useContext, useState, useEffect, useCallback } from 'react';
import { soundEffects } from '../servicos/soundEffects';
import { ContextoChamadaAtiva } from './contextos';

export const FornecedorChamadaAtiva = ({ children: conteudoFilho }) => {
  const [ativoChamada, definirAtivoChamada] = useState(() => {
    try {
      const guardado = sessionStorage.getItem('nexo_active_call');

      return guardado ? lerJsonCompativel(guardado) : null;
    } catch {
      return null;
    }
  });
  const [isMicMuted, definirIsMicMuted] = useState(() => {
    try {
      return localStorage.getItem('nexo_mic_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [isDeafened, definirIsDeafened] = useState(() => {
    try {
      return localStorage.getItem('nexo_deafened') === 'true';
    } catch {
      return false;
    }
  });
  const iniciarChamada = ({
    roomId: salaId,
    roomName: salaNome,
    contextTitle: contextoTitulo = 'Conferência NEXO',
    idCurso: cursoId = null,
    idEspaco: espacoId = null,
    returnUrl = '',
  }) => {
    const chamadaDados = {
      roomId: salaId,
      roomName: salaNome,
      contextTitle: contextoTitulo,
      idCurso: cursoId,
      idEspaco: espacoId,
      returnUrl,
      startedAt: Date.now(),
    };

    definirAtivoChamada(chamadaDados);
    try {
      sessionStorage.setItem('nexo_active_call', JSON.stringify(chamadaDados));
    } catch {}
  };

  const terminarChamada = () => {
    definirAtivoChamada(null);
    try {
      sessionStorage.removeItem('nexo_active_call');
    } catch {}

    window.dispatchEvent(new Event('nexo_call_ended'));
  };

  const sairChamada = useCallback(() => {
    soundEffects.reproduzirSairChamada();
    window.dispatchEvent(new CustomEvent('nexo_call_leave'));
    terminarChamada();
  }, []);
  const alternarMic = useCallback(() => {
    if (ativoChamada) {
      window.dispatchEvent(new CustomEvent('nexo_call_toggle_mic'));
    } else {
      definirIsMicMuted((anterior) => {
        const seguinte = !anterior;
        try {
          localStorage.setItem('nexo_mic_muted', String(seguinte));
        } catch {}

        if (seguinte) {
          soundEffects.reproduzirMute();
        } else {
          soundEffects.reproduzirAtivarMicrofone();
          // Desmutar enquanto ensurdecido desativa também o ensurdecimento
          definirIsDeafened(false);
          try {
            localStorage.setItem('nexo_deafened', 'false');
          } catch {}
        }

        return seguinte;
      });
    }
  }, [ativoChamada]);
  const alternarSilenciarAudio = useCallback(() => {
    if (ativoChamada) {
      window.dispatchEvent(new CustomEvent('nexo_call_toggle_deafen'));
    } else {
      definirIsDeafened((anterior) => {
        const seguinte = !anterior;
        try {
          localStorage.setItem('nexo_deafened', String(seguinte));
        } catch {}

        if (seguinte) {
          soundEffects.reproduzirSilenciarAudio();
          // Ao ficar ensurdecido, o microfone desliga-se automaticamente também!
          definirIsMicMuted(true);
          try {
            localStorage.setItem('nexo_mic_muted', 'true');
          } catch {}
        } else {
          soundEffects.reproduzirAtivarAudio();
        }

        return seguinte;
      });
    }
  }, [ativoChamada]);
  const atualizarChamadaAudioEstado = useCallback(({ isMuted, isDeafened: deafened }) => {
    if (isMuted !== undefined) {
      const val = Boolean(isMuted);

      definirIsMicMuted(val);
      try {
        localStorage.setItem('nexo_mic_muted', String(val));
      } catch {}
    }

    if (deafened !== undefined) {
      const val = Boolean(deafened);

      definirIsDeafened(val);
      try {
        localStorage.setItem('nexo_deafened', String(val));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const tratarArmazenamento = (evento) => {
      if (evento.key === 'nexo_active_call') {
        try {
          definirAtivoChamada(evento.newValue ? lerJsonCompativel(evento.newValue) : null);
        } catch {}
      }
    };

    window.addEventListener('storage', tratarArmazenamento);

    return () => window.removeEventListener('storage', tratarArmazenamento);
  }, []);

  return (
    <ContextoChamadaAtiva.Provider
      value={{
        activeCall: ativoChamada,
        iniciarChamada,
        terminarChamada,
        leaveCall: sairChamada,
        setActiveCall: definirAtivoChamada,
        isMicMuted,
        setIsMicMuted: definirIsMicMuted,
        isDeafened,
        setIsDeafened: definirIsDeafened,
        toggleMic: alternarMic,
        toggleDeafen: alternarSilenciarAudio,
        updateCallAudioState: atualizarChamadaAudioEstado,
      }}
    >
      {conteudoFilho}
    </ContextoChamadaAtiva.Provider>
  );
};

export const useChamadaAtiva = () => {
  const contexto = useContext(ContextoChamadaAtiva);

  return (
    contexto || {
      activeCall: null,
      iniciarChamada: () => {},
      terminarChamada: () => {},
      leaveCall: () => {},
      setActiveCall: () => {},
      isMicMuted: false,
      setIsMicMuted: () => {},
      isDeafened: false,
      setIsDeafened: () => {},
      toggleMic: () => {},
      toggleDeafen: () => {},
      updateCallAudioState: () => {},
    }
  );
};

export default ContextoChamadaAtiva;
