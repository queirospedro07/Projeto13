import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
 Play, 
 Flame, 
 Clock, 
 Award, 
 BookOpen, 
 CheckCircle2, 
 TrendingUp, 
 ArrowRight, 
 Target, 
 Sparkles,
 Users,
 Compass,
 GraduationCap,
 Star,
 Check
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
 const { user } = useAuth();
 const [stats, setStats] = useState<any>(null);
 const [myCourses, setMyCourses] = useState<any[]>([]);
 const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  Promise.all([
   api.getUserStats().catch(() => null),
   api.getMyCourses().catch(() => []),
   api.getCourses({ sort: 'popular' }).catch(() => [])
  ]).then(([statsData, myCoursesData, allCourses]) => {
   setStats(statsData);
   setMyCourses(myCoursesData || []);
   // Exclude already enrolled from recommendations
   const enrolledIds = new Set((myCoursesData || []).map((e: any) => e.courseId));
   setRecommendedCourses((allCourses || []).filter((c: any) => !enrolledIds.has(c.id)).slice(0, 3));
   setLoading(false);
  });
 }, [user?.id]);

 const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
 };

 const primaryEnrollment = myCourses[0] || null;

 return (
  <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
   
   {/* 1. Header with Personalized Greeting & Streak */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
    <div>
     <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
       Painel do Aluno
      </span>
     </div>
     <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
      {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Aluno'}!
     </h1>
     <p className="text-base text-slate-600 dark:text-zinc-400 mt-1">
      Continue as suas aulas em curso, acompanhe a sua turma e alcance os seus objetivos semanais.
     </p>
    </div>

    {/* Action buttons */}
    <div className="flex items-center gap-3">
     <Link to="/library">
      <button className="px-5 py-2.5 text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer">
       <Users className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
       <span>Os Meus Espaços</span>
      </button>
     </Link>
     <Link to="/community">
      <button className="px-5 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer">
       <Compass className="w-4 h-4" />
       <span>Explorar Espaços</span>
      </button>
     </Link>
    </div>
   </div>

   {/* 2. Top Highlights Grid */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    {/* Continue Learning Featured Card or Empty State */}
    <div className="lg:col-span-2 flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200 dark:border-zinc-800 shadow-sm">
     {primaryEnrollment ? (
      <>
       <div>
        <div className="flex items-center justify-between mb-4">
         <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
          Em Curso
         </span>
         <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
          {Math.round(primaryEnrollment.progressPercent || 0)}% concluído
         </span>
        </div>

        <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2 leading-snug">
         {primaryEnrollment.course?.title || 'Curso em Andamento'}
        </h3>
        <p className="text-base text-slate-600 dark:text-zinc-400 line-clamp-2 mb-6">
         {primaryEnrollment.course?.description || 'Continue de onde parou as suas lições práticas.'}
        </p>

        <ProgressBar
         value={primaryEnrollment.progressPercent || 0}
         size="lg"
         variant="brand"
         className="mb-6"
        />
       </div>

       <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400">
         <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
         <span>{primaryEnrollment.course?.durationHours ? `${primaryEnrollment.course.durationHours}h de carga horária` : 'Pronto para aprender'}</span>
        </div>
        <Link to={`/learn/${primaryEnrollment.courseId}`}>
         <button className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer">
          <span>Continuar Aula</span>
          <ArrowRight className="w-4 h-4" />
         </button>
        </Link>
       </div>
      </>
     ) : (
      <div className="flex flex-col justify-between h-full py-2">
       <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 border border-blue-100 dark:border-blue-900/40">
         <Sparkles className="w-3.5 h-3.5" />
         Bem-vindo ao LearnSpace
        </div>
        <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2 leading-snug">
         Ainda não está inscrito em nenhum curso
        </h3>
        <p className="text-base text-slate-600 dark:text-zinc-400 mb-6">
         Explore o nosso catálogo com cursos interativos, projetos práticos e salas de estudo ao vivo da comunidade.
        </p>
       </div>

       <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-zinc-800">
        <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
         Inicie a sua formação académica
        </span>
        <Link to="/explore">
         <button className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer">
          <Compass className="w-4 h-4" />
          <span>Explorar Cursos</span>
         </button>
        </Link>
       </div>
      </div>
     )}
    </div>

    {/* Streak & Daily Goal Card */}
    <div className="flex flex-col gap-6">
     
     {/* Streak Card */}
     <div className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-4">
       <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-500">
        <Flame className="w-7 h-7 fill-amber-500 text-amber-500" />
       </div>
       <div>
        <p className="text-2xl font-black text-slate-950 dark:text-white">
         {user?.streakDays ?? 0} Dias
        </p>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Sequência de Estudo</p>
       </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
       (user?.streakDays ?? 0) > 0 
        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
      }`}>
       {(user?.streakDays ?? 0) > 0 ? 'Ativa' : 'Inativa'}
      </span>
     </div>

     {/* Daily Goal Card */}
     <div className="p-6 rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-bold text-slate-900 dark:text-white">Meta Diária de Estudo</span>
       </div>
       <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
        {user?.minutesToday ?? 0} / {user?.dailyGoalMinutes || 45}m
       </span>
      </div>
      <ProgressBar
       value={user?.minutesToday ?? 0}
       max={user?.dailyGoalMinutes || 45}
       size="md"
       variant="brand"
       className="my-3"
      />
      <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 text-right">
       {Math.max(0, (user?.dailyGoalMinutes || 45) - (user?.minutesToday ?? 0)) === 0
        ? 'Meta de hoje cumprida!'
        : `Faltam ${Math.max(0, (user?.dailyGoalMinutes || 45) - (user?.minutesToday ?? 0))} minutos para bater a meta de hoje`}
      </p>
     </div>

    </div>
   </div>

   {/* 3. Progress Overview & Study Time Chart */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    {/* Weekly Chart */}
    <div className="lg:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
     <div className="flex items-center justify-between mb-6">
      <div>
       <h3 className="text-lg font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Atividade Semanal
       </h3>
       <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Horas de dedicação nos últimos 7 dias</p>
      </div>
      <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-sm border border-blue-100 dark:border-blue-900/40">
       Total: {stats?.totalMinutes ? (stats.totalMinutes / 60).toFixed(1) : (stats?.totalHours ?? '0.0')} horas
      </span>
     </div>

     <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
       <BarChart data={stats?.weeklyHours && stats.weeklyHours.length > 0 ? stats.weeklyHours : [
        { day: 'Seg', hours: 0 },
        { day: 'Ter', hours: 0 },
        { day: 'Qua', hours: 0 },
        { day: 'Qui', hours: 0 },
        { day: 'Sex', hours: 0 },
        { day: 'Sáb', hours: 0 },
        { day: 'Dom', hours: 0 },
       ]}>
        <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
         contentStyle={{ backgroundColor: '#0e0e0e', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
         cursor={{ fill: 'rgba(241, 245, 249, 0.05)' }}
         formatter={(val: any) => [`${val} horas`, 'Investidas']}
        />
        <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
         {(stats?.weeklyHours && stats.weeklyHours.length > 0 ? stats.weeklyHours : [
          { day: 'Seg', hours: 0 },
          { day: 'Ter', hours: 0 },
          { day: 'Qua', hours: 0 },
          { day: 'Qui', hours: 0 },
          { day: 'Sex', hours: 0 },
          { day: 'Sáb', hours: 0 },
          { day: 'Dom', hours: 0 },
         ]).map((entry: any, index: number) => (
          <Cell
           key={`cell-${index}`}
           fill={entry.hours > 0 ? '#2563eb' : '#27272a'}
           className="transition-colors hover:fill-blue-600"
          />
         ))}
        </Bar>
       </BarChart>
      </ResponsiveContainer>
     </div>

     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
      <div>
       <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Inscritos</p>
       <p className="font-black text-slate-900 dark:text-white text-lg mt-1">{myCourses.length}</p>
      </div>
      <div>
       <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Quizzes</p>
       <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg mt-1">{stats?.quizzesTaken ?? 0}</p>
      </div>
      <div>
       <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Badges</p>
       <p className="font-black text-amber-600 dark:text-amber-400 text-lg mt-1">{stats?.badgesCount ?? 0}</p>
      </div>
      <div>
       <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Total XP</p>
       <p className="font-black text-blue-600 dark:text-blue-400 text-lg mt-1">{user?.xp ?? 0}</p>
      </div>
     </div>
    </div>

    {/* Streak Calendar / Activity Feed */}
    <div className="p-8 rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
     <div>
      <div className="flex items-center justify-between mb-6">
       <h3 className="text-lg font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
        <Flame className="w-5 h-5 text-amber-500" /> Consistência
       </h3>
       <Link to="/progress" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
        Ver Tudo →
       </Link>
      </div>

      {/* Weekly Days Indicator */}
      <div className="grid grid-cols-7 gap-2 mb-6 text-center">
       {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => {
        const hasStudied = i < (user?.streakDays ?? 0);
        return (
         <div key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold">{day}</span>
          <div
           className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
            hasStudied
             ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
             : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-zinc-800'
           }`}
          >
           {hasStudied ? <Check className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" /> : null}
          </div>
         </div>
        );
       })}
      </div>

      <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">
       {(user?.streakDays ?? 0) > 0 ? (
        <>Sequência de aprendizagem ativa de <span className="font-bold text-slate-900 dark:text-white">{user?.streakDays} dia(s) consecutivos</span>. Conclua mais 1 lição hoje para manter a sequência!</>
       ) : (
        <>Ainda não iniciou a sua sequência. Conclua a sua primeira lição para acumular dias consecutivos!</>
       )}
      </p>
     </div>

     <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center gap-3">
      <Award className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="text-xs">
       <p className="font-bold text-slate-900 dark:text-white text-sm">Próximo Marco: 7 Dias</p>
       <p className="text-amber-800 dark:text-amber-300 font-medium">+100 XP & Medalha de Académico Dedicado</p>
      </div>
     </div>
    </div>
   </div>

   {/* 4. Recommended For You */}
   <div>
    <div className="flex items-center justify-between mb-6">
     <div>
      <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">Cursos Recomendados</h3>
      <p className="text-sm text-slate-600 dark:text-zinc-400">Formações selecionadas especialmente para o seu perfil</p>
     </div>
     <Link to="/explore" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
      Explorar catálogo completo <ArrowRight className="w-4 h-4" />
     </Link>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
     {recommendedCourses.map(c => (
      <div key={c.id} className="rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] shadow-sm hover:shadow-2xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
       <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
        <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

        {/* Top Overlays */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg flex items-center gap-1">
           <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
           {c.category}
          </span>
          {c.difficulty && (
           <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-zinc-200 shadow-lg">
            {c.difficulty === 'Beginner' ? 'Iniciante' : c.difficulty === 'Intermediate' ? 'Intermédio' : c.difficulty === 'Advanced' ? 'Avançado' : c.difficulty}
           </span>
          )}
         </div>
         <div>
          {c.isEnrolled ? (
           <span className="px-3 py-1 rounded-xl bg-emerald-600/95 text-white backdrop-blur-md border border-emerald-400/40 text-xs font-black shadow-lg uppercase tracking-wider flex items-center gap-1">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Adquirido
           </span>
          ) : c.isFree ? (
           <span className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30 text-xs font-extrabold shadow-lg uppercase tracking-wider">
            Gratuito
           </span>
          ) : (
           <span className="px-3 py-1 rounded-xl bg-blue-600/90 text-white backdrop-blur-md border border-blue-400/30 text-xs font-extrabold shadow-lg">
            {c.price} €
           </span>
          )}
         </div>
        </div>

        {/* Bottom Overlays */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{c.averageRating || '5.0'}</span>
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 shadow-md">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{c.durationHours}h</span>
         </div>
        </div>
       </div>

       <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
         <h4 className="font-extrabold text-slate-950 dark:text-white text-base line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.title}</h4>
         <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mt-1.5">{c.description}</p>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1a1a1a] flex items-center justify-between">
         <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{c.durationHours}h de conteúdo</span>
         <Link to={c.isEnrolled ? `/learn/${c.id}` : `/courses/${c.id}`}>
          <button className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
           c.isEnrolled
            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-950/20'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}>
           {c.isEnrolled ? 'Continuar' : 'Ver Curso'}
          </button>
         </Link>
        </div>
       </div>
      </div>
     ))}
    </div>
   </div>

  </div>
 );
};
