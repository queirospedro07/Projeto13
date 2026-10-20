import { ReportButton } from '../../components/Moderation';
import './ProfilePage.css';
import { useState, useEffect, useRef } from 'react';
import { PageState } from '../../components/PageState';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LuMapPin as MapPin,
  LuBookOpen as BookOpen,
  LuUsers as Users,
  LuPenLine as Edit3,
  LuMessageSquare as MessageSquare,
  LuUserPlus as UserPlus,
  LuUserCheck as UserCheck,
  LuClock as Clock,
  LuCamera as Camera,
  LuImagePlus as ImagePlus,
  LuLoaderCircle as Loader2,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuCheck as Check,
} from 'react-icons/lu';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { ProfileEditor } from '../../components/ProfileEditor';
import { ProfileBanner } from '../../components/ProfileBanner';
import { ProfileSocialLinks } from '../../components/ProfileSocialLinks';
import { getProfileLinks } from '../../utils/profileSocials';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { formatCategory, formatRole } from '../../utils/formatters';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMe = !username || username === 'me' || username === currentUser?.username;
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(!isMe);
  const [notFound, setNotFound] = useState(false);
  const [socialStatus, setSocialStatus] = useState({
    isFollowing: false,
    friendshipStatus: 'NONE',
    isRequester: false,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
  });
  const [activeTab, setActiveTab] = useState('courses');
  const [courseFilter, setCourseFilter] = useState('all');
  const [myCourses, setMyCourses] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSection, setEditSection] = useState('details');
  const visibilityRequests = useRef(new Set());
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);

  const toggleHideCourse = async (courseId, courseTitle = 'Curso') => {
    if (visibilityRequests.current.has(courseId)) return;
    visibilityRequests.current.add(courseId);

    try {
      const { data } = await api.post('/courses/' + encodeURIComponent(courseId) + '/toggle-hide');

      setMyCourses((courses) =>
        courses.map((enrollment) =>
          (enrollment.course?.id || enrollment.courseId) === courseId
            ? { ...enrollment, isHidden: data.isHidden }
            : enrollment,
        ),
      );
      toast({
        title: data.isHidden ? 'Curso ocultado no perfil' : 'Curso visível no perfil',
        message: data.isHidden
          ? '"' + courseTitle + '" deixou de aparecer no seu perfil público.'
          : '"' + courseTitle + '" está visível no seu perfil público.',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível alterar a visibilidade',
        message: error.message,
        type: 'error',
      });
    } finally {
      visibilityRequests.current.delete(courseId);
    }
  };

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError('');
    setNotFound(false);
    setMyCourses([]);

    const loadProfile = async () => {
      try {
        const person = isMe
          ? currentUser
          : (await api.get('/auth/user/' + encodeURIComponent(username))).data;
        if (!active) return;
        setProfileUser(person);

        const courses = isMe ? (await api.get('/courses/my-learning')).data : person?.courses;
        if (!active) return;
        setMyCourses(courses || []);

        if (person?.id) {
          const { data } = await api.get('/social/status/' + encodeURIComponent(person.id));
          if (active) setSocialStatus(data);
        }
      } catch (error) {
        if (!active) return;
        if (error.status === 404) setNotFound(true);
        else setLoadError(error.message || 'Não foi possível carregar o perfil.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [username, currentUser, isMe, revision]);

  const openEditModal = (section = 'details') => {
    setEditSection(typeof section === 'string' ? section : 'details');
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (values) => {
    const result = await api.put('/auth/profile', values).then(({ data }) => data);
    if (result?.user) setProfileUser(result.user);
    await refreshUser();
    setIsEditOpen(false);
    toast({
      title: 'Perfil atualizado',
      message: 'As suas alterações foram guardadas.',
      type: 'success',
    });
  };

  const handleToggleFollow = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.isFollowing) {
        await api.post(`/social/unfollow/${profileUser.id}`).then(({ data }) => data);
        setSocialStatus((p) => ({
          ...p,
          isFollowing: false,
          followersCount: Math.max(0, p.followersCount - 1),
        }));
      } else {
        await api.post(`/social/follow/${profileUser.id}`).then(({ data }) => data);
        setSocialStatus((p) => ({
          ...p,
          isFollowing: true,
          followersCount: p.followersCount + 1,
        }));
      }
    } catch {
      toast({
        title: 'Erro',
        type: 'error',
      });
    }
  };

  const handleFriendAction = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.friendshipStatus === 'NONE') {
        await api.post(`/social/friends/request/${profileUser.id}`).then(({ data }) => data);
        setSocialStatus((p) => ({
          ...p,
          friendshipStatus: 'PENDING',
          isRequester: true,
        }));
        toast({
          title: 'Pedido Enviado',
          type: 'success',
        });
      } else if (socialStatus.friendshipStatus === 'ACCEPTED') {
        await api.delete(`/social/friends/remove/${profileUser.id}`).then(({ data }) => data);
        setSocialStatus((p) => ({
          ...p,
          friendshipStatus: 'NONE',
          friendsCount: Math.max(0, p.friendsCount - 1),
        }));
      }
    } catch {
      toast({
        title: 'Erro',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-page-panel">
        <Loader2 className="profile-page-loader2" />
      </div>
    );
  }

  if (loadError)
    return (
      <PageState
        title="Não foi possível carregar o perfil"
        message={loadError}
        onRetry={() => setRevision((value) => value + 1)}
      />
    );

  if (notFound || (!isMe && !profileUser)) {
    return (
      <div className="profile-page-panel-2">
        <Users className="profile-page-users" />
        <h2 className="profile-page-heading">Utilizador não encontrado</h2>
        <p className="profile-page-description">
          O perfil solicitado não existe ou pode ter sido alterado.
        </p>
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
        >
          Voltar
        </Button>
      </div>
    );
  }

  const u = isMe ? currentUser : profileUser;
  const socialLinks = getProfileLinks(u?.profile);

  return (
    <div className="profile-page-panel-3">
      <div className="profile-page-panel-4">
        <ProfileBanner
          value={u?.profile?.bannerUrl}
          className="profile-page-panel-5"
        >
          {isMe && (
            <div className="profile-page-panel-8">
              <button
                type="button"
                onClick={() => openEditModal('appearance')}
                aria-label="Alterar capa do perfil"
                className="profile-page-button"
              >
                <ImagePlus className="profile-page-image-plus" />
                <span className="profile-page-label">Alterar Banner</span>
              </button>
            </div>
          )}
        </ProfileBanner>

        <div className="profile-page-panel-9">
          <div className="profile-page-panel-10">
            <div className="profile-page-panel-11 ui-group">
              <Avatar
                src={u?.avatarUrl}
                name={u?.name}
                size="xl"
                role={u?.role}
                className="profile-page-avatar"
              />
              <span className="profile-page-label-2" />
              {isMe && (
                <button
                  onClick={() => openEditModal('appearance')}
                  className="profile-page-button-2"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="profile-page-camera" />
                </button>
              )}
            </div>

            <div className="profile-page-panel-12">
              {isMe ? (
                <Button
                  onClick={openEditModal}
                  variant="secondary"
                  size="md"
                  leftIcon={<Edit3 className="profile-page-edit3" />}
                  className="profile-page-button-3"
                >
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleToggleFollow}
                    variant={socialStatus.isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    className="profile-page-button-4"
                  >
                    {socialStatus.isFollowing ? 'A Seguir' : '+ Seguir'}
                  </Button>
                  <Button
                    onClick={handleFriendAction}
                    variant="secondary"
                    size="md"
                    leftIcon={
                      socialStatus.friendshipStatus === 'ACCEPTED' ? (
                        <UserCheck className="profile-page-user-check" />
                      ) : socialStatus.friendshipStatus === 'PENDING' ? (
                        <Clock className="profile-page-clock" />
                      ) : (
                        <UserPlus className="profile-page-edit3" />
                      )
                    }
                    className="profile-page-button-4"
                  >
                    {socialStatus.friendshipStatus === 'ACCEPTED'
                      ? 'Amigos'
                      : socialStatus.friendshipStatus === 'PENDING'
                        ? 'Pendente'
                        : 'Adicionar'}
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/messages?userId=${u.id}`, {
                        state: {
                          peer: u,
                        },
                      })
                    }
                    variant="secondary"
                    size="md"
                    leftIcon={<MessageSquare className="profile-page-edit3" />}
                    className="profile-page-button-4"
                  >
                    Mensagem
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="profile-page-panel-13">
            <h1 className="profile-page-title">{u?.name}</h1>
            <span className="profile-page-label-3">@{u?.username}</span>
            <Badge
              variant="brand"
              size="sm"
            >
              {formatRole(u?.role)}
            </Badge>
          </div>

          {u?.profile?.headline && (
            <p className="profile-page-description-2">{u.profile.headline}</p>
          )}

          {u?.bio && (isMe || u?.profile?.showBio !== false) && (
            <p className="profile-page-description-3">{u.bio}</p>
          )}

          {u?.location && (isMe || ![false, 0].includes(u?.profile?.showLocation)) && (
            <div className="profile-page-panel-14">
              <span className="profile-page-label-4">
                <MapPin className="profile-page-map-pin" />
                {u.location}
              </span>
            </div>
          )}
          {socialLinks.length > 0 && (isMe || ![false, 0].includes(u?.profile?.showSocials)) && (
            <ProfileSocialLinks profile={u?.profile} />
          )}

          <ReportButton
            targetType="user"
            targetId={u?.id}
          />
          <div className="profile-page-panel-15">
            <button
              onClick={() => setActiveTab('friends')}
              className="profile-page-button-5"
            >
              <Users className="profile-page-users-2" />
              <span className="profile-page-label-5">{socialStatus.friendsCount || 0}</span> Amigos
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className="profile-page-button-6"
            >
              <span className="profile-page-label-5">{socialStatus.followersCount || 0}</span>{' '}
              Seguidores
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className="profile-page-button-6"
            >
              <span className="profile-page-label-5">{socialStatus.followingCount || 0}</span> A
              Seguir
            </button>
          </div>
        </div>
      </div>

      <div className="profile-page-panel-16 no-scrollbar">
        {[
          {
            id: 'courses',
            icon: BookOpen,
            label: 'Cursos',
          },
          {
            id: 'friends',
            icon: Users,
            label: 'Social',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundEffects.play('click');
              setActiveTab(tab.id);
            }}
            className={`profile-page-button-7 ${activeTab === tab.id ? 'profile-page-button-8' : 'profile-page-button-9'}`}
          >
            <tab.icon className="profile-page-edit3" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'courses' &&
        (() => {
          const isCourseHidden = (e) => {
            return Boolean(e.isHidden);
          };

          const totalCourses = !isMe && u?.profile?.showCourses === false ? 0 : myCourses.length;
          const hiddenCoursesList = myCourses.filter(isCourseHidden);
          const visibleCoursesList = myCourses.filter((e) => !isCourseHidden(e));
          const hiddenCount = hiddenCoursesList.length;
          const visibleCount = visibleCoursesList.length;
          let displayCourses = myCourses;
          if (!isMe) {
            displayCourses = u?.profile?.showCourses === false ? [] : visibleCoursesList;
          } else if (courseFilter === 'visible') {
            displayCourses = visibleCoursesList;
          } else if (courseFilter === 'hidden') {
            displayCourses = hiddenCoursesList;
          }

          return (
            <div className="profile-page-panel-17">
              <div className="profile-page-panel-18">
                <div>
                  <h3 className="profile-page-subheading">
                    Cursos Inscritos ({isMe ? totalCourses : displayCourses.length})
                  </h3>
                  {isMe && (
                    <p className="profile-page-description-4">
                      Gira a visibilidade das suas formações para terceiros no seu perfil público.
                    </p>
                  )}
                </div>

                {isMe && totalCourses > 0 && (
                  <div className="profile-page-panel-19">
                    <button
                      onClick={() => setCourseFilter('all')}
                      className={`profile-page-button-10 ${courseFilter === 'all' ? 'profile-page-button-11' : 'profile-page-button-12'}`}
                    >
                      Todos ({totalCourses})
                    </button>
                    <button
                      onClick={() => setCourseFilter('visible')}
                      className={`profile-page-button-10 ${courseFilter === 'visible' ? 'profile-page-button-11' : 'profile-page-button-12'}`}
                    >
                      Visíveis ({visibleCount})
                    </button>
                    <button
                      onClick={() => setCourseFilter('hidden')}
                      className={`profile-page-button-14 ${courseFilter === 'hidden' ? 'profile-page-button-16' : 'profile-page-button-12'}`}
                    >
                      <EyeOff className="profile-page-image-plus" />
                      <span>Ocultados para Outros ({hiddenCount})</span>
                    </button>
                  </div>
                )}
              </div>

              {isMe && courseFilter === 'hidden' && hiddenCount > 0 && (
                <div className="profile-page-panel-20">
                  <EyeOff className="profile-page-eye-off" />
                  <span>
                    Estes cursos estão ocultados para outros utilizadores que visitem o seu perfil
                    público. Apenas você consegue visualizá-los aqui.
                  </span>
                </div>
              )}

              {displayCourses.length === 0 ? (
                <Card className="profile-page-card">
                  {courseFilter === 'hidden' ? (
                    <>
                      <Eye className="profile-page-eye" />
                      <p className="profile-page-description-5">Não tem cursos ocultados</p>
                      <p className="profile-page-description-6">
                        Todos os seus cursos inscritos estão visíveis publicamente no seu perfil.
                      </p>
                      <button
                        onClick={() => setCourseFilter('all')}
                        className="profile-page-button-17"
                      >
                        Ver Todos os Cursos
                      </button>
                    </>
                  ) : (
                    <>
                      <BookOpen className="profile-page-eye" />
                      <p className="profile-page-description-5">
                        {isMe
                          ? 'Ainda não está inscrito em nenhum curso.'
                          : 'Nenhum curso visível no momento.'}
                      </p>
                      {isMe && (
                        <Link to="/explore">
                          <Button
                            as="span"
                            variant="primary"
                            size="sm"
                            className="profile-page-button-18"
                          >
                            Explorar Catálogo
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </Card>
              ) : (
                <div className="profile-page-panel-21">
                  {displayCourses.map((e) => {
                    const courseId = e.course?.id || e.courseId;
                    const isHidden = isCourseHidden(e);
                    const isFinished = (e.progressPercent || 0) >= 100;

                    return (
                      <Card
                        key={e.id || courseId}
                        hover
                        className="profile-page-card-2"
                      >
                        <div className="profile-page-panel-22">
                          <div className="profile-page-panel-23">
                            <img
                              src={
                                e.course?.thumbnailUrl ||
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                              }
                              alt={e.course?.title}
                              className="profile-page-image-2"
                            />
                            {isMe && isHidden && (
                              <div
                                className="profile-page-panel-24"
                                title="Ocultado para terceiros"
                              >
                                <EyeOff className="profile-page-eye-off-2" />
                              </div>
                            )}
                          </div>

                          <div className="profile-page-panel-25">
                            <div className="profile-page-panel-26">
                              {isMe &&
                                (isHidden ? (
                                  <span className="profile-page-label-6">
                                    <EyeOff className="profile-page-eye-off-2" /> Ocultado para
                                    terceiros
                                  </span>
                                ) : (
                                  <span className="profile-page-label-7">
                                    <Eye className="profile-page-eye-off-2" /> Visível no perfil
                                  </span>
                                ))}
                              {e.course?.category && (
                                <span className="profile-page-label-8">
                                  {formatCategory(e.course.category)}
                                </span>
                              )}
                            </div>

                            <h4 className="profile-page-caption">{e.course?.title}</h4>

                            <div className="profile-page-panel-27">
                              <div
                                className={[
                                  `profile-page-panel-28 ${isFinished ? 'profile-page-panel-29' : 'profile-page-panel-30'}`,
                                  'profile-page-dynamic-1',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={{
                                  '--profile-page-width': `${Math.round(e.progressPercent || 0)}%`,
                                }}
                              />
                            </div>

                            <div className="profile-page-panel-31">
                              <span>{Math.round(e.progressPercent || 0)}% concluído</span>
                              {isFinished && (
                                <span className="profile-page-label-9">
                                  <Check className="profile-page-eye-off-2" /> Concluído
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="profile-page-panel-32">
                          {isMe ? (
                            <button
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                toggleHideCourse(courseId, e.course?.title);
                              }}
                              className={`profile-page-button-19 ${isHidden ? 'profile-page-button-20' : 'profile-page-button-21'}`}
                              title={
                                isHidden
                                  ? 'Tornar este curso visível no seu perfil público'
                                  : 'Ocultar este curso para outros utilizadores'
                              }
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="profile-page-image-plus" />
                                  <span>Tornar Visível</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="profile-page-image-plus" />
                                  <span>Ocultar de Outros</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span />
                          )}

                          <Link
                            to={`/learn/${courseId}`}
                            className="profile-page-link-4"
                          >
                            <Button
                              as="span"
                              variant="primary"
                              size="sm"
                              className="profile-page-button-22"
                            >
                              Aceder
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      {activeTab === 'friends' && (
        <Card className="profile-page-card-3">
          <Users className="profile-page-users-3" />
          <p className="profile-page-description-7">Hub de Mensagens & Amigos</p>
          <p className="profile-page-description-8">
            Gere amizades, seguidores e conversas diretas no hub de mensagens.
          </p>
          <Link to="/messages">
            <Button
              as="span"
              variant="primary"
              size="md"
              leftIcon={<MessageSquare className="profile-page-edit3" />}
            >
              Abrir Mensagens
            </Button>
          </Link>
        </Card>
      )}

      {isEditOpen && (
        <ProfileEditor
          initialTab={editSection}
          user={currentUser}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default ProfilePage;
