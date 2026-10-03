import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Award, BookOpen, Flame, Users, Edit3, MessageSquare, UserPlus, UserCheck, Clock, Globe, Github, Instagram, Camera, ImagePlus, X, ExternalLink, Loader2, Eye, EyeOff, Linkedin, Youtube, Twitch, Move, Check, RotateCcw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { DraggableImageCrop } from '../../../components/ui/DraggableImageCrop';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { soundEffects } from '../../../services/soundEffects';
import { api } from '../../../services/api';

const XIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.84 4.84 0 0 1-1-.07z"/>
  </svg>
);

const DiscordIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

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

function getBannerStyle(bannerUrl, bannerPosition = '50% 50%') {
  if (!bannerUrl) return {};
  const preset = BANNER_PRESETS.find(p => p.value === bannerUrl);
  if (preset) return {};
  if (
    bannerUrl.startsWith('#') ||
    bannerUrl.startsWith('rgb') ||
    bannerUrl.startsWith('hsl') ||
    bannerUrl.startsWith('linear-gradient')
  ) {
    return { background: bannerUrl };
  }
  return {
    backgroundImage: `url(${bannerUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: bannerPosition || '50% 50%'
  };
}

function getBannerClass(bannerUrl) {
  if (!bannerUrl) return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700';
  const preset = BANNER_PRESETS.find(p => p.value === bannerUrl);
  if (preset) return preset.style;
  if (
    bannerUrl.startsWith('#') ||
    bannerUrl.startsWith('rgb') ||
    bannerUrl.startsWith('hsl') ||
    bannerUrl.startsWith('linear-gradient')
  ) {
    return '';
  }
  return '';
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
  const [loading, setLoading] = useState(!isMe);
  const [notFound, setNotFound] = useState(false);
  const [socialStatus, setSocialStatus] = useState({
    isFollowing: false,
    friendshipStatus: 'NONE',
    isRequester: false,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0
  });
  const [activeTab, setActiveTab] = useState('courses');
  const [courseFilter, setCourseFilter] = useState('all');
  const [myCourses, setMyCourses] = useState([]);
  const [hiddenCourseIds, setHiddenCourseIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_hidden_courses') || localStorage.getItem('learnspace_hidden_courses') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleVisChange = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('nexo_hidden_courses') || localStorage.getItem('learnspace_hidden_courses') || '[]');
        setHiddenCourseIds(stored);
      } catch (_) {}
    };
    window.addEventListener('nexo_courses_visibility_changed', handleVisChange);
    return () => window.removeEventListener('nexo_courses_visibility_changed', handleVisChange);
  }, []);

  const toggleHideCourse = async (courseId, courseTitle = 'Curso') => {
    const isCurrentlyHidden = hiddenCourseIds.includes(courseId);
    const nextHidden = !isCurrentlyHidden;

    setHiddenCourseIds(prev => {
      const next = prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId];
      localStorage.setItem('nexo_hidden_courses', JSON.stringify(next));
      localStorage.setItem('learnspace_hidden_courses', JSON.stringify(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      return next;
    });

    setMyCourses(prev => prev.map(e => {
      if (e.course?.id === courseId || e.courseId === courseId) {
        return { ...e, isHidden: nextHidden };
      }
      return e;
    }));

    toast({
      title: nextHidden ? 'Curso Ocultado dos Outros' : 'Curso Visível no Perfil',
      message: nextHidden
        ? `"${courseTitle}" está agora ocultado para outros utilizadores. Apenas você consegue visualizá-lo aqui no seu perfil.`
        : `"${courseTitle}" está agora visível para quem visitar o seu perfil público.`,
      type: nextHidden ? 'info' : 'success'
    });

    try {
      await api.toggleHideCourse(courseId);
    } catch (_) {}
  };
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editYoutube, setEditYoutube] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editTwitch, setEditTwitch] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editBannerPosition, setEditBannerPosition] = useState('50% 50%');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerPosition, setBannerPosition] = useState('50% 50%');
  const initialBannerPosRef = useRef('50% 50%');
  const [isAdjustingBanner, setIsAdjustingBanner] = useState(false);
  const [isSavingBannerPos, setIsSavingBannerPos] = useState(false);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isCompressingBanner, setIsCompressingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const startAdjustingBanner = () => {
    initialBannerPosRef.current = bannerPosition || '50% 50%';
    setIsAdjustingBanner(true);
  };

  const cancelAdjustingBanner = () => {
    setBannerPosition(initialBannerPosRef.current);
    setIsAdjustingBanner(false);
  };

  useEffect(() => {
    if (isMe && currentUser) {
      const localPos = localStorage.getItem(`nexo_banner_pos_${currentUser.id}`);
      setProfileUser(currentUser);
      setBannerPosition(currentUser?.profile?.bannerPosition || localPos || '50% 50%');
      setLoading(false);
      setNotFound(false);
      api.getMyCourses().then(d => {
        setMyCourses(d || []);
        const serverHidden = (d || []).filter(e => e.isHidden).map(e => e.course?.id || e.courseId).filter(Boolean);
        if (serverHidden.length > 0) {
          setHiddenCourseIds(prev => {
            const merged = Array.from(new Set([...prev, ...serverHidden]));
            localStorage.setItem('nexo_hidden_courses', JSON.stringify(merged));
            localStorage.setItem('learnspace_hidden_courses', JSON.stringify(merged));
            return merged;
          });
        }
      }).catch(() => {});
      api.getSocialStatus(currentUser.id).then(st => setSocialStatus(st)).catch(() => {});
    } else if (!isMe && username) {
      setLoading(true);
      setNotFound(false);
      api.getUserProfile(username).then(userData => {
        setProfileUser(userData);
        setBannerPosition(userData?.profile?.bannerPosition || '50% 50%');
        setMyCourses(userData?.courses || []);
        setLoading(false);
        if (userData?.id) {
          api.getSocialStatus(userData.id).then(st => setSocialStatus(st)).catch(() => {});
        }
      }).catch(() => {
        setNotFound(true);
        setLoading(false);
      });
    }
  }, [username, currentUser, isMe]);
  const openEditModal = useCallback(() => {
    const u = currentUser;
    setEditName(u?.name || '');
    setEditBio(u?.bio || '');
    setEditLocation(u?.location || '');
    setEditHeadline(u?.profile?.headline || '');
    setEditGithub(u?.profile?.github || '');
    setEditTwitter(u?.profile?.twitter || '');
    setEditLinkedin(u?.profile?.linkedin || '');
    setEditInstagram(u?.profile?.instagram || '');
    setEditWebsite(u?.profile?.website || '');
    setEditYoutube(u?.profile?.youtube || '');
    setEditTiktok(u?.profile?.tiktok || '');
    setEditDiscord(u?.profile?.discord || '');
    setEditTwitch(u?.profile?.twitch || '');
    setEditAvatarUrl(u?.avatarUrl || '');
    setEditBannerUrl(u?.profile?.bannerUrl || '');
    setEditBannerPosition(u?.profile?.bannerPosition || bannerPosition || '50% 50%');
    setAvatarPreview(u?.avatarUrl || '');
    setBannerPreview(u?.profile?.bannerUrl || '');
    setIsEditOpen(true);
  }, [profileUser, currentUser, isMe, bannerPosition]);
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
      const updateRes = await api.updateProfile({
        name: editName,
        bio: editBio,
        location: editLocation,
        avatarUrl: editAvatarUrl,
        headline: editHeadline,
        github: editGithub,
        twitter: editTwitter,
        linkedin: editLinkedin,
        instagram: editInstagram,
        website: editWebsite,
        youtube: editYoutube,
        tiktok: editTiktok,
        discord: editDiscord,
        twitch: editTwitch,
        bannerUrl: editBannerUrl,
        bannerPosition: editBannerPosition
      });
      if (updateRes?.user) {
        setProfileUser(updateRes.user);
        setBannerPosition(updateRes.user?.profile?.bannerPosition || editBannerPosition);
        if (currentUser?.id) {
          localStorage.setItem(`nexo_banner_pos_${currentUser.id}`, editBannerPosition);
        }
      }
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

  const handleSaveBannerPositionLive = async () => {
    setIsSavingBannerPos(true);
    try {
      const updateRes = await api.updateProfile({ bannerPosition });
      if (updateRes?.user) {
        setProfileUser(updateRes.user);
        setBannerPosition(updateRes.user?.profile?.bannerPosition || bannerPosition);
      }
      initialBannerPosRef.current = bannerPosition;
      if (currentUser?.id) {
        localStorage.setItem(`nexo_banner_pos_${currentUser.id}`, bannerPosition);
      }
      await refreshUser();
      setIsAdjustingBanner(false);
      toast({
        title: 'Posição do Banner Guardada',
        message: 'O enquadramento da sua capa foi atualizado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível guardar a posição.',
        type: 'error'
      });
    } finally {
      setIsSavingBannerPos(false);
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
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (notFound || (!isMe && !profileUser)) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <Users className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Utilizador não encontrado</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">O perfil solicitado não existe ou pode ter sido alterado.</p>
        <Button onClick={() => navigate(-1)} variant="secondary">Voltar</Button>
      </div>
    );
  }
  const u = isMe ? currentUser : profileUser;
  const bannerClass = getBannerClass(u?.profile?.bannerUrl);
  const bannerStyle = getBannerStyle(u?.profile?.bannerUrl, bannerPosition);
  const isCustomBanner = u?.profile?.bannerUrl && !BANNER_PRESETS.some(p => p.value === u.profile.bannerUrl) && !u.profile.bannerUrl.startsWith('#');

  return <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        
        {isAdjustingBanner ? (
          <div className="h-44 sm:h-56 w-full relative">
            <DraggableImageCrop
              imageUrl={u?.profile?.bannerUrl}
              position={bannerPosition}
              onPositionChange={setBannerPosition}
              isEditing={true}
              onSave={handleSaveBannerPositionLive}
              onCancel={cancelAdjustingBanner}
              className="h-44 sm:h-56 w-full"
              alt="Banner do perfil"
            />
          </div>
        ) : (
          <div className={`h-44 sm:h-56 w-full relative overflow-hidden ${isCustomBanner ? 'bg-slate-900' : bannerClass}`} style={!isCustomBanner ? bannerStyle : {}}>
            {isCustomBanner && (
              <img
                src={u?.profile?.bannerUrl}
                alt="Banner do perfil"
                className="w-full h-full object-cover"
                style={{ objectPosition: bannerPosition || '50% 50%' }}
              />
            )}
            {isCustomBanner && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}

            {isMe && (
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                {isCustomBanner && (
                  <button
                    type="button"
                    onClick={startAdjustingBanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/70 transition-colors cursor-pointer border border-white/20 shadow-md"
                    title="Ajustar enquadramento do banner"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ajustar Posição</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/70 transition-colors cursor-pointer border border-white/20 shadow-md"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Alterar Banner</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="px-5 sm:px-10 pb-8 pt-0">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            
            <div className="relative group -mt-14 sm:-mt-16 z-20 shrink-0 self-start">
              <Avatar 
                src={u?.avatarUrl} 
                name={u?.name} 
                size="xl" 
                role={u?.role} 
                className="ring-4 ring-white dark:ring-zinc-900 bg-white dark:bg-zinc-800 shadow-xl rounded-full" 
              />
              <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-1 right-1 shadow-md" />
              {isMe && <button onClick={() => openEditModal()} className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" aria-label="Alterar foto de perfil">
                  <Camera className="w-6 h-6 text-white drop-shadow" />
                </button>}
            </div>

            
            <div className="flex flex-wrap items-center gap-2.5 z-20 relative pt-1 sm:pt-0">
              {isMe ? <Button onClick={openEditModal} variant="secondary" size="md" leftIcon={<Edit3 className="w-4 h-4" />} className="font-bold cursor-pointer shadow-xs">
                  Editar Perfil
                </Button> : <>
                  <Button onClick={handleToggleFollow} variant={socialStatus.isFollowing ? 'secondary' : 'primary'} size="md" className="font-bold cursor-pointer">
                    {socialStatus.isFollowing ? 'A Seguir' : '+ Seguir'}
                  </Button>
                  <Button onClick={handleFriendAction} variant="secondary" size="md" leftIcon={socialStatus.friendshipStatus === 'ACCEPTED' ? <UserCheck className="w-4 h-4 text-emerald-600" /> : socialStatus.friendshipStatus === 'PENDING' ? <Clock className="w-4 h-4 text-amber-600" /> : <UserPlus className="w-4 h-4" />} className="font-bold cursor-pointer">
                    {socialStatus.friendshipStatus === 'ACCEPTED' ? 'Amigos' : socialStatus.friendshipStatus === 'PENDING' ? 'Pendente' : 'Adicionar'}
                  </Button>
                  <Button onClick={() => navigate(`/messages?userId=${u.id}`, { state: { peer: u } })} variant="secondary" size="md" leftIcon={<MessageSquare className="w-4 h-4" />} className="font-bold cursor-pointer">
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
              {u?.role === 'CREATOR' ? 'Formador' : u?.role === 'ADMIN' ? 'Administrador' : 'Estudante'}
            </Badge>
          </div>

          {u?.profile?.headline && <p className="text-base text-blue-600 dark:text-blue-400 font-semibold mb-2">
              {u.profile.headline}
            </p>}

          {u?.bio && <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-4">
              {u.bio}
            </p>}

          
          {(u?.location || u?.profile?.website || u?.profile?.github || u?.profile?.instagram || u?.profile?.twitter || u?.profile?.linkedin || u?.profile?.youtube || u?.profile?.tiktok || u?.profile?.discord || u?.profile?.twitch) && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-4">
              {u?.location && <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {u.location}
                </span>}
              {u?.profile?.website && <a href={u.profile.website.startsWith('http') ? u.profile.website : `https://${u.profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>}
              {u?.profile?.github && <a href={`https://github.com/${u.profile.github.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.github.replace(/^@/, '')}
                </a>}
              {u?.profile?.linkedin && <a href={`https://linkedin.com/in/${u.profile.linkedin.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                  <Linkedin className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  {u.profile.linkedin.replace(/^@/, '')}
                </a>}
              {u?.profile?.instagram && <a href={`https://instagram.com/${u.profile.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                  <Instagram className="w-3.5 h-3.5 shrink-0 text-pink-500" />
                  @{u.profile.instagram.replace(/^@/, '')}
                </a>}
              {u?.profile?.twitter && <a href={`https://x.com/${u.profile.twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <XIcon className="w-3.5 h-3.5 shrink-0" />
                  @{u.profile.twitter.replace(/^@/, '')}
                </a>}
              {u?.profile?.youtube && <a href={`https://youtube.com/@${u.profile.youtube.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-red-600 transition-colors">
                  <Youtube className="w-3.5 h-3.5 shrink-0 text-red-600" />
                  @{u.profile.youtube.replace(/^@/, '')}
                </a>}
              {u?.profile?.tiktok && <a href={`https://tiktok.com/@${u.profile.tiktok.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <TikTokIcon className="w-3.5 h-3.5 shrink-0" />
                  @{u.profile.tiktok.replace(/^@/, '')}
                </a>}
              {u?.profile?.discord && <span className="flex items-center gap-1.5 text-indigo-500">
                  <DiscordIcon className="w-3.5 h-3.5 shrink-0" />
                  {u.profile.discord}
                </span>}
              {u?.profile?.twitch && <a href={`https://twitch.tv/${u.profile.twitch.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                  <Twitch className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                  {u.profile.twitch.replace(/^@/, '')}
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
          </div>
        </div>
      </div>

      
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-0 overflow-x-auto no-scrollbar">
        {[{
        id: 'courses',
        icon: BookOpen,
        label: 'Cursos'
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

      
      {activeTab === 'courses' && (() => {
        const isCourseHidden = (e) => {
          const courseId = e.course?.id || e.courseId;
          return Boolean(e.isHidden || hiddenCourseIds.includes(courseId));
        };

        const totalCourses = myCourses.length;
        const hiddenCoursesList = myCourses.filter(isCourseHidden);
        const visibleCoursesList = myCourses.filter(e => !isCourseHidden(e));
        const hiddenCount = hiddenCoursesList.length;
        const visibleCount = visibleCoursesList.length;

        let displayCourses = myCourses;
        if (!isMe) {
          displayCourses = visibleCoursesList;
        } else if (courseFilter === 'visible') {
          displayCourses = visibleCoursesList;
        } else if (courseFilter === 'hidden') {
          displayCourses = hiddenCoursesList;
        }

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cursos Inscritos ({totalCourses})
                </h3>
                {isMe && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Gira a visibilidade das suas formações para terceiros no seu perfil público.
                  </p>
                )}
              </div>

              {isMe && totalCourses > 0 && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 self-start sm:self-auto text-xs">
                  <button
                    onClick={() => setCourseFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      courseFilter === 'all'
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todos ({totalCourses})
                  </button>
                  <button
                    onClick={() => setCourseFilter('visible')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      courseFilter === 'visible'
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Visíveis ({visibleCount})
                  </button>
                  <button
                    onClick={() => setCourseFilter('hidden')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      courseFilter === 'hidden'
                        ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultados para Outros ({hiddenCount})</span>
                  </button>
                </div>
              )}
            </div>

            {isMe && courseFilter === 'hidden' && hiddenCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Estes cursos estão ocultados para outros utilizadores que visitem o seu perfil público. Apenas você consegue visualizá-los aqui.</span>
              </div>
            )}

            {displayCourses.length === 0 ? (
              <Card className="p-10 text-center bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 rounded-xl">
                {courseFilter === 'hidden' ? (
                  <>
                    <Eye className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Não tem cursos ocultados
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                      Todos os seus cursos inscritos estão visíveis publicamente no seu perfil.
                    </p>
                    <button
                      onClick={() => setCourseFilter('all')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
                    >
                      Ver Todos os Cursos
                    </button>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      {isMe ? 'Ainda não está inscrito em nenhum curso.' : 'Nenhum curso visível no momento.'}
                    </p>
                    {isMe && (
                      <Link to="/explore">
                        <Button variant="primary" size="sm" className="mt-3">
                          Explorar Catálogo
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayCourses.map(e => {
                  const courseId = e.course?.id || e.courseId;
                  const isHidden = isCourseHidden(e);
                  const isFinished = (e.progressPercent || 0) >= 100;

                  return (
                    <Card key={e.id || courseId} hover className="p-4 flex flex-col justify-between border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs rounded-xl gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={e.course?.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
                            alt={e.course?.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-zinc-700"
                          />
                          {isMe && isHidden && (
                            <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500 text-white shadow-xs" title="Ocultado para terceiros">
                              <EyeOff className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {isMe && (
                              isHidden ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-500/20 inline-flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Ocultado para terceiros
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 inline-flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Visível no perfil
                                </span>
                              )
                            )}
                            {e.course?.category && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-bold">
                                {e.course.category}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 mb-1.5">
                            {e.course?.title}
                          </h4>

                          <div className="w-full bg-slate-100 dark:bg-zinc-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isFinished ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.round(e.progressPercent || 0)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-1 text-xs text-slate-500 dark:text-zinc-400">
                            <span>{Math.round(e.progressPercent || 0)}% concluído</span>
                            {isFinished && (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Concluído
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-700/60 gap-2">
                        {isMe ? (
                          <button
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              toggleHideCourse(courseId, e.course?.title);
                            }}
                            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isHidden
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:text-amber-600 dark:hover:text-amber-400'
                            }`}
                            title={isHidden ? 'Tornar este curso visível no seu perfil público' : 'Ocultar este curso para outros utilizadores'}
                          >
                            {isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tornar Visível</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Ocultar de Outros</span>
                              </>
                            )}
                          </button>
                        ) : <span />}

                        <Link to={`/learn/${courseId}`} className="shrink-0">
                          <Button variant="primary" size="sm" className="font-bold">
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

      
      {activeTab === 'friends' && <Card className="p-8 text-center bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 rounded-xl">
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
                <Avatar src={avatarPreview || editAvatarUrl} name={editName} size="lg" className="rounded-full ring-2 ring-slate-200 dark:ring-zinc-700" />
                {isCompressingAvatar && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Banner do Perfil & Chamadas
              </label>
              {editBannerUrl && !BANNER_PRESETS.some(p => p.value === editBannerUrl) && !editBannerUrl.startsWith('#') && (
                <span className="text-[11px] text-blue-500 font-semibold flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  Arraste para enquadrar
                </span>
              )}
            </div>

            {/* Banner Preview Box with Draggable Framing */}
            {editBannerUrl && !BANNER_PRESETS.some(p => p.value === editBannerUrl) && !editBannerUrl.startsWith('#') ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
                <DraggableImageCrop
                  imageUrl={editBannerUrl}
                  position={editBannerPosition}
                  onPositionChange={setEditBannerPosition}
                  isEditing={true}
                  className="h-28 w-full"
                  alt="Pré-visualização do banner"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditBannerUrl('');
                    setBannerPreview('');
                  }}
                  className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors shadow-md"
                  title="Remover banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className={`h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 relative ${getBannerClass(editBannerUrl)}`} style={getBannerStyle(editBannerUrl, editBannerPosition)}>
                {isCompressingBanner && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {editBannerUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditBannerUrl('');
                      setBannerPreview('');
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-1">
              {BANNER_PRESETS.map(preset => <button key={preset.value} type="button" onClick={() => {
              setEditBannerUrl(preset.value);
              setBannerPreview(preset.value);
            }} title={preset.label} className={`w-8 h-8 rounded-lg ${preset.style} border-2 transition-all cursor-pointer ${editBannerUrl === preset.value ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent hover:border-slate-400'}`} />)}
              <button type="button" onClick={() => bannerInputRef.current?.click()} className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-zinc-600 text-slate-400 flex items-center justify-center hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer" title="Carregar imagem personalizada">
                <ImagePlus className="w-4 h-4" />
              </button>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-500 transition-colors shrink-0">
                <input
                  type="color"
                  value={editBannerUrl.startsWith('#') ? editBannerUrl : '#3b82f6'}
                  onChange={e => {
                    setEditBannerUrl(e.target.value);
                    setBannerPreview(e.target.value);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                  Qualquer Cor
                </span>
              </label>
              <input
                type="text"
                placeholder="Código de cor (ex: #3b82f6 ou #e11d48)"
                value={editBannerUrl.startsWith('data:') ? '' : editBannerUrl}
                onChange={e => {
                  setEditBannerUrl(e.target.value);
                  setBannerPreview(e.target.value);
                }}
                className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Escolha uma cor personalizada, gradiente ou carregue uma imagem para o banner. Pode arrastar a imagem acima para escolher o enquadramento.
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
              <input type="url" placeholder="https://oseusite.pt" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400" />
            </div>
          </div>

          {/* Social networks */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Redes Sociais
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Github className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <input type="text" placeholder="GitHub (username)" value={editGithub} onChange={e => setEditGithub(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                <input type="text" placeholder="LinkedIn (username)" value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                <input type="text" placeholder="Instagram (username)" value={editInstagram} onChange={e => setEditInstagram(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <XIcon className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
                <input type="text" placeholder="X / Twitter (username)" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                <input type="text" placeholder="YouTube (@username)" value={editYoutube} onChange={e => setEditYoutube(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <TikTokIcon className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
                <input type="text" placeholder="TikTok (@username)" value={editTiktok} onChange={e => setEditTiktok(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <DiscordIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                <input type="text" placeholder="Discord (user#tag ou username)" value={editDiscord} onChange={e => setEditDiscord(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2.5">
                <Twitch className="w-4 h-4 text-purple-600 shrink-0" />
                <input type="text" placeholder="Twitch (username)" value={editTwitch} onChange={e => setEditTwitch(e.target.value)} className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 min-w-0" />
              </div>
            </div>
          </div>

          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2 border-t border-slate-100 dark:border-zinc-700">
            <Button type="button" onClick={() => setIsEditOpen(false)} variant="secondary" size="md" className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto font-bold shadow-md shadow-blue-500/20" isLoading={isSaving}>
              {isSaving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default ProfilePage;