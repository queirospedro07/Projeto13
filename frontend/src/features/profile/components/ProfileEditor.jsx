import React, { useEffect, useRef, useState } from 'react';
import {
  UserRound,
  ImagePlus,
  Link2,
  Camera,
  Upload,
  Trash2,
  Check,
  MapPin,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { PROFILE_NETWORKS, normalizeProfileLink } from '../../../utils/profileSocials';
import { ProfileBanner, BANNER_PRESETS } from './ProfileBanner';
import { ProfileSocialLinks, NETWORK_ICONS } from './ProfileSocialLinks';
import './ProfileEditor.css';

async function resizeImage(file, maxWidth, maxHeight) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível processar a imagem.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.85);
}

export function ProfileEditor({ user, onClose, onSave, initialTab = 'details' }) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    headline: user?.profile?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
    avatarUrl: user?.avatarUrl || '',
    bannerUrl: user?.profile?.bannerUrl || '',
  }));
  const [socials, setSocials] = useState(() =>
    Object.fromEntries(
      PROFILE_NETWORKS.map((n) => [
        n.key,
        user?.profile?.socialLinks?.[n.key] || user?.profile?.[n.key] || '',
      ]),
    ),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState('');
  const avatarInput = useRef(null),
    bannerInput = useRef(null);
  const busy = saving || Boolean(processing);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const frame = requestAnimationFrame(() =>
      document.getElementById(`profile-editor-tab-${initialTab}`)?.focus(),
    );
    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('[role="dialog"][aria-label="Editar perfil"]');
      const elements = [
        ...(dialog?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled):not([hidden]), textarea:not(:disabled), a[href], [tabindex="0"]',
        ) || []),
      ].filter((element) => element.getClientRects().length && element.tabIndex >= 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trapFocus);
      previousFocus?.focus?.();
    };
  }, [initialTab]);
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '', submit: '' }));
  };
  const upload = async (event, key) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setErrors((e) => ({ ...e, [key]: 'Escolha uma imagem JPG, PNG ou WebP até 5 MB.' }));
      return;
    }
    setProcessing(key);
    try {
      update(
        key,
        await resizeImage(file, key === 'avatarUrl' ? 512 : 1600, key === 'avatarUrl' ? 512 : 600),
      );
    } catch {
      setErrors((e) => ({ ...e, [key]: 'Não foi possível abrir esta imagem. Experimente outra.' }));
    } finally {
      setProcessing('');
    }
  };
  const previewLinks = Object.fromEntries(
    PROFILE_NETWORKS.flatMap((n) => {
      try {
        const url = normalizeProfileLink(n, socials[n.key]);
        return url ? [[n.key, url]] : [];
      } catch {
        return [];
      }
    }),
  );
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const next = {},
      links = {};
    if (!form.name.trim()) next.name = 'Introduza o seu nome.';
    for (const [key, limit] of [
      ['name', 100],
      ['headline', 120],
      ['bio', 500],
      ['location', 100],
    ]) {
      if (form[key].length > limit) next[key] = `Use até ${limit} caracteres.`;
    }
    for (const network of PROFILE_NETWORKS) {
      try {
        const url = normalizeProfileLink(network, socials[network.key]);
        if (url) links[network.key] = url;
      } catch (error) {
        next[network.key] = error.message;
      }
    }
    for (const key of ['avatarUrl', 'bannerUrl']) {
      if (
        form[key] &&
        !/^(https?:\/\/|data:image\/|\/)/i.test(form[key]) &&
        !(
          key === 'bannerUrl' &&
          (/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([^;"'\\]+\)|linear-gradient\([^;"'\\]+\))$/i.test(
            form[key],
          ) ||
            BANNER_PRESETS.some((p) => p.value === form[key]))
        )
      )
        next[key] = 'Use uma imagem com link http ou https.';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      setTab(
        next.name || next.headline || next.bio || next.location
          ? 'details'
          : next.avatarUrl || next.bannerUrl
            ? 'appearance'
            : 'socials',
      );
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        website: links.website || '',
        github: links.github || '',
        linkedin: links.linkedin || '',
        socialLinks: links,
      });
    } catch (error) {
      setErrors({ submit: error.message || 'Não foi possível guardar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };
  const tabs = [
    { key: 'details', label: 'Perfil', icon: UserRound },
    { key: 'appearance', label: 'Aparência', icon: ImagePlus },
    { key: 'socials', label: 'Redes sociais', icon: Link2 },
  ];
  const field = (key, label, placeholder, limit, multiline = false) => (
    <div className="profile-editor-field" key={key}>
      <label htmlFor={`edit-${key}`}>{label}</label>
      {multiline ? (
        <textarea
          id={`edit-${key}`}
          value={form[key]}
          placeholder={placeholder}
          maxLength={limit}
          rows={5}
          onChange={(e) => update(key, e.target.value)}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={`edit-${key}-hint`}
        />
      ) : (
        <input
          id={`edit-${key}`}
          value={form[key]}
          placeholder={placeholder}
          maxLength={limit}
          onChange={(e) => update(key, e.target.value)}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={`edit-${key}-hint`}
          autoComplete={key === 'name' ? 'name' : 'off'}
        />
      )}
      <div id={`edit-${key}-hint`} className="profile-editor-field-meta">
        <span className="profile-editor-error">{errors[key]}</span>
        <span>
          {form[key].length}/{limit}
        </span>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={() => !busy && onClose()}
      title="Editar perfil"
      maxWidth="4xl"
      bodyClassName="profile-editor-modal-body"
    >
      <form className="profile-editor" onSubmit={submit} noValidate>
        <div className="profile-editor-intro">
          <span className="profile-editor-eyebrow">O SEU ESPAÇO NA NEXO</span>
          <p>Um perfil que conta a sua história.</p>
          <span>Apresente-se à comunidade e partilhe o que faz.</span>
        </div>
        <div className="profile-editor-content">
          <div className="profile-editor-workspace">
            <div className="profile-editor-tabs" role="tablist" aria-label="Secções de edição">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`profile-editor-tab-${key}`}
                  aria-selected={tab === key}
                  tabIndex={tab === key ? 0 : -1}
                  onKeyDown={(event) => {
                    const directions = { ArrowRight: 1, ArrowLeft: -1, Home: 0, End: 0 };
                    if (!(event.key in directions)) return;
                    event.preventDefault();
                    const index =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? tabs.length - 1
                          : (tabs.findIndex((t) => t.key === key) +
                              directions[event.key] +
                              tabs.length) %
                            tabs.length;
                    setTab(tabs[index].key);
                    const tabButtons =
                      event.currentTarget.parentElement.querySelectorAll('[role="tab"]');
                    tabButtons[index]?.focus();
                  }}
                  aria-controls={`profile-editor-panel-${key}`}
                  onClick={() => setTab(key)}
                >
                  <Icon aria-hidden="true" />
                  {label}
                  {key === 'socials' && <span>{Object.keys(previewLinks).length}</span>}
                </button>
              ))}
            </div>
            <fieldset disabled={busy} className="profile-editor-fields">
              <div
                role="tabpanel"
                id={`profile-editor-panel-${tab}`}
                aria-labelledby={`profile-editor-tab-${tab}`}
              >
                {tab === 'details' && (
                  <>
                    <div className="profile-editor-section-heading">
                      <h3>Sobre si</h3>
                      <p>Os detalhes que ajudam a comunidade a conhecê-lo.</p>
                    </div>
                    {field('name', 'Nome de apresentação', 'Como quer ser conhecido?', 100)}
                    {field(
                      'headline',
                      'Título ou especialidade',
                      'Ex.: Designer de interfaces e estudante de programação',
                      120,
                    )}
                    {field(
                      'bio',
                      'Biografia',
                      'Conte-nos o que faz, o que está a aprender e o que o inspira…',
                      500,
                      true,
                    )}
                    {field('location', 'Localização', 'Ex.: Lisboa, Portugal', 100)}
                  </>
                )}
                {tab === 'appearance' && (
                  <>
                    <div className="profile-editor-section-heading">
                      <h3>A sua identidade visual</h3>
                      <p>Escolha uma fotografia e dê personalidade à sua capa.</p>
                    </div>
                    <div className="profile-editor-photo">
                      <Avatar src={form.avatarUrl} name={form.name} size="xl" />
                      <div>
                        <strong>Fotografia de perfil</strong>
                        <p>JPG, PNG ou WebP, até 5 MB.</p>
                        <div className="profile-editor-actions">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => avatarInput.current?.click()}
                            leftIcon={
                              processing === 'avatarUrl' ? (
                                <Loader2 className="profile-editor-spinner" />
                              ) : (
                                <Camera />
                              )
                            }
                          >
                            Alterar foto
                          </Button>
                          {form.avatarUrl && (
                            <button
                              type="button"
                              className="profile-editor-remove"
                              onClick={() => update('avatarUrl', '')}
                              aria-label="Remover foto"
                            >
                              <Trash2 />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="profile-editor-field">
                      <label htmlFor="edit-avatar-url">Ou use um link de imagem</label>
                      <input
                        id="edit-avatar-url"
                        type="url"
                        placeholder="https://exemplo.pt/fotografia.jpg"
                        value={form.avatarUrl.startsWith('data:') ? '' : form.avatarUrl}
                        onChange={(e) => update('avatarUrl', e.target.value)}
                      />
                      <span className="profile-editor-error">{errors.avatarUrl}</span>
                    </div>
                    <div className="profile-editor-section-heading">
                      <h3>Capa do perfil</h3>
                      <p>Aparece no seu perfil e nas chamadas.</p>
                    </div>
                    <ProfileBanner value={form.bannerUrl} className="profile-editor-cover">
                      <button type="button" onClick={() => bannerInput.current?.click()}>
                        <Upload />
                        Carregar imagem
                      </button>
                    </ProfileBanner>
                    <div className="profile-editor-presets" aria-label="Cores da capa">
                      {BANNER_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          title={p.label}
                          aria-label={`Capa ${p.label}`}
                          aria-pressed={
                            form.bannerUrl === p.value ||
                            (!form.bannerUrl && p.value === 'gradient-indigo')
                          }
                          onClick={() => update('bannerUrl', p.value)}
                        >
                          <ProfileBanner value={p.value} />
                          {(form.bannerUrl === p.value ||
                            (!form.bannerUrl && p.value === 'gradient-indigo')) && <Check />}
                        </button>
                      ))}
                    </div>
                    <div className="profile-editor-color">
                      <label htmlFor="edit-cover-color">Cor personalizada</label>
                      <input
                        id="edit-cover-color"
                        type="color"
                        value={/^#[\da-f]{6}$/i.test(form.bannerUrl) ? form.bannerUrl : '#2563eb'}
                        onChange={(e) => update('bannerUrl', e.target.value)}
                      />
                      <button type="button" onClick={() => update('bannerUrl', '')}>
                        Repor capa
                      </button>
                    </div>
                    <div className="profile-editor-field">
                      <label htmlFor="edit-banner-url">Ou use um link para a capa</label>
                      <input
                        id="edit-banner-url"
                        type="url"
                        placeholder="https://exemplo.pt/capa.jpg"
                        value={/^https?:\/\//i.test(form.bannerUrl) ? form.bannerUrl : ''}
                        onChange={(e) => update('bannerUrl', e.target.value)}
                      />
                      <span className="profile-editor-error">{errors.bannerUrl}</span>
                    </div>
                  </>
                )}
                {tab === 'socials' && (
                  <>
                    <div className="profile-editor-section-heading">
                      <h3>Onde o podem encontrar</h3>
                      <p>
                        Adicione os seus perfis e portefólios. Pode usar um link completo ou o nome
                        de utilizador.
                      </p>
                    </div>
                    <div className="profile-editor-social-grid">
                      {PROFILE_NETWORKS.map((n) => {
                        const Icon = NETWORK_ICONS[n.key];
                        return (
                          <div className="profile-editor-field" key={n.key}>
                            <label htmlFor={`edit-social-${n.key}`}>
                              <Icon />
                              {n.label}
                              {previewLinks[n.key] && (
                                <Check className="profile-editor-connected" />
                              )}
                            </label>
                            <input
                              id={`edit-social-${n.key}`}
                              placeholder={n.placeholder}
                              value={socials[n.key]}
                              maxLength={500}
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-invalid={Boolean(errors[n.key])}
                              aria-describedby={`edit-social-${n.key}-error`}
                              onChange={(e) => {
                                setSocials((s) => ({ ...s, [n.key]: e.target.value }));
                                setErrors((s) => ({ ...s, [n.key]: '', submit: '' }));
                              }}
                            />
                            <span
                              id={`edit-social-${n.key}-error`}
                              className="profile-editor-error"
                            >
                              {errors[n.key]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="profile-editor-note">
                      <Eye />A visibilidade destes links segue as suas definições de privacidade.
                    </p>
                  </>
                )}
              </div>
            </fieldset>
          </div>
          <aside className="profile-editor-preview">
            <div className="profile-editor-preview-label">
              <Eye />
              <span>PRÉ-VISUALIZAÇÃO</span>
            </div>
            <div className="profile-editor-preview-card">
              <ProfileBanner value={form.bannerUrl} className="profile-editor-preview-cover" />
              <div className="profile-editor-preview-info">
                <Avatar src={form.avatarUrl} name={form.name} size="lg" />
                <h3>{form.name.trim() || 'O seu nome'}</h3>
                <span className="profile-editor-preview-username">@{user?.username}</span>
                <p className="profile-editor-preview-headline">
                  {form.headline || 'O seu título ou especialidade'}
                </p>
                {form.bio && <p className="profile-editor-preview-bio">{form.bio}</p>}
                {form.location && (
                  <span className="profile-editor-preview-location">
                    <MapPin />
                    {form.location}
                  </span>
                )}
                <ProfileSocialLinks profile={{ socialLinks: previewLinks }} compact />
              </div>
            </div>
            <p>As alterações aparecem aqui antes de guardar.</p>
          </aside>
        </div>
        {errors.submit && (
          <p className="profile-editor-submit-error" role="alert">
            <AlertCircle />
            {errors.submit}
          </p>
        )}
        <footer className="profile-editor-footer">
          <span>Personalize o perfil ao seu ritmo.</span>
          <div>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              disabled={Boolean(processing)}
              leftIcon={<Check />}
            >
              {processing ? 'A preparar imagem…' : 'Guardar alterações'}
            </Button>
          </div>
        </footer>
        <input
          ref={avatarInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => upload(e, 'avatarUrl')}
        />
        <input
          ref={bannerInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => upload(e, 'bannerUrl')}
        />
      </form>
    </Modal>
  );
}
