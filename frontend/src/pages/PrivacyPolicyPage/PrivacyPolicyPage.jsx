import './PrivacyPolicyPage.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SEO } from '../../components/common/SEO';

export const PrivacyPolicyPage = () => {
  return (
    <>
      <SEO
        title="Política de Privacidade — NEXO"
        description="Conheça como a NEXO recolhe, protege e trata os seus dados pessoais em total conformidade com o RGPD em Portugal e na União Europeia."
        canonical="https://nexo.pt/privacy"
      />

      <div className="privacy-policy-page-panel">
        <div className="privacy-policy-page-panel-2">
          {/* Header */}
          <div className="privacy-policy-page-panel-3">
            <Link to="/" className="privacy-policy-page-link">
              <ArrowLeft className="privacy-policy-page-arrow-left" />
              <span>Voltar à Página Principal</span>
            </Link>

            <div className="privacy-policy-page-panel-4">
              <div className="privacy-policy-page-panel-5">
                <ShieldCheck className="privacy-policy-page-shield-check" />
              </div>
              <div>
                <h1 className="privacy-policy-page-title">Política de Privacidade</h1>
                <p className="privacy-policy-page-description">
                  Última atualização: 1 de outubro de 2026 • Em conformidade com o RGPD (Regulamento
                  UE 2016/679)
                </p>
              </div>
            </div>
          </div>

          <Card className="privacy-policy-page-card">
            {/* 1. Introdução */}
            <section className="privacy-policy-page-section">
              <h2 className="privacy-policy-page-heading">
                <FileText className="privacy-policy-page-file-text" />
                <span>1. Enquadramento e Responsável pelo Tratamento</span>
              </h2>
              <p>
                A plataforma <strong>NEXO</strong> (doravante designada por &quot;NEXO&quot; ou
                &quot;Plataforma&quot;) assume o compromisso rigoroso de proteger a privacidade e os
                dados pessoais de todos os seus alunos, formadores, mentores e visitantes, em
                estrita conformidade com a legislação portuguesa e o{' '}
                <strong>
                  Regulamento Geral sobre a Proteção de Dados (RGPD - Regulamento UE 2016/679)
                </strong>
                .
              </p>
              <p>
                Para quaisquer questões relativas ao tratamento dos seus dados ou exercício dos seus
                direitos, pode contactar o nosso Encarregado de Proteção de Dados através do correio
                eletrónico:{' '}
                <a href="mailto:privacidade@nexo.pt" className="privacy-policy-page-link-2">
                  privacidade@nexo.pt
                </a>
                .
              </p>
            </section>

            {/* 2. Dados Recolhidos */}
            <section className="privacy-policy-page-section">
              <h2 className="privacy-policy-page-heading">
                <Eye className="privacy-policy-page-file-text" />
                <span>2. Que Dados Pessoais Recolhemos</span>
              </h2>
              <ul className="privacy-policy-page-list">
                <li>
                  <strong>Dados de Identificação e Registo:</strong> Nome, endereço de correio
                  eletrónico, nome de utilizador, fotografia de perfil e palavra-passe encriptada
                  (via bcrypt com salt rounds reforçado).
                </li>
                <li>
                  <strong>Dados de Formação e Desempenho:</strong> Cursos em que se inscreve, aulas
                  concluídas, progresso percentual, notas de questionários, medalhas conquistadas e
                  certificados emitidos com código de autenticação único.
                </li>
                <li>
                  <strong>Comunicações e Suporte:</strong> Mensagens diretas entre pares, mensagens
                  nas salas de mentoria, histórico de chamadas e mensagens enviadas nos tickets de
                  suporte.
                </li>
                <li>
                  <strong>Dados de Candidatura a Formador:</strong> Biografia, experiência
                  formativa, amostras curriculares e dados submetidos no inquérito de candidatura.
                </li>
                <li>
                  <strong>Dados Técnicos de Navegação:</strong> Endereço IP (anonimizado), registos
                  de acesso, tipo de navegador, sistema operativo e preferências de tema
                  (claro/escuro).
                </li>
              </ul>
            </section>

            {/* 3. Finalidades e Base Legal */}
            <section className="privacy-policy-page-section">
              <h2 className="privacy-policy-page-heading">
                <Lock className="privacy-policy-page-file-text" />
                <span>3. Finalidades do Tratamento e Fundamento Jurídico</span>
              </h2>
              <p>
                O tratamento dos dados é efetuado com base nas seguintes finalidades e fundamentos
                legais:
              </p>
              <ul className="privacy-policy-page-list">
                <li>
                  <strong>Execução de Contrato:</strong> Prestação dos serviços da plataforma
                  educativa, transmissão de aulas em vídeo, registo de progresso e emissão de
                  diplomas verificáveis.
                </li>
                <li>
                  <strong>Comunicações WebRTC em Tempo Real:</strong> Estabelecer salas de áudio e
                  vídeo encriptadas de ponta a ponta sem gravação de transmissões sem consentimento
                  expresso.
                </li>
                <li>
                  <strong>Cumprimento de Obrigações Legais:</strong> Emissão de comprovativos,
                  faturação e combate a fraudes ou violações dos termos.
                </li>
                <li>
                  <strong>Interesse Legítimo:</strong> Manutenção da segurança da infraestrutura,
                  prevenção de abusos e otimização da experiência de utilização.
                </li>
              </ul>
            </section>

            {/* 4. Segurança e Conservação */}
            <section className="privacy-policy-page-section">
              <h2 className="privacy-policy-page-heading">
                <ShieldCheck className="privacy-policy-page-file-text" />
                <span>4. Medidas de Segurança e Prazos de Conservação</span>
              </h2>
              <p>
                Implementamos rigorosas salvaguardas técnicas e organizativas, incluindo
                comunicações protegidas por HTTPS/TLS, chaves criptográficas seguras em JWT e
                proteção ativa contra ataques de injeção e CSRF.
              </p>
              <p>
                Os seus dados são conservados enquanto mantiver a sua conta ativa. Caso solicite a
                eliminação da sua conta, os dados pessoais associados serão permanentemente
                eliminados ou anonimizados no prazo máximo de 30 dias, ressalvadas as obrigações
                legais de conservação fiscal ou contratual.
              </p>
            </section>

            {/* 5. Direitos do Titular dos Dados */}
            <section className="privacy-policy-page-section">
              <h2 className="privacy-policy-page-heading">
                <FileText className="privacy-policy-page-file-text" />
                <span>5. Os Seus Direitos enquanto Titular</span>
              </h2>
              <p>Ao abrigo do RGPD, tem o direito inalienável de:</p>
              <ul className="privacy-policy-page-list-2">
                <li>
                  Solicitar o <strong>Acesso</strong> aos seus dados pessoais armazenados;
                </li>
                <li>
                  Exigir a <strong>Retificação</strong> de dados incorretos ou desatualizados;
                </li>
                <li>
                  Pedir o <strong>Apagamento</strong> dos seus dados (&quot;Direito a ser
                  Esquecido&quot;);
                </li>
                <li>
                  Solicitar a <strong>Limitação</strong> ou <strong>Oposição</strong> ao tratamento;
                </li>
                <li>
                  Pedir a <strong>Portabilidade</strong> dos seus dados em formato estruturado
                  (JSON/CSV);
                </li>
                <li>
                  Apresentar reclamação junto da autoridade de controlo em Portugal:{' '}
                  <strong>CNPD — Comissão Nacional de Proteção de Dados</strong> (www.cnpd.pt).
                </li>
              </ul>
            </section>

            {/* 6. Contacto */}
            <section className="privacy-policy-page-section-2">
              <div>
                <p className="privacy-policy-page-description-2">Dúvidas sobre a Privacidade?</p>
                <p className="privacy-policy-page-description-3">
                  A nossa equipa de conformidade responde no prazo máximo de 48 horas úteis.
                </p>
              </div>
              <Link to="/help" className="privacy-policy-page-link-3">
                <Mail className="privacy-policy-page-mail" />
                <span>Contactar Suporte</span>
              </Link>
            </section>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
