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

      <div className="min-h-screen bg-slate-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Página Principal</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                  Política de Privacidade
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Última atualização: 1 de outubro de 2026 • Em conformidade com o RGPD (Regulamento UE 2016/679)
                </p>
              </div>
            </div>
          </div>

          <Card className="p-6 sm:p-10 space-y-8 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-sm text-sm sm:text-base leading-relaxed text-slate-700 dark:text-neutral-300">
            {/* 1. Introdução */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>1. Enquadramento e Responsável pelo Tratamento</span>
              </h2>
              <p>
                A plataforma <strong>NEXO</strong> (doravante designada por &quot;NEXO&quot; ou &quot;Plataforma&quot;) assume o compromisso rigoroso de proteger a privacidade e os dados pessoais de todos os seus alunos, formadores, mentores e visitantes, em estrita conformidade com a legislação portuguesa e o <strong>Regulamento Geral sobre a Proteção de Dados (RGPD - Regulamento UE 2016/679)</strong>.
              </p>
              <p>
                Para quaisquer questões relativas ao tratamento dos seus dados ou exercício dos seus direitos, pode contactar o nosso Encarregado de Proteção de Dados através do correio eletrónico: <a href="mailto:privacidade@nexo.pt" className="text-blue-600 dark:text-blue-400 font-semibold underline">privacidade@nexo.pt</a>.
              </p>
            </section>

            {/* 2. Dados Recolhidos */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>2. Que Dados Pessoais Recolhemos</span>
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-neutral-300">
                <li><strong>Dados de Identificação e Registo:</strong> Nome, endereço de correio eletrónico, nome de utilizador, fotografia de perfil e palavra-passe encriptada (via bcrypt com salt rounds reforçado).</li>
                <li><strong>Dados de Formação e Desempenho:</strong> Cursos em que se inscreve, aulas concluídas, progresso percentual, notas de questionários, pontos de experiência (XP), medalhas conquistadas e certificados emitidos com código de autenticação único.</li>
                <li><strong>Comunicações e Suporte:</strong> Mensagens diretas entre pares, mensagens nas salas de mentoria, histórico de chamadas e mensagens enviadas nos tickets de suporte.</li>
                <li><strong>Dados de Candidatura a Formador:</strong> Biografia, experiência formativa, amostras curriculares e dados submetidos no inquérito de candidatura.</li>
                <li><strong>Dados Técnicos de Navegação:</strong> Endereço IP (anonimizado), registos de acesso, tipo de navegador, sistema operativo e preferências de tema (claro/escuro).</li>
              </ul>
            </section>

            {/* 3. Finalidades e Base Legal */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>3. Finalidades do Tratamento e Fundamento Jurídico</span>
              </h2>
              <p>
                O tratamento dos dados é efetuado com base nas seguintes finalidades e fundamentos legais:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-neutral-300">
                <li><strong>Execução de Contrato:</strong> Prestação dos serviços da plataforma educativa, transmissão de aulas em vídeo, registo de progresso e emissão de diplomas verificáveis.</li>
                <li><strong>Comunicações WebRTC em Tempo Real:</strong> Estabelecer salas de áudio e vídeo encriptadas de ponta a ponta sem gravação de transmissões sem consentimento expresso.</li>
                <li><strong>Cumprimento de Obrigações Legais:</strong> Emissão de comprovativos, faturação e combate a fraudes ou violações dos termos.</li>
                <li><strong>Interesse Legítimo:</strong> Manutenção da segurança da infraestrutura, prevenção de abusos e otimização da experiência de utilização.</li>
              </ul>
            </section>

            {/* 4. Segurança e Conservação */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>4. Medidas de Segurança e Prazos de Conservação</span>
              </h2>
              <p>
                Implementamos rigorosas salvaguardas técnicas e organizativas, incluindo comunicações protegidas por HTTPS/TLS, chaves criptográficas seguras em JWT e proteção ativa contra ataques de injeção e CSRF.
              </p>
              <p>
                Os seus dados são conservados enquanto mantiver a sua conta ativa. Caso solicite a eliminação da sua conta, os dados pessoais associados serão permanentemente eliminados ou anonimizados no prazo máximo de 30 dias, ressalvadas as obrigações legais de conservação fiscal ou contratual.
              </p>
            </section>

            {/* 5. Direitos do Titular dos Dados */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>5. Os Seus Direitos enquanto Titular</span>
              </h2>
              <p>
                Ao abrigo do RGPD, tem o direito inalienável de:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-neutral-300">
                <li>Solicitar o <strong>Acesso</strong> aos seus dados pessoais armazenados;</li>
                <li>Exigir a <strong>Retificação</strong> de dados incorretos ou desatualizados;</li>
                <li>Pedir o <strong>Apagamento</strong> dos seus dados (&quot;Direito a ser Esquecido&quot;);</li>
                <li>Solicitar a <strong>Limitação</strong> ou <strong>Oposição</strong> ao tratamento;</li>
                <li>Pedir a <strong>Portabilidade</strong> dos seus dados em formato estruturado (JSON/CSV);</li>
                <li>Apresentar reclamação junto da autoridade de controlo em Portugal: <strong>CNPD — Comissão Nacional de Proteção de Dados</strong> (www.cnpd.pt).</li>
              </ul>
            </section>

            {/* 6. Contacto */}
            <section className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Dúvidas sobre a Privacidade?</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">A nossa equipa de conformidade responde no prazo máximo de 48 horas úteis.</p>
              </div>
              <Link
                to="/help"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-100 text-white text-xs font-bold transition-all shrink-0 inline-flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
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
