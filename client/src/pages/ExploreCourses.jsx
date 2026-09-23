import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, BookOpen, Clock, GraduationCap, Check, ArrowRight } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { api } from '../services/api';
export const ExploreCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const categories = [{
    id: 'all',
    label: 'Todos os Cursos'
  }, {
    id: 'programming',
    label: 'Programação & Web'
  }, {
    id: 'design',
    label: 'Design & UI/UX'
  }, {
    id: 'ai',
    label: 'Inteligência Artificial'
  }, {
    id: 'cybersecurity',
    label: 'Cibersegurança'
  }, {
    id: 'cloud',
    label: 'Cloud & DevOps'
  }, {
    id: 'finance',
    label: 'Finanças & Negócios'
  }, {
    id: 'photography',
    label: 'Multimédia & Vídeo'
  }];
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        sort: selectedSort
      };
      if (search) params.search = search;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (selectedPrice === 'free') params.isFree = 'true';
      if (selectedPrice === 'paid') params.isFree = 'false';
      const data = await api.getCourses(params);
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedDifficulty, selectedSort, selectedPrice]);
  const handleSearchSubmit = e => {
    e.preventDefault();
    fetchCourses();
  };
  return <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
          Catálogo de Cursos
        </h1>
        <p className="text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-3xl">
          Domine novas competências práticas através de cursos estruturados com canais de convívio,
          mentoria ao vivo e partilha de ecrã em tempo real.
        </p>
      </div>

      
      <div className="flex flex-col gap-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Pesquise por título, tecnologia, criador ou palavra-chave..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#222222] focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 shadow-xs transition-all" />
          </div>
          <button type="submit" className="px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-2xl transition-all cursor-pointer">
            Pesquisar
          </button>
        </form>

        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map(cat => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141414] hover:text-slate-950 dark:hover:text-white'}`}>
              {cat.label}
            </button>)}
        </div>

        
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-sm text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-4 flex-wrap">
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-zinc-300">Nível:</span>
              <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} className="bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#222222] text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-2xs">
                <option value="all">Todos os Níveis</option>
                <option value="Beginner">Iniciante</option>
                <option value="Intermediate">Intermédio</option>
                <option value="Advanced">Avançado</option>
              </select>
            </div>

            
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-zinc-300">Preço:</span>
              <select value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)} className="bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#222222] text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-2xs">
                <option value="all">Todos os Preços</option>
                <option value="free">Gratuito</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>

          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-zinc-300">Ordenar:</span>
            <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)} className="bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-[#222222] text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 shadow-2xs">
              <option value="popular">Mais Populares</option>
              <option value="newest">Mais Recentes</option>
              <option value="price-low">Preço: Menor para Maior</option>
              <option value="price-high">Preço: Maior para Menor</option>
            </select>
          </div>
        </div>
      </div>

      
      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div> : courses.length === 0 ? <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-[#222222] rounded-3xl bg-white dark:bg-[#0a0a0a] p-8">
          <BookOpen className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Nenhum curso encontrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Experimente ajustar os filtros ou os termos de pesquisa.
          </p>
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => <div key={course.id} className="rounded-3xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] shadow-sm hover:shadow-2xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
              
              <div className="relative h-52 w-full bg-slate-900 overflow-hidden">
                <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />

                
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                
                <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      {course.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-zinc-200 shadow-lg">
                      {course.difficulty === 'Beginner' ? 'Iniciante' : course.difficulty === 'Intermediate' ? 'Intermédio' : course.difficulty === 'Advanced' ? 'Avançado' : course.difficulty}
                    </span>
                  </div>

                  
                  <div>
                    {course.isEnrolled ? <span className="px-3 py-1 rounded-xl bg-emerald-600/95 text-white backdrop-blur-md border border-emerald-400/40 text-xs font-black shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Adquirido
                      </span> : course.isFree ? <span className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30 text-xs font-extrabold shadow-lg uppercase tracking-wider">
                        Gratuito
                      </span> : <span className="px-3 py-1 rounded-xl bg-blue-600/90 text-white backdrop-blur-md border border-blue-400/30 text-xs font-extrabold shadow-lg">
                        {course.price} €
                      </span>}
                  </div>
                </div>

                
                <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between pointer-events-none">
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{course.averageRating || '5.0'}</span>
                    <span className="text-zinc-400 text-[11px]">({course.studentsCount || 0})</span>
                  </div>

                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 shadow-md">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{course.durationHours}h</span>
                  </div>
                </div>

                
                {course.isEnrolled && <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{
              width: `${Math.min(100, Math.max(0, course.userProgress || 0))}%`
            }} />
                  </div>}
              </div>

              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                
                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-[#1a1a1a] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={course.creator?.avatarUrl} name={course.creator?.name} size="sm" />
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {course.creator?.name}
                    </span>
                  </div>

                  <Link to={course.isEnrolled ? `/learn/${course.id}` : `/courses/${course.id}`}>
                    <button className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${course.isEnrolled ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-950/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}>
                      {course.isEnrolled ? <>
                          <span>Continuar ({Math.round(course.userProgress || 0)}%)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </> : 'Ver Curso'}
                    </button>
                  </Link>
                </div>
              </div>
            </div>)}
        </div>}
    </div>;
};