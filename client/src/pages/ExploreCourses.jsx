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
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Pesquise por título, tecnologia, criador ou palavra-chave..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-[#0c0d12] border border-slate-300 dark:border-neutral-800 focus:border-slate-900 dark:focus:border-white rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none shadow-xs transition-colors" />
          </div>
          <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-lg transition-all cursor-pointer border border-slate-900 dark:border-white shadow-xs">
            Pesquisar
          </button>
        </form>

        
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'}`}>
              {cat.label}
            </button>)}
        </div>

        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-neutral-300 text-xs">Nível:</span>
              <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} className="bg-white dark:bg-[#0c0d12] border border-slate-300 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none">
                <option value="all">Todos os Níveis</option>
                <option value="Beginner">Iniciante</option>
                <option value="Intermediate">Intermédio</option>
                <option value="Advanced">Avançado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-neutral-300 text-xs">Preço:</span>
              <select value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)} className="bg-white dark:bg-[#0c0d12] border border-slate-300 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none">
                <option value="all">Todos os Preços</option>
                <option value="free">Gratuito</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-700 dark:text-neutral-300 text-xs">Ordenar:</span>
            <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)} className="bg-white dark:bg-[#0c0d12] border border-slate-300 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none">
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
        </div> : courses.length === 0 ? <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-[#222222] rounded-xl bg-white dark:bg-[#0a0a0a] p-8">
          <BookOpen className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Nenhum curso encontrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Experimente ajustar os filtros ou os termos de pesquisa.
          </p>
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => <div key={course.id} className="rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-slate-400 dark:hover:border-neutral-600 transition-colors overflow-hidden flex flex-col justify-between group">
              
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 opacity-95" />

                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[11px] font-semibold text-white flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      {course.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-medium text-slate-200">
                      {course.difficulty === 'Beginner' ? 'Iniciante' : course.difficulty === 'Intermediate' ? 'Intermédio' : course.difficulty === 'Advanced' ? 'Avançado' : course.difficulty}
                    </span>
                  </div>

                  <div>
                    {course.isEnrolled ? <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Adquirido
                      </span> : course.isFree ? <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        Gratuito
                      </span> : <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">
                        {course.price} €
                      </span>}
                  </div>
                </div>

                <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-xs font-semibold text-white">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{course.averageRating || '5.0'}</span>
                    <span className="text-slate-400 text-[10px]">({course.studentsCount || 0})</span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-medium text-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{course.durationHours}h</span>
                  </div>
                </div>

                {course.isEnrolled && <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{
              width: `${Math.min(100, Math.max(0, course.userProgress || 0))}%`
            }} />
                  </div>}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={course.creator?.avatarUrl} name={course.creator?.name} size="sm" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate">
                      {course.creator?.name}
                    </span>
                  </div>

                  <Link to={course.isEnrolled ? `/learn/${course.id}` : `/courses/${course.id}`}>
                    <button className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border ${course.isEnrolled ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white hover:bg-black' : 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white'}`}>
                      {course.isEnrolled ? <>
                          <span>Continuar ({Math.round(course.userProgress || 0)}%)</span>
                          <ArrowRight className="w-3 h-3" />
                        </> : 'Ver Curso'}
                    </button>
                  </Link>
                </div>
              </div>
            </div>)}
        </div>}
    </div>;
};