import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuAward } from 'react-icons/lu';
import { api } from '../../services/api';
import { Botao } from '../Button';
import './CourseCompletion.css';

export default function CursoConclusao({ idCurso: cursoId, certificate: certificado }) {
  const [busy, definirBusy] = useState(false);
  const [erro, definirErro] = useState('');
  const submitting = useRef(false);
  const navigate = useNavigate();

  async function abrirCertificado() {
    if (submitting.current) return;
    submitting.current = true;
    definirBusy(true);
    definirErro('');
    try {
      const { data: dados } = await api.post(`/certificados/gerar/${encodeURIComponent(cursoId)}`);
      if (!dados.certificate?.id) throw new Error('Não foi possível obter o certificado.');
      navigate(`/certificados/verificar/${encodeURIComponent(dados.certificate.id)}`);
    } catch (erro2) {
      definirErro(erro2.message || 'Não foi possível obter o certificado. Tente novamente.');
    } finally {
      submitting.current = false;
      definirBusy(false);
    }
  }

  return (
    <section
      className="course-completion"
      aria-label="Curso concluído"
    >
      <LuAward aria-hidden="true" />
      <div>
        <h2>Parabéns, concluiu o curso!</h2>
        <p>
          Consulte o seu certificado na página de verificação, onde também pode imprimi-lo ou
          guardá-lo em PDF.
        </p>
        {erro && <p role="alert">{erro}</p>}
      </div>
      {certificado?.id ? (
        <Link
          className="course-completion__link"
          to={`/certificados/verificar/${encodeURIComponent(certificado.id)}`}
        >
          Ver certificado
        </Link>
      ) : (
        <Botao
          isLoading={busy}
          disabled={busy}
          onClick={abrirCertificado}
        >
          Ver certificado
        </Botao>
      )}
    </section>
  );
}
