import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Botao } from '../Button';
import { EsqueletoLinhas } from '../Skeleton';
import './PaymentHistory.css';

const methods = {
  card: 'Cartão',
  mbway: 'MB WAY',
  multibanco: 'Multibanco',
};

export function PagamentoHistorico() {
  const [pagamentos, definirPagamentos] = useState([]);
  const [estado, definirEstado] = useState('loading');
  const [revision, definirRevision] = useState(0);

  useEffect(() => {
    let ativo = true;

    api
      .get('/pagamentos')
      .then(({ data: dados }) => dados)
      .then((registos) => {
        if (ativo) {
          definirPagamentos(registos);
          definirEstado('ready');
        }
      })
      .catch(() => {
        if (ativo) definirEstado('error');
      });

    return () => {
      ativo = false;
    };
  }, [revision]);

  return (
    <section
      className="payment-history"
      aria-label="Histórico de pagamentos"
    >
      <h3>Pagamentos</h3>
      <p>Consulte os pagamentos associados à sua conta.</p>
      {estado === 'loading' && <EsqueletoLinhas count={3} label="A carregar pagamentos" />}
      {estado === 'error' && (
        <>
          <p role="alert">Não foi possível carregar o histórico.</p>
          <Botao
            onClick={() => {
              definirEstado('loading');
              definirRevision((n) => n + 1);
            }}
          >
            Tentar novamente
          </Botao>
        </>
      )}
      {estado === 'ready' &&
        (pagamentos.length ? (
          <ul>
            {pagamentos.map((pagamento) => (
              <li key={pagamento.id}>
                <div>
                  <strong>{pagamento.tituloCurso}</strong>
                  <p>
                    {methods[pagamento.method]} ·{' '}
                    {new Date(pagamento.criadoEm).toLocaleString('pt-PT')}
                  </p>
                </div>
                <div>
                  <strong>
                    {new Intl.NumberFormat('pt-PT', {
                      style: 'currency',
                      currency: pagamento.currency,
                    }).format(pagamento.amountCents / 100)}
                  </strong>
                  <p>{pagamento.status === 'approved' ? 'Aprovado' : 'Recusado'}</p>
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
