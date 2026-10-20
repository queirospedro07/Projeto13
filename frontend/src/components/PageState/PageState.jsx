import { LuCircleAlert as AlertCircle, LuLoaderCircle as LoaderCircle } from 'react-icons/lu';
import { Button } from '../Button';
import './PageState.css';

export function PageState({ loading = false, title, message, onRetry }) {
  const Icon = loading ? LoaderCircle : AlertCircle;

  return (
    <section
      className="page-state"
      role={loading ? 'status' : 'alert'}
      aria-busy={loading}
    >
      <Icon
        aria-hidden="true"
        className={loading ? 'page-state__spinner' : undefined}
      />
      <h1>{title}</h1>
      {message && <p>{message}</p>}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
        >
          Tentar novamente
        </Button>
      )}
    </section>
  );
}
