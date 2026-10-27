import { LuCircleAlert as AlertCircle, LuLoaderCircle as LoaderCircle } from 'react-icons/lu';
import { Botao } from '../Botao';
import './PaginaEstado.css';

export function PaginaEstado({
  loading: carregamento = false,
  title: titulo,
  message: mensagem,
  onRetry,
}) {
  const Icon = carregamento ? LoaderCircle : AlertCircle;

  return (
    <section
      className="page-state"
      role={carregamento ? 'status' : 'alert'}
      aria-busy={carregamento}
    >
      <Icon
        aria-hidden="true"
        className={carregamento ? 'page-state__spinner' : undefined}
      />
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
