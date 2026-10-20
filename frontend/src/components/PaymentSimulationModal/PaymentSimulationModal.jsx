import { useRef, useState } from 'react';
import { LuCircleCheck as CheckCircle2, LuCreditCard as CreditCard } from 'react-icons/lu';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { api } from '../../services/api';
import { formatCoursePrice } from '../../utils/formatters';
import './PaymentSimulationModal.css';

export function PaymentSimulationModal({ course, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const submitting = useRef(false);

  async function confirmPurchase(event) {
    event.preventDefault();
    if (submitting.current || result) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/payments/simulate/${encodeURIComponent(course.id)}`, {
        method: 'card',
        outcome: 'approved',
        expectedAmountCents: Math.round(Number(course.price) * 100),
      });
      if (data.status !== 'approved' && !data.alreadyEnrolled) {
        throw new Error('Não foi possível confirmar o pagamento. Tente novamente.');
      }
      setResult(data);
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
    } catch (err) {
      setError(err.message || 'Não foi possível confirmar a compra. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen
      title={result ? 'Pagamento concluído' : 'Pagamento'}
      onClose={() => !submitting.current && (result ? onSuccess() : onClose())}
      maxWidth="md"
    >
      <div className="payment-simulation">
        <div className="payment-simulation__summary">
          <CreditCard aria-hidden="true" />
          <div>
            <h4>{course.title || course.name}</h4>
            <p>Acesso ao curso</p>
          </div>
          <strong>{formatCoursePrice(course)}</strong>
        </div>
        {result ? (
          <div className="payment-simulation__result" role="status">
            <CheckCircle2 aria-hidden="true" />
            <p>
              {result.alreadyEnrolled
                ? 'Já está inscrito neste curso.'
                : 'Pagamento confirmado. Já pode aceder às aulas.'}
            </p>
            <Button onClick={onSuccess}>Continuar para o curso</Button>
          </div>
        ) : (
          <form onSubmit={confirmPurchase} className="payment-simulation__form" aria-busy={busy}>
            <p>Ao confirmar, a inscrição fica guardada na sua conta.</p>
            {error && (
              <p className="payment-simulation__error" role="alert">
                {error}
              </p>
            )}
            <div className="payment-simulation__actions">
              <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={busy}>
                Pagar
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
