import { Navigate, generatePath, matchPath, useLocation } from 'react-router-dom';

export const ROTAS_ANTERIORES = [
  ['login', 'entrar'],
  ['register', 'registar'],
  ['forgot-password', 'recuperar-palavra-passe'],
  ['reset-password', 'repor-palavra-passe'],
  ['explore', 'explorar'],
  ['courses/:id', 'cursos/:id'],
  ['certificates/verify/:id', 'certificados/verificar/:id'],
  ['help', 'ajuda'],
  ['support', 'apoio'],
  ['privacy', 'privacidade'],
  ['terms', 'termos'],
  ['search', 'pesquisar'],
  ['dashboard', 'painel'],
  ['learn/:idCurso', 'aprender/:idCurso'],
  ['library', 'biblioteca'],
  ['messages', 'mensagens'],
  ['profile', 'perfil'],
  ['profile/:username', 'perfil/:username'],
  ['community/:id', 'comunidade/:id'],
  ['creator/apply', 'formador/candidatar'],
  ['creator', 'formador'],
  ['creator/dashboard', 'formador/painel'],
  ['creator/courses/new', 'formador/cursos/novo'],
  ['creator/courses/:idCurso/edit', 'formador/cursos/:idCurso/editar'],
  ['creator/members', 'formador/membros'],
  ['settings', 'definicoes'],
  ['admin', 'administracao'],
  ['creator/reviews', 'formador/avaliacoes'],
  ['community', 'comunidade'],
  ['progress', 'progresso'],
  ['achievements', 'conquistas'],
  ['leaderboard', 'classificacao'],
];

export function RedirecionarRotaAnterior() {
  const local = useLocation();
  for (const [anterior, atual] of ROTAS_ANTERIORES) {
    const correspondencia = matchPath('/' + anterior, local.pathname);
    if (!correspondencia) continue;

    return (
      <Navigate
        to={generatePath('/' + atual, correspondencia.params) + local.search + local.hash}
        state={local.state}
        replace
      />
    );
  }

  return null;
}
