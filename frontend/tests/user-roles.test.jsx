import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserRoleEditor from '../src/components/UserRoleEditor/UserRoleEditor';
import { ProtectedRoute } from '../src/components/ProtectedRoute/ProtectedRoute';
const { put, actor } = vi.hoisted(() => ({
  put: vi.fn(),
  actor: { user: { id: 'admin', role: 'ADMIN', isTeacher: true } },
}));
vi.mock('../src/services/api', () => ({ api: { put } }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: actor.user, isLoading: false }),
}));
beforeEach(() => {
  put.mockReset();
  actor.user = { id: 'admin', role: 'ADMIN', isTeacher: true };
});
afterEach(cleanup);
it('só altera o cargo de outra conta depois da confirmação', async () => {
  put.mockResolvedValue({ data: {} });
  const onChanged = vi.fn();
  render(
    <UserRoleEditor
      user={{ id: 'student', name: 'Aluno', role: 'STUDENT', isTeacher: false }}
      onChanged={onChanged}
    />,
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Cargo de Aluno' }));
  fireEvent.click(screen.getByRole('option', { name: 'Administrador e formador' }));
  fireEvent.click(screen.getByRole('button', { name: 'Alterar cargo' }));
  expect(put).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cargo' }));
  await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
  expect(put).toHaveBeenCalledWith('/admin/users/student/role', { role: 'ADMIN', isTeacher: true });
});
it('não permite alterar o cargo da própria conta na interface', () => {
  render(
    <UserRoleEditor
      user={{ id: 'admin', name: 'Administrador', role: 'ADMIN', isTeacher: true }}
      onChanged={vi.fn()}
    />,
  );
  expect(screen.queryByRole('combobox')).toBeNull();
});
it.each([false, true])(
  'o acesso de administrador à página de avaliação respeita isTeacher=%s',
  async (isTeacher) => {
    actor.user = { id: 'admin', role: 'ADMIN', isTeacher };
    render(
      <MemoryRouter initialEntries={['/creator/reviews']}>
        <Routes>
          <Route
            path="/creator/reviews"
            element={
              <ProtectedRoute requiredRole="CREATOR">
                <p>Página de avaliação</p>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<p>Painel administrativo</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText(isTeacher ? 'Página de avaliação' : 'Painel administrativo');
  },
);
