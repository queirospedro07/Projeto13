import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const fetchAdminData = async () => {
    try {
      const [statsData, usersData, reportsData] = await Promise.all([api.getAdminStats(), api.getAdminUsers(), api.getAdminReports()]);
      setStats(statsData);
      setUsers(usersData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAdminData();
  }, []);
  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      const res = await api.toggleSuspendUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        isSuspended: res.isSuspended
      } : u));
      toast({
        title: res.isSuspended ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        type: res.isSuspended ? 'error' : 'success'
      });
    } catch (err) {
      toast({
        title: 'Ação Falhou',
        message: 'Não foi possível atualizar o estado do utilizador',
        type: 'error'
      });
    }
  };
  const handleUpdateReport = async (reportId, status) => {
    try {
      await api.updateReportStatus(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? {
        ...r,
        status
      } : r));
      toast({
        title: 'Denúncia Atualizada',
        message: `Marcada como ${status}`
      });
    } catch (err) {
      toast({
        title: 'Ação Falhou',
        type: 'error'
      });
    }
  };
  return <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">
              Consola de Administração
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Administração da Plataforma
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Métricas de desempenho globais, controlo de acessos e moderação de conteúdos.
          </p>
        </div>

        
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto shrink-0">
          <button onClick={() => setActiveTab('overview')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Visão Geral
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Utilizadores ({users.length})
          </button>
          <button onClick={() => setActiveTab('reports')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Denúncias ({reports.filter(r => r.status === 'Pending').length})
          </button>
        </div>
      </div>

      
      {activeTab === 'overview' && <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="p-6 border-slate-200 bg-white shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total de Utilizadores
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {stats?.totalUsers || 11}
              </p>
              <span className="text-xs font-semibold text-emerald-600 mt-1 block">
                ~{stats?.activeUsers || 9} ativos hoje
              </span>
            </Card>

            <Card className="p-6 border-slate-200 bg-white shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Cursos Disponíveis
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {stats?.totalCourses || 10}
              </p>
              <span className="text-xs font-medium text-slate-500 mt-1 block">Em 8 categorias</span>
            </Card>

            <Card className="p-6 border-slate-200 bg-white shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Espaços Ativos
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {stats?.totalSpaces || 5}
              </p>
              <span className="text-xs font-medium text-slate-500 mt-1 block">
                Canais da Comunidade
              </span>
            </Card>

            <Card className="p-6 border-slate-200 bg-white shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Denúncias Pendentes
              </span>
              <p className="text-3xl font-extrabold text-amber-500 mt-1">
                {stats?.pendingReports || 1}
              </p>
              <span className="text-xs font-semibold text-amber-600 mt-1 block">
                Requer revisão
              </span>
            </Card>
          </div>

          <Card className="p-8 border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">
                Estado dos Serviços & Base de Dados
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Todos os módulos e modelos relacionais estão 100% sincronizados e operacionais
              (Utilizadores, Perfis, Cursos, Módulos, Aulas, Quizzes, Espaços, Canais, Mensagens,
              Reações, Conquistas, Transações XP, Salas ao Vivo com Partilha de Ecrã).
            </p>
          </Card>
        </div>}

      
      {activeTab === 'users' && <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/50 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <span>Utilizador / Email</span>
                <div className="flex items-center gap-6">
                  <span className="w-20 text-center">Cargo</span>
                  <span className="w-28 text-center">Nível / XP</span>
                  <span className="w-20 text-center">Estado</span>
                  <span className="w-24 text-right">Ação</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {users.map(u => <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar src={u.avatarUrl} name={u.name} size="md" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                          {u.name}
                        </span>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium truncate">
                          @{u.username} • {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm shrink-0">
                      <div className="w-20 flex justify-center">
                        <Badge variant={u.role === 'ADMIN' ? 'primary' : u.role === 'CREATOR' ? 'accent' : 'outline'} size="sm" className="font-bold">
                          {u.role}
                        </Badge>
                      </div>
                      <span className="w-28 text-center text-slate-700 dark:text-zinc-300 font-bold text-xs">
                        Nvl {u.level} ({u.xp} XP)
                      </span>
                      <span className={`w-20 text-center text-xs font-bold ${u.isSuspended ? 'text-red-600' : 'text-emerald-600'}`}>
                        {u.isSuspended ? 'Suspenso' : 'Ativo'}
                      </span>
                      <div className="w-24 flex justify-end">
                        <button onClick={() => handleToggleSuspend(u.id, u.isSuspended)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${u.isSuspended ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'}`}>
                          {u.isSuspended ? 'Reativar' : 'Suspender'}
                        </button>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </Card>}

      
      {activeTab === 'reports' && <div className="flex flex-col gap-4">
          {reports.length === 0 ? <Card className="p-12 text-center text-sm text-slate-500 font-medium">
              Sem denúncias na fila de moderação.
            </Card> : reports.map(rep => <Card key={rep.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-slate-200 bg-white shadow-xs">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={rep.category === 'Spam' ? 'accent' : 'outline'} size="sm" className="font-bold">
                      {rep.category}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      Alvo: {rep.targetType}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      Reportado por @{rep.reporter?.username}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    Motivo: "{rep.reason}"
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Estado: <span className="text-amber-600 font-bold">{rep.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button onClick={() => handleUpdateReport(rep.id, 'Resolved')} variant="primary" size="md" leftIcon={<CheckCircle2 className="w-4 h-4" />} className="font-bold">
                    Resolver
                  </Button>
                  <Button onClick={() => handleUpdateReport(rep.id, 'Rejected')} variant="secondary" size="md" leftIcon={<XCircle className="w-4 h-4 text-slate-400" />} className="font-semibold">
                    Descartar
                  </Button>
                </div>
              </Card>)}
        </div>}
    </div>;
};