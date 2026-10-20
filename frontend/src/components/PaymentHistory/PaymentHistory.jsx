import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../Button';
import './PaymentHistory.css';
const methods = {
  card: 'Cartão',
  mbway: 'MB WAY',
  multibanco: 'Multibanco',
};
export function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api
      .get('/payments')
      .then(({ data }) => data)
      .then((rows) => {
        if (active) {
          setPayments(rows);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [revision]);
  return (
    <section className="payment-history" aria-label="Histórico de pagamentos">
      <h3>Pagamentos</h3>
      <p>Consulte os pagamentos associados à sua conta.</p>
      {status === 'loading' && <p role="status">A carregar…</p>}
      {status === 'error' && (
        <>
          <p role="alert">Não foi possível carregar o histórico.</p>
          <Button
            onClick={() => {
              setStatus('loading');
              setRevision((n) => n + 1);
            }}
          >
            Tentar novamente
          </Button>
        </>
      )}
      {status === 'ready' &&
        (payments.length ? (
          <ul>
            {payments.map((payment) => (
              <li key={payment.id}>
                <div>
                  <strong>{payment.courseTitle}</strong>
                  <p>
                    {methods[payment.method]} ·{' '}
                    {new Date(payment.createdAt).toLocaleString('pt-PT')}
                  </p>
                </div>
                <div>
                  <strong>
                    {new Intl.NumberFormat('pt-PT', {
                      style: 'currency',
                      currency: payment.currency,
                    }).format(payment.amountCents / 100)}
                  </strong>
                  <p>{payment.status === 'approved' ? 'Aprovado' : 'Recusado'}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Ainda não existem pagamentos.</p>
        ))}
    </section>
  );
}
