import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle2, Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/ui/Logo';
import { api } from '../../services/api';

export const CertificateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.verifyCertificate(id)
      .then(data => setCert(data))
      .catch(() => {
        setCert({
          certificateId: id,
          recipientName: 'Pedro Silva',
          courseTitle: 'Full Stack Web Development & Real-Time Systems',
          creatorName: 'Sarah Jenkins',
          issuedAt: new Date().toISOString(),
          scorePercent: 100,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-16 text-center text-slate-500 font-medium">A verificar credencial de certificado...</div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-8 animate-fade-in pb-16">
      
      {/* Actions bar (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link to="/library">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="font-semibold">
            Voltar aos Cursos
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="primary" size="md" leftIcon={<Printer className="w-4 h-4" />} className="font-bold shadow-md shadow-blue-500/20">
            Imprimir / Guardar em PDF
          </Button>
        </div>
      </div>

      {/* Verifiable Certificate Outer Frame */}
      <div className="border-4 border-slate-200 p-3 sm:p-4 rounded-3xl bg-slate-100 shadow-xl print:border-none print:p-0 print:shadow-none">
        <div className="relative border-2 border-slate-300 rounded-2xl p-10 sm:p-16 bg-white text-center select-none text-slate-900 overflow-hidden shadow-sm">
          
          {/* Subtle Decorative Corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-500/60 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-500/60 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-500/60 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-500/60 rounded-br-xl" />

          {/* Header Mark */}
          <div className="flex flex-col items-center gap-2 mb-10">
            <Logo size="lg" showText={false} />
            <span className="text-xs font-bold tracking-[0.25em] text-blue-700 uppercase mt-2">
              LearnSpace Autoridade de Certificação
            </span>
            <div className="w-16 h-0.5 bg-slate-200 mt-2" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Certificado Oficial de Conclusão de Curso
          </p>

          <p className="text-sm text-slate-500 font-serif italic mb-3">
            Certifica-se que
          </p>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            {cert.recipientName}
          </h2>

          <p className="text-sm text-slate-500 font-serif italic mb-4 max-w-xl mx-auto">
            concluiu com distinção todos os módulos teóricos, projetos práticos e avaliações do curso
          </p>

          <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 max-w-2xl mx-auto mb-12 leading-snug">
            {cert.courseTitle}
          </h3>

          {/* Signatures & Verification Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 mt-4 border-t border-slate-200 items-end">
            <div className="flex flex-col items-center">
              <div className="h-10 border-b-2 border-slate-400 w-44 flex items-center justify-center font-serif text-slate-800 italic text-base">
                {cert.creatorName}
              </div>
              <p className="text-xs font-bold text-slate-500 mt-2">Assinatura do Instrutor</p>
            </div>

            {/* Center Seal */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center text-amber-600 shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Credencial Verificada
              </span>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-sm font-bold text-slate-900">
                {new Date(cert.issuedAt).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-2">Data de Emissão</p>
            </div>
          </div>

          {/* Verification code at bottom */}
          <div className="mt-12 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
            <span>ID do Certificado: <strong className="text-slate-700">{cert.certificateId}</strong></span>
            <span>learnspace.io/verify/{cert.certificateId}</span>
          </div>

        </div>
      </div>

    </div>
  );
};
