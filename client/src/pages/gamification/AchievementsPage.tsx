import React, { useState, useEffect } from 'react';
import { Award, Lock, CheckCircle2, Sparkles, Flame, Zap, Shield, Trophy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAchievements()
      .then(data => setAchievements(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const filtered = achievements.filter(a => {
    if (filter === 'unlocked') return a.isUnlocked;
    if (filter === 'locked') return !a.isUnlocked;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">Conquistas</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Conquistas & Distintivos
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Conclua módulos, mantenha sequências de estudo diárias e interaja na comunidade para desbloquear distintivos.
          </p>
        </div>

        {/* Unlocked ratio pill */}
        <div className="flex items-center gap-3.5 bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">Desbloqueadas</span>
            <p className="text-base font-extrabold text-slate-900">{unlockedCount} / {totalCount}</p>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${filter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}
        >
          Todas ({totalCount})
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${filter === 'unlocked' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}
        >
          Desbloqueadas ({unlockedCount})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${filter === 'locked' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}
        >
          Bloqueadas ({totalCount - unlockedCount})
        </button>
      </div>

      {/* Achievements Cards Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-slate-500 font-medium">A carregar conquistas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(ach => {
            const isUnlocked = ach.isUnlocked;

            return (
              <Card
                key={ach.id}
                className={`p-6 flex flex-col justify-between transition-all border-slate-200 ${
                  isUnlocked
                    ? 'bg-white shadow-sm hover:border-blue-300'
                    : 'opacity-60 bg-slate-50/80 border-dashed'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        isUnlocked
                          ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isUnlocked ? (
                        <Award className="w-6 h-6" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                        {ach.tier}
                      </span>
                      <Badge size="sm" variant="accent" className="font-bold">
                        +{ach.xpReward} XP
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{ach.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{ach.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  {isUnlocked ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Desbloqueada {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ''}
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Bloqueada
                    </span>
                  )}
                  <span className="text-slate-400 capitalize">{ach.category}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
