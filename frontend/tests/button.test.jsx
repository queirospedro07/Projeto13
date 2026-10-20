import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import { Button } from '../src/components/Button';

afterEach(cleanup);
it('apresenta uma ligação de navegação sem criar um botão interativo dentro dela', () => {
  const view = render(
    <MemoryRouter>
      <Link to="/library">
        <Button as="span">Abrir biblioteca</Button>
      </Link>
    </MemoryRouter>,
  );

  expect(screen.getByRole('link', { name: 'Abrir biblioteca' })).toBeTruthy();
  expect(view.container.querySelector('a button')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});
it('mantém o bloqueio de ações enquanto um botão nativo está a carregar', () => {
  render(<Button isLoading>Guardar</Button>);
  expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(true);
});
