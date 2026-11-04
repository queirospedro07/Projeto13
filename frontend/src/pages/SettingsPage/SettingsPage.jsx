import './SettingsPage.css';
import { PagamentoHistorico } from '../../components/PaymentHistory';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuSun as Sun,
  LuMoon as Moon,
  LuMonitor as Monitor,
  LuCheck as Check,
  LuLogOut as LogOut,
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuShieldCheck as ShieldCheck,
  LuEye as Eye,
  LuGlobe as Globe,
  LuMessageSquare as MessageSquare,
  LuBell as Bell,
} from 'react-icons/lu';
import { Cartao } from '../../components/Card';
import { Botao } from '../../components/Button';
import { Distintivo } from '../../components/Badge';
import { Seletor } from '../../components/Select';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useTema } from '../../contexts/ThemeContext';
import { useAvisos } from '../../components/Alerts';
import { api } from '../../services/api';

export const DefinicoesPagina = () => {
  const {
    user: utilizador,
    terminarSessao: terminarSessao,
    atualizarUtilizador,
  } = useAutenticacao();
  const { theme: tema, setTheme: definirTema } = useTema();
  const { toast: aviso } = useAvisos();
  const [emailNotifs, definirEmailNotifs] = useState(() => {
    return localStorage.getItem(`nexo_notif_email_${utilizador?.id}`) !== 'false';
  });
  const [cursoUpdates, definirCursoUpdates] = useState(() => {
    return localStorage.getItem(`nexo_notif_course_${utilizador?.id}`) !== 'false';
  });
  const [conversaMentions, definirConversaMentions] = useState(() => {
    return localStorage.getItem(`nexo_notif_mentions_${utilizador?.id}`) !== 'false';
  });

  // Perfil Privacy & Visibility settings
  const [isPublico, definirIsPublico] = useState(utilizador?.profile?.ePublico !== false);
  const [mostrarBiografia, definirMostrarBiografia] = useState(
    utilizador?.profile?.mostrarBiografia !== false,
  );
  const [mostrarLocalizacao, definirMostrarLocalizacao] = useState(
    utilizador?.profile?.mostrarLocalizacao !== false,
  );
  const [mostrarRedesSociais, definirMostrarRedesSociais] = useState(
    utilizador?.profile?.mostrarRedesSociais !== false,
  );
  const [mostrarEstatisticas, definirMostrarEstatisticas] = useState(
    utilizador?.profile?.mostrarEstatisticas !== false,
  );
  const [mostrarCursos, definirMostrarCursos] = useState(
    utilizador?.profile?.mostrarCursos !== false,
  );

  // Direct Messages & Permissions settings
  const [mensagemDiretaPermission, definirMensagemDiretaPermission] = useState(() => {
    return localStorage.getItem(`nexo_dm_permission_${utilizador?.id}`) || 'FRIENDS_ONLY';
  });
  const [exigirMensagemRequest, definirExigirMensagemRequest] = useState(() => {
    return localStorage.getItem(`nexo_msg_request_${utilizador?.id}`) !== 'false';
  });
  const [amigosListarVisibilidade, definirAmigosListarVisibilidade] = useState(() => {
    return localStorage.getItem(`nexo_friends_visibility_${utilizador?.id}`) || 'FRIENDS';
  });
  const [onlineEstadoVisibilidade, definirOnlineEstadoVisibilidade] = useState(() => {
    return localStorage.getItem(`nexo_online_visibility_${utilizador?.id}`) || 'PUBLIC';
  });
  const [mostrarLerReceipts, definirMostrarLerReceipts] = useState(() => {
    return localStorage.getItem(`nexo_read_receipts_${utilizador?.id}`) !== 'false';
  });
  const [isSavingPrivacidade, definirIsSavingPrivacidade] = useState(false);
  const [isSavingMensagens, definirIsSavingMensagens] = useState(false);

  useEffect(() => {
    if (utilizador?.id) {
      definirMensagemDiretaPermission(
        localStorage.getItem(`nexo_dm_permission_${utilizador.id}`) || 'FRIENDS_ONLY',
      );
      definirExigirMensagemRequest(
        localStorage.getItem(`nexo_msg_request_${utilizador.id}`) !== 'false',
      );
      definirAmigosListarVisibilidade(
        localStorage.getItem(`nexo_friends_visibility_${utilizador.id}`) || 'FRIENDS',
      );
      definirOnlineEstadoVisibilidade(
        localStorage.getItem(`nexo_online_visibility_${utilizador.id}`) || 'PUBLIC',
      );
      definirMostrarLerReceipts(
        localStorage.getItem(`nexo_read_receipts_${utilizador.id}`) !== 'false',
      );
      definirEmailNotifs(localStorage.getItem(`nexo_notif_email_${utilizador.id}`) !== 'false');
      definirCursoUpdates(localStorage.getItem(`nexo_notif_course_${utilizador.id}`) !== 'false');
      definirConversaMentions(
        localStorage.getItem(`nexo_notif_mentions_${utilizador.id}`) !== 'false',
      );
    }

    if (utilizador?.profile) {
      definirIsPublico(utilizador.profile.ePublico !== false);
      definirMostrarBiografia(utilizador.profile.mostrarBiografia !== false);
      definirMostrarLocalizacao(utilizador.profile.mostrarLocalizacao !== false);
      definirMostrarRedesSociais(utilizador.profile.mostrarRedesSociais !== false);
      definirMostrarEstatisticas(utilizador.profile.mostrarEstatisticas !== false);
      definirMostrarCursos(utilizador.profile.mostrarCursos !== false);
    }
  }, [utilizador]);

  const tratarGuardarPrivacidade = async () => {
    definirIsSavingPrivacidade(true);
    try {
      await api
        .put('/autenticacao/perfil', {
          ePublico: isPublico,
          mostrarBiografia: mostrarBiografia,
          mostrarLocalizacao: mostrarLocalizacao,
          mostrarRedesSociais: mostrarRedesSociais,
          mostrarEstatisticas: mostrarEstatisticas,
          mostrarCursos: mostrarCursos,
        })
        .then(({ data: dados }) => dados);
      await atualizarUtilizador();
      aviso({
        title: 'Privacidade Atualizada',
        message: 'A visibilidade dos elementos do seu perfil foi guardada com sucesso.',
        type: 'success',
      });
    } catch (erro) {
      aviso({
        title: 'Erro ao guardar',
        message: erro.message || 'Não foi possível guardar as definições de visibilidade.',
        type: 'error',
      });
    } finally {
      definirIsSavingPrivacidade(false);
    }
  };

  const tratarGuardarMensagensPermissoes = () => {
    definirIsSavingMensagens(true);
    try {
      if (utilizador?.id) {
        localStorage.setItem(`nexo_dm_permission_${utilizador.id}`, mensagemDiretaPermission);
        localStorage.setItem(`nexo_msg_request_${utilizador.id}`, String(exigirMensagemRequest));
        localStorage.setItem(`nexo_friends_visibility_${utilizador.id}`, amigosListarVisibilidade);
        localStorage.setItem(`nexo_online_visibility_${utilizador.id}`, onlineEstadoVisibilidade);
        localStorage.setItem(`nexo_read_receipts_${utilizador.id}`, String(mostrarLerReceipts));
      }

      aviso({
        title: 'Permissões Guardadas',
        message:
          'As suas definições de mensagens, recibos de leitura e privacidade de contactos foram atualizadas.',
        type: 'success',
      });
    } catch {
      aviso({
        title: 'Erro',
        message: 'Falha ao guardar preferências locais.',
        type: 'error',
      });
    } finally {
      definirIsSavingMensagens(false);
    }
  };

  const tratarGuardarPreferencias = () => {
    if (utilizador?.id) {
      localStorage.setItem(`nexo_notif_email_${utilizador.id}`, String(emailNotifs));
      localStorage.setItem(`nexo_notif_course_${utilizador.id}`, String(cursoUpdates));
      localStorage.setItem(`nexo_notif_mentions_${utilizador.id}`, String(conversaMentions));
    }

    aviso({
      title: 'Notificações Atualizadas',
      message: 'As suas preferências de notificações foram atualizadas com sucesso.',
      type: 'success',
    });
  };

  return (
    <div className="settings-page-panel">
      <div className="settings-page-panel-2">
        <div className="settings-page-panel-3">
          <Distintivo
            size="md"
            variant="primary"
          >
            Definições
          </Distintivo>
        </div>
        <h1 className="settings-page-title">Definições da Conta</h1>
        <p className="settings-page-description">
          Gira as suas preferências visuais, permissões de mensagens, privacidade e sessão.
        </p>
      </div>

      {/* 1. Aparência & Tema */}
      <Cartao className="settings-page-card">
        <h3 className="settings-page-subheading">Aparência & Tema</h3>
        <p className="settings-page-description-2">
          Escolha o modo de apresentação visual da plataforma.
        </p>

        <div className="settings-page-panel-4">
          <button
            onClick={() => definirTema('light')}
            className={`settings-page-button ${tema === 'light' ? 'settings-page-button-2' : 'settings-page-button-3'}`}
          >
            <div className="settings-page-panel-5">
              <Sun className="settings-page-sun" />
              {tema === 'light' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Modo Claro (Padrão)</p>
              <p className="settings-page-description-4">Fundo branco puro & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => definirTema('dark')}
            className={`settings-page-button ${tema === 'dark' ? 'settings-page-button-2' : 'settings-page-button-3'}`}
          >
            <div className="settings-page-panel-5">
              <Moon className="settings-page-moon" />
              {tema === 'dark' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Modo Escuro (Preto OLED)</p>
              <p className="settings-page-description-4">Preto puro (#000000) & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => definirTema('system')}
            className={`settings-page-button ${tema === 'system' ? 'settings-page-button-2' : 'settings-page-button-3'}`}
          >
            <div className="settings-page-panel-5">
              <Monitor className="settings-page-monitor" />
              {tema === 'system' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Sincronizado com o Sistema</p>
              <p className="settings-page-description-4">Segue as preferências do sistema</p>
            </div>
          </button>
        </div>
      </Cartao>

      {/* 2. Permissões de Contacto & Mensagens Diretas (DMs) */}
      <Cartao className="settings-page-card-2">
        <div className="settings-page-panel-6">
          <h3 className="settings-page-subheading-2">
            <MessageSquare className="settings-page-check" />
            <span>Permissões de Contacto & Mensagens Diretas (DMs)</span>
          </h3>
          <p className="settings-page-description-5">
            Defina quem tem autorização para lhe enviar mensagens diretas e como funcionam os
            pedidos de conversa.
          </p>
        </div>

        <div className="settings-page-panel-7">
          {/* Quem pode enviar DMs */}
          <div className="settings-page-panel-8">
            <div className="settings-page-panel-9">
              <label
                htmlFor="dm-permission"
                className="settings-page-field-label"
              >
                Quem me pode enviar Mensagens Diretas
              </label>
              <p className="settings-page-description-6">
                Controlo restrito para evitar mensagens indesejadas de desconhecidos.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Seletor
                id="dm-permission"
                value={mensagemDiretaPermission}
                onChange={(evento) => definirMensagemDiretaPermission(evento.target.value)}
                className="settings-page-select"
              >
                <option
                  value="FRIENDS_ONLY"
                  className="settings-page-option"
                >
                  Apenas Amigos e Conexões Aceites
                </option>
                <option
                  value="CLASSMATES"
                  className="settings-page-option"
                >
                  Amigos, Colegas de Curso e Formadores
                </option>
                <option
                  value="ALL"
                  className="settings-page-option"
                >
                  Todos os utilizadores registados
                </option>
                <option
                  value="NONE"
                  className="settings-page-option"
                >
                  Ninguém (Desativar DMs privadas)
                </option>
              </Seletor>
            </div>
          </div>

          {/* Modo Pedido de Mensagem */}
          <div className="settings-page-panel-11">
            <div className="settings-page-panel-12">
              <label
                htmlFor="req-msg-toggle"
                className="settings-page-field-label-2"
              >
                Exigir Pedido Prévio para não-amigos
              </label>
              <p className="settings-page-description-6">
                Quando ativado, os utilizadores que não estão na sua lista de amigos devem enviar
                primeiro uma solicitação de conversa. Apenas após aceitar o pedido é que as
                mensagens diretas são entregues na sua caixa principal.
              </p>
            </div>
            <input
              id="req-msg-toggle"
              type="checkbox"
              checked={exigirMensagemRequest}
              onChange={(evento) => definirExigirMensagemRequest(evento.target.checked)}
              className="settings-page-field"
            />
          </div>

          {/* Visibilidade da Lista de Amigos */}
          <div className="settings-page-panel-13">
            <div className="settings-page-panel-9">
              <label
                htmlFor="friends-vis"
                className="settings-page-field-label"
              >
                Visibilidade da Lista de Amigos e Conexões
              </label>
              <p className="settings-page-description-6">
                Quem pode visualizar os seus amigos e colegas conectados no seu perfil.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Seletor
                id="friends-vis"
                value={amigosListarVisibilidade}
                onChange={(evento) => definirAmigosListarVisibilidade(evento.target.value)}
                className="settings-page-select"
              >
                <option
                  value="PUBLIC"
                  className="settings-page-option"
                >
                  Público (Todos os utilizadores)
                </option>
                <option
                  value="FRIENDS"
                  className="settings-page-option"
                >
                  Apenas os Meus Amigos
                </option>
                <option
                  value="PRIVATE"
                  className="settings-page-option"
                >
                  Privado (Apenas eu)
                </option>
              </Seletor>
            </div>
          </div>

          {/* Estado de Presença / Atividade */}
          <div className="settings-page-panel-13">
            <div className="settings-page-panel-9">
              <label
                htmlFor="online-vis"
                className="settings-page-field-label"
              >
                Estado de Presença (Online / Atividade)
              </label>
              <p className="settings-page-description-6">
                Mostrar quando se encontra online na plataforma e em chamadas de mentoria.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Seletor
                id="online-vis"
                value={onlineEstadoVisibilidade}
                onChange={(evento) => definirOnlineEstadoVisibilidade(evento.target.value)}
                className="settings-page-select"
              >
                <option
                  value="PUBLIC"
                  className="settings-page-option"
                >
                  Mostrar a Todos (Online)
                </option>
                <option
                  value="FRIENDS"
                  className="settings-page-option"
                >
                  Apenas para Amigos
                </option>
                <option
                  value="HIDDEN"
                  className="settings-page-option"
                >
                  Invisível / Ocultar Sempre
                </option>
              </Seletor>
            </div>
          </div>

          {/* Recibos de Leitura ("Dar Vista") */}
          <div className="settings-page-panel-11">
            <div className="settings-page-panel-12">
              <label
                htmlFor="read-receipts-toggle"
                className="settings-page-field-label-2"
              >
                Recibos de Leitura (&quot;Dar Vista&quot;)
              </label>
              <p className="settings-page-description-6">
                Permitir que os seus contactos vejam quando leu as mensagens deles (duplo visto azul
                e hora de visualização) e ver quando as suas mensagens foram vistas.
              </p>
            </div>
            <input
              id="read-receipts-toggle"
              type="checkbox"
              checked={mostrarLerReceipts}
              onChange={(evento) => definirMostrarLerReceipts(evento.target.checked)}
              className="settings-page-field"
            />
          </div>
        </div>

        <Botao
          onClick={tratarGuardarMensagensPermissoes}
          isLoading={isSavingMensagens}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Permissões de Mensagens
        </Botao>
      </Cartao>

      {/* 3. Privacidade e Visibilidade do Perfil */}
      <Cartao className="settings-page-card-2">
        <div className="settings-page-panel-14">
          <div>
            <h3 className="settings-page-subheading-2">
              <ShieldCheck className="settings-page-check" />
              <span>Privacidade & Elementos do Perfil</span>
            </h3>
            <p className="settings-page-description-5">
              Escolha exatamente o que os outros utilizadores podem ver na sua página pública de
              perfil.
            </p>
          </div>
          <Link
            to={`/perfil/${utilizador?.username || utilizador?.id}`}
            className="settings-page-link"
          >
            <Botao
              as="span"
              variant="outline"
              size="sm"
              leftIcon={<Eye className="settings-page-eye" />}
              className="settings-page-button-5"
            >
              Ver Meu Perfil
            </Botao>
          </Link>
        </div>

        <div className="settings-page-panel-15">
          {/* Perfil Público Geral */}
          <div className="settings-page-panel-16">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-7">
                <Globe className="settings-page-globe" />
                <span>Perfil Público Aberto</span>
              </p>
              <p className="settings-page-description-4">
                Se desativado, o seu perfil ficará privado e invisível para visitantes externos e
                outros alunos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublico}
              onChange={(evento) => definirIsPublico(evento.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Biografia */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Biografia e Apresentação</p>
              <p className="settings-page-description-4">
                Exibir o texto da sua apresentação pessoal no cabeçalho do perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mostrarBiografia}
              onChange={(evento) => definirMostrarBiografia(evento.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Localização */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Localização / Cidade</p>
              <p className="settings-page-description-4">
                Exibir a cidade ou país configurado no perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mostrarLocalizacao}
              onChange={(evento) => definirMostrarLocalizacao(evento.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Redes Sociais */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Redes Sociais & Links Externos</p>
              <p className="settings-page-description-4">
                Exibir botões de ligação para GitHub, LinkedIn, Twitter/X e Website pessoal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mostrarRedesSociais}
              onChange={(evento) => definirMostrarRedesSociais(evento.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Cursos Matriculados */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">
                Mostrar Cursos e Certificados Concluídos
              </p>
              <p className="settings-page-description-4">
                Permitir que outros membros vejam a lista de formações em que participou e
                certificados oficiais.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mostrarCursos}
              onChange={(evento) => definirMostrarCursos(evento.target.checked)}
              className="settings-page-field-2"
            />
          </div>
        </div>

        <Botao
          onClick={tratarGuardarPrivacidade}
          isLoading={isSavingPrivacidade}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Visibilidade do Perfil
        </Botao>
      </Cartao>

      {/* 4. Notificações */}
      <Cartao className="settings-page-card-2">
        <div>
          <h3 className="settings-page-subheading-3">
            <Bell className="settings-page-bell" />
            <span>Notificações & Alertas</span>
          </h3>
          <p className="settings-page-description-9">
            Escolha quais os alertas que deseja receber na plataforma e por email.
          </p>
        </div>

        <div className="settings-page-panel-15">
          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Novidades & Aulas nos Meus Cursos</p>
              <p className="settings-page-description-4">
                Quando os formadores publicam novas aulas, materiais ou avisos importantes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={cursoUpdates}
              onChange={(evento) => definirCursoUpdates(evento.target.checked)}
              className="settings-page-field-3"
            />
          </div>

          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Menções na Comunidade & Conversa</p>
              <p className="settings-page-description-4">
                Quando alguém o menciona diretamente (@) ou responde a uma mensagem sua.
              </p>
            </div>
            <input
              type="checkbox"
              checked={conversaMentions}
              onChange={(evento) => definirConversaMentions(evento.target.checked)}
              className="settings-page-field-3"
            />
          </div>

          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Resumo Semanal de Progresso</p>
              <p className="settings-page-description-4">
                Resumo semanal das aulas concluídas e estado das sequências de estudo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(evento) => definirEmailNotifs(evento.target.checked)}
              className="settings-page-field-3"
            />
          </div>
        </div>

        <Botao
          onClick={tratarGuardarPreferencias}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Notificações
        </Botao>
      </Cartao>

      {/* 5. Candidatura a Formador */}
      {utilizador?.role !== 'CREATOR' && utilizador?.role !== 'ADMIN' && (
        <Cartao className="settings-page-card-2">
          <div>
            <h3 className="settings-page-subheading">Programa de Formadores</h3>
            <p className="settings-page-description-9">
              Partilhe o seu conhecimento prático com a comunidade e publique os seus próprios
              cursos.
            </p>
          </div>

          <div className="settings-page-panel-18">
            <div className="settings-page-panel-19">
              <div className="settings-page-panel-20">
                <Sparkles className="settings-page-sparkles" />
              </div>
              <div>
                <p className="settings-page-description-8">Candidatura a Formador</p>
                <p className="settings-page-description-10">
                  Crie e publique cursos na plataforma, com suporte para módulos em vídeo,
                  questionários práticos e salas de mentoria para as suas turmas.
                </p>
              </div>
            </div>
            <Link
              to="/formador/candidatar"
              className="settings-page-link-2"
            >
              <Botao
                as="span"
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="settings-page-arrow-right" />}
                className="settings-page-button-6"
              >
                Candidatar
              </Botao>
            </Link>
          </div>
        </Cartao>
      )}

      <PagamentoHistorico />
      {/* 6. Gestão de Sessão */}
      <Cartao className="settings-page-card-3">
        <div>
          <h4 className="settings-page-caption">Gestão de Sessão</h4>
          <p className="settings-page-description-5">
            Sessão iniciada como {utilizador?.email} (
            {utilizador?.role === 'CREATOR'
              ? 'Formador'
              : utilizador?.role === 'ADMIN'
                ? 'Administrador & Formador'
                : 'Aluno'}
            )
          </p>
        </div>
        <Botao
          onClick={terminarSessao}
          variant="secondary"
          size="md"
          leftIcon={<LogOut className="settings-page-log-out" />}
          className="settings-page-button-7"
        >
          Terminar Sessão
        </Botao>
      </Cartao>
    </div>
  );
};

export default DefinicoesPagina;
