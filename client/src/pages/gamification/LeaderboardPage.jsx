import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
export const LeaderboardPage = () => {
  const {
    user
  } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getLeaderboard({
      period
    }).then(res => {
      setLeaderboard(res.leaderboard || []);
      setCurrentUserRank(res.currentUserRank);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  return <div className="max-w-5xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">
              Classificações
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Classificação & Ranking
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Ganhe XP ao concluir aulas, responder a questionários e ajudar colegas na comunidade.
          </p>
        </div>

        
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${period === 'weekly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Semanal
          </button>
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${period === 'monthly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Mensal
          </button>
          <button onClick={() => setPeriod('all-time')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${period === 'all-time' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
            Geral
          </button>
        </div>
      </div>

      
      {leaderboard.length >= 3 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {top2 && <Card className="p-6 flex items-center gap-4 border-slate-200 bg-white order-2 sm:order-1 shadow-xs hover:border-slate-300 transition-colors">
              <span className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                #2
              </span>
              <Avatar src={top2.avatarUrl} name={top2.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{top2.name}</p>
                <p className="text-xs text-blue-600 font-bold mt-0.5">
                  {top2.xp.toLocaleString()} XP
                </p>
              </div>
            </Card>}

          
          {top1 && <Card className="p-6 flex items-center gap-4 border-amber-200 bg-gradient-to-br from-amber-50/60 to-white order-1 sm:order-2 ring-2 ring-amber-400/30 shadow-md">
              <span className="w-11 h-11 rounded-2xl bg-amber-500 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                #1
              </span>
              <Avatar src={top1.avatarUrl} name={top1.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 text-base truncate">{top1.name}</p>
                <p className="text-sm text-amber-600 font-extrabold mt-0.5">
                  {top1.xp.toLocaleString()} XP
                </p>
              </div>
            </Card>}

          
          {top3 && <Card className="p-6 flex items-center gap-4 border-slate-200 bg-white order-3 shadow-xs hover:border-slate-300 transition-colors">
              <span className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                #3
              </span>
              <Avatar src={top3.avatarUrl} name={top3.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{top3.name}</p>
                <p className="text-xs text-orange-600 font-bold mt-0.5">
                  {top3.xp.toLocaleString()} XP
                </p>
              </div>
            </Card>}
        </div>}

      
      <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-8">
            <span className="w-10 text-center">Pos.</span>
            <span>Aluno</span>
          </div>
          <div className="flex items-center gap-10">
            <span className="hidden sm:inline">Sequência</span>
            <span className="w-20 text-right">XP Total</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {leaderboard.map(item => {
          const isMe = item.id === user?.id;
          return <div key={item.id} className={`px-6 py-4 flex items-center justify-between transition-colors ${isMe ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-8 min-w-0">
                  <span className={`w-10 text-center font-extrabold text-sm ${item.rank === 1 ? 'text-amber-500 font-extrabold' : item.rank === 2 ? 'text-slate-600 font-bold' : item.rank === 3 ? 'text-orange-500 font-bold' : 'text-slate-400'}`}>
                    #{item.rank}
                  </span>

                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar src={item.avatarUrl} name={item.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {item.name} {isMe && '(Você)'}
                        </span>
                        <Badge size="sm" variant="primary" className="text-[10px] py-0 font-bold">
                          Nível {item.level}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">@{item.username}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10 text-sm">
                  <span className="hidden sm:flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {item.streakDays || 0} dias
                  </span>

                  <span className="w-20 text-right font-extrabold text-slate-900">
                    {item.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>;
        })}
        </div>
      </Card>
    </div>;
};