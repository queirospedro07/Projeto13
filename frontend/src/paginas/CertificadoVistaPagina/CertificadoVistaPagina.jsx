import './CertificadoVistaPagina.css';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LuAward as Award,
  LuCircleCheck as CheckCircle2,
  LuPrinter as Printer,
  LuArrowLeft as ArrowLeft,
  LuShieldCheck as ShieldCheck,
  LuShare2 as Share2,
} from 'react-icons/lu';
import { Botao } from '../../componentes/Botao';
import { Logotipo } from '../../componentes/Logotipo';
import { SEO } from '../../componentes/SEO';
import { SocialPartilharJanela } from '../../componentes/SocialPartilharJanela';
import { api } from '../../servicos/api';

export const CertificadoVistaPagina = () => {
  const { id } = useParams();
  const [certificado, definirCertificado] = useState(null);
  const [carregamento, definirCarregamento] = useState(true);
  const [isPartilharJanelaAbrir, definirIsPartilharJanelaAbrir] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/certificados/verificar/${encodeURIComponent(id)}`)
      .then(({ data: dados }) => dados)
      .then((dados) => definirCertificado(dados))
      .catch(() => {
        definirCertificado(null);
      })
      .finally(() => definirCarregamento(false));
  }, [id]);

  const tratarImprimir = () => {
    window.print();
  };

  if (carregamento) {
    return <div className="certificate-view-panel">A verificar credencial de certificado...</div>;
  }

  if (!certificado) {
    return (
      <div className="certificate-view-panel-2">
        <SEO
          title="Certificado Não Encontrado — NEXO"
          description="O certificado solicitado não existe ou não foi emitido."
        />
        <div className="certificate-view-panel-3">
          <div className="certificate-view-panel-4">
            <Award className="certificate-view-award" />
          </div>
          <h2 className="certificate-view-heading">Certificado Não Encontrado</h2>
          <p className="certificate-view-description">
            O certificado com o identificador informado não existe ou ainda não foi emitido.
          </p>
          <Link to="/biblioteca">
            <Botao
              as="span"
              variant="primary"
              size="md"
              className="certificate-view-button"
            >
              Voltar aos Meus Cursos
            </Botao>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Certificado: ${certificado.nomeDestinatario} — ${certificado.tituloCurso} | NEXO`}
        description={`Credencial oficial de conclusão de curso emitida pela plataforma NEXO a ${certificado.nomeDestinatario} no curso ${certificado.tituloCurso}.`}
        canonical={`/certificados/verificar/${certificado.certificateId || id}`}
      />

      <div className="certificate-view-panel-5">
        <div className="certificate-view-panel-6">
          <Link to="/biblioteca">
            <Botao
              as="span"
              variant="secondary"
              size="md"
              leftIcon={<ArrowLeft className="certificate-view-arrow-left" />}
              className="certificate-view-button-2"
            >
              Voltar aos Cursos
            </Botao>
          </Link>
          <div className="certificate-view-panel-7">
            <Botao
              onClick={() => definirIsPartilharJanelaAbrir(true)}
              variant="secondary"
              size="md"
              leftIcon={<Share2 className="certificate-view-arrow-left" />}
              className="certificate-view-button"
            >
              Partilhar Conquista
            </Botao>
            <Botao
              onClick={tratarImprimir}
              variant="primary"
              size="md"
              leftIcon={<Printer className="certificate-view-arrow-left" />}
              className="certificate-view-button-3"
            >
              Imprimir / PDF
            </Botao>
          </div>
        </div>

        <div className="certificate-view-panel-8">
          <div className="certificate-view-panel-9">
            <div className="certificate-view-panel-10" />
            <div className="certificate-view-panel-11" />
            <div className="certificate-view-panel-12" />
            <div className="certificate-view-panel-13" />

            <div className="certificate-view-panel-14">
              <Logotipo
                size="lg"
                showText={false}
              />
              <span className="certificate-view-label">NEXO Autoridade de Certificação</span>
              <div className="certificate-view-panel-15" />
            </div>

            <p className="certificate-view-description-2">
              Certificado Oficial de Conclusão de Curso
            </p>

            <p className="certificate-view-description-3">Certifica-se que</p>

            <h2 className="certificate-view-heading-2">{certificado.nomeDestinatario}</h2>

            <p className="certificate-view-description-4">
              concluiu com distinção todos os módulos teóricos, projetos práticos e avaliações do
              curso
            </p>

            <h3 className="certificate-view-subheading">{certificado.tituloCurso}</h3>

            <div className="certificate-view-panel-16">
              <div className="certificate-view-panel-17">
                <div className="certificate-view-panel-18">{certificado.creatorName}</div>
                <p className="certificate-view-description-5">Assinatura do Formador</p>
              </div>

              <div className="certificate-view-panel-17">
                <div className="certificate-view-panel-19">
                  <ShieldCheck className="certificate-view-award" />
                </div>
                <span className="certificate-view-label-2">
                  <CheckCircle2 className="certificate-view-check-circle2" /> Credencial Verificada
                </span>
              </div>

              <div className="certificate-view-panel-17">
                <p className="certificate-view-description-6">
                  {new Date(certificado.emitidoEm).toLocaleDateString('pt-PT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="certificate-view-description-5">Data de Emissão</p>
              </div>
            </div>

            <div className="certificate-view-panel-20">
              <span>
                ID do Certificado:{' '}
                <strong className="certificate-view-strong">{certificado.certificateId}</strong>
              </span>
              <span>nexo.pt/certificates/verify/{certificado.certificateId}</span>
            </div>
          </div>
        </div>

        {/* Share Janela */}
        <SocialPartilharJanela
          isOpen={isPartilharJanelaAbrir}
          onClose={() => definirIsPartilharJanelaAbrir(false)}
          title={`Certificado de Conclusão: ${certificado.tituloCurso}`}
          text={`Acabei de concluir com sucesso o curso "${certificado.tituloCurso}" na NEXO! Veja o meu certificado verificado:`}
          url={window.location.href}
        />
      </div>
    </>
  );
};

export default CertificadoVistaPagina;
