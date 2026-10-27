import './AulaVideoLeitor.css';
import { useRef, useState } from 'react';
import {
  LuPlay as Play,
  LuPause as Pause,
  LuVolume2 as Volume2,
  LuVolumeX as VolumeX,
  LuCheck as Check,
  LuVideo as Video,
} from 'react-icons/lu';
import { formatarDuracao } from '../../utilitarios/formatacao';

export const obterYouTubeIncorporadoUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
  }

  return null;
};

export const AulaVideoLeitor = ({
  urlVideo,
  title: titulo,
  duracaoMinutos: duracaoMin = 15,
  isCompleted: isConcluido = false,
  onMarkComplete: onMarcarConcluir,
}) => {
  const YouTubeIncorporadoUrl = obterYouTubeIncorporadoUrl(urlVideo);
  const videoRef = useRef(null);
  const [isPlaying, definirIsPlaying] = useState(false);

  const [isMuted, definirIsMuted] = useState(false);
  const [playbackRate, definirPlaybackRate] = useState(1);
  const [mostrarVelocidadeMenu, definirMostrarVelocidadeMenu] = useState(false);
  const [atualTempo, definirAtualTempo] = useState(0);
  const [duracao, definirDuracao] = useState(duracaoMin * 60);
  const [erroVideo, definirErroVideo] = useState('');
  const alternarReproduzir = async () => {
    const video = videoRef.current;
    if (!video) return;
    definirErroVideo('');
    if (!video.paused) {
      video.pause();

      return;
    }

    try {
      await video.play();
    } catch {
      definirErroVideo(
        'Não foi possível reproduzir o vídeo. Verifique a ligação e tente novamente.',
      );
    }
  };

  const tratarTempoAtualizar = () => {
    if (videoRef.current) {
      definirAtualTempo(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        definirDuracao(videoRef.current.duration);
      }
    }
  };

  const tratarSeek = (evento) => {
    const tempo = Number(evento.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = tempo;
      definirAtualTempo(tempo);
    }
  };

  const tratarVelocidadeAlterar = (velocidade) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = velocidade;
      definirPlaybackRate(velocidade);
    }

    definirMostrarVelocidadeMenu(false);
  };

  const alternarMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    definirIsMuted(!isMuted);
  };

  return (
    <div className="lesson-video-player-panel">
      <div className="lesson-video-player-panel-2 ui-group">
        {YouTubeIncorporadoUrl ? (
          <iframe
            src={YouTubeIncorporadoUrl}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="lesson-video-player-iframe"
          />
        ) : urlVideo ? (
          <video
            ref={videoRef}
            src={urlVideo}
            playsInline
            preload="metadata"
            onPlay={() => definirIsPlaying(true)}
            onPause={() => definirIsPlaying(false)}
            onError={() => definirErroVideo('O vídeo não está disponível neste momento.')}
            onTimeUpdate={tratarTempoAtualizar}
            onLoadedMetadata={tratarTempoAtualizar}
            onEnded={() => {
              definirIsPlaying(false);
              if (onMarcarConcluir && !isConcluido) onMarcarConcluir();
            }}
            className="lesson-video-player-video"
          />
        ) : (
          <div className="lesson-video-player-panel-3">
            <div className="lesson-video-player-panel-4">
              <Video className="lesson-video-player-video-2" />
            </div>
            <h3 className="lesson-video-player-subheading">{titulo}</h3>
            <p className="lesson-video-player-description">
              Esta aula ainda não tem um vídeo disponível.
            </p>
          </div>
        )}

        {!YouTubeIncorporadoUrl && urlVideo && (
          <div className="lesson-video-player-panel-5">
            <input
              aria-label="Posição do vídeo"
              type="range"
              min={0}
              max={duracao || 100}
              value={atualTempo}
              onChange={tratarSeek}
              className="lesson-video-player-field"
            />

            <div className="lesson-video-player-panel-6">
              <div className="lesson-video-player-panel-7">
                <button
                  aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                  onClick={alternarReproduzir}
                  className="lesson-video-player-button-2"
                >
                  {isPlaying ? (
                    <Pause className="lesson-video-player-pause" />
                  ) : (
                    <Play className="lesson-video-player-play-2" />
                  )}
                </button>

                <div className="lesson-video-player-panel-8">
                  <button
                    aria-label={isMuted ? 'Ativar som' : 'Silenciar vídeo'}
                    onClick={alternarMute}
                    className="lesson-video-player-button-2"
                  >
                    {isMuted ? (
                      <VolumeX className="lesson-video-player-volume-x" />
                    ) : (
                      <Volume2 className="lesson-video-player-pause" />
                    )}
                  </button>
                  <span className="lesson-video-player-label">
                    {formatarDuracao(atualTempo)} / {formatarDuracao(duracao)}
                  </span>
                </div>
              </div>

              <div className="lesson-video-player-panel-7">
                <div className="lesson-video-player-panel-9">
                  <button
                    onClick={() => definirMostrarVelocidadeMenu(!mostrarVelocidadeMenu)}
                    className="lesson-video-player-button-3"
                  >
                    {playbackRate}x
                  </button>
                  {mostrarVelocidadeMenu && (
                    <div className="lesson-video-player-panel-10">
                      {[0.75, 1, 1.25, 1.5, 2].map((velocidade) => (
                        <button
                          key={velocidade}
                          onClick={() => tratarVelocidadeAlterar(velocidade)}
                          className={`lesson-video-player-button-4 ${playbackRate === velocidade ? 'lesson-video-player-button-5' : 'lesson-video-player-button-6'}`}
                        >
                          {velocidade}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {erroVideo && <p role="alert">{erroVideo}</p>}
      <div className="lesson-video-player-panel-11">
        <div>
          <h2 className="lesson-video-player-heading">{titulo}</h2>
          <p className="lesson-video-player-description-2">
            Duração estimada: {duracaoMin} minutos
          </p>
        </div>

        {onMarcarConcluir && (
          <button
            onClick={onMarcarConcluir}
            className={`lesson-video-player-button-10 ${isConcluido ? 'lesson-video-player-button-11 subtle-shadow' : 'lesson-video-player-button-12'}`}
          >
            {isConcluido ? (
              <>
                <Check className="lesson-video-player-check" />
                <span>Aula Concluída</span>
              </>
            ) : (
              <>
                <Check className="lesson-video-player-subtitles" />
                <span>Concluir Aula</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
