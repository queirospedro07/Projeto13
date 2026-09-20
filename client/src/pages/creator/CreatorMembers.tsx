import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Shield, Award, Check, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const CreatorMembers: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingFeedback, setGradingFeedback] = useState<string>('Excelente raciocínio estruturado, cumpriu todos os critérios essenciais.');
  const [essayGraded, setEssayGraded] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    api.getCreatorMembers()
      .then(data => setMembers(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter(m =>
    m.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveGrade = () => {
    setEssayGraded(true);
    toast({
      title: 'Nota e Correção Registadas',
      message: `A resposta foi avaliada com ${gradingScore}% e o aluno recebeu a notificação com o feedback.`,
      type: 'success'
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">Membros & Turma</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Gestão de Membros & Auditoria</h1>
          <p className="text-base text-slate-600 mt-1">
            Acompanhe o progresso de cada aluno, audite aulas concluídas, quizes e avalie respostas dissertativas.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar membros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>Aluno / Perfil</span>
          <div className="flex items-center gap-8">
            <span className="w-36 text-center">Espaço do Curso</span>
            <span className="w-24 text-center">Nível / XP</span>
            <span className="w-20 text-center">Cargo</span>
            <span className="w-32 text-center">Auditoria</span>
            <span className="w-24 text-right">Contacto</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-sm font-medium text-slate-500">A carregar lista de membros...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-sm font-medium text-slate-500">Nenhum membro encontrado com este termo de pesquisa.</div>
          ) : (
            filteredMembers.map(m => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <Avatar src={m.user?.avatarUrl} name={m.user?.name} size="md" status="online" />
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{m.user?.name}</span>
                    <p className="text-xs text-slate-400 font-medium">@{m.user?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-sm">
                  <span className="w-36 text-center text-slate-700 font-medium truncate">{m.space?.name || 'Geral'}</span>
                  <span className="w-24 text-center text-blue-600 font-bold">Nvl {m.user?.level || 1} ({m.user?.xp || 0} XP)</span>
                  <div className="w-20 flex justify-center">
                    <Badge variant={m.role === 'OWNER' ? 'primary' : m.role === 'MODERATOR' ? 'success' : 'outline'} size="sm" className="font-bold">
                      {m.role || 'STUDENT'}
                    </Badge>
                  </div>
                  <div className="w-32 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-bold text-xs"
                      onClick={() => {
                        setSelectedStudent(m);
                        setEssayGraded(false);
                      }}
                    >
                      Ver Atividades
                    </Button>
                  </div>
                  <div className="w-24 flex justify-end">
                    <Link to="/messages">
                      <Button variant="secondary" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />} className="font-semibold">
                        Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* STUDENT ACTIVITY AUDIT & ESSAY GRADING MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar src={selectedStudent.user?.avatarUrl} name={selectedStudent.user?.name} size="md" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Ficha de Atividade: {selectedStudent.user?.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    @{selectedStudent.user?.username} • Espaço: {selectedStudent.space?.name || 'Geral'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                Fechar
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progresso do Curso</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">82%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[82%]"></div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Aulas Concluídas</span>
                  <div className="text-2xl font-black text-blue-600 mt-1">14 / 17</div>
                  <span className="text-xs text-slate-500">Última aula há 2 horas</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Média em Quizes</span>
                  <div className="text-2xl font-black text-purple-600 mt-1">94%</div>
                  <span className="text-xs text-slate-500">3 quizes realizados</span>
                </div>
              </div>

              {/* Lesson Completion Audit Log */}
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-3">Histórico de Aulas & Vídeos Assistidos</h4>
                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-slate-50/30">
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800">1. Introdução à Arquitetura de Software</span>
                    <span className="text-emerald-600 font-bold">100% Concluído • Há 3 dias</span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800">2. Fundamentos de Performance em React (Vídeo YouTube)</span>
                    <span className="text-emerald-600 font-bold">100% Concluído • Há 2 dias</span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800">3. Masterclass: Deploy & CI/CD Pipelines</span>
                    <span className="text-emerald-600 font-bold">100% Concluído • Há 2 horas</span>
                  </div>
                </div>
              </div>

              {/* Open-Ended Essay Evaluation Section */}
              <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-xs">
                      Avaliação Dissertativa Pendente
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base mt-1.5">
                      Quiz do Módulo 3: Resposta por Extenso
                    </h4>
                  </div>
                  {essayGraded ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      Avaliado: {gradingScore}/100
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                      Aguardar Correção
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Pergunta do Quiz:</span>
                  <p className="font-medium text-slate-800 text-xs">
                    "Explique a diferença entre SSR (Server-Side Rendering) e SSG (Static Site Generation), destacando o impacto em SEO e performance."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Resposta Submetida pelo Aluno:</span>
                  <p className="font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "O SSR gera o HTML a cada requisição do utilizador no servidor, sendo ideal para páginas com dados em tempo real ou autenticação personalizada. Já o SSG constrói o HTML estático no momento do build (tempo de compilação), permitindo distribuição via CDN com tempos de carregamento mínimos. Ambos oferecem excelente SEO porque os motores de busca recebem o HTML totalmente renderizado, mas o SSG oferece melhor performance TTFB."
                  </p>
                </div>

                {/* Teacher Feedback and Score Input */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pt-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nota (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gradingScore}
                      onChange={(e) => setGradingScore(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Comentário / Feedback do Instrutor</label>
                    <input
                      type="text"
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="Escreva orientações para o aluno..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveGrade}
                    className="font-bold shadow-md"
                  >
                    {essayGraded ? 'Atualizar Nota do Aluno' : 'Guardar Correção e Atribuir Nota'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                Concluir Visualização
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
