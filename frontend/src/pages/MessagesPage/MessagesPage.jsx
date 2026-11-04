import { Janela } from '../../components/Dialog';
import { lerJsonCompativel } from '../../utils/fieldCompatibility.js';
import './MessagesPage.css';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LuMessageSquare as MessageSquare,
  LuUsers as Users,
  LuSearch as Search,
  LuPlus as Plus,
  LuSend as Send,
  LuVideo as Video,
  LuX as X,
  LuUserPlus as UserPlus,
  LuArrowLeft as ArrowLeft,
  LuPin as Pin,
  LuCheck as Check,
  LuCheckCheck as CheckCheck,
} from 'react-icons/lu';
import { Avatar } from '../../components/Avatar';
import { Botao } from '../../components/Button';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useAvisos } from '../../components/Alerts';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { ChamadaPalco } from '../../components/CallStage';
import { AmigosGestor } from '../../components/FriendsManager';

export const MensagensPagina = () => {
  const { user: utilizador } = useAutenticacao();
  const { socket, onlineUsers: onlineUtilizadores } = useSocket();
  const { toast: aviso } = useAvisos();
  const [pesquisarParametros, definirPesquisarParametros] = useSearchParams();
  const parametroParticipanteAtual = useRef(pesquisarParametros.get('idUtilizador'));

  parametroParticipanteAtual.current = pesquisarParametros.get('idUtilizador');

  const localizacao = useLocation();
  const navigate = useNavigate();
  const inicialSeparador =
    pesquisarParametros.get('tab') === 'friends' || pesquisarParametros.get('tab') === 'add'
      ? 'friends'
      : 'chat';
  const inicialSubSeparador = pesquisarParametros.get('tab') === 'add' ? 'add' : 'all';
  const [principalSeparador, definirPrincipalSeparador] = useState(inicialSeparador);
  const [amigosSubSeparador, definirAmigosSubSeparador] = useState(inicialSubSeparador);
  const [amigosDados, definirAmigosDados] = useState({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [adicionarAmigoConsultar, definirAdicionarAmigoConsultar] = useState('');
  const [pesquisarResultado, definirPesquisarResultado] = useState(null);
  const [requestSent, definirRequestSent] = useState(false);
  const [conversas, definirConversas] = useState([]);
  const [ativoParticipante, definirAtivoParticipante] = useState(localizacao.state?.peer || null);
  const [mensagens, definirMensagens] = useState([]);
  const [aEnviar, definirAEnviar] = useState(false);
  const envioEmCurso = useRef(false);
  const participanteAtual = useRef(ativoParticipante?.id);

  participanteAtual.current = ativoParticipante?.id;

  const [novaConversaCarregamento, definirNovaConversaCarregamento] = useState(false);
  const [novaConversaErro, definirNovaConversaErro] = useState('');
  const [draft, definirDraft] = useState('');
  const [pesquisarConsultar, definirPesquisarConsultar] = useState('');
  const [pesquisarResultados, definirPesquisarResultados] = useState([]);
  const [isSearchingUtilizadores, definirIsSearchingUtilizadores] = useState(false);
  const [isChamadaAbrir, definirIsChamadaAbrir] = useState(false);
  const [isNovoConversaJanelaAbrir, definirIsNovoConversaJanelaAbrir] = useState(false);
  const [novoConversaPesquisar, definirNovoConversaPesquisar] = useState('');
  const [novoConversaResultados, definirNovoConversaResultados] = useState([]);

  // Pinned Peers State
  const [afixadoParticipanteIds, definirAfixadoParticipanteIds] = useState(() => {
    try {
      return lerJsonCompativel(localStorage.getItem(`nexo_pinned_peers_${utilizador?.id}`) || '[]');
    } catch {
      return [];
    }
  });
  const [apenasMostrarAfixado, definirApenasMostrarAfixado] = useState(() => {
    return localStorage.getItem(`nexo_only_pinned_${utilizador?.id}`) === 'true';
  });

  // Read receipts preference
  const [mostrarLerReceipts, definirMostrarLerReceipts] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(`nexo_read_receipts_${utilizador?.id}`) !== 'false'
      : true;
  });

  useEffect(() => {
    if (!utilizador?.id) return;
    try {
      definirAfixadoParticipanteIds(
        lerJsonCompativel(localStorage.getItem(`nexo_pinned_peers_${utilizador.id}`) || '[]'),
      );
    } catch {
      definirAfixadoParticipanteIds([]);
    }

    definirApenasMostrarAfixado(
      localStorage.getItem(`nexo_only_pinned_${utilizador.id}`) === 'true',
    );
    definirMostrarLerReceipts(
      localStorage.getItem(`nexo_read_receipts_${utilizador.id}`) !== 'false',
    );
  }, [utilizador?.id]);

  const mensagensTerminarRef = useRef(null);
  const deslocarToInferior = () => {
    mensagensTerminarRef.current?.scrollIntoView?.({
      behavior: 'smooth',
    });
  };

  const isUtilizadorOnline = (id) =>
    Boolean(
      id &&
      (typeof onlineUtilizadores?.has === 'function'
        ? onlineUtilizadores.has(id)
        : Array.isArray(onlineUtilizadores) &&
          onlineUtilizadores.some(
            (u) => String(typeof u === 'string' ? u : u?.idUtilizador || u?.id) === String(id),
          )),
    );
  const alternarAfixarParticipante = (participanteId, evento) => {
    if (evento) evento.stopPropagation();
    definirAfixadoParticipanteIds((anterior) => {
      const isAfixado = anterior.includes(participanteId);
      const seguinte = isAfixado
        ? anterior.filter((id) => id !== participanteId)
        : [participanteId, ...anterior];
      if (utilizador?.id) {
        localStorage.setItem(`nexo_pinned_peers_${utilizador.id}`, JSON.stringify(seguinte));
        window.dispatchEvent(new Event('nexo_pins_changed'));
      }

      aviso({
        title: isAfixado ? 'Contacto Desafixado' : 'Contacto Afixado',
        message: isAfixado
          ? 'O contacto foi removido dos seus afixados.'
          : 'O contacto foi afixado no topo da lista de mensagens.',
        type: 'info',
      });

      return seguinte;
    });
  };

  const alternarApenasMostrarAfixado = () => {
    definirApenasMostrarAfixado((anterior) => {
      const seguinte = !anterior;
      if (utilizador?.id) {
        localStorage.setItem(`nexo_only_pinned_${utilizador.id}`, String(seguinte));
      }

      return seguinte;
    });
  };

  const carregarConversas = async () => {
    try {
      const dados = await api.get('/social/dm/conversas').then(({ data: dados2 }) => dados2);
      const listar = dados || [];

      definirConversas(listar);

      const destinoUtilizadorId = pesquisarParametros.get('idUtilizador');
      if (destinoUtilizadorId !== parametroParticipanteAtual.current) return;
      if (destinoUtilizadorId) {
        definirPrincipalSeparador('chat');

        const found = listar.find((c) => c.peer?.id === destinoUtilizadorId);
        if (found) {
          definirAtivoParticipante(found.peer);
        } else if (localizacao.state?.peer && localizacao.state.peer.id === destinoUtilizadorId) {
          definirAtivoParticipante(localizacao.state.peer);
        } else {
          api
            .get(`/social/dm/mensagens/${destinoUtilizadorId}`)
            .then(({ data: dados2 }) => dados2)
            .then((resposta) => {
              if (resposta?.peer && parametroParticipanteAtual.current === destinoUtilizadorId) {
                definirAtivoParticipante(resposta.peer);
              }
            })
            .catch(() => {});
        }
      } else if (!ativoParticipante && listar.length > 0 && principalSeparador === 'chat') {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          definirAtivoParticipante(listar[0].peer);
        }
      }
    } catch {}
  };

  const carregarAmigosDados = async () => {
    try {
      const dados = await api.get('/social/amigos').then(({ data: dados2 }) => dados2);

      definirAmigosDados(
        dados || {
          friends: [],
          incoming: [],
          outgoing: [],
        },
      );
    } catch {}
  };

  useEffect(() => {
    carregarConversas();
    carregarAmigosDados();
  }, [utilizador?.id, pesquisarParametros]);
  useEffect(() => {
    const separadorParametro = pesquisarParametros.get('tab');
    if (separadorParametro === 'friends') {
      definirPrincipalSeparador('friends');
      definirAmigosSubSeparador('all');
    } else if (separadorParametro === 'add') {
      definirPrincipalSeparador('friends');
      definirAmigosSubSeparador('add');
    } else {
      definirPrincipalSeparador('chat');
    }
  }, [pesquisarParametros]);
  useEffect(() => {
    definirMensagens([]);
    if (!ativoParticipante?.id) return undefined;
    const controlador = new AbortController();
    const id = ativoParticipante.id;

    api
      .get(`/social/dm/mensagens/${id}`, { signal: controlador.signal })
      .then(({ data }) => {
        if (controlador.signal.aborted || participanteAtual.current !== id) return;
        definirMensagens((atuais) => [
          ...new Map([...(data.messages || []), ...atuais].map((item) => [item.id, item])).values(),
        ]);
      })
      .catch((erro) => {
        if (!controlador.signal.aborted)
          aviso({
            title: 'Não foi possível carregar a conversa',
            message: erro.message,
            type: 'error',
          });
      });
    definirConversas((atuais) =>
      atuais.map((c) => (c.peer?.id === id ? { ...c, unreadCount: 0 } : c)),
    );

    return () => controlador.abort();
  }, [ativoParticipante?.id, aviso]);
  useEffect(() => {
    deslocarToInferior();
  }, [mensagens.length]);
  useEffect(() => {
    if (!socket) return;
    const tratarMensagemDireta = (msg) => {
      const destinoId = msg.idDestinatarioMensagem || msg.recipientId;
      const isFromAtivo = msg.idRemetente === ativoParticipante?.id && destinoId === utilizador?.id;
      const isToAtivo = msg.idRemetente === utilizador?.id && destinoId === ativoParticipante?.id;
      if (isFromAtivo || isToAtivo) {
        definirMensagens((anterior) => {
          if (anterior.some((m) => m.id === msg.id)) return anterior;
          const optIdx = anterior.findIndex(
            (m) =>
              isToAtivo &&
              m.id?.startsWith('temp-') &&
              m.content === msg.content &&
              m.idRemetente === msg.idRemetente &&
              m.idDestinatarioMensagem === destinoId,
          );
          if (optIdx !== -1) {
            const seguinte = [...anterior];

            seguinte[optIdx] = msg;

            return seguinte;
          }

          return [...anterior, msg];
        });
        if (isFromAtivo) {
          soundEffects.reproduzirMensagem();
        }
      }

      carregarConversas();
    };

    socket.on('direct-message', tratarMensagemDireta);

    const tratarChamadaRejeitado = ({ rejector }) => {
      aviso({
        title: 'Chamada Recusada',
        message: `${rejector?.name || 'O utilizador'} recusou a chamada.`,
        type: 'info',
      });
      definirIsChamadaAbrir(false);
    };

    socket.on('direct-call-rejeitado', tratarChamadaRejeitado);

    return () => {
      socket.off('direct-message', tratarMensagemDireta);
      socket.off('direct-call-rejeitado', tratarChamadaRejeitado);
    };
  }, [socket, ativoParticipante?.id, utilizador?.id, aviso]);
  useEffect(() => {
    if (!pesquisarConsultar.trim()) {
      definirPesquisarResultados([]);
      definirIsSearchingUtilizadores(false);

      return;
    }

    const clean = pesquisarConsultar.replace(/^@/, '').trim().toLowerCase();

    definirIsSearchingUtilizadores(true);

    const timer = setTimeout(() => {
      api
        .get(
          `/social/utilizadores/pesquisar?query=${encodeURIComponent(clean === undefined ? '' : clean)}`,
        )
        .then(({ data: dados }) => dados)
        .then((utilizadores) => {
          const filtered = (utilizadores || []).filter((u) => u.id !== utilizador?.id);

          definirPesquisarResultados(filtered);
        })
        .catch(() => definirPesquisarResultados([]))
        .finally(() => definirIsSearchingUtilizadores(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [pesquisarConsultar, utilizador?.id]);
  useEffect(() => {
    const termo = novoConversaPesquisar.trim().replace(/^@/, '');
    if (!isNovoConversaJanelaAbrir || !termo) {
      definirNovoConversaResultados([]);
      definirNovaConversaCarregamento(false);
      definirNovaConversaErro('');

      return undefined;
    }

    const controlador = new AbortController();

    definirNovaConversaCarregamento(true);
    definirNovaConversaErro('');

    const timer = setTimeout(() => {
      api
        .get(`/social/utilizadores/pesquisar?query=${encodeURIComponent(termo)}`, {
          signal: controlador.signal,
        })
        .then(({ data }) => {
          if (!controlador.signal.aborted)
            definirNovoConversaResultados((data || []).filter((u) => u.id !== utilizador?.id));
        })
        .catch((erro) => {
          if (!controlador.signal.aborted)
            definirNovaConversaErro(erro.message || 'Não foi possível pesquisar.');
        })
        .finally(() => {
          if (!controlador.signal.aborted) definirNovaConversaCarregamento(false);
        });
    }, 200);

    return () => {
      controlador.abort();
      clearTimeout(timer);
    };
  }, [novoConversaPesquisar, isNovoConversaJanelaAbrir, utilizador?.id]);

  const tratarEnviarMensagem = async (evento) => {
    evento.preventDefault();
    if (!draft.trim() || !ativoParticipante || envioEmCurso.current) return;
    envioEmCurso.current = true;
    definirAEnviar(true);

    const destinatarioId = ativoParticipante.id;
    const conteudo = draft.trim();
    const tempId = `temp-dm-${Date.now()}`;
    const optimistic = {
      id: tempId,
      idRemetente: utilizador?.id,
      idDestinatarioMensagem: destinatarioId,
      content: conteudo,
      estaLida: false,
      criadoEm: new Date().toISOString(),
      sender: utilizador,
    };

    definirDraft('');
    definirMensagens((anterior) => [...anterior, optimistic]);
    soundEffects.reproduzirMensagem();
    try {
      const resposta = await api
        .post('/social/dm/enviar', {
          idDestinatarioMensagem: destinatarioId,
          content: conteudo,
        })
        .then(({ data: dados }) => dados);

      if (participanteAtual.current === destinatarioId)
        definirMensagens((anteriores) => [
          ...new Map(
            anteriores
              .map((m) => (m.id === tempId ? resposta : m))
              .concat(resposta)
              .map((m) => [m.id, m]),
          ).values(),
        ]);
      carregarConversas();
    } catch (erro) {
      if (participanteAtual.current === destinatarioId) {
        definirMensagens((anterior) => anterior.filter((m) => m.id !== tempId));
        definirDraft((atual) => atual || conteudo);
      }

      aviso({
        title: 'Erro ao enviar',
        message: erro.message || 'Não foi possível enviar a mensagem.',
        type: 'error',
      });
    } finally {
      envioEmCurso.current = false;
      definirAEnviar(false);
    }
  };

  const tratarSelecionarParticipante = (participante) => {
    soundEffects.play('click');
    definirIsChamadaAbrir(false);
    definirAtivoParticipante(participante);
    definirPrincipalSeparador('chat');
    definirIsNovoConversaJanelaAbrir(false);
    definirPesquisarConsultar('');
    definirPesquisarParametros({
      idUtilizador: participante.id,
    });
    definirConversas((anterior) => {
      const exists = anterior.some((c) => c.peer?.id === participante.id);
      if (!exists) {
        return [
          {
            peer: participante,
            lastMessage: null,
            unreadCount: 0,
          },
          ...anterior,
        ];
      }

      return anterior.map((c) =>
        c.peer?.id === participante.id
          ? {
              ...c,
              unreadCount: 0,
            }
          : c,
      );
    });
  };

  const tratarPesquisarAndAdicionarAmigo = async (evento) => {
    evento.preventDefault();
    if (!adicionarAmigoConsultar.trim()) return;
    const clean = adicionarAmigoConsultar.replace(/^@/, '').trim().toLowerCase();
    try {
      const utilizadores = await api
        .get(
          `/social/utilizadores/pesquisar?query=${encodeURIComponent(clean === undefined ? '' : clean)}`,
        )
        .then(({ data: dados }) => dados);
      const exact = (utilizadores || []).find(
        (u) => u.username?.toLowerCase() === clean && u.id !== utilizador?.id,
      );
      if (exact) {
        definirPesquisarResultado(exact);
        definirRequestSent(false);
      } else {
        const first = (utilizadores || []).find((u) => u.id !== utilizador?.id);
        if (first) {
          definirPesquisarResultado(first);
          definirRequestSent(false);
        } else {
          definirPesquisarResultado(null);
          aviso({
            title: 'Não encontrado',
            message: 'Nenhum utilizador encontrado com esse nome.',
            type: 'error',
          });
        }
      }
    } catch {
      aviso({
        title: 'Erro',
        message: 'Falha ao pesquisar utilizador.',
        type: 'error',
      });
    }
  };

  const tratarEnviarAmigoRequest = async (destinoUtilizadorId) => {
    try {
      await api
        .post(`/social/amigos/pedir/${destinoUtilizadorId}`)
        .then(({ data: dados }) => dados);
      definirRequestSent(true);
      aviso({
        title: 'Pedido Enviado',
        message: 'Pedido de amizade enviado com sucesso!',
        type: 'success',
      });
      carregarAmigosDados();
    } catch (erro) {
      aviso({
        title: 'Aviso',
        message: erro.message || 'Não foi possível enviar o pedido.',
        type: 'error',
      });
    }
  };

  const tratarAceitarAmigoRequest = async (amizadeId) => {
    try {
      await api.post(`/social/amigos/aceitar/${amizadeId}`).then(({ data: dados }) => dados);
      aviso({
        title: 'Amizade Aceite',
        message: 'Agora são amigos e podem conversar livremente!',
        type: 'success',
      });
      carregarAmigosDados();
      carregarConversas();
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao aceitar pedido.',
        type: 'error',
      });
    }
  };

  const tratarRejeitarAmigoRequest = async (amizadeId) => {
    try {
      await api.post(`/social/amigos/rejeitar/${amizadeId}`).then(({ data: dados }) => dados);
      aviso({
        title: 'Pedido Recusado',
        type: 'info',
      });
      carregarAmigosDados();
    } catch {}
  };

  const tratarRemoverAmigo = async (destinoUtilizadorId) => {
    try {
      await api
        .delete(`/social/amigos/remover/${destinoUtilizadorId}`)
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Amigo Removido',
        type: 'info',
      });
      carregarAmigosDados();
    } catch {}
  };

  // Ordena as conversas, colocando primeiro as que estão afixadas.
  const filteredConversas = conversas
    .filter((c) => {
      const matchesPesquisar =
        c.peer?.name?.toLowerCase().includes(pesquisarConsultar.toLowerCase()) ||
        c.peer?.username?.toLowerCase().includes(pesquisarConsultar.toLowerCase());
      if (!matchesPesquisar) return false;
      if (apenasMostrarAfixado) {
        return afixadoParticipanteIds.includes(c.peer?.id);
      }

      return true;
    })
    .sort((a, b) => {
      const aAfixado = afixadoParticipanteIds.includes(a.peer?.id);
      const bAfixado = afixadoParticipanteIds.includes(b.peer?.id);
      if (aAfixado && !bAfixado) return -1;
      if (!aAfixado && bAfixado) return 1;
      const tA = new Date(a.lastMessage?.criadoEm || 0).getTime();
      const tB = new Date(b.lastMessage?.criadoEm || 0).getTime();

      return tB - tA;
    });

  return (
    <div className="messages-page-panel">
      {/* SIDEBAR (CONVERSATIONS / FRIENDS) */}
      <aside
        className={`messages-page-sidebar ${principalSeparador === 'friends' || (principalSeparador === 'chat' && ativoParticipante) ? 'messages-page-sidebar-2' : 'messages-page-sidebar-3'}`}
      >
        {/* Header Tabs */}
        <div className="messages-page-panel-2">
          <div className="messages-page-panel-3">
            <button
              onClick={() => {
                soundEffects.play('click');
                definirPrincipalSeparador('chat');
                definirPesquisarParametros({});
              }}
              className={`messages-page-button ${principalSeparador === 'chat' ? 'messages-page-button-2' : 'messages-page-button-3'}`}
            >
              <MessageSquare className="messages-page-message-square" />
              <span>Conversas</span>
            </button>
            <button
              onClick={() => {
                soundEffects.play('click');
                definirPrincipalSeparador('friends');
                definirPesquisarParametros({
                  tab: 'friends',
                });
              }}
              className={`messages-page-button-4 ${principalSeparador === 'friends' ? 'messages-page-button-2' : 'messages-page-button-3'}`}
            >
              <Users className="messages-page-message-square" />
              <span>Amigos</span>
              {amigosDados?.incoming?.length > 0 && <span className="messages-page-label" />}
            </button>
          </div>

          <button
            onClick={() => {
              soundEffects.play('click');
              definirIsNovoConversaJanelaAbrir(true);
            }}
            className="messages-page-button-5"
            title="Nova conversa"
          >
            <Plus className="messages-page-plus" />
          </button>
        </div>

        {/* Search & Pinned Toggle Bar */}
        <div className="messages-page-panel-4">
          <div className="messages-page-panel-5">
            <Search className="messages-page-search" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={pesquisarConsultar}
              onChange={(evento) => definirPesquisarConsultar(evento.target.value)}
              className="messages-page-field"
            />
            {pesquisarConsultar && (
              <button
                onClick={() => definirPesquisarConsultar('')}
                className="messages-page-button-6"
              >
                <X className="messages-page-x" />
              </button>
            )}
          </div>

          {/* Toggle "Apenas Afixados" */}
          <button
            onClick={alternarApenasMostrarAfixado}
            className={`messages-page-button-7 ${apenasMostrarAfixado ? 'messages-page-button-8' : 'messages-page-button-9'}`}
            title={
              apenasMostrarAfixado
                ? 'A mostrar apenas contactos afixados'
                : 'Filtrar apenas afixados'
            }
          >
            <Pin className="messages-page-message-square" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="messages-page-panel-6 custom-scrollbar">
          {pesquisarConsultar.trim() ? (
            <div>
              <p className="messages-page-description">Resultados ({pesquisarResultados.length})</p>
              {pesquisarResultados.length === 0 ? (
                <p className="messages-page-description-2">
                  {isSearchingUtilizadores ? 'A pesquisar...' : 'Nenhum utilizador encontrado.'}
                </p>
              ) : (
                pesquisarResultados.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => tratarSelecionarParticipante(u)}
                    className="messages-page-panel-7 ui-group"
                  >
                    <div className="messages-page-panel-8">
                      <Avatar
                        shape="square"
                        src={u.urlAvatar}
                        name={u.name}
                        size="sm"
                        className="messages-page-avatar"
                      />
                      <div className="messages-page-panel-9">
                        <p className="messages-page-description-3">{u.name}</p>
                        <p className="messages-page-description-4">@{u.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={(evento) => alternarAfixarParticipante(u.id, evento)}
                      className="messages-page-button-10"
                      title={
                        afixadoParticipanteIds.includes(u.id) ? 'Desafixar' : 'Afixar contacto'
                      }
                    >
                      {afixadoParticipanteIds.includes(u.id) ? (
                        <Pin className="messages-page-pin" />
                      ) : (
                        <Pin className="messages-page-message-square" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : filteredConversas.length === 0 ? (
            <div className="messages-page-panel-10">
              <p>{apenasMostrarAfixado ? 'Nenhum contacto afixado.' : 'Sem conversas ativas.'}</p>
              <div className="messages-page-panel-11">
                {apenasMostrarAfixado ? (
                  <button
                    onClick={() => definirApenasMostrarAfixado(false)}
                    className="messages-page-button-11"
                  >
                    Mostrar todas as conversas
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => definirIsNovoConversaJanelaAbrir(true)}
                      className="messages-page-button-11"
                    >
                      Iniciar Conversa
                    </button>
                    <button
                      onClick={() => {
                        definirPrincipalSeparador('friends');
                        definirAmigosSubSeparador('add');
                      }}
                      className="messages-page-button-12"
                    >
                      <UserPlus className="messages-page-x" />
                      <span>Adicionar Amigos</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            filteredConversas.map((c) => {
              const isSelecionado =
                c.peer?.id === ativoParticipante?.id &&
                principalSeparador === 'chat' &&
                !isChamadaAbrir;
              const isAfixado = afixadoParticipanteIds.includes(c.peer?.id);

              return (
                <div
                  key={c.peer.id}
                  onClick={() => tratarSelecionarParticipante(c.peer)}
                  className={`messages-page-panel-12 ui-group ${isSelecionado ? 'messages-page-panel-13' : 'messages-page-panel-14'}`}
                >
                  <div className="messages-page-panel-15">
                    <Avatar
                      shape="square"
                      src={c.peer.urlAvatar}
                      name={c.peer.name}
                      size="md"
                      className="messages-page-avatar-2"
                    />
                    <span
                      className={`messages-page-label-2 ${isUtilizadorOnline(c.peer?.id) ? 'messages-page-label-4' : 'messages-page-label-5'} messages-page-label-3`}
                    />
                    {isAfixado && (
                      <span className="messages-page-label-6">
                        <Pin className="messages-page-pin-2" />
                      </span>
                    )}
                  </div>

                  <div className="messages-page-panel-9">
                    <div className="messages-page-panel-16">
                      <span className="messages-page-label-7">
                        <span>{c.peer.name}</span>
                      </span>
                      {c.lastMessage?.criadoEm && (
                        <span
                          className={`messages-page-label-8 ${isSelecionado ? 'messages-page-label-9' : 'messages-page-label-10'}`}
                        >
                          {new Date(c.lastMessage.criadoEm).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`messages-page-description-5 ${isSelecionado ? 'messages-page-description-6' : 'messages-page-description-7'}`}
                    >
                      {c.lastMessage?.content || `@${c.peer.username}`}
                    </p>
                  </div>

                  {/* Pin action button on hover */}
                  <button
                    type="button"
                    onClick={(evento) => alternarAfixarParticipante(c.peer.id, evento)}
                    className={`messages-page-button-13 ${isAfixado ? 'messages-page-button-14' : 'messages-page-button-15'}`}
                    title={isAfixado ? 'Desafixar contacto' : 'Afixar contacto'}
                  >
                    <Pin
                      className={`messages-page-message-square ${isAfixado ? 'messages-page-pin-3' : ''}`}
                    />
                  </button>

                  {/* Mostra a contagem apenas quando existem mensagens por ler. */}
                  {c.unreadCount > 0 && (
                    <span className="messages-page-label-11">{c.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CONTENT (CHAT / FRIENDS / CALL) */}
      <main
        className={`messages-page-main ${principalSeparador === 'chat' && !ativoParticipante ? 'messages-page-sidebar-2' : 'messages-page-sidebar-3'}`}
      >
        {principalSeparador === 'friends' ? (
          <div className="messages-page-panel-17">
            <div className="messages-page-panel-18">
              <button
                onClick={() => {
                  definirPrincipalSeparador('chat');
                  definirPesquisarParametros({});
                }}
                className="messages-page-button-16"
              >
                <ArrowLeft className="messages-page-plus" />
                <span>Voltar às conversas</span>
              </button>
            </div>
            <AmigosGestor
              friendsSubTab={amigosSubSeparador}
              onSetFriendsSubTab={definirAmigosSubSeparador}
              friendsData={amigosDados}
              addFriendQuery={adicionarAmigoConsultar}
              onAddFriendQueryChange={definirAdicionarAmigoConsultar}
              onSearchAndAddFriend={tratarPesquisarAndAdicionarAmigo}
              searchResult={pesquisarResultado}
              requestSent={requestSent}
              onSendFriendRequest={tratarEnviarAmigoRequest}
              onAcceptRequest={tratarAceitarAmigoRequest}
              onRejectRequest={tratarRejeitarAmigoRequest}
              onRemoveFriend={tratarRemoverAmigo}
              onOpenConversationWithUser={(participante) => {
                tratarSelecionarParticipante(participante);
                navigate(`/mensagens?idUtilizador=${participante.id}`, {
                  replace: true,
                });
              }}
            />
          </div>
        ) : ativoParticipante ? (
          isChamadaAbrir ? (
            <ChamadaPalco
              key={`call_dm_${[utilizador?.id || 'me', ativoParticipante.id].sort().join('_')}`}
              roomName={`Chamada com ${ativoParticipante.name}`}
              roomId={`call_dm_${[utilizador?.id || 'me', ativoParticipante.id].sort().join('_')}`}
              onDisconnect={() => {
                definirIsChamadaAbrir(false);
                socket?.emit('direct-call-ended', {
                  targetUserId: ativoParticipante.id,
                  roomId: `call_dm_${[utilizador?.id || 'me', ativoParticipante.id].sort().join('_')}`,
                });
              }}
            />
          ) : (
            <div className="messages-page-panel-17">
              {/* Conversa Header */}
              <header className="messages-page-header">
                <div className="messages-page-panel-19">
                  <button
                    onClick={() => {
                      definirAtivoParticipante(null);
                      definirPesquisarParametros({});
                    }}
                    className="messages-page-button-17"
                    title="Voltar às conversas"
                    aria-label="Voltar às conversas"
                  >
                    <ArrowLeft className="messages-page-arrow-left" />
                  </button>
                  <div className="messages-page-panel-15">
                    <Avatar
                      shape="square"
                      src={ativoParticipante.urlAvatar}
                      name={ativoParticipante.name}
                      size="sm"
                      className="messages-page-avatar-2"
                    />
                    <span
                      className={`messages-page-label-2 ${isUtilizadorOnline(ativoParticipante.id) ? 'messages-page-label-4' : 'messages-page-label-5'} messages-page-label-3`}
                    />
                  </div>
                  <div className="messages-page-panel-20">
                    <div className="messages-page-panel-21">
                      <h3 className="messages-page-subheading">{ativoParticipante.name}</h3>
                      <span className="messages-page-label-12">@{ativoParticipante.username}</span>
                    </div>
                    <p
                      className={`messages-page-description-8 ${isUtilizadorOnline(ativoParticipante.id) ? 'messages-page-description-10' : 'messages-page-description-11'} messages-page-description-9`}
                    >
                      <span
                        className={`messages-page-label-13 ${isUtilizadorOnline(ativoParticipante.id) ? 'messages-page-label-14' : 'messages-page-label-5'}`}
                      />
                      {isUtilizadorOnline(ativoParticipante.id) ? 'Disponível' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="messages-page-panel-22">
                  {/* Pin Peer Botao */}
                  <button
                    onClick={(evento) => alternarAfixarParticipante(ativoParticipante.id, evento)}
                    className={`messages-page-button-18 ${afixadoParticipanteIds.includes(ativoParticipante.id) ? 'messages-page-button-19' : 'messages-page-button-20'}`}
                    title={
                      afixadoParticipanteIds.includes(ativoParticipante.id)
                        ? 'Desafixar contacto'
                        : 'Afixar contacto na barra lateral'
                    }
                  >
                    <Pin
                      className={`messages-page-message-square ${afixadoParticipanteIds.includes(ativoParticipante.id) ? 'messages-page-pin-3' : ''}`}
                    />
                    <span className="messages-page-label-15">
                      {afixadoParticipanteIds.includes(ativoParticipante.id) ? 'Afixado' : 'Afixar'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.reproduzirAderirChamada();

                      const mensagemDiretaSalaId = `call_dm_${[utilizador?.id || 'me', ativoParticipante.id].sort().join('_')}`;

                      socket?.emit('direct-call-start', {
                        targetUserId: ativoParticipante.id,
                        caller: {
                          id: utilizador.id,
                          name: utilizador.name,
                          username: utilizador.username,
                          urlAvatar: utilizador.urlAvatar,
                        },
                        roomId: mensagemDiretaSalaId,
                      });
                      definirIsChamadaAbrir(true);
                    }}
                    className="messages-page-button-21"
                    title="Iniciar chamada de voz/vídeo"
                  >
                    <Video className="messages-page-video" />
                    <span className="messages-page-label-15">Chamada</span>
                  </button>

                  <Link to={`/perfil/${ativoParticipante.username || ativoParticipante.id}`}>
                    <Botao
                      as="span"
                      variant="secondary"
                      size="sm"
                      className="messages-page-button-22"
                    >
                      Perfil
                    </Botao>
                  </Link>
                </div>
              </header>

              {/* Messages Scroll Area */}
              <div className="messages-page-panel-23 custom-scrollbar">
                {mensagens.length === 0 ? (
                  <div className="messages-page-panel-24">
                    <Avatar
                      shape="square"
                      src={ativoParticipante.urlAvatar}
                      name={ativoParticipante.name}
                      size="xl"
                      className="messages-page-avatar-3"
                    />
                    <h4 className="messages-page-caption">{ativoParticipante.name}</h4>
                    <p className="messages-page-description-12">@{ativoParticipante.username}</p>
                    <p className="messages-page-description-13">
                      Esta é uma conversa direta e privada. Envie uma mensagem para iniciar o
                      contacto.
                    </p>
                  </div>
                ) : (
                  mensagens.map((m, idx) => {
                    const isMe = m.idRemetente === utilizador?.id;
                    const isSeen = m.estaLida === true || m.estaLida === 1;

                    return (
                      <div
                        key={m.id || idx}
                        className={`messages-page-panel-25 ${isMe ? 'messages-page-panel-26' : ''}`}
                      >
                        {!isMe && (
                          <Avatar
                            shape="square"
                            src={ativoParticipante.urlAvatar}
                            name={ativoParticipante.name}
                            size="sm"
                            className="messages-page-avatar-4"
                          />
                        )}

                        <div
                          className={`messages-page-panel-27 ${isMe ? 'messages-page-panel-28' : ''}`}
                        >
                          <div
                            className={`messages-page-panel-29 ${isMe ? 'messages-page-panel-30 message-outgoing-corner' : 'messages-page-panel-31 message-incoming-corner'}`}
                          >
                            {m.content}
                          </div>

                          <div
                            className={`messages-page-panel-32 ${isMe ? 'messages-page-panel-33' : 'messages-page-panel-34'}`}
                          >
                            <span>
                              {new Date(m.criadoEm).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Indica se a mensagem enviada já foi lida. */}
                            {isMe &&
                              mostrarLerReceipts &&
                              (isSeen ? (
                                <span
                                  className="messages-page-label-16"
                                  title="Visto"
                                >
                                  <CheckCheck className="messages-page-check-check" />
                                  <span className="messages-page-label-17">Visto</span>
                                </span>
                              ) : (
                                <span
                                  className="messages-page-label-18"
                                  title="Enviado"
                                >
                                  <Check className="messages-page-message-square" />
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={mensagensTerminarRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={tratarEnviarMensagem}
                className="messages-page-form pb-safe"
              >
                <input
                  type="text"
                  required
                  placeholder={`Mensagem para @${ativoParticipante.username}...`}
                  value={draft}
                  onChange={(evento) => definirDraft(evento.target.value)}
                  className="messages-page-field-2"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || aEnviar}
                  aria-label={aEnviar ? 'A enviar mensagem' : 'Enviar mensagem'}
                  className="messages-page-button-23"
                >
                  <Send className="messages-page-message-square" />
                </button>
              </form>
            </div>
          )
        ) : (
          <div className="messages-page-panel-35">
            <div className="messages-page-panel-36">
              <MessageSquare className="messages-page-message-square-2" />
            </div>
            <h3 className="messages-page-subheading-2">Caixa de Mensagens & Amigos</h3>
            <p className="messages-page-description-14">
              Conecte-se com amigos ou selecione uma conversa para trocar mensagens diretas.
            </p>
            <div className="messages-page-panel-22">
              <Botao
                onClick={() => definirIsNovoConversaJanelaAbrir(true)}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="messages-page-message-square" />}
                className="messages-page-button-24"
              >
                Nova Mensagem
              </Botao>
              <Botao
                onClick={() => {
                  definirPrincipalSeparador('friends');
                  definirAmigosSubSeparador('add');
                }}
                variant="secondary"
                size="sm"
                leftIcon={<UserPlus className="messages-page-message-square" />}
                className="messages-page-button-24"
              >
                Adicionar Amigo
              </Botao>
            </div>
          </div>
        )}
      </main>

      <Janela
        isOpen={isNovoConversaJanelaAbrir}
        title="Nova conversa"
        maxWidth="md"
        onClose={() => definirIsNovoConversaJanelaAbrir(false)}
      >
        <div className="nova-conversa">
          <p>Encontre alguém da plataforma para iniciar uma conversa.</p>
          <label htmlFor="nova-conversa-pesquisa">Nome ou utilizador</label>
          <div className="nova-conversa-pesquisa">
            <Search aria-hidden="true" />
            <input
              id="nova-conversa-pesquisa"
              autoFocus
              type="search"
              value={novoConversaPesquisar}
              onChange={(evento) => definirNovoConversaPesquisar(evento.target.value)}
              placeholder="Pesquisar por nome ou @utilizador"
            />
          </div>
          {novaConversaCarregamento ? (
            <p role="status">A pesquisar…</p>
          ) : novaConversaErro ? (
            <p role="alert">{novaConversaErro}</p>
          ) : (
            <>
              {!novoConversaPesquisar.trim() && <h4>Conversas recentes</h4>}
              <ul>
                {(novoConversaPesquisar.trim()
                  ? novoConversaResultados
                  : conversas.map((c) => c.peer).filter(Boolean)
                ).map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => tratarSelecionarParticipante(u)}
                    >
                      <Avatar
                        src={u.urlAvatar}
                        name={u.name}
                        size="sm"
                      />
                      <span>
                        <strong>{u.name}</strong>
                        <small>@{u.username}</small>
                      </span>
                      <MessageSquare aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {!(novoConversaPesquisar.trim() ? novoConversaResultados : conversas).length && (
                <p className="nova-conversa-vazio">
                  {novoConversaPesquisar.trim()
                    ? 'Nenhum utilizador encontrado. Experimente outro nome.'
                    : 'Ainda não tem conversas. Pesquise um utilizador acima.'}
                </p>
              )}
            </>
          )}
        </div>
      </Janela>
    </div>
  );
};

export default MensagensPagina;
