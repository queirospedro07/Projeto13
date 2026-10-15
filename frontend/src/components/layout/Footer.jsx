import './Footer.css';
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && trailRef.current.length > 0 && !isRunning) {
          isRunning = true;
          animFrameRef.current = requestAnimationFrame(animate);
        } else if (!isIntersecting && isRunning) {
          isRunning = false;
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        }
      },
      { threshold: 0.01 },
    );

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
      <footer ref={footerRef} onMouseMove={handleMouseMove} className="footer-footer ui-group">
        {/* Subtle Ambient Background Gradient */}
        <div className="footer-panel">
          <div className="footer-panel-2" />
        </div>

        {/* Real-Time Interactive Fluid Pace-Style Cursor Trail Canvas */}
        <canvas ref={canvasRef} className="footer-canvas" />

        <div className="footer-panel-3">
          {/* Main Grid */}
          <div className="footer-panel-4">
            {/* Brand & Description */}
            <div className="footer-panel-5">
              <Logo size="lg" to="/" />
              <p className="footer-description">
                Cursos práticos, uma comunidade para trocar ideias e certificados de conclusão.
              </p>
            </div>

            {/* Navigation Links - 3 columns */}
            <div className="footer-panel-6">
              {/* Column 1: Áreas de Estudo */}
              <div className="footer-panel-7">
                <span className="footer-label">Áreas de Estudo</span>
                <ul className="footer-list">
                  <li>
                    <Link to="/explore" className="footer-link">
                      Catálogo Geral
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Negócios" className="footer-link">
                      Negócios & Gestão
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Marketing" className="footer-link">
                      Marketing & Vendas
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Línguas" className="footer-link">
                      Línguas & Idiomas
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Programação" className="footer-link">
                      Tecnologia & Web
                    </Link>
                  </li>
                  <li>
                    <Link to="/explore?category=Design" className="footer-link">
                      Design & Artes
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Plataforma */}
              <div className="footer-panel-7">
                <span className="footer-label">Plataforma</span>
                <ul className="footer-list">
                  <li>
                    <Link to="/" className="footer-link-2">
                      Início
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="footer-link">
                      Painel do Aluno
                    </Link>
                  </li>
                  <li>
                    <Link to="/creator" className="footer-link">
                      Estúdio do Formador
                    </Link>
                  </li>
                  <li>
                    <Link to="/community" className="footer-link">
                      Comunidade e salas de estudo
                    </Link>
                  </li>
                  <li>
                    <Link to="/library" className="footer-link">
                      Certificados de conclusão
                    </Link>
                  </li>
                  <li>
                    <Link to="/help" className="footer-link-2">
                      Dúvidas & Suporte
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Comunidade & Inquéritos */}
              <div className="footer-panel-8">
                <span className="footer-label">Comunidade & Moderação</span>
                <ul className="footer-list">
                  <li>
                    <Link to="/creator/apply" className="footer-link-2">
                      Candidatura a Formador
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="footer-link">
                      Iniciar Sessão
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://github.com/queirospedro7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link-3"
                    >
                      <Github className="footer-github" />
                      <span>GitHub</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Terms */}
          <div className="footer-panel-9">
            <span>© {currentYear} NEXO. Todos os direitos reservados.</span>
            <div className="footer-panel-10">
              <Link to="/terms" className="footer-link-4">
                Termos de Utilização
              </Link>
              <span>•</span>
              <Link to="/privacy" className="footer-link-4">
                Política de Privacidade
              </Link>
              <span>•</span>
              <Link to="/help" className="footer-link-4">
                Dúvidas & FAQ
              </Link>
              <span>•</span>
              <span>Portugal</span>
            </div>
          </div>
        </div>

        {/* Giant Monumental Wordmark NEXO: Pure Black in Light Mode (#000000), Pure White in Dark Mode */}
        <div className="footer-panel-11">
          <div className="footer-panel-12">NEXO</div>
        </div>
      </footer>
    </>
  );
}
