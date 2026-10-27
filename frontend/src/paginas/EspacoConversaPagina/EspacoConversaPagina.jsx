import './EspacoConversaPagina.css';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { LuMenu as Menu } from 'react-icons/lu';
import { Janela } from '../../componentes/Janela';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useSocket } from '../../contextos/ContextoSocket';
import { useAvisos } from '../../componentes/Avisos';
import { useChamadaAtiva } from '../../contextos/ContextoChamadaAtiva';
import { api } from '../../servicos/api';
import { soundEffects } from '../../servicos/soundEffects';
import { ChamadaPalco } from '../../componentes/ChamadaPalco';
import { AderirChamadaJanela } from '../../componentes/AderirChamadaJanela';
import { ListaCanaisEspaco } from '../../componentes/ListaCanaisEspaco';
import { ListaMensagensEspaco } from '../../componentes/ListaMensagensEspaco';
import { EspacoMembrosBarraLateral } from '../../componentes/EspacoMembrosBarraLateral';

export const EspacoConversaPagina = () => {
  const { id } = useParams();
  const { user: utilizador } = useAutenticacao();
  const { socket, aderirCanal, sairCanal, enviarEscrever, enviarPararEscrever } = useSocket();
  const { toast: aviso } = useAvisos();
  const { activeCall: ativoChamada, iniciarChamada, terminarChamada } = useChamadaAtiva();
  const [espaco, definirEspaco] = useState(null);
  const [canais, definirCanais] = useState([]);
  const [atualCanal, definirAtualCanal] = useState(null);
  const [mensagens, definirMensagens] = useState([]);
  const [entradaConteudo, definirEntradaConteudo] = useState('');
  const [replyingTo, definirReplyingTo] = useState(null);
  const [escreverUtilizadores, definirEscreverUtilizadores] = useState([]);
  const [mostrarMembros, definirMostrarMembros] = useState(true);
  const [afixadoApenas, definirAfixadoApenas] = useState(false);
  const [pesquisarConsultar, definirPesquisarConsultar] = useState('');
  const [inVozSala, definirInVozSala] = useState(null);
  const [pendenteVozSala, definirPendenteVozSala] = useState(null);
  const [vozSalaPreferencias, definirVozSalaPreferencias] = useState({
    startMuted: false,
    startVideoOff: true,
  });
  const [mostrarMobileBarraLateral, definirMostrarMobileBarraLateral] = useState(false);
  const [mostrarCanalJanela, definirMostrarCanalJanela] = useState(false);
  const [novoChNome, definirNovoChNome] = useState('');
  const [novoChType, definirNovoChType] = useState('text');
  const [novoChTopic, definirNovoChTopic] = useState('');
  const [isSavingCanal, definirIsSavingCanal] = useState(false);
  const escreverTimeoutRef = useRef(null);

  useEffect(() => {
    if (ativoChamada && ativoChamada.idEspaco === (espaco?.id || id)) {
      definirInVozSala(ativoChamada.roomName);
    } else if (!ativoChamada && inVozSala) {
      definirInVozSala(null);
    }
  }, [ativoChamada, espaco?.id, id]);
  useEffect(() => {
    if (!id) return;
    api
      .get(`/espacos/${id}`)
      .then(({ data: dados }) => dados)
      .then((dados) => {
        definirEspaco(dados);
        definirCanais(dados.channels || []);
        if (dados.channels && dados.channels.length > 0) {
          definirAtualCanal(dados.channels[0]);
        }
      })
      .catch((erro) => console.error(erro));
  }, [id]);
  useEffect(() => {
    if (!atualCanal) return;
    aderirCanal(atualCanal.id);
    api
      .get(`/canais/${atualCanal.id}/mensagens`)
      .then(({ data: dados }) => dados)
      .then((msgs) => definirMensagens(msgs || []))
      .catch(() => {});

    return () => {
      sairCanal(atualCanal.id);
    };
  }, [atualCanal?.id]);
  useEffect(() => {
    if (!socket) return;
    const tratarNovoMensagem = (msg) => {
      if (msg.idCanal === atualCanal?.id) {
        definirMensagens((anterior) => {
          if (anterior.some((m) => m.id === msg.id)) return anterior;
          const optimisticIdx = anterior.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              (m.idRemetente === msg.idRemetente || m.sender?.username === msg.sender?.username) &&
              m.content === msg.content,
          );
          if (optimisticIdx !== -1) {
            const seguinte = [...anterior];

            seguinte[optimisticIdx] = msg;

            return seguinte;
          }

          return [...anterior, msg];
        });
      }
    };

    const tratarEscrever = ({ idCanal: canalId, username: nomeUtilizador }) => {
      if (
        canalId === atualCanal?.id &&
        nomeUtilizador !== utilizador?.name &&
        nomeUtilizador !== utilizador?.username
      ) {
        definirEscreverUtilizadores((anterior) =>
          Array.from(new Set([...anterior, nomeUtilizador])),
        );
      }
    };

    const tratarPararEscrever = ({ idCanal: canalId, username: nomeUtilizador }) => {
      if (canalId === atualCanal?.id) {
        definirEscreverUtilizadores((anterior) => anterior.filter((u) => u !== nomeUtilizador));
      }
    };

    socket.on('new-message', tratarNovoMensagem);
    socket.on('typing', tratarEscrever);
    socket.on('stop-typing', tratarPararEscrever);

    return () => {
      socket.off('new-message', tratarNovoMensagem);
      socket.off('typing', tratarEscrever);
      socket.off('stop-typing', tratarPararEscrever);
    };
  }, [socket, atualCanal?.id, utilizador?.name, utilizador?.username]);

  const tratarEnviarMensagem = async (evento) => {
    evento.preventDefault();
    if (!entradaConteudo.trim() || !atualCanal) return;
    const conteudoToEnviar = entradaConteudo.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const atualReply = replyingTo;
    const optimisticMsg = {
      id: tempId,
      idCanal: atualCanal.id,
      idRemetente: utilizador?.id || 'temp-user',
      content: conteudoToEnviar,
      estaAfixada: false,
      criadoEm: new Date().toISOString(),
      sender: {
        id: utilizador?.id || 'temp-user',
        name: utilizador?.name || 'Eu',
        username: utilizador?.username || 'eu',
        urlAvatar: utilizador?.urlAvatar,
        role: utilizador?.role || 'STUDENT',
      },
      replyTo: atualReply
        ? {
            id: atualReply.id,
            content: atualReply.content,
            sender: atualReply.sender,
          }
        : undefined,
      reactions: [],
    };

    definirEntradaConteudo('');
    definirReplyingTo(null);
    definirMensagens((anterior) => [...anterior, optimisticMsg]);
    soundEffects.reproduzirMensagem();
    enviarPararEscrever(atualCanal.id);
    try {
      const novoMsg = await api
        .post(`/canais/${atualCanal.id}/mensagens`, {
          content: conteudoToEnviar,
          replyToId: atualReply?.id,
        })
        .then(({ data: dados }) => dados);

      definirMensagens((anterior) => anterior.map((m) => (m.id === tempId ? novoMsg : m)));
    } catch {
      definirMensagens((anterior) => anterior.filter((m) => m.id !== tempId));
      definirEntradaConteudo(conteudoToEnviar);
      aviso({
        title: 'Erro',
        message: 'Não foi possível enviar a mensagem',
        type: 'error',
      });
    }
  };

  const tratarEntradaAlterar = (evento) => {
    definirEntradaConteudo(evento.target.value);
    if (!atualCanal) return;
    enviarEscrever(atualCanal.id);
    if (escreverTimeoutRef.current) clearTimeout(escreverTimeoutRef.current);
    escreverTimeoutRef.current = setTimeout(() => {
      enviarPararEscrever(atualCanal.id);
    }, 2000);
  };

  const tratarCriarCanal = async (evento) => {
    evento.preventDefault();
    if (!novoChNome.trim() || !espaco) return;
    definirIsSavingCanal(true);

    const formattedNome = novoChNome.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      const criado = await api
        .post(`/espacos/${espaco.id}/canais`, {
          name: formattedNome,
          type: novoChType,
          topic: novoChTopic,
        })
        .then(({ data: dados }) => dados);

      definirCanais((anterior) => [...anterior, criado]);
      definirAtualCanal(criado);
      soundEffects.reproduzirSucesso();
      definirMostrarCanalJanela(false);
      definirNovoChNome('');
      definirNovoChTopic('');
      aviso({
        title: 'Canal Criado!',
        message: `Canal #${criado.name} adicionado com sucesso.`,
        type: 'success',
      });
    } catch (erro) {
      aviso({
        title: 'Erro ao criar canal',
        message: erro.message,
        type: 'error',
      });
    } finally {
      definirIsSavingCanal(false);
    }
  };

  const isProprietarioOrAdministracao =
    utilizador?.role === 'ADMIN' ||
    utilizador?.role === 'CREATOR' ||
    espaco?.idProprietario === utilizador?.id;
  const tratarAlternarAfixar = async (mensagemId) => {
    try {
      const resposta = await api
        .post(`/mensagens/${mensagemId}/afixar`)
        .then(({ data: dados }) => dados);

      definirMensagens((anterior) =>
        anterior.map((m) =>
          m.id === mensagemId
            ? {
                ...m,
                estaAfixada: resposta.estaAfixada,
              }
            : m,
        ),
      );
      aviso({
        title: resposta.estaAfixada ? 'Mensagem Fixada' : 'Mensagem Desafixada',
      });
    } catch {}
  };

  const filteredMensagens = mensagens.filter((m) => {
    if (afixadoApenas && !m.estaAfixada) return false;
    if (
      pesquisarConsultar &&
      !(m.content || '').toLowerCase().includes(pesquisarConsultar.toLowerCase())
    )
      return false;

    return true;
  });

  return (
    <div className="space-chat-panel">
      {mostrarMobileBarraLateral && (
        <div
          className="space-chat-panel-2"
          onClick={() => definirMostrarMobileBarraLateral(false)}
        />
      )}

      <div
        className={`
        space-chat-panel-3
        ${mostrarMobileBarraLateral ? 'space-chat-panel-4' : 'space-chat-panel-5'}
      `}
      >
        <ListaCanaisEspaco
          space={espaco}
          channels={canais}
          currentChannel={atualCanal}
          inVoiceRoom={inVozSala}
          isOwnerOrAdmin={isProprietarioOrAdministracao}
          onSelectChannel={(ch) => {
            definirInVozSala(null);
            definirAtualCanal(ch);
            definirMostrarMobileBarraLateral(false);
          }}
          onSelectVoiceRoom={(salaNome) => {
            definirPendenteVozSala(salaNome);
            definirMostrarMobileBarraLateral(false);
          }}
          onDisconnectVoiceRoom={() => {
            definirInVozSala(null);
            terminarChamada();
            soundEffects.reproduzirSairChamada();
          }}
          onOpenCreateChannelModal={() => {
            definirNovoChType('text');
            definirMostrarCanalJanela(true);
            definirMostrarMobileBarraLateral(false);
          }}
        />
      </div>

      {inVozSala ? (
        <ChamadaPalco
          key={`${espaco?.id || id || 'community'}_${inVozSala}`}
          roomName={inVozSala}
          roomId={`space_${espaco?.id || id || 'community'}_${inVozSala
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')}`}
          roomType={
            inVozSala.toLowerCase().includes('palco') ||
            inVozSala.toLowerCase().includes('masterclass')
              ? 'stage'
              : inVozSala.toLowerCase().includes('dúvida') ||
                  inVozSala.toLowerCase().includes('duvidas')
                ? 'qa'
                : 'voice'
          }
          isStageMode={
            inVozSala.toLowerCase().includes('palco') ||
            inVozSala.toLowerCase().includes('masterclass')
          }
          initialMuted={vozSalaPreferencias.startMuted}
          initialCameraOn={!vozSalaPreferencias.startVideoOff}
          onDisconnect={() => {
            definirInVozSala(null);
            terminarChamada();
          }}
        />
      ) : (
        <>
          <button
            onClick={() => definirMostrarMobileBarraLateral(true)}
            className="space-chat-button"
            title="Canais"
            aria-label="Abrir lista de canais"
          >
            <Menu className="space-chat-menu" />
          </button>
          <ListaMensagensEspaco
            currentChannel={atualCanal}
            messages={filteredMensagens}
            inputContent={entradaConteudo}
            onInputChange={tratarEntradaAlterar}
            onSendMessage={tratarEnviarMensagem}
            replyingTo={replyingTo}
            onSetReplyingTo={definirReplyingTo}
            typingUsers={escreverUtilizadores}
            searchQuery={pesquisarConsultar}
            onSearchChange={definirPesquisarConsultar}
            pinnedOnly={afixadoApenas}
            onTogglePinnedOnly={() => definirAfixadoApenas(!afixadoApenas)}
            showMembers={mostrarMembros}
            onToggleMembers={() => definirMostrarMembros(!mostrarMembros)}
            isOwnerOrAdmin={isProprietarioOrAdministracao}
            onTogglePin={tratarAlternarAfixar}
          />

          {mostrarMembros && <EspacoMembrosBarraLateral space={espaco} />}
        </>
      )}

      {mostrarCanalJanela && (
        <Janela
          isOpen={mostrarCanalJanela}
          onClose={() => definirMostrarCanalJanela(false)}
          title="Criar Novo Canal"
        >
          <form
            onSubmit={tratarCriarCanal}
            className="space-chat-form"
          >
            <div>
              <label className="space-chat-field-label">Sugestões Rápidas (1-Clique)</label>
              <div className="space-chat-panel-6">
                {[
                  {
                    name: 'anuncios',
                    type: 'text',
                    label: 'Anúncios',
                    topic: 'Avisos e novidades importantes da comunidade',
                  },
                  {
                    name: 'geral',
                    type: 'text',
                    label: 'Geral',
                    topic: 'Conversas gerais e apresentações',
                  },
                  {
                    name: 'sala-de-estudo',
                    type: 'voice',
                    label: 'Voz Livre',
                    topic: 'Sala com áudio e partilha livre para todos',
                  },
                  {
                    name: 'palco-masterclass',
                    type: 'stage',
                    label: 'Palco (Apenas Adm)',
                    topic: 'Apenas os instrutores falam e partilham ecrã',
                  },
                  {
                    name: 'fila-de-duvidas',
                    type: 'qa',
                    label: 'Dúvidas & Q&A',
                    topic: 'Fila moderada de perguntas e respostas',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      definirNovoChNome(tmpl.name);
                      definirNovoChType(tmpl.type);
                      definirNovoChTopic(tmpl.topic);
                    }}
                    className="space-chat-button-2"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-2">Tipo e Regras do Canal</label>
              <div className="space-chat-panel-7">
                <button
                  type="button"
                  onClick={() => definirNovoChType('text')}
                  className={`space-chat-button-3 ${novoChType === 'text' ? 'space-chat-button-4' : 'space-chat-button-5'}`}
                >
                  <p className="space-chat-description">Canal de Texto</p>
                  <p
                    className={`space-chat-description-2 ${novoChType === 'text' ? 'space-chat-description-3' : 'space-chat-description-4'}`}
                  >
                    Mensagens e fórum
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => definirNovoChType('voice')}
                  className={`space-chat-button-3 ${novoChType === 'voice' ? 'space-chat-button-4' : 'space-chat-button-5'}`}
                >
                  <p className="space-chat-description">Conversação Livre</p>
                  <p
                    className={`space-chat-description-2 ${novoChType === 'voice' ? 'space-chat-description-3' : 'space-chat-description-4'}`}
                  >
                    Todos podem falar e partilhar
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => definirNovoChType('stage')}
                  className={`space-chat-button-3 ${novoChType === 'stage' ? 'space-chat-button-6' : 'space-chat-button-7'}`}
                >
                  <p className="space-chat-description-5">Palco (Apenas Adm Fala)</p>
                  <p
                    className={`space-chat-description-2 ${novoChType === 'stage' ? 'space-chat-description-6' : 'space-chat-description-4'}`}
                  >
                    Alunos proibidos sem autorização
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => definirNovoChType('qa')}
                  className={`space-chat-button-3 ${novoChType === 'qa' ? 'space-chat-button-8' : 'space-chat-button-9'}`}
                >
                  <p className="space-chat-description-7">Sala de Dúvidas (Q&A)</p>
                  <p
                    className={`space-chat-description-2 ${novoChType === 'qa' ? 'space-chat-description-8' : 'space-chat-description-4'}`}
                  >
                    Fila moderada de oradores
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-3">Nome do Canal</label>
              <div className="space-chat-panel-8">
                <span className="space-chat-label">#</span>
                <input
                  type="text"
                  required
                  placeholder="ex: palco-masterclass"
                  value={novoChNome}
                  onChange={(evento) => definirNovoChNome(evento.target.value)}
                  className="space-chat-field"
                />
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-3">Tópico ou Descrição (Opcional)</label>
              <input
                type="text"
                placeholder="ex: Partilha de recursos e links recomendados"
                value={novoChTopic}
                onChange={(evento) => definirNovoChTopic(evento.target.value)}
                className="space-chat-field-2"
              />
            </div>

            <div className="space-chat-panel-9">
              <button
                type="button"
                onClick={() => definirMostrarCanalJanela(false)}
                className="space-chat-button-10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingCanal}
                className="space-chat-button-11"
              >
                {isSavingCanal ? 'A criar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Janela>
      )}

      {/* Janela de confirmação com informações principais antes de entrar na chamada da comunidade */}
      <AderirChamadaJanela
        isOpen={Boolean(pendenteVozSala)}
        roomName={pendenteVozSala}
        contextTitle={espaco?.name}
        onClose={() => definirPendenteVozSala(null)}
        onConfirm={({ startMuted: iniciarMuted, startVideoOff: iniciarVideoOff }) => {
          const sala = pendenteVozSala;
          if (ativoChamada) {
            terminarChamada();
          }

          definirVozSalaPreferencias({
            startMuted: iniciarMuted,
            startVideoOff: iniciarVideoOff,
          });
          definirInVozSala(sala);
          soundEffects.reproduzirAderirChamada();

          const cleanSalaId = `space_${espaco?.id || id || 'community'}_${sala
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')}`;

          iniciarChamada({
            roomId: cleanSalaId,
            roomName: sala,
            contextTitle: espaco?.name || 'Comunidade',
            idEspaco: espaco?.id || id,
            returnUrl: `/comunidade/${espaco?.id || id}`,
          });
          definirPendenteVozSala(null);
        }}
      />
    </div>
  );
};

export default EspacoConversaPagina;
