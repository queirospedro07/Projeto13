import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { Logo } from '../ui/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000, active: false });

  const handleMouseMove = (e) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative bg-white dark:bg-[#06070a] border-t border-slate-200 dark:border-neutral-900 font-sans transition-colors overflow-hidden pb-0 select-none group"
    >
      {/* Clean Minimalist Ambient Background with Dynamic Mouse Spotlight */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_70%)] blur-3xl" />
      </div>

      {/* Real-Time Mouse Spotlight in Footer Background */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: mousePos.active ? 1 : 0,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 75%)`
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-10 md:pt-16 pb-6 relative z-10">
        
        {/* Main Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-12">
          
          {/* Brand & Description */}
          <div className="space-y-4 max-w-sm">
            <Logo size="lg" to="/" />
            <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed">
              Plataforma de excelência para formação tecnológica prática, salas de mentoria WebRTC em tempo real e certificação verificada.
            </p>
          </div>

          {/* Navigation Links - 2 columns on mobile, row on tablet/desktop */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-8 sm:gap-16 md:gap-20 text-sm">
            
            {/* Column 1: Formações */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white block">
                Formações
              </span>
              <ul className="space-y-2.5 text-slate-600 dark:text-neutral-400">
                <li>
                  <Link to="/explore" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Todos os Cursos
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=Programação" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Programação & Web
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=Design" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Design UI/UX
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=DevOps" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    DevOps & Cloud
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Plataforma */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white block">
                Plataforma
              </span>
              <ul className="space-y-2.5 text-slate-600 dark:text-neutral-400">
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Dashboard do Aluno
                  </Link>
                </li>
                <li>
                  <Link to="/creator/studio" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Estúdio de Criação
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Salas WebRTC
                  </Link>
                </li>
                <li>
                  <Link to="/certificates/verify" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Validação de Diplomas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Comunidade */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white block">
                Comunidade
              </span>
              <ul className="space-y-2.5 text-slate-600 dark:text-neutral-400">
                <li>
                  <Link to="/community" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Comunidade Ativa
                  </Link>
                </li>
                <li>
                  <Link to="/admin/apply" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Candidatura a Formador
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Iniciar Sessão
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/queirospedro7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 dark:text-neutral-500">
          <span>© {currentYear} NEXO. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 dark:hover:text-neutral-300 cursor-pointer">Termos</span>
            <span>•</span>
            <span className="hover:text-slate-800 dark:hover:text-neutral-300 cursor-pointer">Privacidade</span>
            <span>•</span>
            <span>Portugal</span>
          </div>
        </div>

      </div>

      {/* Giant Monumental Wordmark NEXO: Pure Black in Light Mode (#000000), Pure White in Dark Mode */}
      {/* 100% Static & Stable (No letter animation), cutting off at the bottom edge */}
      <div className="w-full overflow-hidden leading-none select-none relative mt-2 z-10 pointer-events-none">
        <div className="font-display font-black text-[clamp(3.75rem,22vw,28rem)] leading-[0.65] tracking-[-0.06em] sm:tracking-[-0.08em] text-center uppercase whitespace-nowrap text-black dark:text-white translate-y-[15%]">
          NEXO
        </div>
      </div>
    </footer>
  );
}
