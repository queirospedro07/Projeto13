import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { Logo } from '../ui/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const animFrameRef = useRef(null);

  // Exact Pace (paceapp.space) interactive radial expanding puff ripple trail
  useEffect(() => {
    const canvas = canvasRef.current;
    const footer = footerRef.current;
    if (!canvas || !footer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isIntersecting = false;
    let isRunning = false;

    const handleResize = () => {
      if (!canvas || !footer) return;
      canvas.width = footer.offsetWidth;
      canvas.height = footer.offsetHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      if (!isIntersecting || trailRef.current.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isRunning = false;
        animFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');

      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.opacity -= 0.02;
        p.radius += 0.45;

        if (p.opacity <= 0) {
          trailRef.current.splice(i, 1);
          continue;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        if (isDark) {
          grad.addColorStop(0, `rgba(59, 130, 246, ${p.opacity * 0.95})`);
          grad.addColorStop(0.5, `rgba(99, 102, 241, ${p.opacity * 0.45})`);
          grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else {
          grad.addColorStop(0, `rgba(25, 149, 250, ${p.opacity * 0.95})`);
          grad.addColorStop(0.5, `rgba(59, 130, 246, ${p.opacity * 0.4})`);
          grad.addColorStop(1, 'rgba(25, 149, 250, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (trailRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        isRunning = false;
        animFrameRef.current = null;
      }
    };

    window.__pace_start_footer_trail = () => {
      if (isIntersecting && !isRunning) {
        isRunning = true;
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting && trailRef.current.length > 0 && !isRunning) {
        isRunning = true;
        animFrameRef.current = requestAnimationFrame(animate);
      } else if (!isIntersecting && isRunning) {
        isRunning = false;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      }
    }, { threshold: 0.01 });

    observer.observe(footer);

    return () => {
      delete window.__pace_start_footer_trail;
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const last = trailRef.current[trailRef.current.length - 1];

    if (!last || Math.hypot(x - last.x, y - last.y) > 10) {
      trailRef.current.push({ x, y, opacity: 1, radius: 90 });
      if (window.__pace_start_footer_trail) {
        window.__pace_start_footer_trail();
      }
    }
  };

  return (
    <>
      <footer
        ref={footerRef}
        onMouseMove={handleMouseMove}
        className="relative bg-white dark:bg-[#050608] border-t border-slate-200 dark:border-neutral-900 font-sans transition-colors overflow-hidden pb-0 select-none group"
      >
        {/* Subtle Ambient Background Gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18),transparent_70%)] blur-3xl" />
        </div>

        {/* Real-Time Interactive Fluid Pace-Style Cursor Trail Canvas */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full mix-blend-multiply dark:mix-blend-screen z-0"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-12 md:pt-16 pb-8 relative z-10">
          
          {/* Main Grid */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-16">
            
            {/* Brand & Description */}
            <div className="space-y-4 max-w-sm">
              <Logo size="lg" to="/" />
              <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed">
                Plataforma aberta de excelência para formação prática, mentorias WebRTC em tempo real e certificação verificada.
              </p>
            </div>

            {/* Navigation Links - 3 columns */}
            <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 md:gap-16 text-sm">
              
              {/* Column 1: Áreas de Estudo */}
              <div className="space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white block">
                  Áreas de Estudo
                </span>
                <ul className="space-y-2.5 text-slate-600 dark:text-neutral-400">
                  <li>
                    <Link to="/explore" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Catálogo Geral
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Negócios" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Negócios & Gestão
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Marketing" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Marketing & Vendas
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Línguas" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Línguas & Idiomas
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Programação" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Tecnologia & Web
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Design" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Design & Artes
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
                    <Link to="/" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
                      Página de Demonstração
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Painel do Aluno
                    </Link>
                  </li>
                  <li>
                    <Link to="/creator" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Estúdio do Formador
                    </Link>
                  </li>
                  <li>
                    <Link to="/community" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Salas de Mentoria WebRTC
                    </Link>
                  </li>
                  <li>
                    <Link to="/library" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                      Certificados & Diplomas
                    </Link>
                  </li>
                  <li>
                    <Link to="/help" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
                      Dúvidas & Suporte
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Comunidade & Inquéritos */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white block">
                  Comunidade & Moderação
                </span>
                <ul className="space-y-2.5 text-slate-600 dark:text-neutral-400">
                  <li>
                    <Link to="/creator/apply" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
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
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 dark:text-neutral-500">
            <span>© {currentYear} NEXO. Todos os direitos reservados.</span>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors">
                Termos de Utilização
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors">
                Política de Privacidade
              </Link>
              <span>•</span>
              <Link to="/help" className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors">
                Dúvidas & FAQ
              </Link>
              <span>•</span>
              <span>Portugal</span>
            </div>
          </div>

        </div>

        {/* Giant Monumental Wordmark NEXO: Pure Black in Light Mode (#000000), Pure White in Dark Mode */}
        <div className="w-full overflow-hidden leading-none select-none relative mt-2 z-10 pointer-events-none">
          <div className="font-display font-black text-[clamp(3.75rem,22vw,28rem)] leading-[0.65] tracking-[-0.06em] sm:tracking-[-0.08em] text-center uppercase whitespace-nowrap text-black dark:text-white translate-y-[15%]">
            NEXO
          </div>
        </div>
      </footer>
    </>
  );
}
