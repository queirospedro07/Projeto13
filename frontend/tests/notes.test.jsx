import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LessonNotesTab } from '../src/components/LessonNotesTab';
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../src/services/api', () => ({ api: { get, post } }));
vi.mock('../src/services/soundEffects', () => ({ soundEffects: { playSuccess: vi.fn() } }));
beforeEach(() => {
  get.mockReset();
  post.mockReset();
});
afterEach(cleanup);
it('carrega as notas guardadas quando uma aula é aberta', async () => {
  get.mockResolvedValue({ data: { content: 'Notas persistidas' } });
  render(<LessonNotesTab lessonId="lesson" />);
  const textarea = screen.getByRole('textbox');
  await waitFor(() => expect(textarea.value).toBe('Notas persistidas'));
  expect(get).toHaveBeenCalledWith('/notes/lesson');
});
it('mantém o texto após uma falha ao guardar e permite repetir sem o apagar', async () => {
  get.mockResolvedValue({ data: { content: 'Anterior' } });
  post.mockRejectedValueOnce(new Error('Sem ligação')).mockResolvedValue({ data: {} });
  render(<LessonNotesTab lessonId="lesson" />);
  const textarea = screen.getByRole('textbox');
  await waitFor(() => expect(textarea.disabled).toBe(false));
  fireEvent.change(textarea, { target: { value: 'Texto por guardar' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Notas' }));
  await screen.findByRole('alert');
  expect(textarea.value).toBe('Texto por guardar');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Notas guardadas.');
  expect(post).toHaveBeenLastCalledWith('/notes/lesson', { content: 'Texto por guardar' });
  expect(get).toHaveBeenCalledOnce();
});
it('ignora uma resposta atrasada da aula anterior', async () => {
  let finish;
  get
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ data: { content: 'Segunda aula' } });
  const view = render(<LessonNotesTab lessonId="first" />);
  view.rerender(<LessonNotesTab lessonId="second" />);
  await waitFor(() => expect(screen.getByRole('textbox').value).toBe('Segunda aula'));
  finish({ data: { content: 'Primeira aula' } });
  await waitFor(() => expect(screen.getByRole('textbox').value).toBe('Segunda aula'));
});
