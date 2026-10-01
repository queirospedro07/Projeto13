import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, HelpCircle, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { SEO } from '../../components/common/SEO';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="404 — Página Não Encontrada | NEXO"
        description="A página que procura não existe ou foi movida. Explore os nossos cursos ou volte à página inicial da NEXO."
      />

      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
        <div className="max-w-md mx-auto flex flex-col items-center gap-6">
          <Logo size="lg" showText={false} />

          <div className="relative">
            <span className="text-8xl sm:text-9xl font-display font-black tracking-tight text-slate-200 dark:text-neutral-900 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
                Página Não Encontrada
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-sm">
            O endereço que solicitou pode ter sido removido, alterado ou estar temporariamente indisponível.
          </p>

          {/* Quick Action Buttons / Clear CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-100 font-bold"
            >
              Página Inicial
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/explore')}
              leftIcon={<Compass className="w-4 h-4" />}
              className="w-full sm:w-auto font-semibold"
            >
              Explorar Cursos
            </Button>
          </div>

          {/* Additional helpful links */}
          <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-400">
            <Link to="/help" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Centro de Ajuda & FAQ</span>
            </Link>
            <span>•</span>
            <button
              onClick={() => navigate(-1)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar atrás</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
