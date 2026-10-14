import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Search, Users, UserPlus, Trash2, MessageSquare, BookOpen, CheckCircle, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';

export const CreatorMembers = () => {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'collaborators'
  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Collaborators management state
  const [selectedCollabCourseId, setSelectedCollabCourseId] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [isAddCollabModalOpen, setIsAddCollabModalOpen] = useState(false);
  const [collabIdentifier, setCollabIdentifier] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);
  const [removingCollabId, setRemovingCollabId] = useState(null);

  // Student details modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isAddCollabModalOpen || selectedStudent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddCollabModalOpen, selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, coursesData] = await Promise.all([
        api.getCreatorMembers().catch(() => []),
        api.getCreatorCourses().catch(() => [])
      ]);
      setMembers(membersData || []);
      setCourses(coursesData || []);
      if (coursesData && coursesData.length > 0 && !selectedCollabCourseId) {
        setSelectedCollabCourseId(coursesData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCollaborators = async (courseId) => {
    if (!courseId) return;
    setLoadingCollabs(true);
    try {
      const data = await api.getCourseCollaborators(courseId);
      setCollaborators(data || []);
    } catch (err) {
      setCollaborators([]);
    } finally {
      setLoadingCollabs(false);
    }
  };

  useEffect(() => {
    if (selectedCollabCourseId) {
      loadCollaborators(selectedCollabCourseId);
    }
  }, [selectedCollabCourseId]);

  const courseOptions = useMemo(() => {
    if (courses && courses.length > 0) {
      return courses.map(c => ({ id: c.id, title: c.title }));
    }
    const map = new Map();
    members.forEach(m => {
      if (m.course?.id && m.course?.title) {
        map.set(m.course.id, m.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [courses, members]);

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      m.course?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = selectedCourseFilter === 'ALL' || m.course?.id === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!collabIdentifier.trim() || !selectedCollabCourseId) return;
    setAddingCollab(true);
    try {
      const newCollab = await api.addCourseCollaborator(selectedCollabCourseId, collabIdentifier.trim());
      setCollaborators(prev => [...prev, newCollab]);
      toast({
        title: 'Colaborador Adicionado!',
        message: `${newCollab.name || collabIdentifier} agora é colaborador deste curso.`,
        type: 'success'
      });
      setCollabIdentifier('');
      setIsAddCollabModalOpen(false);
      // Refresh members list as collaborator was also enrolled
      api.getCreatorMembers().then(data => setMembers(data || [])).catch(() => {});
    } catch (err) {
      toast({
        title: 'Erro ao Adicionar',
        message: err.message || 'Não foi possível encontrar ou associar o colaborador.',
        type: 'error'
      });
    } finally {
      setAddingCollab(false);
    }
  };

  const handleRemoveCollaborator = async (collab) => {
    if (!window.confirm(`Tem a certeza que deseja remover ${collab.name || collab.username} dos colaboradores?`)) {
      return;
    }
    setRemovingCollabId(collab.userId);
    try {
      await api.removeCourseCollaborator(selectedCollabCourseId, collab.userId);
      setCollaborators(prev => prev.filter(c => c.userId !== collab.userId));
      toast({
        title: 'Colaborador Removido',
        message: 'O colaborador foi desassociado do curso.',
        type: 'success'
      });
      // Refresh members
      api.getCreatorMembers().then(data => setMembers(data || [])).catch(() => {});
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao remover colaborador.',
        type: 'error'
      });
    } finally {
      setRemovingCollabId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Tem a certeza que deseja remover ${member.user?.name} do curso "${member.course?.title}"?`)) {
      return;
    }
    setDeletingMemberId(member.id);
    try {
      await api.removeCourseMember(member.course.id, member.user.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      toast({
        title: 'Membro Removido',
        message: `${member.user?.name} foi removido do curso.`,
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível remover o membro.',
        type: 'error'
      });
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 animate-fade-in pb-16 px-3 sm:px-6">
      {/* Header */}
      <div className="pb-4 sm:pb-6 border-b border-slate-200 dark:border-[#222636] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge size="md" variant="primary">
                Gestão da Turma
              </Badge>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {members.length} {members.length === 1 ? 'aluno inscrito' : 'alunos inscritos'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Membros & Colaboradores
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Faça a gestão dos alunos inscritos e adicione co-instrutores para colaborar na gestão dos seus cursos.
            </p>
          </div>

          {activeTab === 'collaborators' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddCollabModalOpen(true)}
              className="self-start sm:self-auto font-bold"
            >
              Adicionar Colaborador
            </Button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-[#222636] gap-6 text-sm font-semibold pt-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alunos Inscritos ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'collaborators'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Colaboradores do Curso</span>
          </button>
        </div>

        {/* Filters Bar for Members */}
        {activeTab === 'members' && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar membros ou cursos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-xs transition-all"
              />
            </div>

            <div className="relative">
              <Select
                value={selectedCourseFilter}
                onChange={e => setSelectedCourseFilter(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-blue-500 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">Todos os Cursos ({members.length})</option>
                {courseOptions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Course selector for Collaborators tab */}
        {activeTab === 'collaborators' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Curso Selecionado:</span>
              <Select
                value={selectedCollabCourseId}
                onChange={e => setSelectedCollabCourseId(e.target.value)}
                className="bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                {courseOptions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <>
          {loading ? (
            <div className="p-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
              A carregar lista de membros...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
              Nenhum membro encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636] shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1e2130] bg-slate-50/70 dark:bg-[#151720] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Aluno</th>
                    <th className="py-3.5 px-4">Curso</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-center">Progresso</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e2130] text-sm">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={m.user?.avatarUrl} name={m.user?.name} size="md" status="online" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {m.user?.name}
                            </span>
                            <span className="text-xs text-slate-400 font-medium block truncate">@{m.user?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                          {m.course?.title || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          m.role === 'COLABORADOR'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {m.role || 'ALUNO'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Math.round(Number(m.progressPercent ?? 0))}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to="/messages">
                            <Button variant="secondary" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />} className="font-semibold text-xs">
                              Chat
                            </Button>
                          </Link>
                          <button
                            disabled={deletingMemberId === m.id}
                            onClick={() => handleRemoveMember(m)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                            title="Remover membro do curso"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: COLLABORATORS */}
      {activeTab === 'collaborators' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-4 rounded-2xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
              <strong className="block text-sm font-bold mb-0.5">O que são Colaboradores?</strong>
              Os colaboradores têm permissão para editar conteúdos do curso, adicionar aulas e interagir com os alunos no canal da turma. O proprietário do curso continua a ser o responsável principal.
            </div>
          </div>

          {loadingCollabs ? (
            <div className="p-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
              A carregar colaboradores...
            </div>
          ) : collaborators.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636] flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Nenhum colaborador adicionado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Ainda não adicionou colaboradores a este curso. Convide outros formadores ou colegas para o ajudar na gestão.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setIsAddCollabModalOpen(true)}
                className="mt-2 font-bold"
              >
                Adicionar Colaborador
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaborators.map(c => (
                <div
                  key={c.id || c.userId}
                  className="bg-white dark:bg-[#12141c] p-4 rounded-2xl border border-slate-200 dark:border-[#222636] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={c.avatarUrl} name={c.name} size="md" status="online" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">@{c.username} • {c.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                        COLABORADOR
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={removingCollabId === c.userId}
                    onClick={() => handleRemoveCollaborator(c)}
                    className="p-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                    title="Remover colaborador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Adicionar Colaborador */}
      {isAddCollabModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 dark:bg-black/90" onClick={() => setIsAddCollabModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636] p-6 shadow-2xl z-10 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Adicionar Colaborador</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ao curso selecionado</p>
              </div>
            </div>

            <form onSubmit={handleAddCollaborator} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Curso
                </label>
                <Select
                  value={selectedCollabCourseId}
                  onChange={e => setSelectedCollabCourseId(e.target.value)}
                  className="w-full text-xs font-bold"
                >
                  {courseOptions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome de Utilizador ou Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: joao_silva ou joao@exemplo.com"
                  value={collabIdentifier}
                  onChange={e => setCollabIdentifier(e.target.value)}
                  className="w-full bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  O utilizador precisa de ter uma conta registada na plataforma.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAddCollabModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={addingCollab} className="font-bold">
                  {addingCollab ? 'A adicionar...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
export default CreatorMembers;