import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Scale, ArrowLeft, Shield, AlertTriangle, BookOpen } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SEO } from '../../components/common/SEO';

export const TermsPage = () => {
  return (
    <>
      <SEO
        title="Termos de Utilização — NEXO"
        description="Termos e Condições de Serviço da plataforma NEXO. Conheça as regras para alunos, formadores, emissão de certificados e conduta na comunidade."
        canonical="https://nexo.pt/terms"
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
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                  Termos e Condições de Utilização
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Última atualização: 1 de outubro de 2026 • Válido para a República Portuguesa e Comunidade Europeia
                </p>
              </div>
            </div>
          </div>

          <Card className="p-6 sm:p-10 space-y-8 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-sm text-sm sm:text-base leading-relaxed text-slate-700 dark:text-neutral-300">
            {/* 1. Aceitação */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                <span>1. Aceitação dos Termos</span>
              </h2>
              <p>
                Ao aceder, registar conta ou utilizar qualquer funcionalidade da plataforma <strong>NEXO</strong>, o utilizador declara expressamente que leu, compreendeu e concorda na íntegra com os presentes Termos de Utilização e com a nossa Política de Privacidade.
              </p>
              <p>
                Caso não concorde com qualquer uma das disposições aqui estabelecidas, deverá abster-se imediatamente de utilizar a plataforma.
              </p>
            </section>

            {/* 2. Registo e Segurança da Conta */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>2. Registo de Conta e Dever de Diligência</span>
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-neutral-300">
                <li>O utilizador é o único responsável pela veracidade, exatidão e atualização dos dados facultados no registo.</li>
                <li>As credenciais de acesso (nome de utilizador e palavra-passe) são estritamente pessoais e intransmissíveis.</li>
                <li>Qualquer atividade realizada através da sua conta presume-se efetuada pelo respetivo titular, salvo comunicação prévia e comprovada de quebra de segurança.</li>
              </ul>
            </section>

            {/* 3. Direitos e Deveres dos Formadores */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>3. Criação de Conteúdo e Papel dos Formadores</span>
              </h2>
              <p>
                Os formadores aprovados pela administração da NEXO dispõem de autorização para publicar cursos, módulos, aulas em vídeo, questionários e recursos didáticos, assumindo os seguintes compromissos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-neutral-300">
                <li>Garantir a total titularidade dos direitos de autor sobre todos os materiais carregados, não infringindo direitos de propriedade intelectual de terceiros.</li>
                <li>Manter o rigor científico, técnico e pedagógico dos conteúdos disponibilizados aos alunos.</li>
                <li>Respeitar as diretrizes de moderação, sendo vedada a inclusão de conteúdos de caráter ilícito, difamatório, fraudulento ou discriminatório.</li>
              </ul>
            </section>

            {/* 4. Certificados e Reconhecimento */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                <span>4. Emissão e Verificação de Certificados</span>
              </h2>
              <p>
                A emissão do Certificado Digital de Conclusão está sujeita ao cumprimento cumulativo dos critérios pedagógicos:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-neutral-300">
                <li>Conclusão comprovada de 100% das aulas em vídeo que integram o curso;</li>
                <li>Aprovação nos questionários de avaliação com a percentagem mínima fixada pelo formador;</li>
                <li>Cada certificado emitido integra um <strong>Código de Verificação Único e Inviolável</strong>, passível de validação pública a qualquer momento na secção de verificação da plataforma.</li>
              </ul>
            </section>

            {/* 5. Regras de Conduta e Mentoria */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>5. Código de Conduta nas Comunidades e Salas WebRTC</span>
              </h2>
              <p>
                A NEXO promove um ambiente seguro, ético e colaborativo. É terminantemente proibido:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-neutral-300">
                <li>Praticar qualquer ato de assédio, violência verbal ou discriminação em chamadas ou conversas;</li>
                <li>Gravar, reproduzir ou divulgar áudio ou vídeo de terceiros obtido nas salas de mentoria sem consentimento expresso;</li>
                <li>Distribuir código malicioso, efetuar engenharia reversa ou sobrecarregar a infraestrutura dos servidores.</li>
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
                A violação das presentes regras confere à administração o direito de suspender ou cancelar imediatamente a conta do infrator, sem prejuízo de eventual procedimento judicial cabível.
              </p>
            </section>

            {/* 6. Foro e Lei Aplicável */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />
                <span>6. Lei Aplicável e Jurisdição</span>
              </h2>
              <p>
                Os presentes Termos de Utilização regem-se exclusivamente pela lei portuguesa. Para a resolução de qualquer litígio emergente da interpretação ou execução deste contrato, é competente o Foro da Comarca de Lisboa, com expressa renúncia a qualquer outro.
              </p>
            </section>
          </Card>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
