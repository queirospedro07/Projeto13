import { LuCircleAlert as AlertCircle } from 'react-icons/lu';
import { Botao } from '../Button';
import { EsqueletoPagina } from '../Skeleton';
import './StatusPage.css';

export function PaginaEstado({
  loading: carregamento = false,
  title: titulo,
  message: mensagem,
  onRetry,
  loadingVariant: varianteCarregamento = 'default',
}) {
  if (carregamento) {
    return (
      <EsqueletoPagina
        variant={varianteCarregamento}
        label={titulo || 'A carregar conteúdo'}
      />
    );
  }

  return (
    <section
      className="page-state"
      role="alert"
    >
      <AlertCircle aria-hidden="true" />
      <h1>{titulo}</h1>
      {mensagem && <p>{mensagem}</p>}
      {onRetry && (
        <Botao
          onClick={onRetry}
          variant="outline"
        >
          Tentar novamente
        </Botao>
      )}
    </section>
  );
}
