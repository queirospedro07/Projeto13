import './HomePage.css';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight as ArrowRight,
  LuCircleCheck as CheckCircle2,
  LuChevronDown as ChevronDown,
  LuRadio as Radio,
  LuFileCode2 as FileCode2,
  LuAward as Award,
  LuPlay as Play,
  LuPause as Pause,
  LuVolume2 as Volume2,
  LuVolumeX as VolumeX,
} from 'react-icons/lu';
import Rodape from '../../components/Footer';
import { useAutenticacao } from '../../contexts/AuthContext';
import { SEO } from '../../components/SEO';

export const PaginaInicial = () => {
  const origemSite = import.meta.env.VITE_SITE_URL || window.location.origin;
  const { user: utilizador } = useAutenticacao();
  const [abrirPerguntasFrequentes, definirAbrirPerguntasFrequentes] = useState(0);
  const [isMuted, definirIsMuted] = useState(true);
  const [prefersReducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const [isPlaying, definirIsPlaying] = useState(!prefersReducedMotion);
  const videoRef = useRef(null);

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

  const alternarMute = (evento) => {
    if (evento) evento.stopPropagation();
    definirIsMuted((atual) => !atual);
  };

  const alternarReproduzir = (evento) => {
    if (evento) evento.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      definirIsPlaying(true);
    } else {
      video.pause();
      definirIsPlaying(false);
    }
  };

  const painelCaminho =
    utilizador?.role === 'ADMIN'
      ? '/administracao'
      : utilizador?.role === 'CREATOR'
        ? '/formador'
        : '/painel';
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
        canonical="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'NEXO',
          url: origemSite,
          logo: new URL('/favicon.svg', origemSite).href,
          description:
            'Plataforma de cursos práticos, salas de estudo de voz e vídeo e comunidade.',
          sameAs: ['https://github.com/queirospedro7'],
        }}
      />
      <div className="landing-page-panel">
        <section className="landing-opening">
          <div className="landing-opening__content">
            <p className="landing-opening__eyebrow">Aprendizagem e comunidade</p>
            <h1 className="landing-opening__title">
              Aprenda.
              <br />
              Em conjunto.
            </h1>
            <p className="landing-opening__description">
              Cursos práticos e salas de estudo para aprender com outras pessoas.
            </p>
            <div className="landing-opening__actions">
              <Link
                to={utilizador ? painelCaminho : '/registar'}
                className="landing-opening__primary"
              >
                {utilizador ? 'Ir para o meu painel' : 'Criar conta gratuita'}
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link to="/explorar" className="landing-opening__secondary">
                Ver cursos
              </Link>
            </div>
          </div>

          <div className="landing-opening__showcase">
            <div className="landing-opening__media">
              <video
                ref={videoRef}
                className="landing-opening__video"
                autoPlay={!prefersReducedMotion}
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                onPlay={() => definirIsPlaying(true)}
                onPause={() => definirIsPlaying(false)}
              >
                <source src="/video.mp4" type="video/mp4" />
              </video>
              <div className="landing-opening__controls">
                <button
                  type="button"
                  onClick={alternarMute}
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
                  onClick={alternarReproduzir}
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
        </section>

        <section className="landing-page-panel-17">
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
        </section>

        {/* Secção de Funcionalidades Principais */}
        <section
          id="vantagens"
          className="landing-page-section-2"
        >
          <div className="landing-page-panel-22">
            <h2 className="landing-page-heading">
              Aulas, projetos e espaços para estudar em conjunto.
            </h2>
            <p className="landing-page-description-2">
              Escolha um curso, avance pelas aulas e peça ajuda quando precisar.
            </p>
          </div>

          <div className="landing-page-panel-23">
            {/* Cartao 1: Aulas Práticas & Código Real */}
            <Link
              to="/explorar"
              className="landing-page-link-2 ui-group"
            >
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <FileCode2 className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Prática Real</span>
                </div>

                <h3 className="landing-page-subheading">Cursos Práticos & Projetos</h3>
                <p className="landing-page-description-3">
                  Aulas com exercícios e projetos para pôr em prática o que aprendeu.
                </p>
              </div>

              <div className="landing-page-panel-26">
                <span className="landing-page-label-4">Explorar Catálogo</span>
                <div className="landing-page-panel-27">
                  <ArrowRight className="landing-page-arrow-right-3" />
                </div>
              </div>
            </Link>

            {/* Cartao 2: Comunidades & de voz e vídeo */}
            <Link
              to="/comunidade"
              className="landing-page-link-2 ui-group"
            >
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <Radio className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Colaboração</span>
                </div>

                <h3 className="landing-page-subheading">Salas de estudo e comunidade</h3>
                <p className="landing-page-description-3">
                  Converse com outros alunos e formadores nos canais de estudo, incluindo voz e
                  partilha de ecrã.
                </p>
              </div>

              <div className="landing-page-panel-26">
                <span className="landing-page-label-4">Entrar nas Salas</span>
                <div className="landing-page-panel-27">
                  <ArrowRight className="landing-page-arrow-right-3" />
                </div>
              </div>
            </Link>

            {/* Cartao 3: Certificados de conclusão */}
            <Link
              to="/explorar"
              className="landing-page-link-2 ui-group"
            >
              <div>
                <div className="landing-page-panel-24">
                  <div className="landing-page-panel-25">
                    <Award className="landing-page-file-code2" />
                  </div>
                  <span className="landing-page-label-3">Credencial</span>
                </div>

                <h3 className="landing-page-subheading">Certificados de conclusão</h3>
                <p className="landing-page-description-3">
                  Nos cursos elegíveis, conclua as atividades para obter uma credencial verificável.
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
              <span className="landing-page-label-5">A plataforma</span>
              <h2 className="landing-page-heading-2">
                Aprenda, pratique e acompanhe o seu progresso.
              </h2>

              <Link to="/explorar" className="landing-page-button-6">
                Explorar cursos
              </Link>
            </div>

            <ul className="landing-page-panel-31">
              <li>
                <CheckCircle2 aria-hidden="true" />
                Aulas em vídeo e materiais de apoio
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Exercícios, questionários e projetos
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Canais para conversar e estudar em conjunto
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                Progresso guardado na sua conta
              </li>
            </ul>
          </div>
        </section>

        {/* Candidatura a Formador */}
        <section className="landing-page-section-4">
          <div className="landing-page-panel-33">
            <div className="landing-page-panel-34">
              <span className="landing-page-label-5">Formadores NEXO</span>
              <h3 className="landing-page-subheading-2">Tem conhecimentos para partilhar?</h3>
              <p className="landing-page-description-5">
                Candidate-se a formador e, se for aprovado, poderá criar cursos e acompanhar os seus
                alunos.
              </p>
            </div>

            <Link
              to="/formador/candidatar"
              className="landing-page-link-3"
            >
              <span className="landing-page-button-8">
                <span>Candidatura a Formador</span>
              </span>
            </Link>
          </div>
        </section>

        {/* Perguntas Frequentes (FAQ) */}
        <section
          id="faq"
          className="landing-page-section-5"
        >
          <div className="landing-page-panel-35">
            <span className="landing-page-label-5">Dúvidas Comuns</span>
            <h2 className="landing-page-heading-3">Perguntas Frequentes</h2>
            <Link
              to="/ajuda"
              className="landing-page-faq-link"
            >
              Consultar todas as perguntas <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="landing-page-panel-36">
            {faqs.map((perguntasFrequentes, idx) => (
              <div
                key={idx}
                className="landing-page-panel-37"
              >
                <button
                  id={`faq-question-${idx}`}
                  onClick={() =>
                    definirAbrirPerguntasFrequentes(abrirPerguntasFrequentes === idx ? -1 : idx)
                  }
                  aria-expanded={abrirPerguntasFrequentes === idx}
                  aria-controls={`faq-answer-${idx}`}
                  className="landing-page-button-9"
                >
                  <span>{perguntasFrequentes.q}</span>
                  <ChevronDown
                    className={`landing-page-chevron-down ${abrirPerguntasFrequentes === idx ? 'landing-page-chevron-down-2' : ''}`}
                  />
                </button>

                {abrirPerguntasFrequentes === idx && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className="landing-page-landing-page"
                  >
                    <div className="landing-page-panel-38">{perguntasFrequentes.a}</div>
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
                Encontre um curso para começar.
              </h2>
              <p className="landing-page-description-6">
                Explore o catálogo e escolha o que quer aprender.
              </p>
              <div className="landing-page-panel-41">
                <Link
                  to="/registar"
                  className="landing-page-link"
                >
                  <span className="landing-page-button-10">
                    <span>Criar Conta Gratuita</span>
                    <ArrowRight className="landing-page-arrow-right-4" />
                  </span>
                </Link>
                <Link
                  to="/explorar"
                  className="landing-page-link"
                >
                  <span className="landing-page-button-11">Explorar Cursos</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Rodape />
      </div>
    </>
  );
};

export default PaginaInicial;
