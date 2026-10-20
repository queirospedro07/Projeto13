import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseServerSidebar } from '../src/components/CourseServerSidebar/CourseServerSidebar';

afterEach(cleanup);
function show(hasCommunity, isCreatorOrAdmin) {
  render(
    <MemoryRouter>
      <CourseServerSidebar
        courseTitle="Curso de teste"
        courseId="course"
        hasCommunity={hasCommunity}
        isCreatorOrAdmin={isCreatorOrAdmin}
        customChannels={[]}
        modules={[]}
        completedLessonIds={new Set()}
        resourcesCount={0}
      />
    </MemoryRouter>,
  );
}
it.each([true, false])(
  'oculta toda a comunidade num curso sem comunidade, mesmo com gestão=%s',
  (manager) => {
    show(false, manager);
    expect(screen.queryByText('Salas ao Vivo & Voz')).toBeNull();
    expect(screen.queryByText('Nenhuma sala de voz ativa.')).toBeNull();
    expect(screen.queryByText('Canais de Conversa')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Criar canal' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Criar sala de voz' })).toBeNull();
    expect(screen.getByText('Aulas & Módulos')).toBeTruthy();
  },
);
it('mantém os controlos de comunidade para o formador num curso com comunidade', () => {
  show(true, true);
  expect(screen.getByText('Salas ao Vivo & Voz')).toBeTruthy();
  expect(screen.getByText('Canais de Conversa')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Criar sala de voz' })).toBeTruthy();
});
