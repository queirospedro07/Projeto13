import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  CheckCircle2,
  ChevronDown,
  Star,
  Sparkles,
  Radio,
  FileCode2,
  Award,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/common/SEO';

export const LandingPage = () => {
  const { user, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const [heroMouse, setHeroMouse] = useState({ x: -1000, y: -1000, active: false });

  const handleHeroMouseMove = (event) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setHeroMouse({ x: event.clientX - rect.left, y: event.clientY - rect.top, active: true });
  };

  const handleHeroMouseLeave = () => {
    setHeroMouse((current) => ({ ...current, active: false }));
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isMuted, isPlaying]);

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    setIsMuted((current) => !current);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'CREATOR' ? '/creator' : '/dashboard';

  const faqs = [
    {
      q: 'O que é a plataforma NEXO?',
      a: 'O NEXO é uma plataforma de aprendizagem e comunidade onde podes acompanhar cursos práticos em vídeo, tirar dúvidas em canais de estudo com áudio e partilha de ecrã (WebRTC) e obter certificados ao concluir as formações.'
    },
    {
      q: 'O registo como aluno é gratuito?',
      a: 'Sim, criar conta é gratuito e dá acesso imediato aos cursos abertos, aos espaços da comunidade e aos recursos das aulas.'
    },
    {
      q: 'Como posso tornar-me formador no NEXO?',
      a: 'Qualquer utilizador registado pode submeter uma candidatura a formador através do seu painel. Depois de analisada e aprovada pela administração, a conta passa a ter acesso ao Estúdio do Criador.'
    },
    {
      q: 'Como funcionam os certificados?',
      a: 'Quando concluíres 100% das aulas e questionários de um curso, é gerado automaticamente um certificado digital com um código único de verificação.'
    }
  ];

  return (
    <>
      <SEO
        title="NEXO — Plataforma de Aprendizagem e Comunidade"
        description="Plataforma de cursos online, salas de estudo WebRTC em tempo real, certificados digitais e comunidade de estudantes."
        canonical="https://nexo.pt/"
        ogImage="/hero-showcase.jpg"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "NEXO",
          "url": "https://nexo.pt",
          "logo": "https://nexo.pt/favicon.svg",
          "description": "Plataforma de cursos práticos, salas de estudo WebRTC e comunidade.",
          "sameAs": [
            "https://github.com/queirospedro7"
          ]
        }}
      />
      <div className="min-h-screen bg-white dark:bg-[#06070a] text-slate-900 dark:text-white font-sans transition-colors selection:bg-blue-600 selection:text-white">
      
      {/* Secção Principal (Hero) */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full min-h-0 lg:min-h-[calc(100vh-4rem)] bg-white dark:bg-[#06070a] text-slate-900 dark:text-white flex flex-col justify-between overflow-visible lg:overflow-hidden border-b border-slate-200 dark:border-neutral-900 transition-colors"
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)] blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: heroMouse.active ? 1 : 0,
              background: `radial-gradient(600px circle at ${heroMouse.x}px ${heroMouse.y}px, rgba(37, 99, 235, 0.16) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 75%)`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#06070a]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">
            
            {/* Vídeo de apresentação */}
            <div className="order-1 lg:order-2 lg:col-span-7 w-full flex flex-col items-center justify-center">
              <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-neutral-800 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/70 dark:ring-neutral-700/60">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-transparent to-blue-900/20 pointer-events-none" />
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Vídeo de demonstração da plataforma NEXO"
                >
                  <source src="/video.mp4" type="video/mp4" />
                  O seu navegador não suporta a reprodução de vídeo.
                </video>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 cursor-pointer"
                      aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
                      title={isMuted ? 'Ativar som' : 'Silenciar som'}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={togglePlay}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 cursor-pointer"
                      aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                      title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Texto e botões */}
            <div className="order-2 lg:order-1 lg:col-span-5 space-y-5 sm:space-y-8">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] sm:leading-[1.04] text-balance">
                Aprenda, construa e evolua.
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                Uma plataforma pensada para estudar ao seu ritmo: cursos práticos em vídeo, salas de estudo WebRTC em tempo real e certificados no final de cada curso.
              </p>

              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {user ? (
                  <Link to={dashboardPath} className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 cursor-pointer group">
                      <span>Ir para o Meu Painel</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </Link>
                ) : (
                  <Link to="/register" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg bg-slate-950 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl cursor-pointer group">
                      <span>Criar Conta Gratuita</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </Link>
                )}

                <Link to="/explore" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold text-sm backdrop-blur-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                    <Compass className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    <span>Explorar Catálogo</span>
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Acesso flexível</span>
                </div>
                <span className="hidden xs:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Comunidade ativa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full border-t border-slate-200 dark:border-neutral-900 bg-slate-50/90 dark:bg-black/40 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Disponibilidade</span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5">Acesso Online 24/7</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Salas de Estudo</span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5 truncate">Voz e Vídeo WebRTC</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Certificados</span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5">Código de Verificação</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Avaliação dos Alunos</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold">4.8 / 5</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secção de Funcionalidades Principais */}
      <section id="vantagens" className="scroll-mt-20 py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-14 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            Tudo o que precisa para estudar e colaborar num único sítio.
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-neutral-400 mt-2 sm:mt-4 leading-relaxed">
            Acompanhe as aulas em vídeo, tire dúvidas nos canais da comunidade e acompanhe o seu progresso ao longo dos cursos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          
          {/* Card 1: Aulas Práticas & Código Real */}
          <Link to="/explore" className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d14] hover:border-blue-500/50 dark:hover:border-blue-500/50 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-lg cursor-pointer">
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-8">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCode2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Prática Real
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Cursos Práticos & Projetos
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2.5 sm:mt-3 leading-relaxed">
                Aprenda com aulas estruturadas, desafios aplicados e projetos completos prontos para produção.
              </p>
            </div>

            <div className="pt-5 sm:pt-8 mt-4 sm:mt-6 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Explorar Catálogo
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 group-hover:bg-blue-600 group-hover:border-blue-600 text-slate-700 dark:text-neutral-300 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          {/* Card 2: Comunidades & WebRTC */}
          <Link to="/community" className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d14] hover:border-blue-500/50 dark:hover:border-blue-500/50 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-lg cursor-pointer">
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-8">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Colaboração
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Salas WebRTC & Comunidade
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2.5 sm:mt-3 leading-relaxed">
                Tire dúvidas em tempo real com formadores e participe em canais de voz com partilha de ecrã 24/7.
              </p>
            </div>

            <div className="pt-5 sm:pt-8 mt-4 sm:mt-6 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Entrar nas Salas
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 group-hover:bg-blue-600 group-hover:border-blue-600 text-slate-700 dark:text-neutral-300 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          {/* Card 3: Certificação Verificada */}
          <Link to="/explore" className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d14] hover:border-blue-500/50 dark:hover:border-blue-500/50 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-lg cursor-pointer">
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-8">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Credencial
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Certificação Verificada
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2.5 sm:mt-3 leading-relaxed">
                Obtenha certificados com identificador único verificável para destacar o seu perfil no LinkedIn e CV.
              </p>
            </div>

            <div className="pt-5 sm:pt-8 mt-4 sm:mt-6 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Ver Certificação
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 group-hover:bg-blue-600 group-hover:border-blue-600 text-slate-700 dark:text-neutral-300 group-hover:text-white flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Secção Responsiva */}
      <section className="py-6 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0c0d12] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center shadow-xs">
          
          <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 space-y-4 sm:space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Acesso em Qualquer Dispositivo
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
              Estude em qualquer ecrã, ao seu próprio ritmo.
            </h2>
            <p className="text-xs sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Alterne facilmente entre o computador e o telemóvel. Continue as aulas de onde parou, consulte os seus apontamentos e participe nos canais de estudo da turma.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/explore" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-black dark:hover:bg-slate-100 font-bold text-sm transition-all shadow-xs cursor-pointer">
                  Começar Agora
                </button>
              </Link>
              <Link to="/library" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white font-bold text-sm transition-colors cursor-pointer">
                  Aceder à Minha Biblioteca
                </button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 h-56 sm:h-80 lg:h-full relative overflow-hidden bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80"
              alt="Plataforma NEXO no computador e telemóvel"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-[#0c0d12] via-transparent to-transparent hidden lg:block" />
          </div>

        </div>
      </section>

      {/* Candidatura a Formador */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0c0d12] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Formadores NEXO
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              Quer publicar os seus próprios cursos?
            </h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Submeta uma candidatura a formador. Depois de aprovada pela administração, terá acesso ao Estúdio do Criador para criar módulos, aulas em vídeo e questionários.
            </p>
          </div>

          <Link to="/creator/apply" className="shrink-0 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 text-slate-900 dark:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Candidatura a Formador</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200 dark:border-neutral-800">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Dúvidas Comuns
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white mt-1">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] overflow-hidden shadow-xs"
            >
              <button
                id={`faq-question-${idx}`}
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                aria-expanded={openFaq === idx}
                aria-controls={`faq-answer-${idx}`}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-950 dark:text-white cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-neutral-800/80 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Banner Final */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-slate-950 dark:bg-black border border-slate-800 p-8 sm:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Comece a explorar os cursos na plataforma NEXO
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
              Crie uma conta gratuita para assistir às aulas, resolver questionários e participar nas salas de estudo da comunidade.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white text-slate-950 hover:bg-slate-100 font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                  <span>Criar Conta Gratuita</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/explore" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-7 py-3.5 rounded-lg border border-white/20 hover:bg-white/10 text-white font-bold text-sm transition-colors cursor-pointer">
                  Explorar Cursos
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
};

export default LandingPage;