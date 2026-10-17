import './LandingPage.css';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuCircleCheck as CheckCircle2,
  LuChevronDown as ChevronDown,
  LuSparkles as Sparkles,
  LuRadio as Radio,
  LuFileCode2 as FileCode2,
  LuAward as Award,
  LuPlay as Play,
  LuPause as Pause,
  LuVolume2 as Volume2,
  LuVolumeX as VolumeX,
} from 'react-icons/lu';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/SEO';
export const LandingPage = () => {
  const { user, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const [heroMouse, setHeroMouse] = useState({
    x: -1000,
    y: -1000,
    active: false,
  });
  const handleHeroMouseMove = (event) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setHeroMouse({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  };
  const handleHeroMouseLeave = () => {
    setHeroMouse((current) => ({
      ...current,
      active: false,
    }));
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
  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'CREATOR' ? '/creator' : '/dashboard';
  const faqs = [
    {
      q: 'O que é a plataforma NEXO?',
      a: 'O NEXO é uma plataforma de aprendizagem e comunidade onde podes acompanhar cursos práticos em vídeo, tirar dúvidas em canais de estudo com voz, vídeo e partilha de ecrã e obter certificados ao concluir as formações.',
    },
    {
      q: 'O registo como aluno é gratuito?',
      a: 'Sim, criar conta é gratuito e dá acesso imediato aos cursos abertos, aos espaços da comunidade e aos recursos das aulas.',
    },
    {
      q: 'Como posso tornar-me formador no NEXO?',
      a: 'Qualquer utilizador registado pode submeter uma candidatura a formador através do seu painel. Depois de analisada e aprovada pela administração, a conta passa a ter acesso ao Estúdio do Criador.',
    },
    {
      q: 'Como funcionam os certificados?',
      a: 'Depois de concluir as aulas e obter aprovação nas avaliações e projetos exigidos, pode obter um certificado digital com uma credencial pública de verificação.',
    },
  ];
  return (
    <>
      <SEO
        title="NEXO — Plataforma de Aprendizagem e Comunidade"
        description="Plataforma de cursos online, salas de estudo por voz e vídeo em direto, certificados digitais e comunidade de estudantes."
        canonical="https://nexo.pt/"
        ogImage="/hero-showcase.jpg"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'NEXO',
          url: 'https://nexo.pt',
          logo: 'https://nexo.pt/favicon.svg',
          description:
            'Plataforma de cursos práticos, salas de estudo de voz e vídeo e comunidade.',
          sameAs: ['https://github.com/queirospedro7'],
        }}
      />
      <div className="landing-page-panel">
        {/* Secção Principal (Hero) */}
        <section
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="landing-page-section"
        >
          <div className="landing-page-panel-2">
            <div className="landing-page-panel-3" />
            <div
              className="landing-page-panel-4 landing-page-dynamic-1"
              style={{
                '--landing-page-opacity': heroMouse.active ? 1 : 0,
                '--spotlight-x': `${heroMouse.x}px`,
                '--spotlight-y': `${heroMouse.y}px`,
              }}
            />
            <div className="landing-page-panel-5" />
          </div>

          <div className="landing-page-panel-6">
            <div className="landing-page-panel-7">
              {/* Vídeo de apresentação */}
              <div className="landing-page-panel-8">
                <div className="landing-page-panel-9">
                  <div className="landing-page-panel-10" />
                  <video
                    ref={videoRef}
                    className="landing-page-video"
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="Vídeo de demonstração da plataforma NEXO"
                  >
                    <source src="/video.mp4" type="video/mp4" />O seu navegador não suporta a
                    reprodução de vídeo.
                  </video>

                  <div className="landing-page-panel-11">
                    <div className="landing-page-panel-12">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="landing-page-button"
                        aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
                        title={isMuted ? 'Ativar som' : 'Silenciar som'}
                      >
                        {isMuted ? (
                          <VolumeX className="landing-page-volume-x" />
                        ) : (
                          <Volume2 className="landing-page-volume-x" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={togglePlay}
                        className="landing-page-button-2"
                        aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                        title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                      >
                        {isPlaying ? (
                          <Pause className="landing-page-volume-x" />
                        ) : (
                          <Play className="landing-page-play" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto e botões */}
              <div className="landing-page-panel-13">
                <h1 className="landing-page-title">Aprenda, construa e evolua.</h1>
                <p className="landing-page-description">
                  Uma plataforma pensada para estudar ao seu ritmo: cursos práticos em vídeo, salas
                  de estudo por voz e vídeo em direto e certificados no final de cada curso.
                </p>

                <div className="landing-page-panel-14">
                  {user ? (
                    <Link to={dashboardPath} className="landing-page-link">
                      <span className="landing-page-button-3 ui-group">
                        <span>Ir para o Meu Painel</span>
                        <ArrowRight className="landing-page-arrow-right" />
                      </span>
                    </Link>
                  ) : (
                    <Link to="/register" className="landing-page-link">
                      <span className="landing-page-button-4 ui-group">
                        <span>Criar Conta Gratuita</span>
                        <ArrowRight className="landing-page-arrow-right-2" />
                      </span>
                    </Link>
                  )}

                  <Link to="/explore" className="landing-page-link">
                    <span className="landing-page-button-5">
                      <Compass className="landing-page-compass" />
                      <span>Explorar Catálogo</span>
                    </span>
                  </Link>
                </div>

                <div className="landing-page-panel-15">
                  <div className="landing-page-panel-16">
                    <CheckCircle2 className="landing-page-check-circle2" />
                    <span>Acesso flexível</span>
                  </div>
                  <span className="landing-page-label">•</span>
                  <div className="landing-page-panel-16">
                    <CheckCircle2 className="landing-page-check-circle2" />
                    <span>Comunidade de aprendizagem</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-page-panel-17">
            <div className="landing-page-panel-18">
              <div className="landing-page-panel-19">
                <div>
                  <span className="landing-page-label-2">Acesso</span>
                  <strong className="landing-page-strong">Cursos e recursos online</strong>
                </div>
                <div>
                  <span className="landing-page-label-2">Salas de Estudo</span>
                  <strong className="landing-page-strong-2">Voz e vídeo em direto</strong>
                </div>
                <div>
                  <span className="landing-page-label-2">Certificados</span>
                  <strong className="landing-page-strong">Código de Verificação</strong>
                </div>
                <div>
                  <span className="landing-page-label-2">Aprendizagem</span>
                  <strong className="landing-page-strong">Ao seu ritmo</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secção de Funcionalidades Principais */}
        <section id="vantagens" className="landing-page-section-2">
          <div className="landing-page-panel-22">
            <h2 className="landing-page-heading">
              Tudo o que precisa para estudar e colaborar num único sítio.
            </h2>
            <p className="landing-page-description-2">
              Acompanhe as aulas em vídeo, tire dúvidas nos canais da comunidade e acompanhe o seu
              progresso ao longo dos cursos.
            </p>
          </div>

          <div className="landing-page-panel-23">
            {/* Card 1: Aulas Práticas & Código Real */}
            <Link to="/explore" className="landing-page-link-2 ui-group">
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <FileCode2 className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Prática Real</span>
                </div>

                <h3 className="landing-page-subheading">Cursos Práticos & Projetos</h3>
                <p className="landing-page-description-3">
                  Aprenda com aulas estruturadas, desafios aplicados e projetos completos prontos
                  para produção.
                </p>
              </div>

              <div className="landing-page-panel-26">
                <span className="landing-page-label-4">Explorar Catálogo</span>
                <div className="landing-page-panel-27">
                  <ArrowRight className="landing-page-arrow-right-3" />
                </div>
              </div>
            </Link>

            {/* Card 2: Comunidades & de voz e vídeo */}
            <Link to="/community" className="landing-page-link-2 ui-group">
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <Radio className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Colaboração</span>
                </div>

                <h3 className="landing-page-subheading">Salas de estudo e comunidade</h3>
                <p className="landing-page-description-3">
                  Tire dúvidas em tempo real com formadores e participe em canais de voz com
                  partilha de ecrã durante as sessões.
                </p>
              </div>

              <div className="landing-page-panel-26">
                <span className="landing-page-label-4">Entrar nas Salas</span>
                <div className="landing-page-panel-27">
                  <ArrowRight className="landing-page-arrow-right-3" />
                </div>
              </div>
            </Link>

            {/* Card 3: Certificados de conclusão */}
            <Link to="/explore" className="landing-page-link-2 ui-group">
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <Award className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Credencial</span>
                </div>

                <h3 className="landing-page-subheading">Certificados de conclusão</h3>
                <p className="landing-page-description-3">
                  Obtenha certificados com identificador único verificável para destacar o seu
                  perfil no LinkedIn e CV.
                </p>
              </div>

              <div className="landing-page-panel-26">
                <span className="landing-page-label-4">Ver Certificação</span>
                <div className="landing-page-panel-27">
                  <ArrowRight className="landing-page-arrow-right-3" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Secção Responsiva */}
        <section className="landing-page-section-3">
          <div className="landing-page-panel-28">
            <div className="landing-page-panel-29">
              <span className="landing-page-label-5">Acesso em Qualquer Dispositivo</span>
              <h2 className="landing-page-heading-2">
                Estude em qualquer ecrã, ao seu próprio ritmo.
              </h2>
              <p className="landing-page-description-4">
                Alterne facilmente entre o computador e o telemóvel. Continue as aulas de onde
                parou, consulte os seus apontamentos e participe nos canais de estudo da turma.
              </p>

              <div className="landing-page-panel-30">
                <Link to="/explore" className="landing-page-link">
                  <span className="landing-page-button-6">Começar Agora</span>
                </Link>
                <Link to="/library" className="landing-page-link">
                  <span className="landing-page-button-7">Aceder à Minha Biblioteca</span>
                </Link>
              </div>
            </div>

            <div className="landing-page-panel-31">
              <img
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80"
                alt="Plataforma NEXO no computador e telemóvel"
                className="landing-page-image"
              />
              <div className="landing-page-panel-32" />
            </div>
          </div>
        </section>

        {/* Candidatura a Formador */}
        <section className="landing-page-section-4">
          <div className="landing-page-panel-33">
            <div className="landing-page-panel-34">
              <span className="landing-page-label-5">Formadores NEXO</span>
              <h3 className="landing-page-subheading-2">Quer publicar os seus próprios cursos?</h3>
              <p className="landing-page-description-5">
                Submeta uma candidatura a formador. Depois de aprovada pela administração, terá
                acesso ao Estúdio do Criador para criar módulos, aulas em vídeo e questionários.
              </p>
            </div>

            <Link to="/creator/apply" className="landing-page-link-3">
              <span className="landing-page-button-8">
                <Sparkles className="landing-page-sparkles" />
                <span>Candidatura a Formador</span>
              </span>
            </Link>
          </div>
        </section>

        {/* Perguntas Frequentes (FAQ) */}
        <section id="faq" className="landing-page-section-5">
          <div className="landing-page-panel-35">
            <span className="landing-page-label-5">Dúvidas Comuns</span>
            <h2 className="landing-page-heading-3">Perguntas Frequentes</h2>
            <Link to="/help" className="landing-page-faq-link">
              Consultar todas as perguntas <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="landing-page-panel-36">
            {faqs.map((faq, idx) => (
              <div key={idx} className="landing-page-panel-37">
                <button
                  id={`faq-question-${idx}`}
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                  className="landing-page-button-9"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`landing-page-chevron-down ${openFaq === idx ? 'landing-page-chevron-down-2' : ''}`}
                  />
                </button>

                {openFaq === idx && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className="landing-page-landing-page"
                  >
                    <div className="landing-page-panel-38">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Banner Final */}
        <section className="landing-page-section-6">
          <div className="landing-page-panel-39">
            <div className="landing-page-panel-40">
              <h2 className="landing-page-heading-4">
                Comece a explorar os cursos na plataforma NEXO
              </h2>
              <p className="landing-page-description-6">
                Crie uma conta gratuita para assistir às aulas, resolver questionários e participar
                nas salas de estudo da comunidade.
              </p>
              <div className="landing-page-panel-41">
                <Link to="/register" className="landing-page-link">
                  <span className="landing-page-button-10">
                    <span>Criar Conta Gratuita</span>
                    <ArrowRight className="landing-page-arrow-right-4" />
                  </span>
                </Link>
                <Link to="/explore" className="landing-page-link">
                  <span className="landing-page-button-11">Explorar Cursos</span>
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
