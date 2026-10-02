import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  CheckCircle2,
  Play,
  ChevronDown,
  Star,
  Clock,
  Sparkles,
  Radio,
  FileCode2,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { LogoIcon } from '../../components/ui/Logo';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/common/SEO';

export const LandingPage = () => {
  const { user, isLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  const heroRef = useRef(null);
  const [heroMouse, setHeroMouse] = useState({ x: -1000, y: -1000, active: false });

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setHeroMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroMouse((prev) => ({ ...prev, active: false }));
  };

  const fallbackCourses = [
    {
      id: 'course-react-ts',
      title: 'React 19 & TypeScript de Alta Performance',
      description: 'Domine os novos padrões do React 19, Server Components, Gestão de Estado Eficiente, Hooks Modernos e TypeScript Avançado com projetos reais.',
      category: 'Programação',
      price: 0,
      isFree: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      durationHours: 14.5,
      rating: 4.9,
      enrolledCount: 1420
    },
    {
      id: 'course-ui-ux',
      title: 'Design Systems & Interfaces Cinemáticas no Figma',
      description: 'Crie sistemas de design industriais, tokens de cores, tipografia responsiva, componentes reutilizáveis e protótipos de alta fidelidade.',
      category: 'Design UI/UX',
      price: 29.0,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      durationHours: 18,
      rating: 4.8,
      enrolledCount: 890
    },
    {
      id: 'course-cloud-devops',
      title: 'Docker, Contentores e Arquitetura de Produção',
      description: 'Domine contentores, orquestração, servidores Linux e fluxos de integração contínua para colocar projetos escaláveis em produção.',
      category: 'DevOps',
      price: 39.0,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      durationHours: 20,
      rating: 4.9,
      enrolledCount: 1105
    }
  ];

  useEffect(() => {
    if (user) return;
    api
      .getCourses({ sort: 'popular' })
      .then((data) => {
        if (data && data.length > 0) {
          setCourses(data.slice(0, 3));
        } else {
          setCourses(fallbackCourses);
        }
      })
      .catch(() => {
        setCourses(fallbackCourses);
      });
  }, [user]);

  if (isLoading) {
    return null;
  }

  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'CREATOR' ? '/creator' : '/dashboard';

  const faqs = [
    {
      q: 'O que é a plataforma NEXO?',
      a: 'O NEXO é uma plataforma de formação de excelência em múltiplas áreas do conhecimento. Combina cursos práticos estruturados com salas de mentoria em direto via WebRTC, apoio comunitário contínuo e certificação digital verificada.'
    },
    {
      q: 'O registo como aluno é gratuito?',
      a: 'Sim, o registo inicial é 100% gratuito e confere acesso imediato a cursos abertos, às salas de conferência da comunidade e ao repositório de recursos.'
    },
    {
      q: 'Como posso tornar-me formador no NEXO?',
      a: 'Qualquer aluno pode submeter um inquérito de candidatura a formador através do painel. A equipa de administração do NEXO avalia o perfil, a experiência e a proposta curricular antes de validar e aprovar o acesso ao Estúdio de Criação.'
    },
    {
      q: 'Como funciona a certificação digital?',
      a: 'Ao concluir 100% das aulas e testes práticos de um curso, é emitido um certificado digital oficial com código de autenticação único que pode ser partilhado diretamente no LinkedIn e no currículo profissional.'
    }
  ];

  return (
    <>
      <SEO
        title="NEXO — Plataforma de Formação & Conhecimento de Excelência"
        description="NEXO é a plataforma de aprendizagem de alta performance com cursos práticos, mentoria WebRTC em tempo real, certificados verificados e estúdio de criadores."
        canonical="https://nexo.pt/"
        ogImage="/hero-showcase.jpg"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "NEXO",
          "url": "https://nexo.pt",
          "logo": "https://nexo.pt/favicon.svg",
          "description": "Plataforma de formação prática, mentoria WebRTC e certificação verificada.",
          "sameAs": [
            "https://github.com/queirospedro7"
          ]
        }}
      />
      <div className="min-h-screen bg-white dark:bg-[#06070a] text-slate-900 dark:text-white font-sans transition-colors selection:bg-blue-600 selection:text-white">
      
      {/* 1. FULLSCREEN HERO SECTION (Ocupa o ecrã inteiro no Desktop e adapta-se com fluidez no Telemóvel) */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full min-h-0 lg:min-h-[calc(100vh-4rem)] bg-white dark:bg-[#06070a] text-slate-900 dark:text-white flex flex-col justify-between overflow-visible lg:overflow-hidden border-b border-slate-200 dark:border-neutral-900 transition-colors"
      >
        
        {/* Clean Minimalist Ambient Background with Dynamic Mouse Spotlight */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Subtle Top Ambient Soft Glow */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)] blur-3xl" />

          {/* Real-Time Interactive Mouse Spotlight in Hero Background */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: heroMouse.active ? 1 : 0,
              background: `radial-gradient(600px circle at ${heroMouse.x}px ${heroMouse.y}px, rgba(37, 99, 235, 0.16) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 75%)`
            }}
          />

          {/* Smooth Bottom Edge Fade into next section */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#06070a]" />
        </div>

        {/* Hero Main Content (Clean, Spacious & Clutter-Free) */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 flex-1 flex flex-col justify-center">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Bold Typography & Clean Square CTAs */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-8">

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] sm:leading-[1.04] text-balance">
                Aprenda, construa e evolua.
              </h1>

              {/* Concise Subhead */}
              <p className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                Aceda à plataforma de excelência desenhada para impulsionar as suas competências: cursos práticos estruturados, salas de mentoria WebRTC em direto e certificação verificada.
              </p>

              {/* Action Buttons */}
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
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        <path
                          d="M7 17L17 7M17 7H7M17 7V17"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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

              {/* Trust Tag */}
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

            {/* Right Column: Simple Clean Code Background Image */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 shadow-xl relative group bg-slate-950">
                <img
                  src="/hero-code.jpg"
                  alt="Plataforma de Formação NEXO"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="eager"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Telemetry Strip (Spans full width across screen) */}
        <div className="relative z-10 w-full border-t border-slate-200 dark:border-neutral-900 bg-slate-50/90 dark:bg-black/40 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  Disponibilidade
                </span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5">
                  Operação 24/7
                </strong>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  Salas de Estudo
                </span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5 truncate">
                  Mentoria & Voz WebRTC
                </strong>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  Credenciais
                </span>
                <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold block mt-0.5">
                  100% Certificadas
                </strong>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                  Avaliação Média
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <strong className="text-slate-950 dark:text-white text-sm sm:text-base lg:text-lg font-bold">
                    4.9 / 5
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 2. THE 3 USP VISUAL CARDS (Cards arquiteturais sem imagens, com ícones e botão de ação) */}
      <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-14 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            Construa o seu conhecimento a partir de uma única plataforma, desenhada para o futuro.
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-neutral-400 mt-2 sm:mt-4 leading-relaxed">
            Todas as ferramentas necessárias para aprender de forma prática, tirar dúvidas com especialistas e comprovar as suas competências no mercado.
          </p>
        </div>

        {/* 3 Columns Grid - Clean, Image-Free Architecture */}
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

      {/* 3. BANNER VISUAL CONTAINED (Multi-Screen Responsive Learning) */}
      <section className="py-6 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0c0d12] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center shadow-xs">
          
          <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 space-y-4 sm:space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Acesso Universal & Flexível
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
              Aprenda em qualquer ecrã, ao seu próprio ritmo.
            </h2>
            <p className="text-xs sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Transite facilmente entre o computador e os dispositivos móveis. Continue as suas aulas exatamente de onde parou, consulte as suas anotações técnicas e participe em discussões de turma sem interrupções.
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

      {/* 4. REAL COURSES SHOWCASE (Catálogo de Destaque da Base de Dados) */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Formações em Destaque
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white mt-1">
              Explore Cursos Validados
            </h2>
          </div>

          <Link
            to="/explore"
            className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-200"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                    {course.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-2">
                    {course.rating || course.averageRating ? (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        {course.rating || course.averageRating}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 dark:text-neutral-500 font-medium">
                        <Star className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-700" />
                        Sem avaliações
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.durationHours || 12}h
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-950 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 dark:border-neutral-800/80 mt-2 flex items-center justify-between">
                <span className="text-base font-bold text-slate-950 dark:text-white">
                  {formatCoursePrice(course)}
                </span>

                <Link
                  to={`/courses/${course.id}`}
                  className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CREATOR CANDIDATURE BANNER */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0c0d12] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Junte-se aos Formadores NEXO
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              Tem conhecimento especializado para partilhar?
            </h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Submeta a sua candidatura a formador. Após aprovação da equipa pedagógica, terá acesso completo ao Estúdio de Criação para publicar cursos e construir a sua audiência.
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

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
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
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-950 dark:text-white cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-neutral-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION BANNER */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-slate-950 dark:bg-black border border-slate-800 p-8 sm:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Pronto para transformar a sua carreira com o NEXO?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
              Crie a sua conta gratuita hoje mesmo e junte-se a milhares de alunos em cursos práticos e salas de estudo ativas.
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

      {/* 8. FOOTER */}
      <Footer />
    </div>
    </>
  );
};

export default LandingPage;