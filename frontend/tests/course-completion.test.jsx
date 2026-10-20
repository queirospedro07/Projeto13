import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseCompletion from '../src/components/CourseCompletion/CourseCompletion';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('../src/services/api', () => ({ api: { post } }));
beforeEach(() => {
  post.mockReset();
});
afterEach(cleanup);
it('mantém uma ligação ao certificado já emitido sem voltar a pedi-lo', () => {
  render(
    <MemoryRouter>
      <CourseCompletion
        courseId="course"
        certificate={{ id: 'certificate' }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Ver certificado' }).getAttribute('href')).toBe(
    '/certificates/verify/certificate',
  );
  expect(post).not.toHaveBeenCalled();
});
it('obtém o certificado de um curso concluído anteriormente e abre a sua página', async () => {
  post.mockResolvedValue({ data: { certificate: { id: 'certificate' } } });
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={<CourseCompletion courseId="course" />}
        />
        <Route
          path="/certificates/verify/certificate"
          element={<p>Página do certificado</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ver certificado' }));
  await screen.findByText('Página do certificado');
  expect(post).toHaveBeenCalledWith('/certificates/generate/course');
});
it('apresenta o erro se o servidor indicar requisitos por cumprir', async () => {
  post.mockRejectedValue(new Error('Conclua todas as avaliações.'));
  render(
    <MemoryRouter>
      <CourseCompletion courseId="course" />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ver certificado' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Conclua todas as avaliações.');
});
