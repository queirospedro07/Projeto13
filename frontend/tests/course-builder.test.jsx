import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseBuilderPage from '../src/pages/CourseBuilderPage';
const { get, post, put } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('../src/services/api', () => ({ api: { get, post, put } }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'teacher', name: 'Formador', role: 'CREATOR' } }),
}));
vi.mock('../src/components/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../src/services/soundEffects', () => ({ soundEffects: { play: vi.fn() } }));
beforeEach(() => {
  get.mockReset();
  post.mockReset();
  put.mockReset();
  get.mockResolvedValue({
    data: { id: 'draft', title: 'Curso de teste', approvalStatus: 'DRAFT', updatedAt: 'version' },
  });
  put.mockResolvedValue({ data: { success: true } });
});
afterEach(cleanup);
function show() {
  render(
    <MemoryRouter initialEntries={['/creator/courses/new']}>
      <Routes>
        <Route path="/creator/courses/new" element={<CourseBuilderPage />} />
        <Route path="/creator" element={<p>Painel do criador</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByPlaceholderText(/Gestão Estratégica/), {
    target: { value: 'Curso de teste' },
  });
}
it('guarda um rascunho sem o submeter nem enviar opções removidas', async () => {
  post.mockResolvedValue({ data: { id: 'draft' } });
  show();
  expect(screen.queryByText('Preço com Desconto (€)')).toBeNull();
  expect(screen.queryByText('Medalha de Conclusão')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rascunho' }));
  await screen.findByText('Painel do criador');
  expect(post).toHaveBeenCalledOnce();
  expect(post.mock.calls[0][0]).toBe('/creator/courses');
  expect(post.mock.calls[0][1].isPublished).toBe(false);
  expect(post.mock.calls[0][1]).not.toHaveProperty('badge');
  expect(post.mock.calls[0][1]).not.toHaveProperty('certificate');
});
it('uma falha de submissão conserva o curso criado e a repetição não duplica cursos', async () => {
  let attempts = 0;
  post.mockImplementation(async (url) => {
    if (url.endsWith('/submit-review') && attempts++ === 0)
      throw new Error('Adicione aulas antes de submeter.');
    return { data: { id: 'draft' } };
  });
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Enviar para revisão' }).disabled).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));
  await screen.findByText('Painel do criador');
  expect(post.mock.calls.filter(([url]) => url === '/creator/courses')).toHaveLength(1);
  expect(put).toHaveBeenCalledWith(
    '/creator/courses/draft',
    expect.objectContaining({ expectedUpdatedAt: 'version' }),
  );
});
