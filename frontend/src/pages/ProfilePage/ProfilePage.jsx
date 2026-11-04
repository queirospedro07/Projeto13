import './ProfilePage.css';
import { useState, useEffect, useRef } from 'react';
import { PaginaEstado } from '../../components/StatusPage';
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
import { Cartao } from '../../components/Card';
import { Botao } from '../../components/Button';
import { Distintivo } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { PerfilEditor } from '../../components/ProfileEditor';
import { PerfilCapa } from '../../components/ProfileCover';
import { LigacoesRedesSociaisPerfil } from '../../components/ProfileSocialLinks';
import { obterPerfilLigacoes } from '../../utils/profileSocialLinks';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useAvisos } from '../../components/Alerts';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { formatarCategoria, formatarCargo } from '../../utils/formatting';

export const PerfilPagina = () => {
  const { username: nomeUtilizador } = useParams();
  const { user: atualUtilizador, atualizarUtilizador } = useAutenticacao();
  const { toast: aviso } = useAvisos();
  const navigate = useNavigate();
  const isMe =
    !nomeUtilizador || nomeUtilizador === 'me' || nomeUtilizador === atualUtilizador?.username;
  const [perfilUtilizador, definirPerfilUtilizador] = useState(null);
  const [carregamento, definirCarregamento] = useState(!isMe);
  const [notFound, definirNotFound] = useState(false);
  const [socialEstado, definirSocialEstado] = useState({
    isFollowing: false,
    friendshipStatus: 'NONE',
    isRequester: false,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
  });
  const [ativoSeparador, definirAtivoSeparador] = useState('courses');
  const [cursoFiltrar, definirCursoFiltrar] = useState('all');
  const [meusCursos, definirMeusCursos] = useState([]);
  const [isEditarAbrir, definirIsEditarAbrir] = useState(false);
  const [editarSeccao, definirEditarSeccao] = useState('details');
  const visibilidadeRequests = useRef(new Set());
  const [carregarErro, definirCarregarErro] = useState('');
  const [revision, definirRevision] = useState(0);
  const alternarOcultarCurso = async (cursoId, cursoTitulo = 'Curso') => {
    if (visibilidadeRequests.current.has(cursoId)) return;
    visibilidadeRequests.current.add(cursoId);
    try {
      const { data: dados } = await api.post(
        '/cursos/' + encodeURIComponent(cursoId) + '/alternar-visibilidade',
      );

      definirMeusCursos((cursos) =>
        cursos.map((inscricao) =>
          (inscricao.course?.id || inscricao.idCurso) === cursoId
            ? {
                ...inscricao,
                estaOculto: dados.estaOculto,
              }
            : inscricao,
        ),
      );
      aviso({
        title: dados.estaOculto ? 'Curso ocultado no perfil' : 'Curso visível no perfil',
        message: dados.estaOculto
          ? '"' + cursoTitulo + '" deixou de aparecer no seu perfil público.'
          : '"' + cursoTitulo + '" está visível no seu perfil público.',
        type: 'success',
      });
    } catch (erro) {
      aviso({
        title: 'Não foi possível alterar a visibilidade',
        message: erro.message,
        type: 'error',
      });
    } finally {
      visibilidadeRequests.current.delete(cursoId);
    }
  };

  useEffect(() => {
    let ativo = true;

    definirCarregamento(true);
    definirCarregarErro('');
    definirNotFound(false);
    definirMeusCursos([]);

    const carregarPerfil = async () => {
      try {
        const person = isMe
          ? atualUtilizador
          : (await api.get('/autenticacao/user/' + encodeURIComponent(nomeUtilizador))).data;
        if (!ativo) return;
        definirPerfilUtilizador(person);

        const cursos = isMe ? (await api.get('/cursos/minha-aprendizagem')).data : person?.courses;
        if (!ativo) return;
        definirMeusCursos(cursos || []);
        if (person?.id) {
          const { data: dados } = await api.get('/social/estado/' + encodeURIComponent(person.id));
          if (ativo) definirSocialEstado(dados);
        }
      } catch (erro) {
        if (!ativo) return;
        if (erro.status === 404) definirNotFound(true);
        else definirCarregarErro(erro.message || 'Não foi possível carregar o perfil.');
      } finally {
        if (ativo) definirCarregamento(false);
      }
    };

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [nomeUtilizador, atualUtilizador, isMe, revision]);

  const abrirEditarJanela = (seccao = 'details') => {
    definirEditarSeccao(typeof seccao === 'string' ? seccao : 'details');
    definirIsEditarAbrir(true);
  };

  const tratarGuardarPerfil = async (values) => {
    const resultado = await api
      .put('/autenticacao/perfil', values)
      .then(({ data: dados }) => dados);
    if (resultado?.user) definirPerfilUtilizador(resultado.user);
    await atualizarUtilizador();
    definirIsEditarAbrir(false);
    aviso({
      title: 'Perfil atualizado',
      message: 'As suas alterações foram guardadas.',
      type: 'success',
    });
  };

  const tratarAlternarFollow = async () => {
    if (!perfilUtilizador) return;
    soundEffects.play('click');
    try {
      if (socialEstado.isFollowing) {
        await api
          .post(`/social/deixar-seguir/${perfilUtilizador.id}`)
          .then(({ data: dados }) => dados);
        definirSocialEstado((p) => ({
          ...p,
          isFollowing: false,
          followersCount: Math.max(0, p.followersCount - 1),
        }));
      } else {
        await api.post(`/social/seguir/${perfilUtilizador.id}`).then(({ data: dados }) => dados);
        definirSocialEstado((p) => ({
          ...p,
          isFollowing: true,
          followersCount: p.followersCount + 1,
        }));
      }
    } catch {
      aviso({
        title: 'Erro',
        type: 'error',
      });
    }
  };

  const tratarAmigoAcao = async () => {
    if (!perfilUtilizador) return;
    soundEffects.play('click');
    try {
      if (socialEstado.friendshipStatus === 'NONE') {
        await api
          .post(`/social/amigos/pedir/${perfilUtilizador.id}`)
          .then(({ data: dados }) => dados);
        definirSocialEstado((p) => ({
          ...p,
          friendshipStatus: 'PENDING',
          isRequester: true,
        }));
        aviso({
          title: 'Pedido Enviado',
          type: 'success',
        });
      } else if (socialEstado.friendshipStatus === 'ACCEPTED') {
        await api
          .delete(`/social/amigos/remover/${perfilUtilizador.id}`)
          .then(({ data: dados }) => dados);
        definirSocialEstado((p) => ({
          ...p,
          friendshipStatus: 'NONE',
          friendsCount: Math.max(0, p.friendsCount - 1),
        }));
      }
    } catch {
      aviso({
        title: 'Erro',
        type: 'error',
      });
    }
  };

  if (carregamento) {
    return (
      <div className="profile-page-panel">
        <Loader2 className="profile-page-loader2" />
      </div>
    );
  }

  if (carregarErro)
    return (
      <PaginaEstado
        title="Não foi possível carregar o perfil"
        message={carregarErro}
        onRetry={() => definirRevision((valor) => valor + 1)}
      />
    );
  if (notFound || (!isMe && !perfilUtilizador)) {
    return (
      <div className="profile-page-panel-2">
        <Users className="profile-page-users" />
        <h2 className="profile-page-heading">Utilizador não encontrado</h2>
        <p className="profile-page-description">
          O perfil solicitado não existe ou pode ter sido alterado.
        </p>
        <Botao
          onClick={() => navigate(-1)}
          variant="secondary"
        >
          Voltar
        </Botao>
      </div>
    );
  }

  const u = isMe ? atualUtilizador : perfilUtilizador;
  const socialLigacoes = obterPerfilLigacoes(u?.profile);

  return (
    <div className="profile-page-panel-3">
      <div className="profile-page-panel-4">
        <PerfilCapa
          value={u?.profile?.urlCapa}
          className="profile-page-panel-5"
        >
          {isMe && (
            <div className="profile-page-panel-8">
              <button
                type="button"
                onClick={() => abrirEditarJanela('appearance')}
                aria-label="Alterar capa do perfil"
                className="profile-page-button"
              >
                <ImagePlus className="profile-page-image-plus" />
                <span className="profile-page-label">Alterar Banner</span>
              </button>
            </div>
          )}
        </PerfilCapa>

        <div className="profile-page-panel-9">
          <div className="profile-page-panel-10">
            <div className="profile-page-panel-11 ui-group">
              <Avatar
                src={u?.urlAvatar}
                name={u?.name}
                size="xl"
                role={u?.role}
                className="profile-page-avatar"
              />
              <span className="profile-page-label-2" />
              {isMe && (
                <button
                  onClick={() => abrirEditarJanela('appearance')}
                  className="profile-page-button-2"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="profile-page-camera" />
                </button>
              )}
            </div>

            <div className="profile-page-panel-12">
              {isMe ? (
                <Botao
                  onClick={abrirEditarJanela}
                  variant="secondary"
                  size="md"
                  leftIcon={<Edit3 className="profile-page-edit3" />}
                  className="profile-page-button-3"
                >
                  Editar Perfil
                </Botao>
              ) : (
                <>
                  <Botao
                    onClick={tratarAlternarFollow}
                    variant={socialEstado.isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    className="profile-page-button-4"
                  >
                    {socialEstado.isFollowing ? 'A Seguir' : '+ Seguir'}
                  </Botao>
                  <Botao
                    onClick={tratarAmigoAcao}
                    variant="secondary"
                    size="md"
                    leftIcon={
                      socialEstado.friendshipStatus === 'ACCEPTED' ? (
                        <UserCheck className="profile-page-user-check" />
                      ) : socialEstado.friendshipStatus === 'PENDING' ? (
                        <Clock className="profile-page-clock" />
                      ) : (
                        <UserPlus className="profile-page-edit3" />
                      )
                    }
                    className="profile-page-button-4"
                  >
                    {socialEstado.friendshipStatus === 'ACCEPTED'
                      ? 'Amigos'
                      : socialEstado.friendshipStatus === 'PENDING'
                        ? 'Pendente'
                        : 'Adicionar'}
                  </Botao>
                  <Botao
                    onClick={() =>
                      navigate(`/mensagens?idUtilizador=${u.id}`, {
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
                  </Botao>
                </>
              )}
            </div>
          </div>

          <div className="profile-page-panel-13">
            <h1 className="profile-page-title">{u?.name}</h1>
            <span className="profile-page-label-3">@{u?.username}</span>
            <Distintivo
              variant="brand"
              size="sm"
            >
              {formatarCargo(u?.role)}
            </Distintivo>
          </div>

          {u?.profile?.headline && (
            <p className="profile-page-description-2">{u.profile.headline}</p>
          )}

          {u?.bio && (isMe || u?.profile?.mostrarBiografia !== false) && (
            <p className="profile-page-description-3">{u.bio}</p>
          )}

          {u?.location && (isMe || ![false, 0].includes(u?.profile?.mostrarLocalizacao)) && (
            <div className="profile-page-panel-14">
              <span className="profile-page-label-4">
                <MapPin className="profile-page-map-pin" />
                {u.location}
              </span>
            </div>
          )}
          {socialLigacoes.length > 0 &&
            (isMe || ![false, 0].includes(u?.profile?.mostrarRedesSociais)) && (
              <LigacoesRedesSociaisPerfil profile={u?.profile} />
            )}
          <div className="profile-page-panel-15">
            <button
              onClick={() => definirAtivoSeparador('friends')}
              className="profile-page-button-5"
            >
              <Users className="profile-page-users-2" />
              <span className="profile-page-label-5">{socialEstado.friendsCount || 0}</span> Amigos
            </button>
            <button
              onClick={() => definirAtivoSeparador('friends')}
              className="profile-page-button-6"
            >
              <span className="profile-page-label-5">{socialEstado.followersCount || 0}</span>{' '}
              Seguidores
            </button>
            <button
              onClick={() => definirAtivoSeparador('friends')}
              className="profile-page-button-6"
            >
              <span className="profile-page-label-5">{socialEstado.followingCount || 0}</span> A
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
        ].map((separador) => (
          <button
            key={separador.id}
            onClick={() => {
              soundEffects.play('click');
              definirAtivoSeparador(separador.id);
            }}
            className={`profile-page-button-7 ${ativoSeparador === separador.id ? 'profile-page-button-8' : 'profile-page-button-9'}`}
          >
            <separador.icon className="profile-page-edit3" />
            {separador.label}
          </button>
        ))}
      </div>

      {ativoSeparador === 'courses' &&
        (() => {
          const isCursoOculto = (evento) => {
            return Boolean(evento.estaOculto);
          };

          const totalCursos = !isMe && u?.profile?.mostrarCursos === false ? 0 : meusCursos.length;
          const ocultoCursosListar = meusCursos.filter(isCursoOculto);
          const visibleCursosListar = meusCursos.filter((evento) => !isCursoOculto(evento));
          const ocultoContar = ocultoCursosListar.length;
          const visibleContar = visibleCursosListar.length;
          let displayCursos = meusCursos;
          if (!isMe) {
            displayCursos = u?.profile?.mostrarCursos === false ? [] : visibleCursosListar;
          } else if (cursoFiltrar === 'visible') {
            displayCursos = visibleCursosListar;
          } else if (cursoFiltrar === 'hidden') {
            displayCursos = ocultoCursosListar;
          }

          return (
            <div className="profile-page-panel-17">
              <div className="profile-page-panel-18">
                <div>
                  <h3 className="profile-page-subheading">
                    Cursos Inscritos ({isMe ? totalCursos : displayCursos.length})
                  </h3>
                  {isMe && (
                    <p className="profile-page-description-4">
                      Gira a visibilidade das suas formações para terceiros no seu perfil público.
                    </p>
                  )}
                </div>

                {isMe && totalCursos > 0 && (
                  <div className="profile-page-panel-19">
                    <button
                      onClick={() => definirCursoFiltrar('all')}
                      className={`profile-page-button-10 ${cursoFiltrar === 'all' ? 'profile-page-button-11' : 'profile-page-button-12'}`}
                    >
                      Todos ({totalCursos})
                    </button>
                    <button
                      onClick={() => definirCursoFiltrar('visible')}
                      className={`profile-page-button-10 ${cursoFiltrar === 'visible' ? 'profile-page-button-11' : 'profile-page-button-12'}`}
                    >
                      Visíveis ({visibleContar})
                    </button>
                    <button
                      onClick={() => definirCursoFiltrar('hidden')}
                      className={`profile-page-button-14 ${cursoFiltrar === 'hidden' ? 'profile-page-button-16' : 'profile-page-button-12'}`}
                    >
                      <EyeOff className="profile-page-image-plus" />
                      <span>Ocultados para Outros ({ocultoContar})</span>
                    </button>
                  </div>
                )}
              </div>

              {isMe && cursoFiltrar === 'hidden' && ocultoContar > 0 && (
                <div className="profile-page-panel-20">
                  <EyeOff className="profile-page-eye-off" />
                  <span>
                    Estes cursos estão ocultados para outros utilizadores que visitem o seu perfil
                    público. Apenas você consegue visualizá-los aqui.
                  </span>
                </div>
              )}

              {displayCursos.length === 0 ? (
                <Cartao className="profile-page-card">
                  {cursoFiltrar === 'hidden' ? (
                    <>
                      <Eye className="profile-page-eye" />
                      <p className="profile-page-description-5">Não tem cursos ocultados</p>
                      <p className="profile-page-description-6">
                        Todos os seus cursos inscritos estão visíveis publicamente no seu perfil.
                      </p>
                      <button
                        onClick={() => definirCursoFiltrar('all')}
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
                        <Link to="/explorar">
                          <Botao
                            as="span"
                            variant="primary"
                            size="sm"
                            className="profile-page-button-18"
                          >
                            Explorar Catálogo
                          </Botao>
                        </Link>
                      )}
                    </>
                  )}
                </Cartao>
              ) : (
                <div className="profile-page-panel-21">
                  {displayCursos.map((evento) => {
                    const cursoId = evento.course?.id || evento.idCurso;
                    const isOculto = isCursoOculto(evento);
                    const isFinished = (evento.percentagemProgresso || 0) >= 100;

                    return (
                      <Cartao
                        key={evento.id || cursoId}
                        hover
                        className="profile-page-card-2"
                      >
                        <div className="profile-page-panel-22">
                          <div className="profile-page-panel-23">
                            <img
                              src={evento.course?.urlMiniatura || '/images/curso-sem-capa.svg'}
                              alt={evento.course?.title}
                              className="profile-page-image-2"
                            />
                            {isMe && isOculto && (
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
                                (isOculto ? (
                                  <span className="profile-page-label-6">
                                    <EyeOff className="profile-page-eye-off-2" /> Ocultado para
                                    terceiros
                                  </span>
                                ) : (
                                  <span className="profile-page-label-7">
                                    <Eye className="profile-page-eye-off-2" /> Visível no perfil
                                  </span>
                                ))}
                              {evento.course?.category && (
                                <span className="profile-page-label-8">
                                  {formatarCategoria(evento.course.category)}
                                </span>
                              )}
                            </div>

                            <h4 className="profile-page-caption">{evento.course?.title}</h4>

                            <div className="profile-page-panel-27">
                              <div
                                className={[
                                  `profile-page-panel-28 ${isFinished ? 'profile-page-panel-29' : 'profile-page-panel-30'}`,
                                  'profile-page-dynamic-1',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={{
                                  '--profile-page-width': `${Math.round(evento.percentagemProgresso || 0)}%`,
                                }}
                              />
                            </div>

                            <div className="profile-page-panel-31">
                              <span>{Math.round(evento.percentagemProgresso || 0)}% concluído</span>
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
                                alternarOcultarCurso(cursoId, evento.course?.title);
                              }}
                              className={`profile-page-button-19 ${isOculto ? 'profile-page-button-20' : 'profile-page-button-21'}`}
                              title={
                                isOculto
                                  ? 'Tornar este curso visível no seu perfil público'
                                  : 'Ocultar este curso para outros utilizadores'
                              }
                            >
                              {isOculto ? (
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
                            to={`/aprender/${cursoId}`}
                            className="profile-page-link-4"
                          >
                            <Botao
                              as="span"
                              variant="primary"
                              size="sm"
                              className="profile-page-button-22"
                            >
                              Aceder
                            </Botao>
                          </Link>
                        </div>
                      </Cartao>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      {ativoSeparador === 'friends' && (
        <Cartao className="profile-page-card-3">
          <Users className="profile-page-users-3" />
          <p className="profile-page-description-7">Hub de Mensagens & Amigos</p>
          <p className="profile-page-description-8">
            Gere amizades, seguidores e conversas diretas no hub de mensagens.
          </p>
          <Link to="/mensagens">
            <Botao
              as="span"
              variant="primary"
              size="md"
              leftIcon={<MessageSquare className="profile-page-edit3" />}
            >
              Abrir Mensagens
            </Botao>
          </Link>
        </Cartao>
      )}

      {isEditarAbrir && (
        <PerfilEditor
          initialTab={editarSeccao}
          user={atualUtilizador}
          onClose={() => definirIsEditarAbrir(false)}
          onSave={tratarGuardarPerfil}
        />
      )}
    </div>
  );
};

export default PerfilPagina;
