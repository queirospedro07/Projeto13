import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from '../src/components/Avatar';

afterEach(cleanup);

it.each(['ADMIN', 'CREATOR', 'STUDENT'])('mostra a inicial sem fotografia para %s', (role) => {
  render(<Avatar name="Pedro Queirós" role={role} />);
  expect(screen.getByText('P')).toBeTruthy();
  expect(screen.queryByRole('img')).toBeNull();
});

it('substitui o avatar predefinido antigo pela inicial', () => {
  render(<Avatar name="Ana" src="/avatar-default.svg" />);
  expect(screen.getByText('A')).toBeTruthy();
  expect(screen.queryByRole('img')).toBeNull();
});

it('mostra a fotografia carregada e recupera a inicial se a imagem falhar', () => {
  render(<Avatar name="Pedro" src="/uploads/foto.webp" />);
  const image = screen.getByRole('img', { name: 'Pedro' });
  expect(image.getAttribute('src')).toBe('/uploads/foto.webp');
  fireEvent.error(image);
  expect(screen.getByText('P')).toBeTruthy();
});
