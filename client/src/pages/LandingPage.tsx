import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Award, 
  CheckCircle2, 
  Star,
  Monitor,
  Video,
  FileCode2,
  Sparkles,
  Radio,
  Play,
  Share2,
  Mic,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Logo } from '../components/ui/Logo';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    api.getCourses({ sort: 'popular' }).then(data => setCourses(data?.slice(0, 3) || [])).catch(() => {});
  }, []);

  return (
    <div className="w-full bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Release Pill */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold mb-8 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>LearnSpace</span>
          <span className="text-blue-300">•</span>
          <span>Plataforma de Ensino com Salas de Conferência e Partilha de Ecrã</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-slate-950 max-w-5xl leading-[1.08] mb-8">
          Aprenda e ensine com <span className="text-blue-600">comunicação em direto</span> e colaboração ativa.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-2xl text-slate-600 max-w-3xl font-medium leading-relaxed mb-12">
          Cada curso inclui canais temáticos de texto, aulas estruturadas com questionários práticos e salas de conferência com partilha de câmara e ecrã de alta definição.
        </p>

        {/* Large CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto mb-20">
          <Link to="/register">
            <button className="px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25 rounded-2xl transition-all flex items-center gap-3 cursor-pointer">
              <span>Criar Conta Gratuita</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link to="/explore">
            <button className="px-8 py-4 text-lg font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl transition-all cursor-pointer">
              Explorar Catálogo
            </button>
          </Link>
          <Link to="/login">
            <button className="px-8 py-4 text-lg font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-300 rounded-2xl transition-all cursor-pointer">
              Iniciar Sessão
            </button>
          </Link>
        </div>

        {/* Course Studio & Live Call Showcase */}
        <div className="w-full max-w-6xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-left">
          {/* Top Window Bar */}
          <div className="h-14 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-700"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-slate-700"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-slate-700"></span>
            </div>
            <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>learnspace.io/learn/fullstack-react-mastery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                EM DIRETO
              </span>
            </div>
          </div>

          {/* App Window Body: 3-column Course Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950">
            
            {/* 1. Left Channels Column */}
            <div className="md:col-span-3 p-4 bg-slate-900/90 flex flex-col justify-between text-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                    FS
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">Full-Stack Hub</p>
                    <p className="text-xs text-slate-400">Servidor do Curso</p>
                  </div>
                </div>

                {/* Categorized Channels */}
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="px-2 pb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Canais de Discussão
                    </div>
                    <div className="flex flex-col gap-1 text-slate-300">
                      <div className="px-3 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs flex items-center gap-2">
                        <span>#</span> geral
                      </div>
                      <div className="px-3 py-2 rounded-xl hover:bg-slate-800/50 text-slate-400 text-xs flex items-center gap-2">
                        <span>#</span> dúvidas
                      </div>
                      <div className="px-3 py-2 rounded-xl hover:bg-slate-800/50 text-slate-400 text-xs flex items-center gap-2">
                        <span>#</span> projetos
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="px-2 pb-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Salas de Transmissão
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>Mentoria & Ecrã</span>
                        </div>
                        <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded">Em direto</span>
                      </div>
                      <div className="px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 text-xs flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Sala de Estudo 1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 mt-4">
                <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" name="Lucas Mendes" size="sm" status="online" />
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">Lucas Mendes</p>
                  <p className="text-[10px] text-emerald-400">Microfone Ligado</p>
                </div>
              </div>
            </div>

            {/* 2. Middle Live Screen Share Stream */}
            <div className="md:col-span-6 p-6 flex flex-col justify-between bg-slate-950">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="font-bold text-sm">Transmissão em Direto — Partilha de Ecrã</span>
                  </div>
                  <Badge variant="primary" size="sm">1080p 60fps</Badge>
                </div>

                {/* Simulated Screen Stream */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex flex-col justify-between p-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                      <Monitor className="w-4 h-4 text-blue-400" />
                      <span>Ecrã do Instrutor — Visual Studio Code</span>
                    </div>
                    <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">LIVE</span>
                  </div>

                  {/* Mock Code on Screen */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed max-w-lg">
                    <span className="text-purple-400">export async function</span> <span className="text-blue-400">createSession</span>() &#123;<br/>
                    &nbsp;&nbsp;<span className="text-purple-400">const</span> stream = <span className="text-purple-400">await</span> navigator.mediaDevices.<span className="text-blue-400">getDisplayMedia</span>();<br/>
                    &nbsp;&nbsp;<span className="text-slate-500">// Transmissão de vídeo de alta definição ativada</span><br/>
                    &nbsp;&nbsp;<span className="text-purple-400">return</span> stream;<br/>
                    &#125;
                  </div>

                  {/* Stream Controls */}
                  <div className="flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" name="Sarah Jenkins" size="xs" />
                      <span>Sarah Jenkins (Instrutora)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <Mic className="w-4 h-4 text-emerald-400" />
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <Video className="w-4 h-4 text-blue-400" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Features */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800 mt-6 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="font-bold text-white">Zero Latência</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">WebRTC Direto</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="font-bold text-white">Áudio Espacial</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cancelamento de Ruído</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="font-bold text-white">Gravação na Nuvem</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Disponível em 24h</p>
                </div>
              </div>
            </div>

            {/* 3. Right Interactive Chat & Quizzes Column */}
            <div className="md:col-span-3 p-4 bg-slate-900/90 flex flex-col justify-between text-sm">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="font-bold text-white text-xs">Chat da Turma em Direto</span>
                  <span className="text-[10px] text-slate-400">28 participantes</span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-400">Tiago Santos</span>
                      <span className="text-[10px] text-slate-500">16:42</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">Excelente demonstração da transmissão em tempo real!</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-400">Ana Rodrigues</span>
                      <span className="text-[10px] text-slate-500">16:43</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">O código de exemplo já está disponível na aba de recursos?</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <p className="font-bold text-amber-400 mb-1">Questionário de Fixação Ativo</p>
                    <p className="text-slate-300 leading-tight">Responda ao desafio da aula para desbloquear 50 XP.</p>
                  </div>
                </div>
              </div>

              {/* Chat Input Simulation */}
              <div className="pt-4 border-t border-slate-800 mt-4">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Escrever mensagem na turma...</span>
                  <span className="text-blue-500 font-bold text-xs">Enviar</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 2. THREE PILLARS SECTION */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge size="md" variant="primary" className="mb-3">Arquitetura de Ensino</Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Construído para resultados reais de aprendizagem.
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            A união entre currículo estruturado de alto nível, comunidade ativa e conferências interativas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold mb-6">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Currículo Estruturado</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Módulos de vídeo em alta definição, artigos técnicos com blocos de código formatados, transcrições e recursos para download.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-blue-600 font-bold text-sm">
              <span>Explorar cursos disponíveis</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>

          <Card className="p-8 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold mb-6">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Conferências & Ecrã</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Sessões de mentoria com partilha de ecrã fluida, salas de estudo em grupo por voz e tira-dúvidas direto com os instrutores.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <span>Ver salas de mentoria</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>

          <Card className="p-8 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Quizzes & Certificados</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Avaliações interativas que validam o conhecimento prático, sistema de pontuação e certificados verificados após 100% de conclusão.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-amber-600 font-bold text-sm">
              <span>Validar certificados</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        </div>
      </section>

      {/* 3. POPULAR COURSES PREVIEW */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <Badge size="md" variant="primary" className="mb-2">Destaques</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Cursos em Maior Destaque</h2>
            <p className="text-base text-slate-600 mt-1">Inscreva-se e aceda imediatamente a todas as aulas e servidores de turma.</p>
          </div>
          <Link to="/explore">
            <Button variant="secondary" size="md" className="font-bold">Ver Catálogo Completo</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map(course => (
            <Card key={course.id} hover className="p-0 overflow-hidden flex flex-col justify-between border-slate-200 bg-white shadow-xs">
              <div className="relative h-48 w-full bg-slate-900">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                  <Badge size="md" variant="primary" className="bg-white/95 backdrop-blur-md shadow-xs">
                    {course.category}
                  </Badge>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-2 leading-relaxed">{course.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-slate-900">{course.isFree ? 'Gratuito' : `€${course.price}`}</span>
                  <Link to={`/courses/${course.id}`}>
                    <Button variant="primary" size="md" className="font-bold">Saber Mais</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. FINAL CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-blue-600 text-white p-10 sm:p-16 text-center flex flex-col items-center shadow-xl shadow-blue-500/20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mb-4">
            Pronto para transformar a sua aprendizagem?
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mb-8 leading-relaxed">
            Crie a sua conta gratuita hoje e aceda a centenas de aulas estruturadas e salas de estudo em tempo real.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <button className="px-8 py-4 text-base font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-2xl transition-all shadow-md cursor-pointer">
                Criar Conta Gratuita
              </button>
            </Link>
            <Link to="/creator/courses/new">
              <button className="px-8 py-4 text-base font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-400 rounded-2xl transition-all cursor-pointer">
                Tornar-me Instrutor
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} />
          <span className="font-bold text-slate-900 font-sans">LearnSpace</span>
          <span>© 2026. Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/explore" className="hover:text-slate-900">Cursos</Link>
          <Link to="/community" className="hover:text-slate-900">Comunidades</Link>
          <Link to="/leaderboard" className="hover:text-slate-900">Classificações</Link>
          <Link to="/login" className="hover:text-slate-900">Iniciar Sessão</Link>
        </div>
      </footer>

    </div>
  );
};
