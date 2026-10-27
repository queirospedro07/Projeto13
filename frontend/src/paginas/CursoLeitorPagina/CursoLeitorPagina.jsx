import { podeGerirEsteCurso, temInscricaoCurso } from '../../utilitarios/permissoes';
import { lerJsonCompativel } from '../../utilitarios/compatibilidadeCampos.js';
import { ProjetoSubmissao } from '../../componentes/ProjetoSubmissao';
import './CursoLeitorPagina.css';
import CursoConclusao from '../../componentes/CursoConclusao/CursoConclusao';
import { seguroExternoUrl } from '../../utilitarios/urlSegura';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LuPlay as Play,
  LuHash as Hash,
  LuRadio as Radio,
  LuCircleHelp as HelpCircle,
  LuFileCode2 as FileCode2,
  LuCheck as Check,
  LuAward as Award,
  LuChevronRight as ChevronRight,
  LuChevronLeft as ChevronLeft,
  LuVideo as Video,
  LuLightbulb as Lightbulb,
  LuSquareCheck as CheckSquare,
  LuSquare as Square,
  LuMenu as Menu,
  LuBookOpen as BookOpen,
  LuPlus as Plus,
  LuSettings as Settings,
  LuUsers as Users,
  LuLock as Lock,
  LuSparkles as Sparkles,
} from 'react-icons/lu';
import { Janela } from '../../componentes/Janela';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useSocket } from '../../contextos/ContextoSocket';
import { useAvisos } from '../../componentes/Avisos';
import { useChamadaAtiva } from '../../contextos/ContextoChamadaAtiva';
import { api } from '../../servicos/api';
import { soundEffects } from '../../servicos/soundEffects';
import { ChamadaPalco } from '../../componentes/ChamadaPalco';
import { AderirChamadaJanela } from '../../componentes/AderirChamadaJanela';
import { BarraLateralComunidadeCurso } from '../../componentes/BarraLateralComunidadeCurso';
import { CursoCanalConversa } from '../../componentes/CursoCanalConversa';
import { CursoQuestionarioVista } from '../../componentes/CursoQuestionarioVista';
import { CursoDocumentosVista } from '../../componentes/CursoDocumentosVista';
import { AulaNotasSeparador } from '../../componentes/AulaNotasSeparador';
import { AulaRecursosSeparador } from '../../componentes/AulaRecursosSeparador';

export const CursoLeitorPagina = () => {
  const { idCurso: cursoId } = useParams();
  const navigate = useNavigate();
  const { user: utilizador } = useAutenticacao();
  const { activeCall: ativoChamada, iniciarChamada, terminarChamada } = useChamadaAtiva();
  const { socket, aderirCanal, sairCanal } = useSocket();
  const { toast: aviso } = useAvisos();
  const [curso, definirCurso] = useState(null);
  const [atualAula, definirAtualAula] = useState(null);
  const [carregamento, definirCarregamento] = useState(true);
  const [concluidoAulaIds, definirConcluidoAulaIds] = useState(new Set());
  const [ativoVista, definirAtivoVista] = useState(() => {
    try {
      const guardadoCursoVista = localStorage.getItem(`nexo_player_view_${cursoId}`);
      const guardadoGlobal = localStorage.getItem('nexo_player_preferred_view');
      const candidate = guardadoCursoVista || guardadoGlobal;
      if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
        return candidate;
      }
    } catch {}

    return 'lesson';
  });
  const tratarVistaAlterar = (vista) => {
    definirAtivoVista(vista);
    if (vista !== 'live-room') {
      try {
        localStorage.setItem(`nexo_player_view_${cursoId}`, vista);
        localStorage.setItem('nexo_player_preferred_view', vista);
      } catch {}
    }
  };

  const [atualTextCanal, definirAtualTextCanal] = useState(null);
  const [personalizadoCanais, definirPersonalizadoCanais] = useState([]);
  const [mobileBarraLateralAbrir, definirMobileBarraLateralAbrir] = useState(false);
  const [liveSalaNome, definirLiveSalaNome] = useState('Live Mentoria & Ecrã');
  const [inLiveSala, definirInLiveSala] = useState(false);
  const [pendenteAderirSala, definirPendenteAderirSala] = useState(null);
  const [liveSalaPreferencias, definirLiveSalaPreferencias] = useState({
    startMuted: false,
    startVideoOff: true,
  });
  const [ativoAulaSeparador, definirAtivoAulaSeparador] = useState('overview');
  const [canalMensagens, definirCanalMensagens] = useState([]);
  const [conversaEntrada, definirConversaEntrada] = useState('');
  const [replyingTo, definirReplyingTo] = useState(null);
  const [mostrarMembrosListar, definirMostrarMembrosListar] = useState(true);
  const resolvedMensagemIds = new Set(
    canalMensagens.filter((mensagem) => mensagem.isResolved).map((mensagem) => mensagem.id),
  );
  const [mostrarCriarCanalJanela, definirMostrarCriarCanalJanela] = useState(false);
  const [editingCanal, definirEditingCanal] = useState(null);
  const [novoCanalNome, definirNovoCanalNome] = useState('');
  const [novoCanalType, definirNovoCanalType] = useState('text');
  const [novoCanalTopic, definirNovoCanalTopic] = useState('');
  const [novoCanalPergunta, definirNovoCanalPergunta] = useState('');
  const [isCreatingCanal, definirIsCreatingCanal] = useState(false);
  const [selecionadoItens, definirSelecionadoItens] = useState({});
  const carregarCursoDados = async () => {
    if (!cursoId) return;
    try {
      let dados = null;
      try {
        dados = await api.get(`/cursos/${cursoId}`).then(({ data: dados2 }) => dados2);
      } catch {
        try {
          const espacoDados = await api
            .get(`/espacos/${cursoId}`)
            .then(({ data: dados2 }) => dados2);
          if (espacoDados) {
            dados = {
              id: espacoDados.id,
              title: espacoDados.name,
              slug: espacoDados.slug,
              description: espacoDados.description,
              urlMiniatura: espacoDados.urlCapa || espacoDados.urlIcone,
              urlCapa: espacoDados.urlCapa,
              category: espacoDados.category || 'Geral',
              creator: espacoDados.owner,
              modules: [],
              space: espacoDados,
            };
          }
        } catch (evento2) {
          console.error(evento2);
        }
      }

      if (!dados) {
        dados = {
          id: cursoId,
          title: 'Ambiente de Aprendizagem',
          description: '',
          category: 'Geral',
          difficulty: 'Iniciante',
          modules: [],
          space: {
            id: cursoId,
            name: 'Turma & Comunidade',
            channels: [],
          },
        };
      }

      let modulosListar = dados.modules || [];

      modulosListar.forEach((mod) => {
        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach((les) => {
            if (
              les.content &&
              typeof les.content === 'string' &&
              les.content.trim().startsWith('{')
            ) {
              try {
                const parsed = lerJsonCompativel(les.content);
                if (les.type === 'quiz') {
                  les.quiz = les.quiz || parsed;
                  les.content =
                    parsed.description ||
                    'Responda às questões práticas para testar os seus conhecimentos.';
                } else if (les.type === 'text') {
                  les.richArticle = les.richArticle || parsed;
                  les.content = parsed.markdown || '';
                }
              } catch {}
            }
          });
        }
      });

      const podeGerir = podeGerirEsteCurso(utilizador, dados);
      if (!temInscricaoCurso(dados) && !podeGerir) {
        navigate(`/cursos/${dados.slug || dados.id || cursoId}`, {
          replace: true,
        });

        return;
      }

      definirCurso(dados);

      const concluido = new Set();

      dados.userEnrollment?.lessonProgresses?.forEach((lp) => {
        if (lp.completed === 1 || lp.completed === true || lp.isCompleted) {
          concluido.add(lp.idAula);
        }
      });
      definirConcluidoAulaIds(concluido);

      const todosAulas2 = dados.modules?.flatMap((m) => m.lessons) || [];
      if (todosAulas2.length > 0) {
        let destinoAula = null;
        try {
          const guardadoAulaId = localStorage.getItem(`nexo_last_lesson_${dados.id || cursoId}`);
          if (guardadoAulaId) {
            destinoAula = todosAulas2.find((l) => l.id === guardadoAulaId);
          }
        } catch {}

        if (!destinoAula) {
          destinoAula = todosAulas2.find((l) => !concluido.has(l.id)) || todosAulas2[0];
        }

        definirAtualAula(destinoAula);
      } else {
        definirAtualAula(null);
      }

      if (dados.space?.channels && dados.space.channels.length > 0) {
        const mapped = dados.space.channels.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type === 'voice' ? 'voice' : 'text',
          topic: c.topic || 'Canal do espaço da turma',
        }));

        definirPersonalizadoCanais(mapped);

        const textCanais = mapped.filter((c) => c.type === 'text');
        let destinoCanal = textCanais[0] || mapped[0];
        try {
          const guardadoCanalId = localStorage.getItem(
            `nexo_player_channel_${dados.id || cursoId}`,
          );
          if (guardadoCanalId) {
            const found = textCanais.find((c) => c.id === guardadoCanalId);
            if (found) destinoCanal = found;
          }
        } catch {}

        definirAtualTextCanal(destinoCanal);
      } else {
        definirPersonalizadoCanais([]);
        definirAtualTextCanal(null);
      }
    } catch (erro) {
      console.error(erro);
    } finally {
      definirCarregamento(false);
    }
  };

  useEffect(() => {
    definirCurso(null);
    definirCarregamento(true);
    definirAtualTextCanal(null);
    definirCanalMensagens([]);
    definirPersonalizadoCanais([]);

    const isThisCursoChamada = Boolean(
      ativoChamada && String(ativoChamada.idCurso) === String(cursoId),
    );
    if (isThisCursoChamada) {
      definirInLiveSala(true);
      definirLiveSalaNome(ativoChamada.roomName || 'Sala ao Vivo');
      definirAtivoVista('live-room');
    } else {
      definirInLiveSala(false);
      definirLiveSalaNome('');

      let preferred = 'lesson';
      try {
        const guardadoCursoVista = localStorage.getItem(`nexo_player_view_${cursoId}`);
        const guardadoGlobal = localStorage.getItem('nexo_player_preferred_view');
        const candidate = guardadoCursoVista || guardadoGlobal;
        if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
          preferred = candidate;
        }
      } catch {}

      definirAtivoVista(preferred);
    }

    definirPendenteAderirSala(null);
    carregarCursoDados();
  }, [cursoId]);
  useEffect(() => {
    if (atualAula?.id && (curso?.id || cursoId)) {
      try {
        localStorage.setItem(`nexo_last_lesson_${curso?.id || cursoId}`, atualAula.id);
      } catch {}
    }
  }, [atualAula?.id, curso?.id, cursoId]);
  useEffect(() => {
    const isThisCursoChamada = Boolean(
      ativoChamada && String(ativoChamada.idCurso) === String(cursoId),
    );
    if (isThisCursoChamada) {
      definirInLiveSala(true);
      definirLiveSalaNome(ativoChamada.roomName || 'Sala ao Vivo');
    } else {
      definirInLiveSala(false);
      if (ativoVista === 'live-room') {
        let preferred = 'lesson';
        try {
          const guardadoCursoVista = localStorage.getItem(`nexo_player_view_${cursoId}`);
          const guardadoGlobal = localStorage.getItem('nexo_player_preferred_view');
          const candidate = guardadoCursoVista || guardadoGlobal;
          if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
            preferred = candidate;
          }
        } catch {}

        definirAtivoVista(preferred);
      }
    }
  }, [ativoChamada, cursoId]);
  useEffect(() => {
    const tratarFocarChamada = (evento) => {
      const chamada = evento.detail || ativoChamada;
      if (chamada && String(chamada.idCurso) === String(cursoId)) {
        definirInLiveSala(true);
        definirLiveSalaNome(chamada.roomName || 'Sala ao Vivo');
        definirAtivoVista('live-room');
      }
    };

    window.addEventListener('nexo_focus_call', tratarFocarChamada);

    return () => window.removeEventListener('nexo_focus_call', tratarFocarChamada);
  }, [cursoId, ativoChamada]);
  useEffect(() => {
    let isSubscribed = true;
    if (ativoVista === 'channel' && atualTextCanal) {
      definirCanalMensagens([]);
      aderirCanal(atualTextCanal.id);
      api
        .get(`/canais/${atualTextCanal.id}/mensagens`)
        .then(({ data: dados }) => dados)
        .then((msgs) => {
          if (isSubscribed) {
            definirCanalMensagens(msgs || []);
          }
        })
        .catch(() => {
          if (isSubscribed) {
            definirCanalMensagens([
              {
                id: `msg-welcome-${atualTextCanal.id}`,
                idRemetente: curso?.idFormador || 'creator',
                content: `Bem-vindos ao canal #${atualTextCanal.name}! Utilizem este espaço para interagir com a turma e o instrutor.`,
                criadoEm: new Date().toISOString(),
                sender: {
                  name: curso?.creator?.name || 'Instrutor',
                  username: 'instrutor',
                  role: 'CREATOR',
                },
              },
            ]);
          }
        });

      return () => {
        isSubscribed = false;
        sairCanal(atualTextCanal.id);
      };
    }
  }, [ativoVista, atualTextCanal?.id]);
  useEffect(() => {
    if (!socket) return;
    const tratarNovoMensagem = (msg) => {
      if (msg.idCanal === atualTextCanal?.id) {
        definirCanalMensagens((anterior) => {
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

    socket.on('new-message', tratarNovoMensagem);

    return () => {
      socket.off('new-message', tratarNovoMensagem);
    };
  }, [socket, atualTextCanal?.id]);

  const tratarMarcarConcluir = async () => {
    if (!atualAula || !curso) return;
    try {
      const resposta = await api
        .post(`/cursos/${curso.id}/aulas/${atualAula.id}/concluir`)
        .then(({ data: dados }) => dados);

      definirConcluidoAulaIds((anterior) => new Set([...anterior, atualAula.id]));
      definirCurso((anterior) => {
        if (!anterior) return anterior;
        const atualizadoAulaProgresses = resposta.enrollment?.lessonProgresses || [
          ...(anterior.userEnrollment?.lessonProgresses || []).filter(
            (lp) => lp.idAula !== atualAula.id,
          ),
          {
            idInscricao: resposta.enrollment?.id,
            idAula: atualAula.id,
            completed: 1,
            isCompleted: true,
          },
        ];

        return {
          ...anterior,
          certificate: resposta.certificate || anterior.certificate,
          userEnrollment: {
            ...anterior.userEnrollment,
            ...resposta.enrollment,
            lessonProgresses: atualizadoAulaProgresses,
            percentagemProgresso:
              resposta.enrollment?.percentagemProgresso ??
              anterior.userEnrollment?.percentagemProgresso,
          },
        };
      });
      soundEffects.reproduzirSucesso();
      if (resposta.certificate?.id) {
        aviso({
          title: 'Curso concluído!',
          message: 'O seu certificado foi emitido.',
          type: 'success',
        });
        navigate(`/certificados/verificar/${encodeURIComponent(resposta.certificate.id)}`);

        return;
      }

      aviso({
        title: 'Aula Concluída!',
        message: `Progresso: ${resposta.enrollment?.percentagemProgresso ?? 0}%`,
        type: 'success',
      });
    } catch {
      aviso({
        title: 'Erro',
        message: 'Não foi possível marcar a aula como concluída',
        type: 'error',
      });
    }
  };

  const tratarEnviarConversaMensagem = async (evento) => {
    evento.preventDefault();
    if (!conversaEntrada.trim() || !atualTextCanal) return;
    const conteudo = conversaEntrada.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const atualReply = replyingTo;
    const optimisticMsg = {
      id: tempId,
      idCanal: atualTextCanal.id,
      idRemetente: utilizador?.id || 'temp-user',
      content: conteudo,
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

    definirConversaEntrada('');
    definirReplyingTo(null);
    definirCanalMensagens((anterior) => [...anterior, optimisticMsg]);
    soundEffects.reproduzirMensagem();
    try {
      const novoMsg = await api
        .post(`/canais/${atualTextCanal.id}/mensagens`, {
          content: conteudo,
          replyToId: atualReply?.id,
        })
        .then(({ data: dados }) => dados);

      definirCanalMensagens((anterior) => anterior.map((m) => (m.id === tempId ? novoMsg : m)));
    } catch (erro) {
      definirCanalMensagens((anterior) => anterior.filter((m) => m.id !== tempId));
      definirConversaEntrada(conteudo);
      definirReplyingTo(atualReply);
      aviso({
        title: 'Mensagem não enviada',
        message: erro.message,
        type: 'error',
      });
    }
  };

  const tratarGuardarCanalSubmeter = async (evento) => {
    evento.preventDefault();
    if (!novoCanalNome.trim()) return;
    definirIsCreatingCanal(true);

    let espacoId = curso?.idEspaco || curso?.space?.id;
    const formattedNome = novoCanalNome.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      if (!espacoId) {
        const { data: dados } = await api.post(`/formador/cursos/${curso.id}/comunidade`);

        espacoId = dados.idEspaco;
        definirCurso((atual) => ({
          ...atual,
          idEspaco: espacoId,
          hasCommunity: true,
          space: {
            id: espacoId,
            channels: [],
            members: [],
          },
        }));
      }

      const canalDados = {
        name: formattedNome,
        type: novoCanalType,
        topic: novoCanalTopic,
        perguntaOrientadora: novoCanalPergunta,
      };
      const novoCanal = editingCanal
        ? await api
            .put('/espacos/' + espacoId + '/canais/' + editingCanal.id, canalDados)
            .then(({ data: dados }) => dados)
        : await api
            .post(`/espacos/${espacoId}/canais`, canalDados)
            .then(({ data: dados }) => dados);
      if (editingCanal) {
        definirPersonalizadoCanais((anterior) =>
          anterior.map((c) => (c.id === editingCanal.id ? novoCanal : c)),
        );
      } else {
        definirPersonalizadoCanais((anterior) => [...anterior, novoCanal]);
      }

      soundEffects.reproduzirSucesso();
      aviso({
        title: editingCanal ? 'Canal Atualizado!' : 'Canal Criado!',
        message: `O canal #${novoCanal.name} já está disponível no servidor do curso.`,
        type: 'success',
      });
      if (novoCanalType === 'voice') {
        definirLiveSalaNome(novoCanal.name);
        definirPendenteAderirSala(novoCanal.name);
      } else {
        definirAtualTextCanal(novoCanal);
        definirAtivoVista('channel');
      }

      definirMostrarCriarCanalJanela(false);
      definirEditingCanal(null);
      definirNovoCanalNome('');
      definirNovoCanalTopic('');
      definirNovoCanalPergunta('');
    } catch (erro) {
      aviso({
        title: 'Não foi possível guardar o canal',
        message: erro.message,
        type: 'error',
      });
    } finally {
      definirIsCreatingCanal(false);
    }
  };

  const tratarSelecionarCanal = (ch) => {
    if (atualTextCanal?.id !== ch.id) {
      definirCanalMensagens([]);
    }

    definirAtualTextCanal(ch);
    tratarVistaAlterar('channel');
    try {
      localStorage.setItem(`nexo_player_channel_${curso?.id || cursoId}`, ch.id);
    } catch {}
  };

  const isFormadorOrAdministracao = podeGerirEsteCurso(utilizador, curso);
  const todosAulas = curso?.modules?.flatMap((m) => m.lessons) || [];
  const atualAulaIndice = todosAulas.findIndex((l) => l.id === atualAula?.id);
  const anteriorAula = atualAulaIndice > 0 ? todosAulas[atualAulaIndice - 1] : null;
  const seguinteAula =
    atualAulaIndice !== -1 && atualAulaIndice < todosAulas.length - 1
      ? todosAulas[atualAulaIndice + 1]
      : null;
  const isAtualConcluido = concluidoAulaIds.has(atualAula?.id);
  if (carregamento) {
    return (
      <div className="course-player-panel">
        <span className="course-player-label"></span>A carregar o ambiente do curso...
      </div>
    );
  }

  if (!curso) {
    return <div className="course-player-panel-2">Curso não encontrado.</div>;
  }

  const cursoDocs = curso.documents || curso.resources || [];

  return (
    <div className="course-player-panel-3">
      {/* Desktop BarraLateral */}
      <div className="course-player-panel-4">
        <BarraLateralComunidadeCurso
          tituloCurso={curso.title}
          hasCommunity={Boolean(curso.hasCommunity)}
          idCurso={curso.id}
          isCreatorOrAdmin={isFormadorOrAdministracao}
          customChannels={personalizadoCanais}
          currentTextChannel={atualTextCanal}
          activeView={ativoVista}
          inLiveRoom={inLiveSala}
          liveRoomName={liveSalaNome}
          modules={curso.modules || []}
          currentLessonId={atualAula?.id}
          completedLessonIds={concluidoAulaIds}
          resourcesCount={cursoDocs.length}
          user={utilizador}
          onSelectChannel={tratarSelecionarCanal}
          onSelectLesson={(les) => {
            definirAtualAula(les);
            tratarVistaAlterar('lesson');
            try {
              localStorage.setItem(`nexo_last_lesson_${curso?.id || cursoId}`, les.id);
            } catch {}
          }}
          onSelectLiveRoom={(sala) => {
            if (inLiveSala && liveSalaNome === sala) {
              definirAtivoVista('live-room');
            } else {
              definirPendenteAderirSala(sala);
            }
          }}
          onSelectQuiz={() => tratarVistaAlterar('quiz')}
          onSelectDocuments={() => tratarVistaAlterar('documents')}
          onOpenCreateChannel={(type = 'text') => {
            definirEditingCanal(null);
            definirNovoCanalNome('');
            definirNovoCanalType(type);
            definirNovoCanalTopic('');
            definirNovoCanalPergunta('');
            definirMostrarCriarCanalJanela(true);
          }}
          onOpenEditChannel={(ch) => {
            definirEditingCanal(ch);
            definirNovoCanalNome(ch.name);
            definirNovoCanalType(ch.type);
            definirNovoCanalTopic(ch.topic || '');
            definirNovoCanalPergunta(ch.perguntaOrientadora || '');
            definirMostrarCriarCanalJanela(true);
          }}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileBarraLateralAbrir && (
        <div className="course-player-panel-5">
          <div
            className="course-player-panel-6"
            onClick={() => definirMobileBarraLateralAbrir(false)}
          />
          <div className="course-player-panel-7">
            <BarraLateralComunidadeCurso
              tituloCurso={curso.title}
              hasCommunity={Boolean(curso.hasCommunity)}
              idCurso={curso.id}
              isCreatorOrAdmin={isFormadorOrAdministracao}
              customChannels={personalizadoCanais}
              currentTextChannel={atualTextCanal}
              activeView={ativoVista}
              inLiveRoom={inLiveSala}
              liveRoomName={liveSalaNome}
              modules={curso.modules || []}
              currentLessonId={atualAula?.id}
              completedLessonIds={concluidoAulaIds}
              resourcesCount={cursoDocs.length}
              user={utilizador}
              onCloseMobile={() => definirMobileBarraLateralAbrir(false)}
              onSelectChannel={(ch) => {
                tratarSelecionarCanal(ch);
                definirMobileBarraLateralAbrir(false);
              }}
              onSelectLesson={(les) => {
                definirAtualAula(les);
                tratarVistaAlterar('lesson');
                try {
                  localStorage.setItem(`nexo_last_lesson_${curso?.id || cursoId}`, les.id);
                } catch {}

                definirMobileBarraLateralAbrir(false);
              }}
              onSelectLiveRoom={(sala) => {
                if (inLiveSala && liveSalaNome === sala) {
                  definirAtivoVista('live-room');
                } else {
                  definirPendenteAderirSala(sala);
                }

                definirMobileBarraLateralAbrir(false);
              }}
              onSelectQuiz={() => {
                tratarVistaAlterar('quiz');
                definirMobileBarraLateralAbrir(false);
              }}
              onSelectDocuments={() => {
                tratarVistaAlterar('documents');
                definirMobileBarraLateralAbrir(false);
              }}
              onOpenCreateChannel={(type = 'text') => {
                definirMobileBarraLateralAbrir(false);
                definirEditingCanal(null);
                definirNovoCanalNome('');
                definirNovoCanalType(type);
                definirNovoCanalTopic('');
                definirNovoCanalPergunta('');
                definirMostrarCriarCanalJanela(true);
              }}
              onOpenEditChannel={(ch) => {
                definirMobileBarraLateralAbrir(false);
                definirEditingCanal(ch);
                definirNovoCanalNome(ch.name);
                definirNovoCanalType(ch.type);
                definirNovoCanalTopic(ch.topic || '');
                definirNovoCanalPergunta(ch.perguntaOrientadora || '');
                definirMostrarCriarCanalJanela(true);
              }}
            />
          </div>
        </div>
      )}

      <main className="course-player-main">
        {(curso.certificate ||
          (todosAulas.length > 0 && todosAulas.every((aula) => concluidoAulaIds.has(aula.id)))) && (
          <CursoConclusao
            idCurso={curso.id}
            certificate={curso.certificate}
          />
        )}
        <header className="course-player-header">
          <div className="course-player-panel-8">
            <button
              type="button"
              onClick={() => definirMobileBarraLateralAbrir(true)}
              className="course-player-button"
              title="Abrir menu do curso"
              aria-label="Abrir menu do curso"
            >
              <Menu className="course-player-menu" />
            </button>

            {ativoVista === 'channel' && (
              <div className="course-player-panel-9">
                {atualTextCanal?.type === 'qa' ? (
                  <HelpCircle className="course-player-help-circle" />
                ) : atualTextCanal?.type === 'showcase' ? (
                  <Sparkles className="course-player-sparkles" />
                ) : atualTextCanal?.modoAcesso === 'announcement' ||
                  atualTextCanal?.name?.includes('anuncio') ? (
                  <Lock className="course-player-lock" />
                ) : (
                  <Hash className="course-player-help-circle" />
                )}
                <span className="course-player-label-2">#{atualTextCanal?.name || 'geral'}</span>
                {atualTextCanal?.topic && (
                  <span className="course-player-label-3">— {atualTextCanal.topic}</span>
                )}
                {(atualTextCanal?.modoAcesso === 'announcement' ||
                  atualTextCanal?.name?.includes('anuncio')) && (
                  <span className="course-player-label-4">Apenas Leitura</span>
                )}
              </div>
            )}

            {ativoVista === 'lesson' && (
              <div className="course-player-panel-10">
                <Play className="course-player-help-circle" />
                <span className="course-player-label-2">{atualAula?.title || 'Aula em Vídeo'}</span>
              </div>
            )}

            {ativoVista === 'live-room' && (
              <div className="course-player-panel-11">
                <Radio className="course-player-radio" />
                <span className="course-player-label-2">{liveSalaNome}</span>
              </div>
            )}

            {ativoVista === 'quiz' && (
              <div className="course-player-panel-12">
                <HelpCircle className="course-player-help-circle-2" />
                <span className="course-player-label-2">Quizzes</span>
              </div>
            )}

            {ativoVista === 'documents' && (
              <div className="course-player-panel-12">
                <FileCode2 className="course-player-help-circle" />
                <span className="course-player-label-2">Documentos</span>
              </div>
            )}
          </div>

          <div className="course-player-panel-13">
            {ativoVista === 'channel' && (
              <button
                type="button"
                onClick={() => definirMostrarMembrosListar((anterior) => !anterior)}
                className={`course-player-button-2 ${mostrarMembrosListar ? 'course-player-button-3' : 'course-player-button-4'}`}
                title={
                  mostrarMembrosListar ? 'Ocultar Colegas e Instrutor' : 'Ver Colegas e Instrutor'
                }
                aria-label="Alternar lista de colegas"
              >
                <Users className="course-player-users" />
                <span className="course-player-label-5">Membros</span>
              </button>
            )}

            {isFormadorOrAdministracao && (
              <Link
                to={`/formador/cursos/${curso.id}/editar?step=3`}
                className="course-player-link"
                title="Adicionar ou gerir aulas e módulos"
              >
                <Settings className="course-player-settings" />
                <span>Editar Aulas</span>
              </Link>
            )}

            {ativoVista === 'lesson' && atualAula && (
              <button
                onClick={tratarMarcarConcluir}
                className={`course-player-button-5 ${isAtualConcluido ? 'course-player-button-6' : 'course-player-button-7'}`}
              >
                {isAtualConcluido ? (
                  <>
                    <Check className="course-player-check" />
                    <span className="course-player-label-6">Concluída</span>
                    <span className="course-player-label-7">Feito</span>
                  </>
                ) : (
                  <>
                    <span className="course-player-label-6">Marcar como Concluída</span>
                    <span className="course-player-label-7">Concluir</span>
                  </>
                )}
              </button>
            )}

            {inLiveSala && ativoVista !== 'live-room' && (
              <button
                onClick={() => definirAtivoVista('live-room')}
                className="course-player-button-8"
              >
                <Video className="course-player-users" />
                <span>Ver Transmissão</span>
              </button>
            )}
          </div>
        </header>

        {ativoVista === 'live-room' && inLiveSala && (
          <div className="course-player-panel-14">
            <ChamadaPalco
              key={`${cursoId}_${liveSalaNome || 'live'}`}
              roomName={liveSalaNome || 'Sala ao Vivo do Curso'}
              roomId={
                personalizadoCanais.find(
                  (canal) => canal.name === liveSalaNome && canal.type === 'voice',
                )?.id
              }
              isStageMode={
                liveSalaNome.toLowerCase().includes('dúvida') ||
                liveSalaNome.toLowerCase().includes('duvidas') ||
                liveSalaNome.toLowerCase().includes('mentoria')
              }
              initialMuted={liveSalaPreferencias.startMuted}
              initialCameraOn={!liveSalaPreferencias.startVideoOff}
              onDisconnect={() => {
                definirInLiveSala(false);
                terminarChamada();

                const fallback =
                  personalizadoCanais.find((c) => c.type !== 'voice') || personalizadoCanais[0];
                if (fallback) {
                  definirAtualTextCanal(fallback);
                  tratarVistaAlterar('channel');
                } else {
                  tratarVistaAlterar('lesson');
                }
              }}
            />
          </div>
        )}

        {ativoVista === 'channel' && atualTextCanal && (
          <CursoCanalConversa
            channel={atualTextCanal}
            messages={canalMensagens}
            chatInput={conversaEntrada}
            onChatInputChange={definirConversaEntrada}
            onSendMessage={tratarEnviarConversaMensagem}
            replyingTo={replyingTo}
            onSetReplyingTo={definirReplyingTo}
            onToggleResolve={
              isFormadorOrAdministracao
                ? async (msgId) => {
                    try {
                      const resultado = await api
                        .post('/mensagens/' + msgId + '/resolver')
                        .then(({ data: dados }) => dados);

                      definirCanalMensagens((anterior) =>
                        anterior.map((m) =>
                          m.id === msgId
                            ? {
                                ...m,
                                isResolved: resultado.isResolved,
                              }
                            : m,
                        ),
                      );
                    } catch (erro) {
                      aviso({
                        title: 'Não foi possível atualizar a dúvida',
                        message: erro.message,
                        type: 'error',
                      });
                    }
                  }
                : undefined
            }
            resolvedMessageIds={resolvedMensagemIds}
            showMembersList={mostrarMembrosListar}
            onToggleMembersList={() => definirMostrarMembrosListar(!mostrarMembrosListar)}
            isCreatorOrAdmin={isFormadorOrAdministracao}
            creatorUser={curso.creator}
            currentUserId={utilizador?.id}
            onInsertGuidingPrompt={(prompt) => definirConversaEntrada(`${prompt}\n\n`)}
            classmates={curso?.classmates || []}
          />
        )}

        {ativoVista === 'lesson' &&
          (!atualAula ? (
            <div className="course-player-panel-15">
              <div className="course-player-panel-16">
                <BookOpen className="course-player-book-open" />
              </div>
              <h3 className="course-player-subheading">Nenhuma aula publicada ainda</h3>
              <p className="course-player-description">
                {isFormadorOrAdministracao
                  ? 'Este curso ainda não possui aulas adicionadas. Clique no botão abaixo para adicionar módulos e aulas no editor do curso.'
                  : 'O instrutor ainda está a preparar os conteúdos deste curso. Fique atento às novidades!'}
              </p>
              {isFormadorOrAdministracao && (
                <Link
                  to={`/formador/cursos/${curso.id}/edit?step=3`}
                  className="course-player-link-2"
                >
                  <Plus className="course-player-users" />
                  <span>Adicionar Aulas & Módulos</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="course-player-panel-17 custom-scrollbar">
              {atualAula?.type === 'quiz' && (
                <CursoQuestionarioVista
                  key={atualAula.id}
                  idAula={atualAula.id}
                  onCompleteQuiz={() => !isAtualConcluido && tratarMarcarConcluir()}
                  onNextLesson={seguinteAula ? () => definirAtualAula(seguinteAula) : undefined}
                />
              )}

              {atualAula?.type === 'resource' && (
                <>
                  <p className="course-player-description">
                    {typeof atualAula.content === 'string' ? atualAula.content : ''}
                  </p>
                  <AulaRecursosSeparador
                    resources={
                      atualAula.resources ||
                      (seguroExternoUrl(atualAula.content)
                        ? [
                            {
                              title: atualAula.title,
                              url: seguroExternoUrl(atualAula.content),
                            },
                          ]
                        : curso.documents || [])
                    }
                  />
                </>
              )}
              {atualAula?.type === 'project' && (
                <ProjetoSubmissao
                  key={atualAula.id}
                  idAula={atualAula.id}
                  title={atualAula.title}
                  description={atualAula.content}
                  onApproved={tratarMarcarConcluir}
                />
              )}
              {atualAula?.type === 'text' && (
                <div className="course-player-panel-33">
                  <div className="course-player-panel-34">
                    <div>
                      <h2 className="course-player-heading-2">{atualAula.title}</h2>
                      <span className="course-player-label-13">
                        Guia de Estudo & Artigo Técnico
                      </span>
                    </div>
                  </div>

                  {(atualAula.richArticle?.calloutText || atualAula.calloutText) && (
                    <div className="course-player-panel-35">
                      <Lightbulb className="course-player-lightbulb" />
                      <div>
                        <p className="course-player-description-5">Dica Pro do Instrutor:</p>
                        <p>{atualAula.richArticle?.calloutText || atualAula.calloutText}</p>
                      </div>
                    </div>
                  )}

                  <div className="course-player-panel-36">
                    {atualAula.content || 'Sem conteúdo adicional nesta aula.'}
                  </div>

                  {Array.isArray(atualAula.richArticle?.checklist || atualAula.checklist) &&
                    (atualAula.richArticle?.checklist || atualAula.checklist).length > 0 && (
                      <div className="course-player-panel-37">
                        <span className="course-player-label-14">Checklist de Aprendizagem:</span>
                        {(atualAula.richArticle?.checklist || atualAula.checklist).map((chk) => (
                          <label
                            key={chk.id || chk}
                            onClick={() =>
                              definirSelecionadoItens((anterior) => ({
                                ...anterior,
                                [chk.id || chk]: !anterior[chk.id || chk],
                              }))
                            }
                            className="course-player-field-label-2"
                          >
                            {selecionadoItens[chk.id || chk] ? (
                              <CheckSquare className="course-player-check-square" />
                            ) : (
                              <Square className="course-player-square" />
                            )}
                            <span
                              className={
                                selecionadoItens[chk.id || chk]
                                  ? 'course-player-label-15'
                                  : 'course-player-label-16'
                              }
                            >
                              {chk.text || chk}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                </div>
              )}

              <div className="course-player-panel-38">
                {anteriorAula ? (
                  <button
                    onClick={() => definirAtualAula(anteriorAula)}
                    className="course-player-button-12"
                  >
                    <ChevronLeft className="course-player-chevron-left" />
                    <span className="course-player-label-17">Anterior: {anteriorAula.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                {seguinteAula ? (
                  <button
                    onClick={() => definirAtualAula(seguinteAula)}
                    className="course-player-button-13"
                  >
                    <span className="course-player-label-17">Próxima: {seguinteAula.title}</span>
                    <ChevronRight className="course-player-chevron-left" />
                  </button>
                ) : (
                  <button
                    onClick={tratarMarcarConcluir}
                    className="course-player-button-14"
                  >
                    <Award className="course-player-chevron-left" />
                    <span>Concluir última aula</span>
                  </button>
                )}
              </div>

              <div>
                <div className="course-player-panel-39 no-scrollbar">
                  {[
                    {
                      id: 'overview',
                      label: 'Visão Geral da Aula',
                    },
                    {
                      id: 'resources',
                      label: `Recursos (${cursoDocs.length})`,
                    },
                    {
                      id: 'notes',
                      label: 'Notas Pessoais',
                    },
                  ].map((separador) => (
                    <button
                      key={separador.id}
                      onClick={() => definirAtivoAulaSeparador(separador.id)}
                      className={`course-player-button-15 ${ativoAulaSeparador === separador.id ? 'course-player-button-16' : 'course-player-button-17'}`}
                    >
                      {separador.label}
                    </button>
                  ))}
                </div>

                <div className="course-player-panel-40">
                  {ativoAulaSeparador === 'overview' && (
                    <div className="course-player-panel-41">
                      {atualAula?.content || 'Sem notas ou introdução adicional para esta aula.'}
                    </div>
                  )}

                  {ativoAulaSeparador === 'notes' && <AulaNotasSeparador idAula={atualAula?.id} />}

                  {ativoAulaSeparador === 'resources' && (
                    <AulaRecursosSeparador resources={cursoDocs} />
                  )}
                </div>
              </div>
            </div>
          ))}

        {ativoVista === 'quiz' && (
          <CursoQuestionarioVista
            lessons={(curso.modules || [])
              .flatMap((m) => m.lessons || [])
              .filter((l) => l.type === 'quiz')}
          />
        )}

        {ativoVista === 'documents' && <CursoDocumentosVista documents={cursoDocs} />}
      </main>

      {mostrarCriarCanalJanela && (
        <Janela
          isOpen={mostrarCriarCanalJanela}
          onClose={() => {
            definirMostrarCriarCanalJanela(false);
            definirEditingCanal(null);
          }}
          title={
            editingCanal
              ? `Configurar Canal #${editingCanal.name}`
              : 'Criar Novo Canal no Servidor do Curso'
          }
        >
          <form
            onSubmit={tratarGuardarCanalSubmeter}
            className="course-player-form-2"
          >
            {!curso?.idEspaco && !curso?.space?.id && (
              <p>
                Ao criar o primeiro canal, ativa a comunidade deste curso para chats e chamadas.
              </p>
            )}
            <div>
              <label className="course-player-field-label-3">Sugestões Rápidas (1-Clique)</label>
              <div className="course-player-panel-32">
                {[
                  {
                    name: 'anuncios',
                    type: 'text',
                    label: 'Anúncios',
                    topic: 'Avisos importantes e comunicados da turma',
                  },
                  {
                    name: 'geral',
                    type: 'text',
                    label: 'Geral',
                    topic: 'Conversas gerais e apresentações dos membros',
                  },
                  {
                    name: 'duvidas-aulas',
                    type: 'qa',
                    label: 'Dúvidas',
                    topic: 'Espaço para colocar dúvidas de código e exercícios',
                  },
                  {
                    name: 'projetos-showcase',
                    type: 'showcase',
                    label: 'Projetos',
                    topic: 'Partilha de repositórios GitHub e demos',
                  },
                  {
                    name: 'materiais-apoio',
                    type: 'text',
                    label: 'Materiais',
                    topic: 'Links de apoio, PDFs e documentação recomendada',
                  },
                  {
                    name: 'mentoria-ao-vivo',
                    type: 'voice',
                    label: 'Mentoria Voz',
                    topic: 'Sala de conferência ao vivo e mentoria',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      definirNovoCanalNome(tmpl.name);
                      definirNovoCanalType(tmpl.type);
                      definirNovoCanalTopic(tmpl.topic);
                    }}
                    className="course-player-button-18"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="course-player-field-label-4">Tipo do Canal</label>
              <div className="course-player-panel-42">
                {[
                  {
                    id: 'text',
                    label: 'Texto & Conversa',
                    desc: 'Convívio geral',
                  },
                  {
                    id: 'qa',
                    label: 'Dúvidas & Q&A',
                    desc: 'Resolução técnica',
                  },
                  {
                    id: 'showcase',
                    label: 'Showcase',
                    desc: 'Projetos da turma',
                  },
                  {
                    id: 'voice',
                    label: 'Sala de Voz',
                    desc: 'Live e áudio',
                  },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => definirNovoCanalType(t.id)}
                    className={`course-player-button-19 ${novoCanalType === t.id ? 'course-player-button-20' : 'course-player-button-21'}`}
                  >
                    <p
                      className={`course-player-description-6 ${novoCanalType === t.id ? 'course-player-description-7' : 'course-player-description-8'}`}
                    >
                      {t.label}
                    </p>
                    <p
                      className={`course-player-description-9 ${novoCanalType === t.id ? 'course-player-description-10' : 'course-player-description-11'}`}
                    >
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="course-player-field-label-5">Nome do Canal (URL Slug)</label>
              <div className="course-player-panel-43">
                <span className="course-player-label-18">#</span>
                <input
                  type="text"
                  required
                  placeholder="ex: duvidas-modulo-2 ou projetos-finais"
                  value={novoCanalNome}
                  onChange={(evento) => definirNovoCanalNome(evento.target.value)}
                  className="course-player-field-2"
                />
              </div>
            </div>

            <div>
              <label className="course-player-field-label-5">Descrição do Objetivo do Canal</label>
              <input
                type="text"
                placeholder="ex: Canal dedicado a tirar dúvidas técnicas sobre a matéria do módulo"
                value={novoCanalTopic}
                onChange={(evento) => definirNovoCanalTopic(evento.target.value)}
                className="course-player-field-3"
              />
            </div>

            <div className="course-player-panel-44">
              <button
                type="button"
                onClick={() => {
                  definirMostrarCriarCanalJanela(false);
                  definirEditingCanal(null);
                }}
                className="course-player-button-22"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingCanal}
                className="course-player-button-23"
              >
                {isCreatingCanal ? 'A guardar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Janela>
      )}

      {/* Janela de confirmação com informações principais antes de entrar na chamada */}
      <AderirChamadaJanela
        isOpen={Boolean(pendenteAderirSala)}
        roomName={pendenteAderirSala}
        contextTitle={curso?.title}
        onClose={() => definirPendenteAderirSala(null)}
        onConfirm={({ startMuted: iniciarMuted, startVideoOff: iniciarVideoOff }) => {
          const sala = pendenteAderirSala;
          if (ativoChamada) {
            terminarChamada();
          }

          definirLiveSalaPreferencias({
            startMuted: iniciarMuted,
            startVideoOff: iniciarVideoOff,
          });

          const salaId = personalizadoCanais.find(
            (canal) => canal.name === sala && canal.type === 'voice',
          )?.id;
          if (!salaId) {
            aviso({
              title: 'Sala indisponível',
              message: 'Atualize os canais e tente novamente.',
              type: 'error',
            });
            definirPendenteAderirSala(null);

            return;
          }

          definirLiveSalaNome(sala);
          definirInLiveSala(true);
          definirAtivoVista('live-room');
          soundEffects.reproduzirAderirChamada();
          iniciarChamada({
            roomId: salaId,
            roomName: sala,
            contextTitle: curso?.title || 'Curso',
            idCurso: cursoId,
            returnUrl: `/aprender/${cursoId}`,
          });
          definirPendenteAderirSala(null);
        }}
      />
    </div>
  );
};

export default CursoLeitorPagina;
