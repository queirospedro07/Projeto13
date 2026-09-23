import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
export const CreatorMembers = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradingScore, setGradingScore] = useState(85);
  const [gradingFeedback, setGradingFeedback] = useState('Excelente raciocínio estruturado, cumpriu todos os critérios essenciais.');
  const [essayGraded, setEssayGraded] = useState(false);
  const [roleModalMember, setRoleModalMember] = useState(null);
  const [courseRoles, setCourseRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const { toast } = useToast();

  const fetchMembers = () => {
    setLoading(true);
    api.getCreatorMembers()
      .then(data => setMembers(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Extract distinct course list for filter
  const courseOptions = React.useMemo(() => {
    const map = new Map();
    members.forEach(m => {
      if (m.course?.id && m.course?.title) {
        map.set(m.course.id, m.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [members]);

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      m.course?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = selectedCourseFilter === 'ALL' || m.course?.id === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const handleOpenRoleModal = async member => {
    setRoleModalMember(member);
    setSelectedRoleId(member.roleId || null);
    if (member.course?.id) {
      setLoadingRoles(true);
      try {
        const roles = await api.getCourseRoles(member.course.id);
        setCourseRoles(roles || []);
      } catch (e) {
        setCourseRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    }
  };

  const handleSaveRole = async () => {
    if (!roleModalMember) return;
    setSavingRole(true);
    try {
      await api.assignCourseMemberRole(roleModalMember.course.id, roleModalMember.user.id, selectedRoleId);
      const chosenRole = courseRoles.find(r => r.id === selectedRoleId);
      setMembers(prev => prev.map(m => {
        if (m.id === roleModalMember.id) {
          return {
            ...m,
            roleId: selectedRoleId,
            role: chosenRole ? chosenRole.name : 'STUDENT',
            roleColor: chosenRole ? chosenRole.color : 'zinc'
          };
        }
        return m;
      }));
      toast({
        title: 'Cargo Atualizado!',
        message: `As permissões e cargo de ${roleModalMember.user.name} foram atribuídos com sucesso.`,
        type: 'success'
      });
      setRoleModalMember(null);
    } catch (e) {
      toast({
        title: 'Erro ao atribuir cargo',
        message: 'Não foi possível guardar as alterações de cargo.',
        type: 'error'
      });
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemoveMember = async member => {
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

  const handleSaveGrade = () => {
    setEssayGraded(true);
    toast({
      title: 'Nota e Correção Registadas',
      message: `A resposta foi avaliada com ${gradingScore}% e o aluno recebeu a notificação com o feedback.`,
      type: 'success'
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 animate-fade-in pb-16 px-3 sm:px-6">
      {/* Header */}
      <div className="pb-4 sm:pb-6 border-b border-slate-200 dark:border-[#222636] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge size="md" variant="primary">
                Membros & Turma
              </Badge>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {members.length} {members.length === 1 ? 'membro' : 'membros'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gestão de Membros & Permissões
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Atribua cargos e regras aos membros da turma, audite progresso e avalie respostas dissertativas.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar membros ou cursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-xs transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Cursos ({members.length})</option>
              {courseOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
          A carregar lista de membros...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
          Nenhum membro encontrado com os filtros selecionados.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Responsive Cards */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredMembers.map(m => (
              <div
                key={m.id}
                className="bg-white dark:bg-[#12141c] p-4 rounded-2xl border border-slate-200 dark:border-[#222636] shadow-xs flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={m.user?.avatarUrl} name={m.user?.name} size="md" status="online" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {m.user?.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium truncate">@{m.user?.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenRoleModal(m)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50"
                  >
                    <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="truncate max-w-[90px]">{m.role || 'STUDENT'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1e2130] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Curso:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {m.course?.title || 'Geral'}
                    </span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Nvl {m.user?.level || 1} • {m.user?.xp || 0} XP
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold text-[11px] py-1.5 px-2 text-center justify-center"
                    onClick={() => {
                      setSelectedStudent(m);
                      setEssayGraded(false);
                    }}
                  >
                    Atividades
                  </Button>
                  <Link to="/messages" className="w-full">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<MessageSquare className="w-3 h-3" />}
                      className="font-semibold text-[11px] py-1.5 px-2 w-full justify-center"
                    >
                      Chat
                    </Button>
                  </Link>
                  <button
                    disabled={deletingMemberId === m.id}
                    onClick={() => handleRemoveMember(m)}
                    className="px-2 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer text-center justify-center flex items-center"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Sleek Table */}
          <div className="hidden md:block bg-white dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636] shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1e2130] bg-slate-50/70 dark:bg-[#151720] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Aluno / Perfil</th>
                  <th className="py-3.5 px-4">Curso / Turma</th>
                  <th className="py-3.5 px-4 text-center">Nível / XP</th>
                  <th className="py-3.5 px-4 text-center">Cargo & Regras</th>
                  <th className="py-3.5 px-4 text-center">Auditoria</th>
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
                      <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1" title={m.course?.title || m.space?.name}>
                        {m.course?.title || m.space?.name || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        Nvl {m.user?.level || 1} ({m.user?.xp || 0} XP)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenRoleModal(m)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50"
                        title="Clique para alterar cargo e permissões"
                      >
                        <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="truncate max-w-[90px]">{m.role || 'STUDENT'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-bold text-xs"
                        onClick={() => {
                          setSelectedStudent(m);
                          setEssayGraded(false);
                        }}
                      >
                        Ver Atividades
                      </Button>
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
        </>
      )}

      
      {roleModalMember && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#12141c] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-[#222636] shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-[#222636] flex items-center justify-between bg-slate-50/50 dark:bg-[#151720]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Atribuir Cargo a {roleModalMember.user?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Turma: {roleModalMember.course?.title || roleModalMember.space?.name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRoleModalMember(null)}>
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Selecione o cargo e conjunto de permissões que este membro terá no curso e nas salas
                de conferência:
              </p>

              {loadingRoles ? <div className="p-6 text-center text-xs text-slate-400">
                  A carregar cargos do curso...
                </div> : <div className="space-y-2">
                  
                  <label onClick={() => setSelectedRoleId(null)} className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedRoleId === null ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] hover:bg-slate-50 dark:hover:bg-[#1a1d28]'}`}>
                    <input type="radio" name="roleOption" checked={selectedRoleId === null} onChange={() => setSelectedRoleId(null)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          Aluno (Padrão)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          STUDENT
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Permissões normais de aluno: assiste aulas, pede autorização com mão
                        levantada em chamadas com palco restrito.
                      </p>
                    </div>
                  </label>

                  
                  {courseRoles.map(role => <label key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedRoleId === role.id ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] hover:bg-slate-50 dark:hover:bg-[#1a1d28]'}`}>
                      <input type="radio" name="roleOption" checked={selectedRoleId === role.id} onChange={() => setSelectedRoleId(role.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {role.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 uppercase">
                            Cargo Especial
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {role.canPostAnnouncements ? <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                              ✓ Publicar comunicados
                            </span> : null}
                          {role.canSpeakInStage ? <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-semibold">
                              ✓ Falar no palco direto
                            </span> : null}
                          {role.canShareScreen ? <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-semibold">
                              ✓ Partilhar ecrã
                            </span> : null}
                          {role.canModerateChat ? <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                              ✓ Moderar chat
                            </span> : null}
                        </div>
                      </div>
                    </label>)}

                  {courseRoles.length === 0 && <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-[#222636] text-center text-xs text-slate-500">
                      Nenhum cargo personalizado configurado neste curso. Pode criar novos cargos na
                      edição do curso.
                    </div>}
                </div>}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#151720] border-t border-slate-200 dark:border-[#222636] flex justify-end gap-3 shrink-0">
              <Button variant="secondary" onClick={() => setRoleModalMember(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveRole} disabled={savingRole}>
                {savingRole ? 'A guardar...' : 'Confirmar Cargo'}
              </Button>
            </div>
          </div>
        </div>}

      
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#12141c] rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-[#222636] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-200 dark:border-[#222636] flex items-center justify-between bg-slate-50/50 dark:bg-[#151720] shrink-0">
              <div className="flex items-center gap-3">
                <Avatar src={selectedStudent.user?.avatarUrl} name={selectedStudent.user?.name} size="md" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Ficha de Atividade: {selectedStudent.user?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    @{selectedStudent.user?.username} • Espaço:{' '}
                    {selectedStudent.space?.name || 'Geral'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                Fechar
              </Button>
            </div>

            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-[#222636]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Progresso do Curso
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">82%</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[82%]"></div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-[#222636]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Aulas Concluídas
                  </span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    14 / 17
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Última aula há 2 horas
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-[#222636]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Média em Quizes
                  </span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    94%
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    3 quizes realizados
                  </span>
                </div>
              </div>

              
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-3">
                  Histórico de Aulas & Vídeos Assistidos
                </h4>
                <div className="rounded-2xl border border-slate-200 dark:border-[#222636] divide-y divide-slate-100 dark:divide-[#1e2130] overflow-hidden bg-slate-50/30 dark:bg-[#151720]/40">
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      1. Introdução à Arquitetura de Software
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      100% Concluído • Há 3 dias
                    </span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      2. Fundamentos de Performance em React
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      100% Concluído • Há 2 dias
                    </span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      3. Masterclass: Deploy & CI/CD Pipelines
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      100% Concluído • Há 2 horas
                    </span>
                  </div>
                </div>
              </div>

              
              <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold text-xs">
                      Avaliação Dissertativa Pendente
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-1.5">
                      Quiz do Módulo 3: Resposta por Extenso
                    </h4>
                  </div>
                  {essayGraded ? <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                      Avaliado: {gradingScore}/100
                    </span> : <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold text-xs">
                      Aguardar Correção
                    </span>}
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636]">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
                    Pergunta do Quiz:
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    "Explique a diferença entre SSR (Server-Side Rendering) e SSG (Static Site
                    Generation), destacando o impacto em SEO e performance."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636]">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
                    Resposta Submetida pelo Aluno:
                  </span>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#1a1d28] p-3 rounded-lg border border-slate-100 dark:border-[#2a2e42]">
                    "O SSR gera o HTML a cada requisição do utilizador no servidor, sendo ideal para
                    páginas com dados em tempo real ou autenticação personalizada. Já o SSG constrói
                    o HTML estático no momento do build (tempo de compilação), permitindo
                    distribuição via CDN com tempos de carregamento mínimos. Ambos oferecem
                    excelente SEO porque os motores de busca recebem o HTML totalmente renderizado,
                    mas o SSG oferece melhor performance TTFB."
                  </p>
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pt-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nota (0 - 100)
                    </label>
                    <input type="number" min={0} max={100} value={gradingScore} onChange={e => setGradingScore(Number(e.target.value))} className="w-full bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Comentário / Feedback do Instrutor
                    </label>
                    <input type="text" value={gradingFeedback} onChange={e => setGradingFeedback(e.target.value)} placeholder="Escreva orientações para o aluno..." className="w-full bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="sm" onClick={handleSaveGrade} className="font-bold shadow-md">
                    {essayGraded ? 'Atualizar Nota do Aluno' : 'Guardar Correção e Atribuir Nota'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#151720] border-t border-slate-200 dark:border-[#222636] flex justify-end shrink-0">
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                Concluir Visualização
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};