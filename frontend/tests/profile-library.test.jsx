import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../src/pages/ProfilePage';
import LibraryPage from '../src/pages/LibraryPage';

const { get, post, toast, user } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  toast: vi.fn(),
  user: {
    id: 'student',
    username: 'aluno_teste',
    name: 'Aluno de teste',
    role: 'STUDENT',
    profile: { showCourses: true },
  },
}));

vi.mock('../src/services/api', () => ({ api: { get, post } }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user, refreshUser: vi.fn() }) }));
vi.mock('../src/components/Toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('../src/components/ProfileEditor', () => ({ ProfileEditor: () => null }));
vi.mock('../src/components/Moderation', () => ({ ReportButton: () => null }));
vi.mock('../src/services/soundEffects', () => ({ soundEffects: { play: vi.fn() } }));

const enrollment = {
  id: 'enrollment',
  courseId: 'course',
  isHidden: false,
  progressPercent: 10,
  course: { id: 'course', title: 'Curso de teste' },
};

function showProfile() {
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route
          path="/profile/:username?"
          element={<ProfilePage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  toast.mockReset();
  localStorage.clear();
  get.mockImplementation(async (url) => ({
    data:
      url === '/courses/my-learning'
        ? [enrollment]
        : { friendsCount: 0, followersCount: 0, followingCount: 0 },
  }));
});
afterEach(cleanup);
it('não apresenta preferências locais antigas como privacidade confirmada no servidor', async () => {
  localStorage.setItem('nexo_hidden_courses', JSON.stringify(['course']));
  showProfile();
  expect(await screen.findByRole('button', { name: 'Ocultar de Outros' })).toBeTruthy();
});
it('mantém a visibilidade e comunica o erro quando a gravação falha', async () => {
  post.mockRejectedValue(new Error('Servidor indisponível'));
  showProfile();
  fireEvent.click(await screen.findByRole('button', { name: 'Ocultar de Outros' }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })),
  );
  expect(screen.getByRole('button', { name: 'Ocultar de Outros' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tornar Visível' })).toBeNull();
});
it('aplica o estado devolvido pelo servidor depois de guardar', async () => {
  post.mockResolvedValue({ data: { isHidden: true } });
  showProfile();
  fireEvent.click(await screen.findByRole('button', { name: 'Ocultar de Outros' }));
  expect(await screen.findByRole('button', { name: 'Tornar Visível' })).toBeTruthy();
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});
it('permite voltar a carregar a biblioteca sem confundir uma falha com uma lista vazia', async () => {
  get.mockRejectedValueOnce(new Error('Sem ligação'));
  render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole('heading', { name: 'Não foi possível carregar a biblioteca' }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Curso de teste')).toBeTruthy();
});
