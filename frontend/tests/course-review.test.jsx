import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseReview from '../src/components/CourseReview/CourseReview';

afterEach(cleanup);
const course = {
  id: 'pending',
  title: 'Curso para revisão',
  description: 'Apresentação do curso',
  approvalStatus: 'PENDING',
  creator: { name: 'Formador' },
  price: 10,
  learningOutcomes: ['Aprender a programar'],
  requirements: ['Computador'],
  modules: [
    {
      id: 'module',
      title: 'Primeiro módulo',
      lessons: [
        {
          id: 'article',
          title: 'Aula de leitura',
          type: 'article',
          richArticle: { markdown: 'Texto para o administrador rever.' },
        },
        {
          id: 'quiz',
          title: 'Aula com questionário',
          type: 'quiz',
          quiz: {
            questions: [
              {
                id: 'question',
                question: 'Qual é a resposta?',
                options: ['Resposta A', 'Resposta B'],
              },
            ],
          },
        },
      ],
    },
  ],
};
function show(props = {}) {
  render(
    <MemoryRouter>
      <CourseReview
        course={course}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onRequestChanges={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}
it('permite rever as aulas e só aprovar após confirmação explícita', async () => {
  const onApprove = vi.fn();
  show({ onApprove });
  const approve = await screen.findByRole('button', { name: 'Aprovar e publicar' });
  expect(approve.disabled).toBe(true);
  expect(screen.getByText('Texto para o administrador rever.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Aula com questionário/ }));
  expect(screen.getByText('Qual é a resposta?')).toBeTruthy();
  expect(screen.getByText('Resposta A')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(approve);
  expect(onApprove).toHaveBeenCalledOnce();
});
it('permite pedir alterações e impede aprovar um curso sem aulas', async () => {
  const onRequestChanges = vi.fn();
  show({ course: { ...course, modules: [] }, onRequestChanges });
  const approve = await screen.findByRole('button', { name: 'Aprovar e publicar' });
  fireEvent.click(screen.getByRole('checkbox'));
  expect(approve.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Pedir alterações' }));
  expect(onRequestChanges).toHaveBeenCalledOnce();
});
it('não disponibiliza a aprovação quando o carregamento falha', async () => {
  const onRetry = vi.fn();
  show({ error: true, onRetry });
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: 'Aprovar e publicar' })).toBeNull();
});
