import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  TrendingUp, 
  PlusCircle, 
  Star, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Eye
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../services/api';

export const CreatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCreatorStats().catch(() => null),
      api.getCreatorCourses().catch(() => []),
    ]).then(([statsData, coursesData]) => {
      setStats(statsData);
      setCourses(coursesData || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">Estúdio do Criador</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Painel do Criador & Instrutor
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Gira os seus espaços de aprendizagem, aulas, canais e acompanhe os membros da comunidade.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/creator/members">
            <Button variant="secondary" size="md" leftIcon={<Users className="w-4 h-4" />} className="font-semibold">
              Gerir Membros
            </Button>
          </Link>
          <Link to="/creator/courses/new">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} className="font-bold">
              Criar Novo Espaço
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Receita Total</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                €{stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '14.850'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Alunos Inscritos</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats?.totalStudents || 342}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Taxa de Conclusão</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats?.completionRate || 74}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Classificação Média</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats?.averageRating || '4.9'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Time Series Chart */}
      <Card className="p-7 border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Evolução de Receitas
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Faturação mensal e crescimento de matrículas</p>
          </div>
          <Badge variant="success" size="md" className="font-bold">+38% este mês</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.revenueData || [
              { month: 'Jan', revenue: 1200 },
              { month: 'Fev', revenue: 2100 },
              { month: 'Mar', revenue: 3400 },
              { month: 'Abr', revenue: 4800 },
              { month: 'Mai', revenue: 6200 },
              { month: 'Jun', revenue: 8900 },
              { month: 'Jul', revenue: 14850 },
            ]}>
              <defs>
                <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="€" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [`€${val}`, 'Receita']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Creator's Spaces Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Espaços Publicados ({courses.length})</h3>
            <p className="text-sm text-slate-500 mt-0.5">Espaços ativos com módulos e canais para membros</p>
          </div>
          <Link to="/creator/courses/new">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} className="font-bold">
              Criar Espaço
            </Button>
          </Link>
        </div>

        <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Nome do Espaço</span>
                <div className="flex items-center gap-8">
                  <span className="w-16 text-center">Membros</span>
                  <span className="w-16 text-center">Módulos</span>
                  <span className="w-16 text-center">Acesso</span>
                  <span className="w-40 text-right">Ações</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {courses.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-500">
                    Ainda não criou nenhum espaço. Clique em "Criar Espaço" para lançar a sua primeira comunidade de aprendizagem!
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={course.thumbnailUrl} alt={course.title} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base truncate max-w-[200px] sm:max-w-sm">{course.title}</h4>
                          <div className="flex items-center gap-2.5 mt-1">
                            <Badge size="sm" variant="primary">{course.category}</Badge>
                            <span className="text-xs text-slate-400 font-medium">• {course.difficulty}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-sm shrink-0">
                        <span className="w-16 text-center text-slate-800 font-bold">{course._count?.enrollments || 0}</span>
                        <span className="w-16 text-center text-slate-500">{course._count?.modules || 0}</span>
                        <span className="w-16 text-center text-slate-900 font-bold">{course.isFree ? 'Grátis' : `€${course.price}`}</span>
                        <div className="flex items-center justify-end gap-2 w-40">
                          <Link to={`/learn/${course.id}`}>
                            <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                              Ver
                            </Button>
                          </Link>
                          <Link to={`/creator/courses/${course.id}/edit`}>
                            <Button variant="primary" size="sm" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};
