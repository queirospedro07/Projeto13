import './CertificateView.css';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle2, Printer, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { SocialShareModal } from '../../../components/common/SocialShareModal';
import { api } from '../../../services/api';

export const CertificateView = () => {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .verifyCertificate(id)
      .then((data) => setCert(data))
      .catch(() => {
        setCert(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="certificate-view-panel">A verificar credencial de certificado...</div>;
  }

  if (!cert) {
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
          <Link to="/library">
            <Button variant="primary" size="md" className="certificate-view-button">
              Voltar aos Meus Cursos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Certificado: ${cert.recipientName} — ${cert.courseTitle} | NEXO`}
        description={`Credencial oficial de conclusão de curso emitida pela plataforma NEXO a ${cert.recipientName} no curso ${cert.courseTitle}.`}
        canonical={`https://nexo.pt/certificates/verify/${cert.certificateId || id}`}
      />

      <div className="certificate-view-panel-5">
        <div className="certificate-view-panel-6">
          <Link to="/library">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ArrowLeft className="certificate-view-arrow-left" />}
              className="certificate-view-button-2"
            >
              Voltar aos Cursos
            </Button>
          </Link>
          <div className="certificate-view-panel-7">
            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="secondary"
              size="md"
              leftIcon={<Share2 className="certificate-view-arrow-left" />}
              className="certificate-view-button"
            >
              Partilhar Conquista
            </Button>
            <Button
              onClick={handlePrint}
              variant="primary"
              size="md"
              leftIcon={<Printer className="certificate-view-arrow-left" />}
              className="certificate-view-button-3"
            >
              Imprimir / PDF
            </Button>
          </div>
        </div>

        <div className="certificate-view-panel-8">
          <div className="certificate-view-panel-9">
            <div className="certificate-view-panel-10" />
            <div className="certificate-view-panel-11" />
            <div className="certificate-view-panel-12" />
            <div className="certificate-view-panel-13" />

            <div className="certificate-view-panel-14">
              <Logo size="lg" showText={false} />
              <span className="certificate-view-label">NEXO Autoridade de Certificação</span>
              <div className="certificate-view-panel-15" />
            </div>

            <p className="certificate-view-description-2">
              Certificado Oficial de Conclusão de Curso
            </p>

            <p className="certificate-view-description-3">Certifica-se que</p>

            <h2 className="certificate-view-heading-2">{cert.recipientName}</h2>

            <p className="certificate-view-description-4">
              concluiu com distinção todos os módulos teóricos, projetos práticos e avaliações do
              curso
            </p>

            <h3 className="certificate-view-subheading">{cert.courseTitle}</h3>

            <div className="certificate-view-panel-16">
              <div className="certificate-view-panel-17">
                <div className="certificate-view-panel-18">{cert.creatorName}</div>
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
                  {new Date(cert.issuedAt).toLocaleDateString('pt-PT', {
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
                <strong className="certificate-view-strong">{cert.certificateId}</strong>
              </span>
              <span>nexo.pt/certificates/verify/{cert.certificateId}</span>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        <SocialShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`Certificado de Conclusão: ${cert.courseTitle}`}
          text={`Acabei de concluir com sucesso o curso "${cert.courseTitle}" na NEXO! Veja o meu certificado verificado:`}
          url={window.location.href}
        />
      </div>
    </>
  );
};

export default CertificateView;
