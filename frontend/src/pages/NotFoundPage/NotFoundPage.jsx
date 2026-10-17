import './NotFoundPage.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuCompass as Compass,
  LuHouse as Home,
  LuCircleHelp as HelpCircle,
  LuArrowLeft as ArrowLeft,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="404 — Página Não Encontrada | NEXO"
        description="A página que procura não existe ou foi movida. Explore os nossos cursos ou volte à página inicial da NEXO."
      />

      <div className="not-found-page-panel">
        <div className="not-found-page-panel-2">
          <Logo size="lg" showText={false} />

          <div className="not-found-page-panel-3">
            <span className="not-found-page-label">404</span>
            <div className="not-found-page-panel-4">
              <span className="not-found-page-label-2">Página Não Encontrada</span>
            </div>
          </div>

          <p className="not-found-page-description">
            O endereço que solicitou pode ter sido removido, alterado ou estar temporariamente
            indisponível.
          </p>

          {/* Quick Action Buttons / Clear CTAs */}
          <div className="not-found-page-panel-5">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              leftIcon={<Home className="not-found-page-home" />}
              className="not-found-page-button"
            >
              Página Inicial
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/explore')}
              leftIcon={<Compass className="not-found-page-home" />}
              className="not-found-page-button-2"
            >
              Explorar Cursos
            </Button>
          </div>

          {/* Additional helpful links */}
          <div className="not-found-page-panel-6">
            <Link to="/help" className="not-found-page-link">
              <HelpCircle className="not-found-page-help-circle" />
              <span>Centro de Ajuda & FAQ</span>
            </Link>
            <span>•</span>
            <button onClick={() => navigate(-1)} className="not-found-page-button-3">
              <ArrowLeft className="not-found-page-help-circle" />
              <span>Voltar atrás</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default NotFoundPage;
