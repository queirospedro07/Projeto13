import './NotFoundPage.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuCompass as Compass,
  LuHouse as Home,
  LuCircleHelp as HelpCircle,
  LuArrowLeft as ArrowLeft,
} from 'react-icons/lu';
import { Botao } from '../../components/Button';
import { Logotipo } from '../../components/Logo';
import { SEO } from '../../components/SEO';

export const PaginaNaoEncontrada = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="404 — Página Não Encontrada | NEXO"
        description="A página que procura não existe ou foi movida. Explore os nossos cursos ou volte à página inicial da NEXO."
      />

      <div className="not-found-page-panel">
        <div className="not-found-page-panel-2">
          <Logotipo
            size="lg"
            showText={false}
          />

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
            <Botao
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              leftIcon={<Home className="not-found-page-home" />}
              className="not-found-page-button"
            >
              Página Inicial
            </Botao>

            <Botao
              variant="secondary"
              size="md"
              onClick={() => navigate('/explorar')}
              leftIcon={<Compass className="not-found-page-home" />}
              className="not-found-page-button-2"
            >
              Explorar Cursos
            </Botao>
          </div>

          {/* Additional helpful links */}
          <div className="not-found-page-panel-6">
            <Link
              to="/ajuda"
              className="not-found-page-link"
            >
              <HelpCircle className="not-found-page-help-circle" />
              <span>Centro de Ajuda & FAQ</span>
            </Link>
            <span>•</span>
            <button
              onClick={() => navigate(-1)}
              className="not-found-page-button-3"
            >
              <ArrowLeft className="not-found-page-help-circle" />
              <span>Voltar atrás</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaginaNaoEncontrada;
