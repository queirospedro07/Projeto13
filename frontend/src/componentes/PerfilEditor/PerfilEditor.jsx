import { CORES_AVATAR, obterCorAvatar } from '../../utilitarios/coresAvatar';
import { useEffect, useRef, useState } from 'react';
import {
  LuUserRound as UserRound,
  LuImagePlus as ImagePlus,
  LuLink2 as Link2,
  LuCamera as Camera,
  LuUpload as Upload,
  LuTrash2 as Trash2,
  LuCheck as Check,
  LuMapPin as MapPin,
  LuCircleAlert as AlertCircle,
  LuLoaderCircle as Loader2,
  LuEye as Eye,
} from 'react-icons/lu';
import { Janela } from '../Janela';
import { Botao } from '../Botao';
import { Avatar } from '../Avatar';
import { PROFILE_NETWORKS, normalizarPerfilLigacao } from '../../utilitarios/redesSociaisPerfil';
import { PerfilCapa, BANNER_PRESETS } from '../PerfilCapa';
import { LigacoesRedesSociaisPerfil, NETWORK_ICONS } from '../LigacoesRedesSociaisPerfil';
import './PerfilEditor.css';

async function redimensionarImagem(ficheiro, maxWidth, maxHeight) {
  const dadosUrl = await new Promise((resolver, rejeitar) => {
    const reader = new FileReader();

    reader.onload = () => resolver(reader.result);
    reader.onerror = rejeitar;
    reader.readAsDataURL(ficheiro);
  });
  const imagem = await new Promise((resolver, rejeitar) => {
    const img = new Image();

    img.onload = () => resolver(img);
    img.onerror = rejeitar;
    img.src = dadosUrl;
  });
  const scale = Math.min(1, maxWidth / imagem.width, maxHeight / imagem.height);
  const canvas = document.createElement('canvas');

  canvas.width = Math.max(1, Math.round(imagem.width * scale));
  canvas.height = Math.max(1, Math.round(imagem.height * scale));

  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Não foi possível processar a imagem.');
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/webp', 0.85);
}

export function PerfilEditor({
  user: utilizador,
  onClose: onFechar,
  onSave: onGuardar,
  initialTab: inicialSeparador = 'details',
}) {
  const [separador, definirSeparador] = useState(inicialSeparador);
  const [form, definirForm] = useState(() => ({
    name: utilizador?.name || '',
    headline: utilizador?.profile?.headline || '',
    bio: utilizador?.bio || '',
    location: utilizador?.location || '',
    urlAvatar: utilizador?.urlAvatar || '',
    urlCapa: utilizador?.profile?.urlCapa || '',
  }));
  const [redesSociais, definirRedesSociais] = useState(() =>
    Object.fromEntries(
      PROFILE_NETWORKS.map((n) => [
        n.key,
        utilizador?.profile?.ligacoesRedesSociais?.[n.key] || utilizador?.profile?.[n.key] || '',
      ]),
    ),
  );
  const [erros, definirErros] = useState({});
  const [saving, definirSaving] = useState(false);
  const [processing, definirProcessing] = useState('');
  const avatarEntrada = useRef(null);
  const capaEntrada = useRef(null);
  const busy = saving || Boolean(processing);

  useEffect(() => {
    const anteriorFocar = document.activeElement;
    const frame = requestAnimationFrame(() =>
      document.getElementById(`profile-editor-tab-${inicialSeparador}`)?.focus(),
    );
    const reterFocar = (evento) => {
      if (evento.key !== 'Tab') return;
      const dialog = document.querySelector('[role="dialog"][aria-label="Editar perfil"]');
      const elements = [
        ...(dialog?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled):not([hidden]), textarea:not(:disabled), a[href], [tabindex="0"]',
        ) || []),
      ].filter((element) => element.getClientRects().length && element.tabIndex >= 0);
      const first = elements[0];
      const ultima = elements[elements.length - 1];
      if (evento.shiftKey && document.activeElement === first) {
        evento.preventDefault();
        ultima?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultima) {
        evento.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', reterFocar);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', reterFocar);
      anteriorFocar?.focus?.();
    };
  }, [inicialSeparador]);

  const atualizar = (chave, valor) => {
    definirForm((f) => ({
      ...f,
      [chave]: valor,
    }));
    definirErros((evento) => ({
      ...evento,
      [chave]: '',
      submit: '',
    }));
  };

  const carregar = async (evento, chave) => {
    const ficheiro = evento.target.files?.[0];

    evento.target.value = '';
    if (!ficheiro) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(ficheiro.type) ||
      ficheiro.size > 5 * 1024 * 1024
    ) {
      definirErros((evento2) => ({
        ...evento2,
        [chave]: 'Escolha uma imagem JPG, PNG ou WebP até 5 MB.',
      }));

      return;
    }

    definirProcessing(chave);
    try {
      atualizar(
        chave,
        await redimensionarImagem(
          ficheiro,
          chave === 'urlAvatar' ? 512 : 1600,
          chave === 'urlAvatar' ? 512 : 600,
        ),
      );
    } catch {
      definirErros((evento2) => ({
        ...evento2,
        [chave]: 'Não foi possível abrir esta imagem. Experimente outra.',
      }));
    } finally {
      definirProcessing('');
    }
  };

  const previsualizarLigacoes = Object.fromEntries(
    PROFILE_NETWORKS.flatMap((n) => {
      try {
        const url = normalizarPerfilLigacao(n, redesSociais[n.key]);

        return url ? [[n.key, url]] : [];
      } catch {
        return [];
      }
    }),
  );
  const submeter = async (evento) => {
    evento.preventDefault();
    if (busy) return;
    const seguinte = {};
    const ligacoes = {};
    if (!form.name.trim()) seguinte.name = 'Introduza o seu nome.';
    for (const [chave, limite] of [
      ['name', 100],
      ['headline', 120],
      ['bio', 500],
      ['location', 100],
    ]) {
      if (form[chave].length > limite) seguinte[chave] = `Use até ${limite} caracteres.`;
    }

    for (const network of PROFILE_NETWORKS) {
      try {
        const url = normalizarPerfilLigacao(network, redesSociais[network.key]);
        if (url) ligacoes[network.key] = url;
      } catch (erro) {
        seguinte[network.key] = erro.message;
      }
    }

    for (const chave of ['urlAvatar', 'urlCapa']) {
      if (
        form[chave] &&
        !/^(https?:\/\/|data:image\/|\/)/i.test(form[chave]) &&
        !(
          chave === 'urlCapa' &&
          (/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([^;"'\\]+\)|linear-gradient\([^;"'\\]+\))$/i.test(
            form[chave],
          ) ||
            BANNER_PRESETS.some((p) => p.value === form[chave]))
        )
      )
        seguinte[chave] = 'Use uma imagem com link http ou https.';
    }

    if (Object.keys(seguinte).length) {
      definirErros(seguinte);
      definirSeparador(
        seguinte.name || seguinte.headline || seguinte.bio || seguinte.location
          ? 'details'
          : seguinte.urlAvatar || seguinte.urlCapa
            ? 'appearance'
            : 'socials',
      );

      return;
    }

    definirSaving(true);
    definirErros({});
    try {
      await onGuardar({
        ...form,
        name: form.name.trim(),
        website: ligacoes.website || '',
        github: ligacoes.github || '',
        linkedin: ligacoes.linkedin || '',
        ligacoesRedesSociais: ligacoes,
      });
    } catch (erro) {
      definirErros({
        submit: erro.message || 'Não foi possível guardar. Tente novamente.',
      });
    } finally {
      definirSaving(false);
    }
  };

  const tabs = [
    {
      key: 'details',
      label: 'Perfil',
      icon: UserRound,
    },
    {
      key: 'appearance',
      label: 'Aparência',
      icon: ImagePlus,
    },
    {
      key: 'socials',
      label: 'Redes sociais',
      icon: Link2,
    },
  ];
  const campo = (chave, label, placeholder, limite, multiline = false) => (
    <div
      className="profile-editor-field"
      key={chave}
    >
      <label htmlFor={`edit-${chave}`}>{label}</label>
      {multiline ? (
        <textarea
          id={`edit-${chave}`}
          value={form[chave]}
          placeholder={placeholder}
          maxLength={limite}
          rows={5}
          onChange={(evento) => atualizar(chave, evento.target.value)}
          aria-invalid={Boolean(erros[chave])}
          aria-describedby={`edit-${chave}-hint`}
        />
      ) : (
        <input
          id={`edit-${chave}`}
          value={form[chave]}
          placeholder={placeholder}
          maxLength={limite}
          onChange={(evento) => atualizar(chave, evento.target.value)}
          aria-invalid={Boolean(erros[chave])}
          aria-describedby={`edit-${chave}-hint`}
          autoComplete={chave === 'name' ? 'name' : 'off'}
        />
      )}
      <div
        id={`edit-${chave}-hint`}
        className="profile-editor-field-meta"
      >
        <span className="profile-editor-error">{erros[chave]}</span>
        <span>
          {form[chave].length}/{limite}
        </span>
      </div>
    </div>
  );

  return (
    <Janela
      isOpen
      onClose={() => !busy && onFechar()}
      title="Editar perfil"
      maxWidth="4xl"
      bodyClassName="profile-editor-modal-body"
    >
      <form
        className="profile-editor"
        onSubmit={submeter}
        noValidate
      >
        <div className="profile-editor-intro">
          <span className="profile-editor-eyebrow">O SEU ESPAÇO NA NEXO</span>
          <p>Um perfil que conta a sua história.</p>
          <span>Apresente-se à comunidade e partilhe o que faz.</span>
        </div>
        <div className="profile-editor-content">
          <div className="profile-editor-workspace">
            <div
              className="profile-editor-tabs"
              role="tablist"
              aria-label="Secções de edição"
            >
              {tabs.map(({ key: chave, label, icon: Icon }) => (
                <button
                  key={chave}
                  type="button"
                  role="tab"
                  id={`profile-editor-tab-${chave}`}
                  aria-selected={separador === chave}
                  tabIndex={separador === chave ? 0 : -1}
                  onKeyDown={(evento) => {
                    const directions = {
                      ArrowRight: 1,
                      ArrowLeft: -1,
                      Home: 0,
                      End: 0,
                    };
                    if (!(evento.key in directions)) return;
                    evento.preventDefault();

                    const indice =
                      evento.key === 'Home'
                        ? 0
                        : evento.key === 'End'
                          ? tabs.length - 1
                          : (tabs.findIndex((t) => t.key === chave) +
                              directions[evento.key] +
                              tabs.length) %
                            tabs.length;

                    definirSeparador(tabs[indice].key);

                    const separadorButtons =
                      evento.currentTarget.parentElement.querySelectorAll('[role="tab"]');

                    separadorButtons[indice]?.focus();
                  }}
                  aria-controls={`profile-editor-panel-${chave}`}
                  onClick={() => definirSeparador(chave)}
                >
                  <Icon aria-hidden="true" />
                  {label}
                  {chave === 'socials' && <span>{Object.keys(previsualizarLigacoes).length}</span>}
                </button>
              ))}
            </div>
            <fieldset
              disabled={busy}
              className="profile-editor-fields"
            >
              <div
                role="tabpanel"
                id={`profile-editor-panel-${separador}`}
                aria-labelledby={`profile-editor-tab-${separador}`}
              >
                {separador === 'details' && (
                  <>
                    <div className="profile-editor-section-heading">
                      <h3>Sobre si</h3>
                      <p>Os detalhes que ajudam a comunidade a conhecê-lo.</p>
                    </div>
                    {campo('name', 'Nome de apresentação', 'Como quer ser conhecido?', 100)}
                    {campo(
                      'headline',
                      'Título ou especialidade',
                      'Ex.: Designer de interfaces e estudante de programação',
                      120,
                    )}
                    {campo(
                      'bio',
                      'Biografia',
                      'Conte-nos o que faz, o que está a aprender e o que o inspira…',
                      500,
                      true,
                    )}
                    {campo('location', 'Localização', 'Ex.: Lisboa, Portugal', 100)}
                  </>
                )}
                {separador === 'appearance' && (
                  <>
                    <div className="profile-editor-section-heading">
                      <h3>A sua identidade visual</h3>
                      <p>Escolha uma fotografia e dê personalidade à sua capa.</p>
                    </div>
                    <div className="profile-editor-photo">
                      <Avatar
                        src={form.urlAvatar}
                        name={form.name}
                        size="xl"
                      />
                      <div>
                        <strong>Fotografia de perfil</strong>
                        <p>JPG, PNG ou WebP, até 5 MB.</p>
                        <div className="profile-editor-actions">
                          <Botao
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => avatarEntrada.current?.click()}
                            leftIcon={
                              processing === 'urlAvatar' ? (
                                <Loader2 className="profile-editor-spinner" />
                              ) : (
                                <Camera />
                              )
                            }
                          >
                            Alterar foto
                          </Botao>
                          {form.urlAvatar && !obterCorAvatar(form.urlAvatar) && (
                            <button
                              type="button"
                              className="profile-editor-remove"
                              onClick={() => atualizar('urlAvatar', '')}
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
                        value={
                          form.urlAvatar.startsWith('data:') || obterCorAvatar(form.urlAvatar)
                            ? ''
                            : form.urlAvatar
                        }
                        onChange={(evento) => atualizar('urlAvatar', evento.target.value)}
                      />
                      <span className="profile-editor-error">{erros.urlAvatar}</span>
                    </div>
                    <fieldset className="avatar-color-picker">
                      <legend>Cor do avatar</legend>
                      <p>Escolha uma cor para usar as suas iniciais em vez de uma fotografia.</p>
                      <div>
                        {CORES_AVATAR.map((item) => (
                          <button
                            key={item.nome}
                            type="button"
                            aria-label={`Avatar ${item.nome}`}
                            aria-pressed={form.urlAvatar === item.url}
                            onClick={() => atualizar('urlAvatar', item.url)}
                            style={{ '--avatar-cor': item.cor }}
                          >
                            {form.urlAvatar === item.url && <Check aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div className="profile-editor-section-heading">
                      <h3>Capa do perfil</h3>
                      <p>Aparece no seu perfil e nas chamadas.</p>
                    </div>
                    <PerfilCapa
                      value={form.urlCapa}
                      className="profile-editor-cover"
                    >
                      <button
                        type="button"
                        onClick={() => capaEntrada.current?.click()}
                      >
                        <Upload />
                        Carregar imagem
                      </button>
                    </PerfilCapa>
                    <div
                      className="profile-editor-presets"
                      aria-label="Cores da capa"
                    >
                      {BANNER_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          title={p.label}
                          aria-label={`Capa ${p.label}`}
                          aria-pressed={
                            form.urlCapa === p.value ||
                            (!form.urlCapa && p.value === 'gradient-indigo')
                          }
                          onClick={() => atualizar('urlCapa', p.value)}
                        >
                          <PerfilCapa value={p.value} />
                          {(form.urlCapa === p.value ||
                            (!form.urlCapa && p.value === 'gradient-indigo')) && <Check />}
                        </button>
                      ))}
                    </div>
                    <div className="profile-editor-color">
                      <label htmlFor="edit-cover-color">Cor personalizada</label>
                      <input
                        id="edit-cover-color"
                        type="color"
                        value={/^#[\da-f]{6}$/i.test(form.urlCapa) ? form.urlCapa : '#2563eb'}
                        onChange={(evento) => atualizar('urlCapa', evento.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => atualizar('urlCapa', '')}
                      >
                        Repor capa
                      </button>
                    </div>
                    <div className="profile-editor-field">
                      <label htmlFor="edit-banner-url">Ou use um link para a capa</label>
                      <input
                        id="edit-banner-url"
                        type="url"
                        placeholder="https://exemplo.pt/capa.jpg"
                        value={/^https?:\/\//i.test(form.urlCapa) ? form.urlCapa : ''}
                        onChange={(evento) => atualizar('urlCapa', evento.target.value)}
                      />
                      <span className="profile-editor-error">{erros.urlCapa}</span>
                    </div>
                  </>
                )}
                {separador === 'socials' && (
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
                          <div
                            className="profile-editor-field"
                            key={n.key}
                          >
                            <label htmlFor={`edit-social-${n.key}`}>
                              <Icon />
                              {n.label}
                              {previsualizarLigacoes[n.key] && (
                                <Check className="profile-editor-connected" />
                              )}
                            </label>
                            <input
                              id={`edit-social-${n.key}`}
                              placeholder={n.placeholder}
                              value={redesSociais[n.key]}
                              maxLength={500}
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-invalid={Boolean(erros[n.key])}
                              aria-describedby={`edit-social-${n.key}-error`}
                              onChange={(evento) => {
                                definirRedesSociais((s) => ({
                                  ...s,
                                  [n.key]: evento.target.value,
                                }));
                                definirErros((s) => ({
                                  ...s,
                                  [n.key]: '',
                                  submit: '',
                                }));
                              }}
                            />
                            <span
                              id={`edit-social-${n.key}-error`}
                              className="profile-editor-error"
                            >
                              {erros[n.key]}
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
              <PerfilCapa
                value={form.urlCapa}
                className="profile-editor-preview-cover"
              />
              <div className="profile-editor-preview-info">
                <Avatar
                  src={form.urlAvatar}
                  name={form.name}
                  size="lg"
                />
                <h3>{form.name.trim() || 'O seu nome'}</h3>
                <span className="profile-editor-preview-username">@{utilizador?.username}</span>
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
                <LigacoesRedesSociaisPerfil
                  profile={{
                    ligacoesRedesSociais: previsualizarLigacoes,
                  }}
                  compact
                />
              </div>
            </div>
            <p>As alterações aparecem aqui antes de guardar.</p>
          </aside>
        </div>
        {erros.submit && (
          <p
            className="profile-editor-submit-error"
            role="alert"
          >
            <AlertCircle />
            {erros.submit}
          </p>
        )}
        <footer className="profile-editor-footer">
          <span>Personalize o perfil ao seu ritmo.</span>
          <div>
            <Botao
              type="button"
              variant="outline"
              onClick={onFechar}
              disabled={busy}
            >
              Cancelar
            </Botao>
            <Botao
              type="submit"
              isLoading={saving}
              disabled={Boolean(processing)}
              leftIcon={<Check />}
            >
              {processing ? 'A preparar imagem…' : 'Guardar alterações'}
            </Botao>
          </div>
        </footer>
        <input
          ref={avatarEntrada}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(evento) => carregar(evento, 'urlAvatar')}
        />
        <input
          ref={capaEntrada}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(evento) => carregar(evento, 'urlCapa')}
        />
      </form>
    </Janela>
  );
}
