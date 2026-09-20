import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Users, 
  Home, 
  Trophy, 
  FolderPlus, 
  Settings, 
  ArrowRight,
  Command,
  X,
  Clock,
  Trash2,
  Tag
} from 'lucide-react';
import { api } from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | 'courses' | 'spaces' | 'actions';

interface PaletteItem {
  id: string;
  type: 'course' | 'space' | 'action' | 'history';
  title: string;
  subtitle?: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
}

const RECENT_SEARCHES_KEY = 'learnspace_recent_searches';

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || '');

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      setRecentSearches([]);
    }
  }, [isOpen]);

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const removeSingleRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      api.getCourses().then(data => setCourses(data || [])).catch(() => {});
      api.getSpaces().then(data => setSpaces(data || [])).catch(() => {});
    }
  }, [isOpen]);

  // Static quick navigation actions
  const quickActions: PaletteItem[] = useMemo(() => [
    { id: 'act-dashboard', type: 'action', title: 'Ir para Painel Principal', subtitle: 'Aceda aos seus cursos ativos e progresso', to: '/dashboard', icon: Home, badge: 'Navegação' },
    { id: 'act-explore', type: 'action', title: 'Explorar Catálogo de Cursos', subtitle: 'Descubra cursos certificados e módulos práticos', to: '/explore', icon: BookOpen, badge: 'Cursos' },
    { id: 'act-community', type: 'action', title: 'Descobrir Espaços & Salas', subtitle: 'Canais de estudo em grupo e comunicação ao vivo', to: '/community', icon: Users, badge: 'Comunidade' },
    { id: 'act-leaderboard', type: 'action', title: 'Classificação Global', subtitle: 'Tabela de líderes e pontuação de XP', to: '/leaderboard', icon: Trophy, badge: 'Gamificação' },
    { id: 'act-creator', type: 'action', title: 'Estúdio do Criador', subtitle: 'Gestão de cursos, estatísticas e novos conteúdos', to: '/creator', icon: FolderPlus, badge: 'Criadores' },
    { id: 'act-settings', type: 'action', title: 'Definições & Preferências', subtitle: 'Ajuste de perfil, notificações e segurança', to: '/settings', icon: Settings, badge: 'Conta' },
  ], []);

  // Filtered courses
  const filteredCourses: PaletteItem[] = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'courses') return [];
    const q = query.toLowerCase().trim();
    return courses
      .filter(c => !q || c.title.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q)))
      .slice(0, 6)
      .map(c => ({
        id: `course-${c.id}`,
        type: 'course',
        title: c.title,
        subtitle: `${c.category || 'Geral'} • ${c.difficulty || 'Todos os níveis'} • ${c.isFree ? 'Gratuito' : `${c.price}€`}`,
        to: `/courses/${c.id}`,
        icon: BookOpen,
        badge: 'Curso',
      }));
  }, [courses, query, activeCategory]);

  // Filtered spaces
  const filteredSpaces: PaletteItem[] = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'spaces') return [];
    const q = query.toLowerCase().trim();
    return spaces
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)) || (s.tagline && s.tagline.toLowerCase().includes(q)))
      .slice(0, 6)
      .map(s => ({
        id: `space-${s.id}`,
        type: 'space',
        title: s.name,
        subtitle: s.tagline || s.description || `${s.memberCount || 1} membros ativos`,
        to: `/community/${s.id}`,
        icon: Users,
        badge: 'Espaço',
      }));
  }, [spaces, query, activeCategory]);

  // Filtered actions
  const filteredActions: PaletteItem[] = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'actions') return [];
    const q = query.toLowerCase().trim();
    return quickActions.filter(a => !q || a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q)));
  }, [quickActions, query, activeCategory]);

  // Flat list of visible items for keyboard selection
  const flatItems: PaletteItem[] = useMemo(() => {
    return [...filteredCourses, ...filteredSpaces, ...filteredActions];
  }, [filteredCourses, filteredSpaces, filteredActions]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelect = (to: string, title?: string) => {
    if (title) saveRecentSearch(title);
    else if (query) saveRecentSearch(query);
    navigate(to);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }

      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex].to, flatItems[selectedIndex].title);
        } else if (query.trim()) {
          handleSelect(`/explore?search=${encodeURIComponent(query.trim())}`, query.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, query, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col">
        {/* Search input header */}
        <div className="flex items-center px-5 py-4 border-b border-slate-200 dark:border-neutral-800 gap-3.5 bg-white dark:bg-[#121214]">
          <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Pesquise cursos, lições, espaços, criadores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Filter categories bar */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50/80 dark:bg-[#0c0c0e] border-b border-slate-200/80 dark:border-neutral-800/80 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'courses', label: 'Cursos' },
            { id: 'spaces', label: 'Comunidades' },
            { id: 'actions', label: 'Ações Rápidas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as FilterCategory)}
              className={`px-3 py-1 rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results / Suggestions List */}
        <div 
          ref={resultsContainerRef}
          className="p-3 sm:p-4 max-h-[22rem] sm:max-h-96 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-sm bg-slate-50/40 dark:bg-[#0e0e10]"
        >
          {/* Recent Searches (shown when query is empty and history exists) */}
          {!query.trim() && recentSearches.length > 0 && activeCategory === 'all' && (
            <div>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Pesquisas Recentes
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 px-1">
                {recentSearches.map(item => (
                  <span
                    key={item}
                    onClick={() => setQuery(item)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                  >
                    <span>{item}</span>
                    <button
                      onClick={(e) => removeSingleRecentSearch(e, item)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover termo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Courses Category Section */}
          {filteredCourses.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                <span>Cursos ({filteredCourses.length})</span>
                {query.trim() && (
                  <button
                    onClick={() => handleSelect(`/explore?search=${encodeURIComponent(query)}`)}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Ver catálogo completo <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {filteredCourses.map(item => {
                  const globalIdx = flatItems.findIndex(i => i.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-active={isSelected}
                      onClick={() => handleSelect(item.to, item.title)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-neutral-800/80 border-blue-400 dark:border-blue-500/80 shadow-xs'
                          : 'bg-white dark:bg-[#141416] border-slate-200/80 dark:border-neutral-800/80 hover:border-blue-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
                        }`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate text-sm">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-neutral-700">
                          {item.badge}
                        </span>
                        <ArrowRight className={`w-4 h-4 transition-transform shrink-0 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-400 dark:text-zinc-600'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spaces / Communities Section */}
          {filteredSpaces.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                <span>Comunidades & Salas ({filteredSpaces.length})</span>
                {query.trim() && (
                  <button
                    onClick={() => handleSelect(`/community?search=${encodeURIComponent(query)}`)}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Ver todas as salas <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {filteredSpaces.map(item => {
                  const globalIdx = flatItems.findIndex(i => i.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-active={isSelected}
                      onClick={() => handleSelect(item.to, item.title)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-neutral-800/80 border-blue-400 dark:border-blue-500/80 shadow-xs'
                          : 'bg-white dark:bg-[#141416] border-slate-200/80 dark:border-neutral-800/80 hover:border-blue-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate text-sm">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-neutral-700">
                          {item.badge}
                        </span>
                        <ArrowRight className={`w-4 h-4 transition-transform shrink-0 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-400 dark:text-zinc-600'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Ações Rápidas
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {filteredActions.map(item => {
                  const globalIdx = flatItems.findIndex(i => i.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-active={isSelected}
                      onClick={() => handleSelect(item.to, item.title)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-neutral-800/80 border-blue-400 dark:border-blue-500/80 shadow-xs'
                          : 'bg-white dark:bg-[#141416] border-slate-200/80 dark:border-neutral-800/80 hover:border-blue-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-zinc-400'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate text-sm">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                          Abrir
                        </kbd>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results state */}
          {flatItems.length === 0 && (
            <div className="py-10 text-center flex flex-col items-center justify-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">
                Nenhum resultado direto para "{query}"
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                Experimente pesquisar com outras palavras-chave ou explorar diretamente os catálogos.
              </p>
              {query.trim() && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => handleSelect(`/explore?search=${encodeURIComponent(query.trim())}`)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Pesquisar em Cursos
                  </button>
                  <button
                    onClick={() => handleSelect(`/community?search=${encodeURIComponent(query.trim())}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Pesquisar em Salas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 font-medium text-[11px] sm:text-xs">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 font-mono text-[10px] text-slate-700 dark:text-zinc-300 font-bold">↑</kbd>
              <kbd className="bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 font-mono text-[10px] text-slate-700 dark:text-zinc-300 font-bold">↓</kbd>
              <span className="hidden sm:inline ml-1 text-slate-400 dark:text-zinc-500">Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 font-mono text-[10px] text-slate-700 dark:text-zinc-300 font-bold">Enter</kbd>
              <span className="hidden sm:inline ml-1 text-slate-400 dark:text-zinc-500">Selecionar</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <kbd className="bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700 font-mono text-[10px] text-slate-700 dark:text-zinc-300 font-bold">Esc</kbd>
              <span className="ml-1 text-slate-400 dark:text-zinc-500">Fechar</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-bold text-xs">
            <Command className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-zinc-300">LearnSpace</span>
          </span>
        </div>
      </div>
    </div>
  );
};
