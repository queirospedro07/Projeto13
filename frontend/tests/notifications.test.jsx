import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Notifications from '../src/components/Notifications/Notifications';

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock('../src/services/api', () => ({ api: { get, put } }));
beforeEach(() => {
  get.mockReset();
  put.mockReset();
  put.mockResolvedValue({ data: {} });
});
afterEach(cleanup);
it('mostra o feedback por ler e abre o editor após marcar a notificação como lida', async () => {
  get.mockResolvedValue({
    data: [
      {
        id: 'review',
        title: 'Alterações solicitadas ao curso',
        content: 'Melhore a introdução.',
        link: '/creator/courses/course/edit',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ],
  });
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={<Notifications />}
        />
        <Route
          path="/creator/courses/course/edit"
          element={<p>Editor com feedback</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações (1 por ler)' }));
  fireEvent.click(await screen.findByRole('button', { name: /Alterações solicitadas/ }));
  await screen.findByText('Editor com feedback');
  expect(put).toHaveBeenCalledWith('/notifications/review/read');
});
it('não navega para ligações externas presentes numa notificação', async () => {
  get.mockResolvedValue({
    data: [
      {
        id: 'bad',
        title: 'Aviso',
        content: 'Ligação inválida',
        link: '//external.invalid',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ],
  });
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={<Notifications />}
        />
        <Route
          path="/dashboard"
          element={<p>Painel seguro</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações (1 por ler)' }));
  fireEvent.click(await screen.findByRole('button', { name: /Aviso/ }));
  await screen.findByText('Painel seguro');
});
