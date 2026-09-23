import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Video,
  Users,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { api } from '../services/api';

export const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback courses matching the platform database structure
  const fallbackCourses = [
    {
      id: 'course-react-ts',
      title: 'React 19 & TypeScript de Alta Performance',
      description: 'Domine os novos padrões do React 19, Server Components, gestão de estado eficiente e TypeScript avançado.',
      category: 'Programação',
      price: 0,
      isFree: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      durationHours: 14.5
    },
    {
      id: 'course-ui-ux',
      title: 'Design de Interfaces e Sistemas no Figma',
      description: 'Crie sistemas de design escaláveis, protótipos funcionais e interfaces modernas prontas para código.',
      category: 'Design',
      price: 29.0,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      durationHours: 12.0
    },
    {
      id: 'course-cloud-devops',
      title: 'Fundamentos de Cloud, Docker e Infraestrutura',
      description: 'Implemente fluxos de entrega contínua, contenha serviços em Docker e publique aplicações na nuvem.',
      category: 'Cloud & DevOps',
      price: 39.0,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      durationHours: 16.0
    }
  ];

  useEffect(() => {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <div className="mb-6">
          <Badge variant="primary" size="md" className="font-semibold">
            Plataforma de Ensino e Formação Digital
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-950 dark:text-white max-w-4xl leading-[1.1] mb-6">
          Formação prática e especializada para impulsionar a sua carreira.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 max-w-2xl font-medium leading-relaxed mb-10">
          Aceda a cursos estruturados em vídeo e texto, acompanhe o seu progresso passo a passo e conquiste certificados verificados. Para formadores, oferecemos um estúdio completo para criar, publicar e gerir turmas.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto mb-16">
          <Link to="/register">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Criar Conta Gratuita
            </Button>
          </Link>

          <Link to="/explore">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Explorar Catálogo
            </Button>
          </Link>
        </div>

        {/* Institutional Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          <Card className="p-5 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">Formação Estruturada</span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Módulos sequenciais organizados por especialistas</span>
          </Card>

          <Card className="p-5 text-center flex flex-col items-center justify-center">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">Certificados Verificados</span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Código de validação pública para currículo e LinkedIn</span>
          </Card>

          <Card className="p-5 text-center flex flex-col items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">Gestão Centralizada</span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Estúdio dedicado para criadores e formadores</span>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PILARES DE UTILIZAÇÃO: ALUNOS E FORMADORES                             */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Perfis de Utilização
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2">
            Ambientes dedicados às necessidades de quem aprende e de quem leciona.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card Aluno */}
          <Card className="p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2">
                Para Clientes & Alunos
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                Aprenda com lições práticas, acompanhe o seu progresso em tempo real e emita certificados oficiais após a conclusão de cada formação.
              </p>

              <ul className="space-y-3 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Aulas em vídeo com player otimizado e recursos descarregáveis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Painel do aluno com continuação imediata da última aula assistida</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Certificados digitais com identificador de validação pública</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-neutral-800">
              <Link to="/register">
                <Button variant="secondary" size="md" className="w-full font-bold">
                  Registar como Aluno
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card Criador */}
          <Card className="p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2">
                Para Criadores & Formadores
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                Estruture e publique os seus cursos, organize lições modulares e faça a gestão integral dos alunos matriculados num único painel.
              </p>

              <ul className="space-y-3 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Construtor direto de cursos com gestão de módulos e lições</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Painel analítico de alunos inscritos e taxas de conclusão</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Configuração flexível de cursos gratuitos ou com preço definido</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-neutral-800">
              <Link to="/register">
                <Button variant="secondary" size="md" className="w-full font-bold">
                  Registar como Formador
                </Button>
              </Link>
            </div>
          </Card>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CURSOS EM DESTAQUE                                                     */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="primary" size="md" className="mb-2">
              Destaques
            </Badge>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Cursos Disponíveis
            </h2>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1">
              Conheça algumas das formações práticas presentes no catálogo.
            </p>
          </div>

          <Link to="/explore">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver Catálogo Completo
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} hover className="p-0 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={
                      course.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="primary" size="sm" className="bg-white/95 dark:bg-black/85 backdrop-blur-md">
                      {course.category || 'Geral'}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between mt-4">
                <span className="text-lg font-black text-slate-950 dark:text-white">
                  {course.isFree || course.price === 0 ? 'Gratuito' : `€${course.price}`}
                </span>

                <Link to={`/courses/${course.id}`}>
                  <Button variant="primary" size="sm">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RECURSOS INSTITUCIONAIS                                                */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <Video className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aulas em Vídeo e Recursos</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Ambiente de reprodução otimizado com materiais complementares e questionários de fixação.
            </p>
          </Card>

          <Card className="p-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Validação de Certificados</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Autenticidade garantida por identificadores únicos para validação pública e rápida por empregadores.
            </p>
          </Card>

          <Card className="p-6">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Estrutura Modular</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Conteúdos organizados de forma sequencial para garantir uma aprendizagem consistente e focada.
            </p>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHAMADA FINAL PARA AÇÃO (CTA)                                         */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-blue-600 text-white p-8 sm:p-12 text-center flex flex-col items-center shadow-lg shadow-blue-500/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mb-3">
            Pronto para iniciar a sua formação ou publicar um curso?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mb-8 leading-relaxed">
            Registe a sua conta gratuita para ter acesso imediato ao catálogo ou começar a estruturar os seus conteúdos no estúdio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <button className="px-6 py-3 text-sm font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-md cursor-pointer">
                Criar Conta Gratuita
              </button>
            </Link>
            <Link to="/login">
              <button className="px-6 py-3 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-400 rounded-xl transition-all cursor-pointer">
                Iniciar Sessão
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. RODAPÉ INSTITUCIONAL                                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-200 dark:border-neutral-800 py-10 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-neutral-400 font-medium">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showText={false} />
          <span className="font-bold text-slate-900 dark:text-white">LearnSpace</span>
          <span>© {new Date().getFullYear()}. Todos os direitos reservados.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/explore" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Explorar Cursos
          </Link>
          <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Iniciar Sessão
          </Link>
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Criar Conta
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;