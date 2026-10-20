import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuAward } from 'react-icons/lu';
import { api } from '../../services/api';
import { Button } from '../Button';
import './CourseCompletion.css';

export default function CourseCompletion({ courseId, certificate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const navigate = useNavigate();
  async function openCertificate() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/certificates/generate/${encodeURIComponent(courseId)}`);
      if (!data.certificate?.id) throw new Error('Não foi possível obter o certificado.');
      navigate(`/certificates/verify/${encodeURIComponent(data.certificate.id)}`);
    } catch (error) {
      setError(error.message || 'Não foi possível obter o certificado. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="course-completion" aria-label="Curso concluído">
      <LuAward aria-hidden="true" />
      <div>
        <h2>Parabéns, concluiu o curso!</h2>
        <p>
          Consulte o seu certificado na página de verificação, onde também pode imprimi-lo ou
          guardá-lo em PDF.
        </p>
        {error && <p role="alert">{error}</p>}
      </div>
      {certificate?.id ? (
        <Link
          className="course-completion__link"
          to={`/certificates/verify/${encodeURIComponent(certificate.id)}`}
        >
          Ver certificado
        </Link>
      ) : (
        <Button isLoading={busy} disabled={busy} onClick={openCertificate}>
          Ver certificado
        </Button>
      )}
    </section>
  );
}
