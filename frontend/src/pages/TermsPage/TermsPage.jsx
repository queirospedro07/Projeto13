import './TermsPage.css';
import { Link } from 'react-router-dom';
import {
  LuFileCheck as FileCheck,
  LuScale as Scale,
  LuArrowLeft as ArrowLeft,
  LuShield as Shield,
  LuTriangleAlert as AlertTriangle,
  LuBookOpen as BookOpen,
} from 'react-icons/lu';
import { Card } from '../../components/Card';
import { SEO } from '../../components/SEO';
export const TermsPage = () => {
  return (
    <>
      <SEO
        title="Termos de Utilização — NEXO"
        description="Termos e Condições de Serviço da plataforma NEXO. Conheça as regras para alunos, formadores, emissão de certificados e conduta na comunidade."
        canonical="https://nexo.pt/terms"
      />

      <div className="terms-page-panel">
        <div className="terms-page-panel-2">
          {/* Header */}
          <div className="terms-page-panel-3">
            <Link to="/" className="terms-page-link">
              <ArrowLeft className="terms-page-arrow-left" />
              <span>Voltar à Página Principal</span>
            </Link>

            <div className="terms-page-panel-4">
              <div className="terms-page-panel-5">
                <Scale className="terms-page-scale" />
              </div>
              <div>
                <h1 className="terms-page-title">Termos e Condições de Utilização</h1>
                <p className="terms-page-description">
                  Última atualização: 1 de outubro de 2026 • Válido para a República Portuguesa e
                  Comunidade Europeia
                </p>
              </div>
            </div>
          </div>

          <Card className="terms-page-card">
            {/* 1. Aceitação */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <FileCheck className="terms-page-file-check" />
                <span>1. Aceitação dos Termos</span>
              </h2>
              <p>
                Ao aceder, registar conta ou utilizar qualquer funcionalidade da plataforma{' '}
                <strong>NEXO</strong>, o utilizador declara expressamente que leu, compreendeu e
                concorda na íntegra com os presentes Termos de Utilização e com a nossa Política de
                Privacidade.
              </p>
              <p>
                Caso não concorde com qualquer uma das disposições aqui estabelecidas, deverá
                abster-se imediatamente de utilizar a plataforma.
              </p>
            </section>

            {/* 2. Registo e Segurança da Conta */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <Shield className="terms-page-file-check" />
                <span>2. Registo de Conta e Dever de Diligência</span>
              </h2>
              <ul className="terms-page-list">
                <li>
                  O utilizador é o único responsável pela veracidade, exatidão e atualização dos
                  dados facultados no registo.
                </li>
                <li>
                  As credenciais de acesso (nome de utilizador e palavra-passe) são estritamente
                  pessoais e intransmissíveis.
                </li>
                <li>
                  Qualquer atividade realizada através da sua conta presume-se efetuada pelo
                  respetivo titular, salvo comunicação prévia e comprovada de quebra de segurança.
                </li>
              </ul>
            </section>

            {/* 3. Direitos e Deveres dos Formadores */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <BookOpen className="terms-page-file-check" />
                <span>3. Criação de Conteúdo e Papel dos Formadores</span>
              </h2>
              <p>
                Os formadores aprovados pela administração da NEXO dispõem de autorização para
                publicar cursos, módulos, aulas em vídeo, questionários e recursos didáticos,
                assumindo os seguintes compromissos:
              </p>
              <ul className="terms-page-list">
                <li>
                  Garantir a total titularidade dos direitos de autor sobre todos os materiais
                  carregados, não infringindo direitos de propriedade intelectual de terceiros.
                </li>
                <li>
                  Manter o rigor científico, técnico e pedagógico dos conteúdos disponibilizados aos
                  alunos.
                </li>
                <li>
                  Respeitar as diretrizes de moderação, sendo vedada a inclusão de conteúdos de
                  caráter ilícito, difamatório, fraudulento ou discriminatório.
                </li>
              </ul>
            </section>

            {/* 4. Certificados e Reconhecimento */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <FileCheck className="terms-page-file-check" />
                <span>4. Emissão e Verificação de Certificados</span>
              </h2>
              <p>
                A emissão do Certificado Digital de Conclusão está sujeita ao cumprimento cumulativo
                dos critérios pedagógicos:
              </p>
              <ul className="terms-page-list-2">
                <li>Conclusão comprovada de 100% das aulas em vídeo que integram o curso;</li>
                <li>
                  Aprovação nos questionários de avaliação com a percentagem mínima fixada pelo
                  formador;
                </li>
                <li>
                  Cada certificado emitido integra um{' '}
                  <strong>Código de Verificação Único e Inviolável</strong>, passível de validação
                  pública a qualquer momento na secção de verificação da plataforma.
                </li>
              </ul>
            </section>

            {/* 5. Regras de Conduta e Mentoria */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <AlertTriangle className="terms-page-alert-triangle" />
                <span>5. Código de Conduta nas Comunidades e Salas WebRTC</span>
              </h2>
              <p>
                A NEXO promove um ambiente seguro, ético e colaborativo. É terminantemente proibido:
              </p>
              <ul className="terms-page-list-2">
                <li>
                  Praticar qualquer ato de assédio, violência verbal ou discriminação em chamadas ou
                  conversas;
                </li>
                <li>
                  Gravar, reproduzir ou divulgar áudio ou vídeo de terceiros obtido nas salas de
                  mentoria sem consentimento expresso;
                </li>
                <li>
                  Distribuir código malicioso, efetuar engenharia reversa ou sobrecarregar a
                  infraestrutura dos servidores.
                </li>
              </ul>
              <p className="terms-page-description-2">
                A violação das presentes regras confere à administração o direito de suspender ou
                cancelar imediatamente a conta do infrator, sem prejuízo de eventual procedimento
                judicial cabível.
              </p>
            </section>

            {/* 6. Foro e Lei Aplicável */}
            <section className="terms-page-section">
              <h2 className="terms-page-heading">
                <Scale className="terms-page-file-check" />
                <span>6. Lei Aplicável e Jurisdição</span>
              </h2>
              <p>
                Os presentes Termos de Utilização regem-se exclusivamente pela lei portuguesa. Para
                a resolução de qualquer litígio emergente da interpretação ou execução deste
                contrato, é competente o Foro da Comarca de Lisboa, com expressa renúncia a qualquer
                outro.
              </p>
            </section>
          </Card>
        </div>
      </div>
    </>
  );
};
export default TermsPage;
