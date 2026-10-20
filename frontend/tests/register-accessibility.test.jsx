import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../src/pages/RegisterPage';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null, register: vi.fn() }),
}));
afterEach(cleanup);
it('associa os nomes dos campos às entradas do registo e permite preenchimento automático correto', () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('textbox', { name: 'Nome Completo' }).autocomplete).toBe('name');
  expect(screen.getByRole('textbox', { name: 'Nome de Utilizador' }).autocomplete).toBe('username');
  expect(screen.getByRole('textbox', { name: 'E-mail' }).autocomplete).toBe('email');
  expect(screen.getByLabelText('Palavra-passe', { exact: true }).autocomplete).toBe('new-password');
  expect(screen.getByLabelText('Confirmar Palavra-passe', { exact: true }).autocomplete).toBe(
    'new-password',
  );
});
