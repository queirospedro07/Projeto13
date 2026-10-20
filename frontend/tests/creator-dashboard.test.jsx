import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatorDashboardPage from '../src/pages/CreatorDashboardPage';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../src/services/api', () => ({ api: { get } }));
vi.mock('../src/components/CreatorTools', () => ({
  ReviewQueue: () => null,
  CourseAccessManager: () => null,
}));
afterEach(() => {
  cleanup();
  get.mockReset();
});

it.each([0, 14549])('apresenta os ganhos em euros para %i cêntimos', async (totalRevenueCents) => {
  get.mockImplementation(async (url) => ({
    data: url === '/creator/stats' ? { totalRevenueCents } : [],
  }));
  render(
    <MemoryRouter>
      <CreatorDashboardPage />
    </MemoryRouter>,
  );
  await screen.findByText('Ganhos totais');
  const amount = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
    totalRevenueCents / 100,
  );
  expect(
    screen.getByText((text) => text.replace(/\s/g, '') === amount.replace(/\s/g, '')),
  ).toBeTruthy();
  expect(screen.queryByText('Por configurar')).toBeNull();
});
