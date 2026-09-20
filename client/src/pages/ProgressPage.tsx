import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Clock, Award, BookOpen, CheckCircle2, Check } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProgressPage: React.FC = () => {
 const { user } = useAuth();
 const [stats, setStats] = useState<any>(null);
 const [enrollments, setEnrollments] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  Promise.all([
   api.getUserStats().catch(() => null),
   api.getMyCourses().catch(() => []),
  ]).then(([statsData, enrollmentsData]) => {
   setStats(statsData);
   setEnrollments(enrollmentsData || []);
   setLoading(false);
  });
 }, [user?.id]);

 return (
  <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
   
   {/* Header */}
   <div className="pb-6 border-b border-slate-200">
    <div className="flex items-center gap-2 mb-2">
     <Badge size="md" variant="primary">Estatísticas</Badge>
    </div>
    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">O Seu Progresso & Desempenho</h1>
    <p className="text-base text-slate-600 mt-1">
     Métricas detalhadas sobre o seu tempo de estudo, questionários superados e cursos concluídos.
    </p>
   </div>

   {/* 4 Stats Cards */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="p-6 border-slate-200 bg-white shadow-xs">
     <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
       <Clock className="w-6 h-6" />
      </div>
      <div>
       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tempo Total</p>
       <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats?.totalHours || '24.6'}h</p>
      </div>
     </div>
    </Card>

    <Card className="p-6 border-slate-200 bg-white shadow-xs">
     <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
       <Flame className="w-6 h-6 fill-amber-500" />
      </div>
      <div>
       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sequência Atual</p>
       <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats?.streakDays || 12} dias</p>
      </div>
     </div>
    </Card>

    <Card className="p-6 border-slate-200 bg-white shadow-xs">
     <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
       <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quizzes Aprovados</p>
       <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats?.quizzesTaken || 5}</p>
      </div>
     </div>
    </Card>

    <Card className="p-6 border-slate-200 bg-white shadow-xs">
     <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
       <Award className="w-6 h-6" />
      </div>
      <div>
       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Distintivos</p>
       <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats?.badgesCount || 5}</p>
      </div>
     </div>
    </Card>
   </div>

   {/* Chart & Streak Breakdown */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <Card className="lg:col-span-2 p-7 border-slate-200 bg-white shadow-xs">
     <h3 className="text-lg font-bold text-slate-900 mb-1">Horas de Estudo Semanal</h3>
     <p className="text-xs text-slate-400 font-semibold mb-6">Dedicação diária nos últimos 7 dias</p>

     <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
       <BarChart data={stats?.weeklyHours || [
        { day: 'Seg', hours: 2.5 },
        { day: 'Ter', hours: 3.8 },
        { day: 'Qua', hours: 1.5 },
        { day: 'Qui', hours: 4.2 },
        { day: 'Sex', hours: 3.0 },
        { day: 'Sáb', hours: 5.1 },
        { day: 'Dom', hours: 2.0 }
       ]}>
        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="h" />
        <Tooltip
         contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
         cursor={{ fill: 'rgba(239, 246, 255, 0.6)' }}
         formatter={(val: any) => [`${val} horas`, 'Tempo']}
        />
        <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#2563eb" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </Card>

    {/* Streak Consistency */}
    <Card className="p-7 flex flex-col justify-between border-slate-200 bg-white shadow-xs">
     <div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">Calendário de Frequência</h3>
      <p className="text-xs text-slate-400 font-semibold mb-6">Consistência diária</p>

      <div className="grid grid-cols-7 gap-2 text-center mb-6">
       {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
         <span className="text-xs font-bold text-slate-400">{d}</span>
         <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
          i < 6 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 border border-slate-200 text-slate-400'
         }`}>
          {i < 6 ? <Check className="w-3.5 h-3.5 text-amber-800" /> : null}
         </div>
        </div>
       ))}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
       O hábito de estudo diário acelera a aprendizagem. Dedicar apenas 15 minutos por dia garante uma retenção até 3x superior.
      </p>
     </div>

     <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 mt-6">
      <span className="font-extrabold text-amber-800 text-sm">12 Dias Consecutivos</span>
      <p className="text-amber-700 text-xs mt-0.5 font-medium">Top 5% de consistência na plataforma</p>
     </div>
    </Card>
   </div>

   {/* Course Completion Breakdown */}
   <div>
    <h3 className="text-xl font-bold text-slate-900 mb-4">Progresso por Curso</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     {enrollments.map(e => (
      <Card key={e.id} className="p-6 border-slate-200 bg-white shadow-xs">
       <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 text-base truncate max-w-xs">{e.course?.title}</h4>
        <Badge variant={e.isCompleted ? 'success' : 'primary'} size="md" className="font-bold">
         {Math.round(e.progressPercent)}%
        </Badge>
       </div>
       <ProgressBar value={e.progressPercent} size="md" variant={e.isCompleted ? 'success' : 'brand'} className="my-3" />
       <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
        <span>{e.isCompleted ? 'Curso Concluído' : 'Em Progresso'}</span>
        <span>Instrutor: {e.course?.creator?.name}</span>
       </div>
      </Card>
     ))}
    </div>
   </div>

  </div>
 );
};
