import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { api, getAuthToken, setAuthToken } from '../src/services/api';

const { auth } = vi.hoisted(() => ({
  auth: { user: null, isLoading: false, sessionError: '', retrySession: vi.fn() },
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => auth }));
beforeEach(() => {
  Object.assign(auth, { user: null, isLoading: false, sessionError: '' });
  auth.retrySession.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(cleanup);
function show(requiredRole) {
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <p>Área privada</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Iniciar sessão</p>} />
        <Route path="/dashboard" element={<p>Painel do aluno</p>} />
        <Route path="/creator/apply" element={<p>Candidatura a formador</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
it('redireciona visitantes para o login sem apresentar conteúdo privado', () => {
  show();
  expect(screen.getByText('Iniciar sessão')).toBeTruthy();
  expect(screen.queryByText('Área privada')).toBeNull();
});
it('impede alunos de abrir a administração', () => {
  auth.user = { role: 'STUDENT' };
  show('ADMIN');
  expect(screen.getByText('Painel do aluno')).toBeTruthy();
});
it('permite ao administrador abrir as ferramentas de professor', () => {
  auth.user = { role: 'ADMIN' };
  show('CREATOR');
  expect(screen.getByText('Área privada')).toBeTruthy();
});
it('aguarda a validação da sessão antes de apresentar uma rota protegida', () => {
  auth.isLoading = true;
  show();
  expect(screen.queryByText('Área privada')).toBeNull();
  expect(screen.getByText(/A verificar credenciais/)).toBeTruthy();
});
it('permite recuperar uma falha de sessão sem mostrar conteúdo privado', () => {
  auth.sessionError = 'Serviço indisponível';
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(auth.retrySession).toHaveBeenCalledOnce();
  expect(screen.queryByText('Área privada')).toBeNull();
});
it('envia o JWT em Authorization e mantém a preferência de persistência', async () => {
  setAuthToken('session-jwt');
  expect(sessionStorage.getItem('nexo_token')).toBe('session-jwt');
  expect(localStorage.getItem('nexo_token')).toBeNull();
  setAuthToken('persistent-jwt', true);
  expect(sessionStorage.getItem('nexo_token')).toBeNull();
  let authorization;
  await api.get('/auth/me', {
    adapter: async (config) => {
      authorization = config.headers.Authorization;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
  expect(authorization).toBe('Bearer persistent-jwt');
});
it('preserva o JWT quando há falhas do serviço e remove-o quando a sessão é inválida', async () => {
  window.history.replaceState({}, '', '/login');
  setAuthToken('jwt', true);
  const rejected = (status) => (config) =>
    Promise.reject({ response: { status, data: { message: 'Erro de teste' } }, config });
  await expect(api.get('/auth/me', { adapter: rejected(503) })).rejects.toMatchObject({
    status: 503,
  });
  expect(getAuthToken()).toBe('jwt');
  await expect(api.get('/auth/me', { adapter: rejected(401) })).rejects.toMatchObject({
    status: 401,
  });
  expect(getAuthToken()).toBeNull();
});
