import { useRef, useState } from 'react';
import { LuCircleCheck as CheckCircle2, LuCreditCard as CreditCard } from 'react-icons/lu';
import { Janela } from '../Janela';
import { Botao } from '../Botao';
import { api } from '../../servicos/api';
import { formatarCursoPreco } from '../../utilitarios/formatacao';
import './PagamentoSimulacaoJanela.css';

export function PagamentoSimulacaoJanela({
  course: curso,
  onClose: onFechar,
  onSuccess: onSucesso,
}) {
  const [busy, definirBusy] = useState(false);
  const [erro, definirErro] = useState('');
  const [resultado, definirResultado] = useState(null);
  const submitting = useRef(false);
  if (import.meta.env.PROD) {
    return (
      <Janela
        isOpen
        title="Inscrição no curso"
        onClose={onFechar}
        maxWidth="md"
      >
        <div className="payment-simulation">
          <h4>{curso.title || curso.name}</h4>
          <p>
            Os pagamentos online ainda não estão disponíveis. Contacte o formador para obter acesso
            a este curso.
          </p>
          <Botao
            variant="secondary"
            onClick={onFechar}
          >
            Fechar
          </Botao>
        </div>
      </Janela>
    );
  }

  async function confirmarPurchase(evento) {
    evento.preventDefault();
    if (submitting.current || resultado) return;
    submitting.current = true;
    definirBusy(true);
    definirErro('');
    try {
      const { data: dados } = await api.post(
        `/pagamentos/simular/${encodeURIComponent(curso.id)}`,
        {
          method: 'card',
          outcome: 'approved',
          expectedAmountCents: Math.round(Number(curso.price) * 100),
        },
      );
      if (dados.status !== 'approved' && !dados.alreadyEnrolled) {
        throw new Error('Não foi possível confirmar o pagamento. Tente novamente.');
      }

      definirResultado(dados);
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
    } catch (erro2) {
      definirErro(erro2.message || 'Não foi possível confirmar a compra. Tente novamente.');
    } finally {
      submitting.current = false;
      definirBusy(false);
    }
  }

  return (
    <Janela
      isOpen
      title={resultado ? 'Pagamento concluído' : 'Pagamento'}
      onClose={() => !submitting.current && (resultado ? onSucesso() : onFechar())}
      maxWidth="md"
    >
      <div className="payment-simulation">
        <div className="payment-simulation__summary">
          <CreditCard aria-hidden="true" />
          <div>
            <h4>{curso.title || curso.name}</h4>
            <p>Acesso ao curso</p>
          </div>
          <strong>{formatarCursoPreco(curso)}</strong>
        </div>
        {resultado ? (
          <div
            className="payment-simulation__result"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" />
            <p>
              {resultado.alreadyEnrolled
                ? 'Já está inscrito neste curso.'
                : 'Pagamento confirmado. Já pode aceder às aulas.'}
            </p>
            <Botao onClick={onSucesso}>Continuar para o curso</Botao>
          </div>
        ) : (
          <form
            onSubmit={confirmarPurchase}
            className="payment-simulation__form"
            aria-busy={busy}
          >
            <p>
              Simulação de demonstração, sem cobrança real. Ao confirmar, a inscrição fica guardada
              na sua conta.
            </p>
            {erro && (
              <p
                className="payment-simulation__error"
                role="alert"
              >
                {erro}
              </p>
            )}
            <div className="payment-simulation__actions">
              <Botao
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={onFechar}
              >
                Cancelar
              </Botao>
              <Botao
                type="submit"
                isLoading={busy}
              >
                Pagar
              </Botao>
            </div>
          </form>
        )}
      </div>
    </Janela>
  );
}
