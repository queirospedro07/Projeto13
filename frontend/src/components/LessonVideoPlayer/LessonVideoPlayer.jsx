import './LessonVideoPlayer.css';
import { useRef, useState } from 'react';
import {
  LuPlay as Play,
  LuPause as Pause,
  LuVolume2 as Volume2,
  LuVolumeX as VolumeX,
  LuCaptions as Subtitles,
  LuCheck as Check,
  LuVideo as Video,
} from 'react-icons/lu';
import { formatDuration } from '../../utils/formatters';

export const getYouTubeEmbedUrl = (url) => {
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

export const LessonVideoPlayer = ({
  videoUrl,
  title,
  durationMin = 15,
  isCompleted = false,
  onMarkComplete,
  xpReward = 25,
}) => {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMin * 60);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }

    setShowSpeedMenu(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="lesson-video-player-panel">
      <div className="lesson-video-player-panel-2 ui-group">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="lesson-video-player-iframe"
          />
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              if (onMarkComplete && !isCompleted) onMarkComplete();
            }}
            className="lesson-video-player-video"
          />
        ) : (
          <div className="lesson-video-player-panel-3">
            <div className="lesson-video-player-panel-4">
              <Video className="lesson-video-player-video-2" />
            </div>
            <h3 className="lesson-video-player-subheading">{title}</h3>
            <p className="lesson-video-player-description">
              Transmissão em alta definição 1080p disponível para reprodução.
            </p>
            <button
              onClick={togglePlay}
              className="lesson-video-player-button"
            >
              <Play className="lesson-video-player-play" />
              <span>Iniciar Vídeo-Aula</span>
            </button>
          </div>
        )}

        {!youtubeEmbedUrl && videoUrl && (
          <div className="lesson-video-player-panel-5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="lesson-video-player-field"
            />

            <div className="lesson-video-player-panel-6">
              <div className="lesson-video-player-panel-7">
                <button
                  onClick={togglePlay}
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
                    onClick={toggleMute}
                    className="lesson-video-player-button-2"
                  >
                    {isMuted ? (
                      <VolumeX className="lesson-video-player-volume-x" />
                    ) : (
                      <Volume2 className="lesson-video-player-pause" />
                    )}
                  </button>
                  <span className="lesson-video-player-label">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>
              </div>

              <div className="lesson-video-player-panel-7">
                <div className="lesson-video-player-panel-9">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="lesson-video-player-button-3"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="lesson-video-player-panel-10">
                      {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`lesson-video-player-button-4 ${playbackRate === speed ? 'lesson-video-player-button-5' : 'lesson-video-player-button-6'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSubtitlesOn(!subtitlesOn)}
                  className={`lesson-video-player-button-7 ${subtitlesOn ? 'lesson-video-player-button-8' : 'lesson-video-player-button-9'}`}
                  title="Legendas em Português"
                >
                  <Subtitles className="lesson-video-player-subtitles" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lesson-video-player-panel-11">
        <div>
          <h2 className="lesson-video-player-heading">{title}</h2>
          <p className="lesson-video-player-description-2">
            Duração estimada: {durationMin} minutos
          </p>
        </div>

        {onMarkComplete && (
          <button
            onClick={onMarkComplete}
            className={`lesson-video-player-button-10 ${isCompleted ? 'lesson-video-player-button-11 subtle-shadow' : 'lesson-video-player-button-12'}`}
          >
            {isCompleted ? (
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
