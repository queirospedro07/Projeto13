import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Subtitles, 
  RotateCcw, 
  Check, 
  Award,
  Video
} from 'lucide-react';
import { formatDuration } from '../../../utils/formatters';

interface LessonVideoPlayerProps {
  videoUrl?: string;
  title: string;
  durationMin?: number;
  isCompleted?: boolean;
  onMarkComplete?: () => void;
  xpReward?: number;
}

// Helper to extract YouTube embed URL
export const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
  }
  return null;
};

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  videoUrl,
  title,
  durationMin = 15,
  isCompleted = false,
  onMarkComplete,
  xpReward = 25
}) => {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
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
    <div className="flex flex-col gap-6 antialiased">
      {/* Video Container */}
      <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
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
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-950 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center mb-4 shadow-lg border border-slate-700">
              <Video className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Transmissão em alta definição 1080p disponível para reprodução.
            </p>
            <button
              onClick={togglePlay}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Vídeo-Aula</span>
            </button>
          </div>
        )}

        {/* Video Overlay Custom Controls (Only for native HTML5 video, not iframe) */}
        {!youtubeEmbedUrl && videoUrl && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Timeline */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
            />

            <div className="flex items-center justify-between text-white text-xs font-semibold">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="p-1.5 hover:text-slate-300 cursor-pointer">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button onClick={toggleMute} className="p-1.5 hover:text-slate-300 cursor-pointer">
                    {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <span className="font-mono text-xs text-slate-300">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Playback speed selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-xs font-mono font-semibold cursor-pointer"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-xl flex flex-col gap-1 z-20">
                      {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold text-left cursor-pointer ${playbackRate === speed ? 'bg-white text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitles toggle */}
                <button
                  onClick={() => setSubtitlesOn(!subtitlesOn)}
                  className={`p-1.5 rounded cursor-pointer ${subtitlesOn ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                  title="Legendas em Português"
                >
                  <Subtitles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Complete Status Bar */}
      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Duração estimada: {durationMin} minutos • Recompensa: +{xpReward} XP</p>
        </div>

        {onMarkComplete && (
          <button
            onClick={onMarkComplete}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                : 'bg-slate-950 text-white hover:bg-slate-800 shadow-xs'
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Lição Concluída (+{xpReward} XP)</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Concluir Lição (+{xpReward} XP)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
