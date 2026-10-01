import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Radio, 
  PhoneOff, 
  ArrowRight, 
  Volume2, 
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { useActiveCall } from '../../context/ActiveCallContext';
import { soundEffects } from '../../services/soundEffects';

export const ActiveCallBanner = () => {
  return null;
};

  // Formatar tempo 00:00
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Se já estiver na página do curso e na sala ao vivo do curso ativo
  const isInSameCourse = activeCall.courseId && location.pathname.includes(activeCall.courseId);
  const isInSameSpace = activeCall.spaceId && location.pathname.includes(activeCall.spaceId);

  const handleReturnToCall = () => {
    try {
      window.dispatchEvent(new CustomEvent('nexo_focus_call', { detail: activeCall }));
    } catch {}
    if (activeCall.returnUrl) {
      navigate(activeCall.returnUrl);
    } else if (activeCall.courseId) {
      navigate(`/learn/${activeCall.courseId}`);
    } else if (activeCall.spaceId) {
      navigate(`/community/${activeCall.spaceId}`);
    }
  };

  const handleDisconnect = (e) => {
    e.stopPropagation();
    try {
      soundEffects.playLeaveCall();
    } catch {}
    endCall();
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-fade-in select-none">
      <div className="flex items-center gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl bg-neutral-950/95 text-white border border-neutral-800 shadow-2xl backdrop-blur-xl hover:border-neutral-700 transition-all">
        
        {/* Indicador de Pulso de Áudio */}
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
        </div>

        {/* Informação da Sala e Contexto */}
        <div 
          onClick={handleReturnToCall}
          className="cursor-pointer min-w-0 flex flex-col pr-1"
          title="Clique para voltar à chamada"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-mono">
              Em Chamada
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-white truncate max-w-[180px] sm:max-w-xs">
            <span className="truncate">{activeCall.roomName}</span>
            <span className="text-neutral-500 font-normal">•</span>
            <span className="text-neutral-400 font-medium truncate text-[11px]">
              {activeCall.contextTitle}
            </span>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 shrink-0 border-l border-neutral-800 pl-2 sm:pl-3">
          <button
            type="button"
            onClick={handleReturnToCall}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Voltar ao ecrã da chamada"
          >
            <span>Voltar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
            title="Desligar e sair da chamada"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallBanner;
