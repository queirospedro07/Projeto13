import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Modal } from '../src/components/Modal';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});
it('mantém o fundo bloqueado se o primeiro de dois diálogos for fechado', () => {
  document.body.style.overflow = 'auto';

  const dialogs = (first, second) => (
    <>
      <Modal
        isOpen={first}
        onClose={() => {}}
        title="Primeiro"
      >
        <p>Conteúdo</p>
      </Modal>
      <Modal
        isOpen={second}
        onClose={() => {}}
        title="Segundo"
      >
        <p>Conteúdo</p>
      </Modal>
    </>
  );
  const view = render(dialogs(true, true));

  expect(document.body.style.overflow).toBe('hidden');
  view.rerender(dialogs(false, true));
  expect(document.body.style.overflow).toBe('hidden');
  view.rerender(dialogs(false, false));
  expect(document.body.style.overflow).toBe('auto');
});
