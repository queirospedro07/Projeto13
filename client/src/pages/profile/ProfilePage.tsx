import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Flame, 
  Users, 
  Edit3, 
  MessageSquare,
  UserPlus,
  UserCheck,
  UserX,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Globe,
  Github,
  Twitter,
  Clock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isMe = !username || username === 'me' || username === currentUser?.username;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [socialStatus, setSocialStatus] = useState<any>({
    isFollowing: false,
    friendshipStatus: 'NONE', // NONE, PENDING, ACCEPTED
    isRequester: false,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
  });

  const [activeTab, setActiveTab] = useState<'courses' | 'achievements' | 'friends' | 'followers' | 'following'>('courses');

  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');

  // Load Profile Data
  useEffect(() => {
    if (isMe) {
      if (currentUser) {
        setProfileUser(currentUser);
        setName(currentUser.name || '');
        setBio(currentUser.bio || '');
        setLocation(currentUser.location || '');
        setAvatarUrl(currentUser.avatarUrl || '');
        setHeadline(currentUser.profile?.headline || '');
        setGithub(currentUser.profile?.github || '');
        setTwitter(currentUser.profile?.twitter || '');

        api.getMyCourses().then(data => setMyCourses(data || [])).catch(() => {});
        api.getAchievements().then(data => setAchievements(data?.filter((a: any) => a.isUnlocked) || [])).catch(() => {});
        api.getSocialStatus(currentUser.id).then(st => setSocialStatus(st)).catch(() => {});
      }
    } else {
      // Find searched user by username
      api.searchSocialUsers(username || '').then(users => {
        const found = (users || []).find((u: any) => u.username?.toLowerCase() === username?.toLowerCase()) || (users || [])[0];
        if (found) {
          setProfileUser(found);
          api.getSocialStatus(found.id).then(st => setSocialStatus(st)).catch(() => {});
          api.getFollowers(found.id).then(res => setFollowersList(res.followers || [])).catch(() => {});
          api.getFollowing(found.id).then(res => setFollowingList(res.following || [])).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [username, currentUser?.id, isMe]);

  // Social Actions
  const handleToggleFollow = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.isFollowing) {
        await api.unfollowUser(profileUser.id);
        setSocialStatus((prev: any) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
        toast({ title: 'Deixou de Seguir', message: `Deixou de seguir @${profileUser.username}.`, type: 'info' });
      } else {
        await api.followUser(profileUser.id);
        setSocialStatus((prev: any) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
        toast({ title: 'A Seguir', message: `Começou a seguir @${profileUser.username}.`, type: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', message: 'Não foi possível atualizar.', type: 'error' });
    }
  };

  const handleFriendAction = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.friendshipStatus === 'NONE') {
        await api.sendFriendRequest(profileUser.id);
        setSocialStatus((prev: any) => ({ ...prev, friendshipStatus: 'PENDING', isRequester: true }));
        toast({ title: 'Pedido Enviado', message: `Pedido de amizade enviado para @${profileUser.username}!`, type: 'success' });
      } else if (socialStatus.friendshipStatus === 'ACCEPTED') {
        await api.removeFriend(profileUser.id);
        setSocialStatus((prev: any) => ({ ...prev, friendshipStatus: 'NONE', friendsCount: Math.max(0, prev.friendsCount - 1) }));
        toast({ title: 'Amigo Removido', message: 'O utilizador foi removido da sua lista de amigos.', type: 'info' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', message: err.message || 'Falha ao processar amizade.', type: 'error' });
    }
  };

  const handleStartDM = () => {
    soundEffects.play('click');
    navigate('/messages');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        name,
        bio,
        location,
        avatarUrl,
        headline,
        github,
        twitter,
      });
      await refreshUser();
      setIsEditOpen(false);
      toast({ title: 'Perfil Atualizado', message: 'As suas informações foram guardadas com sucesso.', type: 'success' });
    } catch (err) {
      toast({ title: 'Erro ao Atualizar', message: 'Não foi possível guardar o perfil.', type: 'error' });
    }
  };

  const userToDisplay = profileUser || currentUser;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        
        {/* Banner */}
        <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-950/40 backdrop-blur-md text-xs font-extrabold text-white border border-white/20">
              Nível {userToDisplay?.level || 1}
            </span>
            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs">
              {userToDisplay?.xp || 100} XP
            </span>
          </div>
        </div>

        <div className="p-8 sm:p-10 pt-0">
          
          {/* Avatar & Action Buttons Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="relative">
              <Avatar
                src={userToDisplay?.avatarUrl}
                name={userToDisplay?.name}
                size="xl"
                className="ring-4 ring-white bg-white shadow-lg rounded-3xl"
              />
              <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white absolute bottom-1 right-1" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isMe ? (
                <Button
                  onClick={() => setIsEditOpen(true)}
                  variant="secondary"
                  size="md"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  className="font-bold cursor-pointer"
                >
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleToggleFollow}
                    variant={socialStatus.isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    className="font-bold cursor-pointer"
                  >
                    {socialStatus.isFollowing ? 'A Seguir' : '+ Seguir'}
                  </Button>

                  <Button
                    onClick={handleFriendAction}
                    variant="secondary"
                    size="md"
                    leftIcon={
                      socialStatus.friendshipStatus === 'ACCEPTED' ? (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      ) : socialStatus.friendshipStatus === 'PENDING' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )
                    }
                    className="font-bold cursor-pointer"
                  >
                    {socialStatus.friendshipStatus === 'ACCEPTED'
                      ? 'Amigos'
                      : socialStatus.friendshipStatus === 'PENDING'
                      ? 'Pedido Pendente'
                      : 'Adicionar Amigo'}
                  </Button>

                  <Button
                    onClick={handleStartDM}
                    variant="secondary"
                    size="md"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    className="font-bold cursor-pointer"
                  >
                    Mensagem
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* User Bio & Titles */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {userToDisplay?.name}
              </h1>
              <span className="text-sm text-slate-400 font-bold">@{userToDisplay?.username}</span>
              <Badge variant="brand" size="sm">{userToDisplay?.role || 'STUDENT'}</Badge>
            </div>
            
            <p className="text-base text-blue-600 font-bold mb-3">
              {userToDisplay?.profile?.headline || 'Estudante LearnSpace'}
            </p>

            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
              {userToDisplay?.bio || 'Membro da comunidade LearnSpace em constante evolução e aprendizagem contínua.'}
            </p>

            {/* Social Counts & Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 pt-4 border-t border-slate-100 font-bold">
              
              <button
                onClick={() => setActiveTab('friends')}
                className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-950">{socialStatus.friendsCount || 0}</span> Amigos
              </button>

              <button
                onClick={() => setActiveTab('followers')}
                className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-slate-950">{socialStatus.followersCount || 0}</span> Seguidores
              </button>

              <button
                onClick={() => setActiveTab('following')}
                className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-slate-950">{socialStatus.followingCount || 0}</span> A Seguir
              </button>

              {userToDisplay?.streakDays > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {userToDisplay.streakDays} dias seguidos
                </span>
              )}

              {userToDisplay?.location && (
                <span className="flex items-center gap-1 text-slate-500 font-normal">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {userToDisplay.location}
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* 2. PROFILE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { soundEffects.play('click'); setActiveTab('courses'); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'courses' ? 'bg-blue-50 text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Cursos</span>
        </button>

        <button
          onClick={() => { soundEffects.play('click'); setActiveTab('achievements'); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'achievements' ? 'bg-blue-50 text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Conquistas ({achievements.length})</span>
        </button>

        <button
          onClick={() => { soundEffects.play('click'); setActiveTab('friends'); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'friends' ? 'bg-blue-50 text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Amigos</span>
        </button>
      </div>

      {/* TAB CONTENT: COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Cursos Matriculados ({myCourses.length})
          </h3>

          {myCourses.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50 border-slate-200 rounded-3xl">
              <p className="text-sm font-bold text-slate-700 mb-1">Nenhum curso matriculado de momento.</p>
              <p className="text-xs text-slate-500 mb-4">Explore o catálogo para começar a aprender.</p>
              <Link to="/explore">
                <Button variant="primary" size="sm">Explorar Catálogo</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myCourses.map(e => (
                <Card key={e.id} hover className="p-5 flex items-center justify-between border-slate-200 bg-white shadow-xs rounded-2xl">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={e.course?.thumbnailUrl} alt={e.course?.title} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{e.course?.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">Progresso: {Math.round(e.progressPercent || 0)}%</p>
                    </div>
                  </div>
                  <Link to={`/learn/${e.courseId}`}>
                    <Button variant="primary" size="md" className="font-bold">Aceder</Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Distintivos & Badges Desbloqueados
            </h3>
            <Link to="/achievements" className="text-sm font-bold text-blue-600 hover:underline">
              Ver Todos
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {achievements.map(ach => (
              <Card key={ach.id} className="p-4 flex items-center gap-3 bg-white border-slate-200 shadow-xs rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">{ach.title || ach.name}</p>
                  <p className="text-xs text-blue-600 font-bold">+{ach.xpReward} XP</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FRIENDS */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Rede de Amigos
            </h3>
            <Link to="/messages" className="text-sm font-bold text-blue-600 hover:underline">
              Gerir no Hub de Mensagens
            </Link>
          </div>

          <Card className="p-8 text-center bg-slate-50 border-slate-200 rounded-3xl">
            <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-900 mb-1">Comunicação Direta & Colaboração</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Aceda ao hub de mensagens para encontrar colegas de curso, enviar pedidos de amizade e iniciar conversas de texto ou voz.
            </p>
            <Link to="/messages">
              <Button variant="primary" size="md" leftIcon={<MessageSquare className="w-4 h-4" />}>
                Abrir Mensagens Diretas
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Perfil">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Título / Especialidade</label>
            <input
              type="text"
              placeholder="ex: Engenheiro de Software | Full Stack"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Biografia</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none leading-relaxed transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Localização</label>
              <input
                type="text"
                placeholder="Lisboa, Portugal"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">URL da Imagem de Perfil</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" onClick={() => setIsEditOpen(false)} variant="secondary" size="md">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" className="font-bold shadow-md shadow-blue-500/20">
              Guardar Alterações
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ProfilePage;
