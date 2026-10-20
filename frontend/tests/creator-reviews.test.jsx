import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatorReviewsPage from '../src/pages/CreatorReviewsPage';

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock('../src/services/api', () => ({ api: { get, put } }));

const project = {
  id: 'project',
  studentName: 'Ana',
  lessonTitle: 'Projeto final',
  courseId: 'course',
  courseTitle: 'Curso de programação',
  url: 'https://example.com/project',
};
const quiz = {
  id: 'quiz',
  studentName: 'Pedro',
  lessonTitle: 'Questionário final',
  courseId: 'course',
  courseTitle: 'Curso de programação',
  quiz: { questions: [{ id: 'question', question: 'Explique a solução', type: 'open-ended' }] },
  answers: { question: 'A minha resposta' },
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  get.mockReset();
  put.mockReset();
  get.mockImplementation(async (url) => ({
    data:
      url === '/creator/courses'
        ? [
            { id: 'course', title: 'Curso de programação' },
            { id: 'other', title: 'Design' },
          ]
        : url === '/projects/reviews'
          ? [project]
          : [quiz],
  }));
  put.mockResolvedValue({ data: {} });
});
afterEach(() => {
  cleanup();
  delete Element.prototype.scrollIntoView;
});

function show() {
  render(
    <MemoryRouter>
      <CreatorReviewsPage />
    </MemoryRouter>,
  );
}

it('mostra os trabalhos e permite filtrar por tipo e aluno', async () => {
  show();
  await screen.findByText('Projeto final');
  await screen.findByText('Questionário final');
  fireEvent.click(screen.getByRole('combobox', { name: 'Tipo de trabalho' }));
  fireEvent.click(screen.getByRole('option', { name: 'Projetos' }));
  expect(screen.queryByText('Questionário final')).toBeNull();
  fireEvent.change(screen.getByLabelText('Pesquisar aluno ou trabalho'), {
    target: { value: 'Pedro' },
  });
  expect(screen.queryByText('Projeto final')).toBeNull();
});
it('permite escolher um curso sem trabalhos e voltar a um curso com entregas', async () => {
  show();
  await screen.findByText('Projeto final');
  fireEvent.click(screen.getByRole('combobox', { name: 'Curso a avaliar' }));
  fireEvent.click(screen.getByRole('option', { name: 'Design', exact: true }));
  expect(screen.queryByText('Projeto final')).toBeNull();
  expect(
    screen.getByText('Não existem trabalhos pendentes para os filtros selecionados.'),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('combobox', { name: 'Curso a avaliar' }));
  fireEvent.click(screen.getByRole('option', { name: 'Curso de programação', exact: true }));
  expect(screen.getByText('Projeto final')).toBeTruthy();
  expect(screen.getByText('Questionário final')).toBeTruthy();
});
it('exige feedback antes de pedir alterações e envia o parecer ao servidor', async () => {
  show();

  const button = await screen.findByRole('button', { name: 'Pedir alterações' });

  fireEvent.click(button);
  await screen.findByText('Escreva o feedback com as alterações necessárias.');
  expect(put).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Parecer para o aluno'), {
    target: { value: 'Adicione testes.' },
  });
  fireEvent.click(button);
  await waitFor(() =>
    expect(put).toHaveBeenCalledWith('/projects/reviews/project', {
      status: 'CHANGES_REQUESTED',
      feedback: 'Adicione testes.',
    }),
  );
});
it('atribui uma nota ao questionário na página dedicada', async () => {
  show();

  const grade = await screen.findByLabelText('Nota final (0–100)');

  fireEvent.change(grade, { target: { value: '85' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar avaliação' }));
  await waitFor(() => expect(put).toHaveBeenCalledWith('/quizzes/reviews/quiz', { score: 85 }));
});
