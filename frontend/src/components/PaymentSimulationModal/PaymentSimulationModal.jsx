import { useRef, useState } from 'react';
import { LuCircleCheck as CheckCircle2, LuCreditCard as CreditCard } from 'react-icons/lu';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { api } from '../../services/api';
import { formatCoursePrice } from '../../utils/formatters';
import './PaymentSimulationModal.css';
export function PaymentSimulationModal({ course, onClose, onSuccess }) {
  const [method, setMethod] = useState('card');
  const [outcome, setOutcome] = useState('approved');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const submittingRef = useRef(false);
  const methodLabels = {
    card: 'Cartão de demonstração',
    mbway: 'MB WAY',
    multibanco: 'Multibanco',
  };
  const amountCents = Math.round(Number(course.price) * 100);
  const resultPrice =
    result?.amountCents !== undefined
      ? new Intl.NumberFormat('pt-PT', {
          style: 'currency',
          currency: result.currency || 'EUR',
        }).format(result.amountCents / 100)
      : formatCoursePrice(course);
  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current || !confirming) return;
    submittingRef.current = true;
    setBusy(true);
    setError('');
    try {
      const payment = await api
        .post(`/payments/simulate/${encodeURIComponent(course.id)}`, {
          method,
          outcome,
          expectedAmountCents: amountCents,
        })
        .then(({ data }) => data);
      if (payment.status === 'declined') {
        setConfirming(false);
        setError('Pagamento recusado na simulação. Pode tentar novamente com outro resultado.');
      } else {
        setResult(payment);
        window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      }
    } catch (err) {
      setError(err.message || 'Não foi possível guardar a simulação. Tente novamente.');
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      onClose={() => !submittingRef.current && (result ? onSuccess() : onClose())}
      title={result ? 'Comprovativo da compra' : confirming ? 'Confirmar compra' : 'Pagamento'}
      maxWidth="md"
    >
      <div className="payment-simulation">
        <p className="payment-simulation__notice">
          Modo de demonstração · Não existe qualquer cobrança real.
        </p>
        <div className="payment-simulation__summary">
          <CreditCard aria-hidden="true" />
          <div>
            <h4>{course.title || course.name}</h4>
            <p>Inscrição no curso</p>
          </div>
          <strong>{resultPrice}</strong>
        </div>
        {result ? (
          <div className="payment-simulation__result" role="status">
            <CheckCircle2 aria-hidden="true" />
            <h4>
              {result.alreadyEnrolled ? 'Já está inscrito neste curso' : 'Simulação aprovada'}
            </h4>
            <p>A inscrição está guardada. Pode aceder às aulas mesmo depois de reiniciar.</p>
            {result.id && (
              <p>
                Referência: <code>{result.id}</code>
              </p>
            )}
            {result.id && (
              <p>
                {methodLabels[result.method]} · {new Date(result.createdAt).toLocaleString('pt-PT')}
              </p>
            )}
            <Button onClick={onSuccess}>Continuar para o curso</Button>
          </div>
        ) : confirming ? (
          <form onSubmit={submit} className="payment-simulation__form" aria-busy={busy}>
            <p>Reveja os dados antes de confirmar a sua compra simulada.</p>
            <dl className="payment-simulation__confirmation">
              <div>
                <dt>Curso</dt>
                <dd>{course.title || course.name}</dd>
              </div>
              <div>
                <dt>Método</dt>
                <dd>{methodLabels[method]}</dd>
              </div>
              <div>
                <dt>Total a confirmar</dt>
                <dd>
                  <strong>{formatCoursePrice(course)}</strong>
                </dd>
              </div>
              <div>
                <dt>Resultado de demonstração</dt>
                <dd>{outcome === 'approved' ? 'Pagamento aprovado' : 'Pagamento recusado'}</dd>
              </div>
            </dl>
            <p>
              A confirmação aprovada guarda a inscrição e dá acesso ao curso. Não será debitado
              qualquer valor.
            </p>
            {error && (
              <p className="payment-simulation__error" role="alert">
                {error}
              </p>
            )}
            <div className="payment-simulation__actions">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setConfirming(false);
                  setError('');
                }}
              >
                Voltar
              </Button>
              <Button type="submit" isLoading={busy}>
                Confirmar compra · {formatCoursePrice(course)}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError('');
              setConfirming(true);
            }}
            className="payment-simulation__form"
          >
            <label htmlFor="payment-method">Método de pagamento</label>
            <select
              id="payment-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={busy}
            >
              <option value="card">Cartão de demonstração</option>
              <option value="mbway">MB WAY</option>
              <option value="multibanco">Multibanco</option>
            </select>
            <p>São usados dados fictícios. Não introduza dados bancários.</p>
            <label htmlFor="payment-outcome">Resultado a simular</label>
            <select
              id="payment-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              disabled={busy}
            >
              <option value="approved">Aprovado · conceder acesso</option>
              <option value="declined">Recusado · manter sem acesso</option>
            </select>
            {error && (
              <p className="payment-simulation__error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" isLoading={busy}>
              Rever compra · {formatCoursePrice(course)}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
