import './CreatorMembers.css';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  UserPlus,
  Trash2,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Shield,
} from 'lucide-react';
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
        api.getCreatorCourses().catch(() => []),
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
      return courses.map((c) => ({ id: c.id, title: c.title }));
    }
    const map = new Map();
    members.forEach((m) => {
      if (m.course?.id && m.course?.title) {
        map.set(m.course.id, m.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [courses, members]);

  const filteredMembers = members.filter((m) => {
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
      const newCollab = await api.addCourseCollaborator(
        selectedCollabCourseId,
        collabIdentifier.trim(),
      );
      setCollaborators((prev) => [...prev, newCollab]);
      toast({
        title: 'Colaborador Adicionado!',
        message: `${newCollab.name || collabIdentifier} agora é colaborador deste curso.`,
        type: 'success',
      });
      setCollabIdentifier('');
      setIsAddCollabModalOpen(false);
      // Refresh members list as collaborator was also enrolled
      api
        .getCreatorMembers()
        .then((data) => setMembers(data || []))
        .catch(() => {});
    } catch (err) {
      toast({
        title: 'Erro ao Adicionar',
        message: err.message || 'Não foi possível encontrar ou associar o colaborador.',
        type: 'error',
      });
    } finally {
      setAddingCollab(false);
    }
  };

  const handleRemoveCollaborator = async (collab) => {
    if (
      !window.confirm(
        `Tem a certeza que deseja remover ${collab.name || collab.username} dos colaboradores?`,
      )
    ) {
      return;
    }
    setRemovingCollabId(collab.userId);
    try {
      await api.removeCourseCollaborator(selectedCollabCourseId, collab.userId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collab.userId));
      toast({
        title: 'Colaborador Removido',
        message: 'O colaborador foi desassociado do curso.',
        type: 'success',
      });
      // Refresh members
      api
        .getCreatorMembers()
        .then((data) => setMembers(data || []))
        .catch(() => {});
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao remover colaborador.',
        type: 'error',
      });
    } finally {
      setRemovingCollabId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    if (
      !window.confirm(
        `Tem a certeza que deseja remover ${member.user?.name} do curso "${member.course?.title}"?`,
      )
    ) {
      return;
    }
    setDeletingMemberId(member.id);
    try {
      await api.removeCourseMember(member.course.id, member.user.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast({
        title: 'Membro Removido',
        message: `${member.user?.name} foi removido do curso.`,
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível remover o membro.',
        type: 'error',
      });
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div className="creator-members-panel">
      {/* Header */}
      <div className="creator-members-panel-2">
        <div className="creator-members-panel-3">
          <div>
            <div className="creator-members-panel-4">
              <Badge size="md" variant="primary">
                Gestão da Turma
              </Badge>
              <span className="creator-members-label">
                {members.length} {members.length === 1 ? 'aluno inscrito' : 'alunos inscritos'}
              </span>
            </div>
            <h1 className="creator-members-title">Membros & Colaboradores</h1>
            <p className="creator-members-description">
              Faça a gestão dos alunos inscritos e adicione co-instrutores para colaborar na gestão
              dos seus cursos.
            </p>
          </div>

          {activeTab === 'collaborators' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="creator-members-user-plus" />}
              onClick={() => setIsAddCollabModalOpen(true)}
              className="creator-members-button"
            >
              Adicionar Colaborador
            </Button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="creator-members-panel-5">
          <button
            onClick={() => setActiveTab('members')}
            className={`creator-members-button-2 ${
              activeTab === 'members' ? 'creator-members-button-3' : 'creator-members-button-4'
            }`}
          >
            <Users className="creator-members-user-plus" />
            <span>Alunos Inscritos ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`creator-members-button-2 ${
              activeTab === 'collaborators'
                ? 'creator-members-button-3'
                : 'creator-members-button-4'
            }`}
          >
            <Shield className="creator-members-user-plus" />
            <span>Colaboradores do Curso</span>
          </button>
        </div>

        {/* Filters Bar for Members */}
        {activeTab === 'members' && (
          <div className="creator-members-panel-6">
            <div className="creator-members-panel-7">
              <Search className="creator-members-search" />
              <input
                type="text"
                placeholder="Pesquisar membros ou cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="creator-members-field"
              />
            </div>

            <div className="creator-members-panel-8">
              <Select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="creator-members-select subtle-shadow"
              >
                <option value="ALL">Todos os Cursos ({members.length})</option>
                {courseOptions.map((c) => (
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
          <div className="creator-members-panel-9">
            <div className="creator-members-panel-10">
              <BookOpen className="creator-members-book-open" />
              <span>Curso Selecionado:</span>
              <Select
                value={selectedCollabCourseId}
                onChange={(e) => setSelectedCollabCourseId(e.target.value)}
                className="creator-members-select-2"
              >
                {courseOptions.map((c) => (
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
            <div className="creator-members-panel-11">A carregar lista de membros...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="creator-members-panel-11">
              Nenhum membro encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="creator-members-panel-12">
              <table className="creator-members-table">
                <thead>
                  <tr className="creator-members-table-row">
                    <th className="creator-members-table-heading">Aluno</th>
                    <th className="creator-members-table-heading-2">Curso</th>
                    <th className="creator-members-table-heading-3">Tipo</th>
                    <th className="creator-members-table-heading-3">Progresso</th>
                    <th className="creator-members-table-heading-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="creator-members-table-body">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="creator-members-table-row-2">
                      <td className="creator-members-table-heading">
                        <div className="creator-members-panel-13">
                          <Avatar
                            src={m.user?.avatarUrl}
                            name={m.user?.name}
                            size="md"
                            status="online"
                          />
                          <div className="creator-members-panel-14">
                            <span className="creator-members-label-2">{m.user?.name}</span>
                            <span className="creator-members-label-3">@{m.user?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="creator-members-table-heading-2">
                        <span className="creator-members-label-4">
                          {m.course?.title || 'Geral'}
                        </span>
                      </td>
                      <td className="creator-members-table-heading-3">
                        <span
                          className={`creator-members-label-5 ${
                            m.role === 'COLABORADOR'
                              ? 'creator-members-label-6'
                              : 'creator-members-label-7'
                          }`}
                        >
                          {m.role || 'ALUNO'}
                        </span>
                      </td>
                      <td className="creator-members-table-heading-3">
                        <span className="creator-members-label-8">
                          {Math.round(Number(m.progressPercent ?? 0))}%
                        </span>
                      </td>
                      <td className="creator-members-table-heading-4">
                        <div className="creator-members-panel-15">
                          <Link to="/messages">
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={
                                <MessageSquare className="creator-members-message-square" />
                              }
                              className="creator-members-button-5"
                            >
                              Chat
                            </Button>
                          </Link>
                          <button
                            disabled={deletingMemberId === m.id}
                            onClick={() => handleRemoveMember(m)}
                            className="creator-members-button-6"
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
        <div className="creator-members-panel-16">
          <div className="creator-members-panel-17">
            <Shield className="creator-members-shield" />
            <div className="creator-members-panel-18">
              <strong className="creator-members-strong">O que são Colaboradores?</strong>
              Os colaboradores têm permissão para editar conteúdos do curso, adicionar aulas e
              interagir com os alunos no canal da turma. O proprietário do curso continua a ser o
              responsável principal.
            </div>
          </div>

          {loadingCollabs ? (
            <div className="creator-members-panel-19">A carregar colaboradores...</div>
          ) : collaborators.length === 0 ? (
            <div className="creator-members-panel-20">
              <div className="creator-members-panel-21">
                <Users className="creator-members-users" />
              </div>
              <h3 className="creator-members-subheading">Nenhum colaborador adicionado</h3>
              <p className="creator-members-description-2">
                Ainda não adicionou colaboradores a este curso. Convide outros formadores ou colegas
                para o ajudar na gestão.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="creator-members-user-plus" />}
                onClick={() => setIsAddCollabModalOpen(true)}
                className="creator-members-button-7"
              >
                Adicionar Colaborador
              </Button>
            </div>
          ) : (
            <div className="creator-members-panel-22">
              {collaborators.map((c) => (
                <div key={c.id || c.userId} className="creator-members-panel-23">
                  <div className="creator-members-panel-24">
                    <Avatar src={c.avatarUrl} name={c.name} size="md" status="online" />
                    <div className="creator-members-panel-14">
                      <h4 className="creator-members-caption">{c.name}</h4>
                      <p className="creator-members-description-3">
                        @{c.username} • {c.email}
                      </p>
                      <span className="creator-members-label-9">COLABORADOR</span>
                    </div>
                  </div>

                  <button
                    disabled={removingCollabId === c.userId}
                    onClick={() => handleRemoveCollaborator(c)}
                    className="creator-members-button-8"
                    title="Remover colaborador"
                  >
                    <Trash2 className="creator-members-user-plus" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Adicionar Colaborador */}
      {isAddCollabModalOpen &&
        createPortal(
          <div className="creator-members-panel-25">
            <div
              className="creator-members-panel-26"
              onClick={() => setIsAddCollabModalOpen(false)}
            />
            <div className="creator-members-panel-27" onClick={(e) => e.stopPropagation()}>
              <div className="creator-members-panel-28">
                <div className="creator-members-panel-29">
                  <UserPlus className="creator-members-user-plus-2" />
                </div>
                <div>
                  <h3 className="creator-members-subheading-2">Adicionar Colaborador</h3>
                  <p className="creator-members-description-4">Ao curso selecionado</p>
                </div>
              </div>

              <form onSubmit={handleAddCollaborator} className="creator-members-panel-16">
                <div>
                  <label className="creator-members-field-label">Curso</label>
                  <Select
                    value={selectedCollabCourseId}
                    onChange={(e) => setSelectedCollabCourseId(e.target.value)}
                    className="creator-members-select-3"
                  >
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="creator-members-field-label">Nome de Utilizador ou Email</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: joao_silva ou joao@exemplo.com"
                    value={collabIdentifier}
                    onChange={(e) => setCollabIdentifier(e.target.value)}
                    className="creator-members-field-2"
                  />
                  <p className="creator-members-description-5">
                    O utilizador precisa de ter uma conta registada na plataforma.
                  </p>
                </div>

                <div className="creator-members-panel-30">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddCollabModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={addingCollab}
                    className="creator-members-button-9"
                  >
                    {addingCollab ? 'A adicionar...' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
export default CreatorMembers;
