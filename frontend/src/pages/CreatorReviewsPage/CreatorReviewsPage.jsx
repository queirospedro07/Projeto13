import { Link } from 'react-router-dom';
import { ReviewQueue } from '../../components/CreatorTools';
import './CreatorReviewsPage.css';

export default function CreatorReviewsPage() {
  return (
    <div className="creator-reviews-page">
      <header>
        <div>
          <p>Estúdio do formador</p>
          <h1>Avaliar trabalhos</h1>
          <p>
            Reveja projetos e respostas de desenvolvimento, atribua notas e envie feedback aos
            alunos.
          </p>
        </div>
        <Link to="/creator">Voltar ao painel</Link>
      </header>
      <ReviewQueue />
    </div>
  );
}
