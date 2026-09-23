import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Award, BookOpen, Flame, Users, Edit3, MessageSquare, UserPlus, UserCheck, Clock, Globe, Github, Twitter, Linkedin, Camera, ImagePlus, X, ExternalLink, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
const BANNER_PRESETS = [{
  label: 'Azul Índigo',
  value: 'gradient-indigo',
  style: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
}, {
  label: 'Esmeralda',
  value: 'gradient-emerald',
  style: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600'
}, {
  label: 'Pôr do Sol',
  value: 'gradient-sunset',
  style: 'bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400'
}, {
  label: 'Crepúsculo',
  value: 'gradient-dusk',
  style: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700'
}, {
  label: 'Aurora',
  value: 'gradient-aurora',
  style: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600'
}, {
  label: 'Meia-noite',
  value: 'gradient-midnight',
  style: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black'
}];
function getBannerStyle(bannerUrl) {
  if (!bannerUrl) return {};
  const preset = BANNER_PRESETS.find(p => p.value === bannerUrl);
  if (preset) return {};
  return {
    backgroundImage: `url(${bannerUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}
function getBannerClass(bannerUrl) {
  if (!bannerUrl) return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700';
  const preset = BANNER_PRESETS.find(p => p.value === bannerUrl);
  return preset ? preset.style : '';
}
function compressImageToBase64(file, maxDimension = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let {
          width,
          height
        } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height / width * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round(width / height * maxDimension);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export const ProfilePage = () => {
  const {
    username
  } = useParams();
  const {
    user: currentUser,
    refreshUser
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const isMe = !username || username === 'me' || username === currentUser?.username;
  const [profileUser, setProfileUser] = useState(null);
  const [socialStatus, setSocialStatus] = useState({
    isFollowing: false,
    friendshipStatus: 'NONE',
    isRequester: false,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0
  });
  const [activeTab, setActiveTab] = useState('courses');
  const [myCourses, setMyCourses] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isCompressingBanner, setIsCompressingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  useEffect(() => {
    if (isMe && currentUser) {
      setProfileUser(currentUser);
      api.getMyCourses().then(d => setMyCourses(d || [])).catch(() => {});
      api.getAchievements().then(d => setAchievements((d || []).filter(a => a.isUnlocked))).catch(() => {});
      api.getSocialStatus(currentUser.id).then(st => setSocialStatus(st)).catch(() => {});
    } else if (!isMe && username) {
      api.searchSocialUsers(username).then(users => {
        const found = (users || []).find(u => u.username?.toLowerCase() === username.toLowerCase()) || users?.[0];
        if (found) {
          setProfileUser(found);
          api.getSocialStatus(found.id).then(st => setSocialStatus(st)).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [username, currentUser?.id, isMe]);
  const openEditModal = useCallback(() => {
    const u = profileUser || currentUser;
    setEditName(u?.name || '');
    setEditBio(u?.bio || '');
    setEditLocation(u?.location || '');
    setEditHeadline(u?.profile?.headline || '');
    setEditGithub(u?.profile?.github || '');
    setEditTwitter(u?.profile?.twitter || '');
    setEditLinkedin(u?.profile?.linkedin || '');
    setEditWebsite(u?.profile?.website || '');
    setEditAvatarUrl(u?.avatarUrl || '');
    setEditBannerUrl(u?.profile?.bannerUrl || '');
    setAvatarPreview(u?.avatarUrl || '');
    setBannerPreview(u?.profile?.bannerUrl || '');
    setIsEditOpen(true);
  }, [profileUser, currentUser]);
  const handleAvatarFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ficheiro inválido',
        message: 'Selecione uma imagem (JPG, PNG, WebP).',
        type: 'error'
      });
      return;
    }
    setIsCompressingAvatar(true);
    try {
      const base64 = await compressImageToBase64(file, 400, 0.85);
      setEditAvatarUrl(base64);
      setAvatarPreview(base64);
    } catch {
      toast({
        title: 'Erro',
        message: 'Não foi possível processar a imagem.',
        type: 'error'
      });
    } finally {
      setIsCompressingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };
  const handleBannerFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ficheiro inválido',
        message: 'Selecione uma imagem.',
        type: 'error'
      });
      return;
    }
    setIsCompressingBanner(true);
    try {
      const base64 = await compressImageToBase64(file, 1200, 0.8);
      setEditBannerUrl(base64);
      setBannerPreview(base64);
    } catch {
      toast({
        title: 'Erro',
        message: 'Não foi possível processar a imagem.',
        type: 'error'
      });
    } finally {
      setIsCompressingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };
  const handleSaveProfile = async e => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile({
        name: editName,
        bio: editBio,
        location: editLocation,
        avatarUrl: editAvatarUrl,
        headline: editHeadline,
        github: editGithub,
        twitter: editTwitter,
        linkedin: editLinkedin,
        website: editWebsite,
        bannerUrl: editBannerUrl
      });
      await refreshUser();
      setIsEditOpen(false);
      toast({
        title: 'Perfil Atualizado',
        message: 'As suas informações foram guardadas.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível guardar.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleToggleFollow = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.isFollowing) {
        await api.unfollowUser(profileUser.id);
        setSocialStatus(p => ({
          ...p,
          isFollowing: false,
          followersCount: Math.max(0, p.followersCount - 1)
        }));
      } else {
        await api.followUser(profileUser.id);
        setSocialStatus(p => ({
          ...p,
          isFollowing: true,
          followersCount: p.followersCount + 1
        }));
      }
    } catch {
      toast({
        title: 'Erro',
        type: 'error'
      });
    }
  };
  const handleFriendAction = async () => {
    if (!profileUser) return;
    soundEffects.play('click');
    try {
      if (socialStatus.friendshipStatus === 'NONE') {
        await api.sendFriendRequest(profileUser.id);
        setSocialStatus(p => ({
          ...p,
          friendshipStatus: 'PENDING',
          isRequester: true
        }));
        toast({
          title: 'Pedido Enviado',
          type: 'success'
        });
      } else if (socialStatus.friendshipStatus === 'ACCEPTED') {
        await api.removeFriend(profileUser.id);
        setSocialStatus(p => ({
          ...p,
          friendshipStatus: 'NONE',
          friendsCount: Math.max(0, p.friendsCount - 1)
        }));
      }
    } catch {
      toast({
        title: 'Erro',
        type: 'error'
      });
    }
  };
  const u = profileUser || currentUser;
  const bannerClass = getBannerClass(u?.profile?.bannerUrl);
  const bannerStyle = getBannerStyle(u?.profile?.bannerUrl);
  return <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        
        <div className={`h-44 sm:h-56 w-full relative ${bannerClass}`} style={bannerStyle}>
          
          {u?.profile?.bannerUrl && !BANNER_PRESETS.find(p => p.value === u.profile.bannerUrl) && <div className="absolute inset-0 bg-black/20" />}

          
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="px-3 py-1 rounded-xl bg-black/40 backdrop-blur-sm text-xs font-extrabold text-white border border-white/20">
              Nível {u?.level || 1}
            </span>
            <span className="px-3 py-1 rounded-xl bg-blue-600/90 backdrop-blur-sm text-white font-extrabold text-xs">
              {u?.xp || 0} XP
            </span>
          </div>

          
          {isMe && <button onClick={() => openEditModal()} className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/60 transition-colors cursor-pointer border border-white/20">
              <ImagePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alterar Banner</span>
            </button>}
        </div>

        <div className="px-6 sm:px-10 pb-8 pt-0">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-6">
            
            <div className="relative group">
              <Avatar src={u?.avatarUrl} name={u?.name} size="xl" className="ring-4 ring-white dark:ring-zinc-900 bg-white dark:bg-zinc-800 shadow-lg rounded-3xl" />
              <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-1 right-1" />
              {isMe && <button onClick={() => openEditModal()} className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" aria-label="Alterar foto de perfil">
                  <Camera className="w-6 h-6 text-white drop-shadow" />
                </button>}
            </div>

            
            <div className="flex flex-wrap items-center gap-2.5">
              {isMe ? <Button onClick={openEditModal} variant="secondary" size="md" leftIcon={<Edit3 className="w-4 h-4" />} className="font-bold cursor-pointer">
                  Editar Perfil
                </Button> : <>
                  <Button onClick={handleToggleFollow} variant={socialStatus.isFollowing ? 'secondary' : 'primary'} size="md" className="font-bold cursor-pointer">
                    {socialStatus.isFollowing ? 'A Seguir' : '+ Seguir'}
                  </Button>
                  <Button onClick={handleFriendAction} variant="secondary" size="md" leftIcon={socialStatus.friendshipStatus === 'ACCEPTED' ? <UserCheck className="w-4 h-4 text-emerald-600" /> : socialStatus.friendshipStatus === 'PENDING' ? <Clock className="w-4 h-4 text-amber-600" /> : <UserPlus className="w-4 h-4" />} className="font-bold cursor-pointer">
                    {socialStatus.friendshipStatus === 'ACCEPTED' ? 'Amigos' : socialStatus.friendshipStatus === 'PENDING' ? 'Pendente' : 'Adicionar'}
                  </Button>
                  <Button onClick={() => navigate('/messages')} variant="secondary" size="md" leftIcon={<MessageSquare className="w-4 h-4" />} className="font-bold cursor-pointer">
                    Mensagem
                  </Button>
                </>}
            </div>
          </div>

          
          <div className="flex items-start gap-3 flex-wrap mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {u?.name}
            </h1>
            <span className="text-sm text-slate-400 dark:text-zinc-500 font-bold self-center">
              @{u?.username}
            </span>
            <Badge variant="brand" size="sm">
              {u?.role || 'STUDENT'}
            </Badge>
          </div>

          {u?.profile?.headline && <p className="text-base text-blue-600 dark:text-blue-400 font-semibold mb-2">
              {u.profile.headline}
            </p>}

          {u?.bio && <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-4">
              {u.bio}
            </p>}

          
          {(u?.location || u?.profile?.website || u?.profile?.github || u?.profile?.twitter || u?.profile?.linkedin) && <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-4">
              {u?.location && <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {u.location}
                </span>}
              {u?.profile?.website && <a href={u.profile.website.startsWith('http') ? u.profile.website : `https://${u.profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>}
              {u?.profile?.github && <a href={`https://github.com/${u.profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.github}
                </a>}
              {u?.profile?.twitter && <a href={`https://twitter.com/${u.profile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                  <Twitter className="w-3.5 h-3.5 shrink-0" />@{u.profile.twitter}
                </a>}
              {u?.profile?.linkedin && <a href={`https://linkedin.com/in/${u.profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                  <Linkedin className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.linkedin}
                </a>}
            </div>}

          
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 dark:text-zinc-400 pt-4 border-t border-slate-100 dark:border-zinc-800 font-semibold">
            <button onClick={() => setActiveTab('friends')} className="hover:text-blue-600 cursor-pointer flex items-center gap-1.5 transition-colors">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="font-extrabold text-slate-900 dark:text-white">
                {socialStatus.friendsCount || 0}
              </span>{' '}
              Amigos
            </button>
            <button onClick={() => setActiveTab('friends')} className="hover:text-blue-600 cursor-pointer transition-colors">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {socialStatus.followersCount || 0}
              </span>{' '}
              Seguidores
            </button>
            <button onClick={() => setActiveTab('friends')} className="hover:text-blue-600 cursor-pointer transition-colors">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {socialStatus.followingCount || 0}
              </span>{' '}
              A Seguir
            </button>
            {(u?.streakDays ?? 0) > 0 && <span className="flex items-center gap-1.5 text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                {u.streakDays} dias seguidos
              </span>}
          </div>
        </div>
      </div>

      
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-0 overflow-x-auto">
        {[{
        id: 'courses',
        icon: BookOpen,
        label: 'Cursos'
      }, {
        id: 'achievements',
        icon: Award,
        label: `Conquistas (${achievements.length})`
      }, {
        id: 'friends',
        icon: Users,
        label: 'Social'
      }].map(tab => <button key={tab.id} onClick={() => {
        soundEffects.play('click');
        setActiveTab(tab.id);
      }} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer -mb-px ${activeTab === tab.id ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>)}
      </div>

      
      {activeTab === 'courses' && <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Cursos Matriculados ({myCourses.length})
          </h3>
          {myCourses.length === 0 ? <Card className="p-10 text-center bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 rounded-3xl">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Nenhum curso ainda.
              </p>
              <Link to="/explore">
                <Button variant="primary" size="sm" className="mt-3">
                  Explorar Catálogo
                </Button>
              </Link>
            </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCourses.map(e => <Card key={e.id} hover className="p-4 flex items-center justify-between border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs rounded-2xl gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={e.course?.thumbnailUrl} alt={e.course?.title} className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {e.course?.title}
                      </h4>
                      <div className="mt-1 w-full bg-slate-100 dark:bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{
                  width: `${Math.round(e.progressPercent || 0)}%`
                }} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {Math.round(e.progressPercent || 0)}% completo
                      </p>
                    </div>
                  </div>
                  <Link to={`/learn/${e.courseId}`} className="shrink-0">
                    <Button variant="primary" size="sm" className="font-bold">
                      Aceder
                    </Button>
                  </Link>
                </Card>)}
            </div>}
        </div>}

      
      {activeTab === 'achievements' && <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Badges Desbloqueados
            </h3>
            <Link to="/achievements" className="text-sm font-bold text-blue-600 hover:underline">
              Ver Todos
            </Link>
          </div>
          {achievements.length === 0 ? <Card className="p-10 text-center bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 rounded-3xl">
              <Award className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Ainda sem conquistas. Continue a aprender!
              </p>
            </Card> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {achievements.map(ach => <Card key={ach.id} className="p-4 flex items-center gap-3 bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 shadow-xs rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {ach.title || ach.name}
                    </p>
                    <p className="text-xs text-amber-600 font-bold">+{ach.xpReward} XP</p>
                  </div>
                </Card>)}
            </div>}
        </div>}

      
      {activeTab === 'friends' && <Card className="p-8 text-center bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 rounded-3xl">
          <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Hub de Mensagens & Amigos
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
            Gere amizades, seguidores e conversas diretas no hub de mensagens.
          </p>
          <Link to="/messages">
            <Button variant="primary" size="md" leftIcon={<MessageSquare className="w-4 h-4" />}>
              Abrir Mensagens
            </Button>
          </Link>
        </Card>}

      
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Perfil">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Foto de Perfil
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <Avatar src={avatarPreview || editAvatarUrl} name={editName} size="lg" className="rounded-2xl ring-2 ring-slate-200 dark:ring-zinc-700" />
                {isCompressingAvatar && <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>}
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-zinc-600 w-fit">
                  <Camera className="w-4 h-4" />
                  Carregar Foto
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                <input type="url" placeholder="Ou cole um URL de imagem..." value={editAvatarUrl.startsWith('data:') ? '' : editAvatarUrl} onChange={e => {
                setEditAvatarUrl(e.target.value);
                setAvatarPreview(e.target.value);
              }} className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all" />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  JPG, PNG ou WebP — máx. 2 MB. Redimensionado automaticamente.
                </p>
              </div>
            </div>
          </div>

          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Banner do Perfil & Chamadas
            </label>

            
            <div className={`h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 relative ${getBannerClass(editBannerUrl)}`} style={getBannerStyle(editBannerUrl)}>
              {isCompressingBanner && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>}
              {editBannerUrl && <button type="button" onClick={() => {
              setEditBannerUrl('');
              setBannerPreview('');
            }} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>}
            </div>

            
            <div className="flex flex-wrap gap-2">
              {BANNER_PRESETS.map(preset => <button key={preset.value} type="button" onClick={() => {
              setEditBannerUrl(preset.value);
              setBannerPreview(preset.value);
            }} title={preset.label} className={`w-8 h-8 rounded-lg ${preset.style} border-2 transition-all cursor-pointer ${editBannerUrl === preset.value ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent hover:border-slate-400'}`} />)}
              <button type="button" onClick={() => bannerInputRef.current?.click()} className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-zinc-600 text-slate-400 flex items-center justify-center hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer" title="Carregar imagem personalizada">
                <ImagePlus className="w-4 h-4" />
              </button>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Este banner também aparece como fundo nos tiles de chamada quando a câmara está
              desligada.
            </p>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Nome Completo
              </label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Título / Especialidade
              </label>
              <input type="text" placeholder="ex: Full Stack Developer" value={editHeadline} onChange={e => setEditHeadline(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400" />
            </div>
          </div>

          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Biografia</label>
            <textarea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed" />
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Localização
              </label>
              <input type="text" placeholder="Lisboa, Portugal" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Website</label>
              <input type="url" placeholder="https://meusite.com" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400" />
            </div>
          </div>

          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Redes Sociais
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Github className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="text" placeholder="utilizador" value={editGithub} onChange={e => setEditGithub(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Twitter className="w-4 h-4 text-sky-400 shrink-0" />
                <input type="text" placeholder="@handle" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                <input type="text" placeholder="utilizador" value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
            </div>
          </div>

          
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-zinc-700">
            <Button type="button" onClick={() => setIsEditOpen(false)} variant="secondary" size="md">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" className="font-bold shadow-md shadow-blue-500/20" isLoading={isSaving}>
              {isSaving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default ProfilePage;