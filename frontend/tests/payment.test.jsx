import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentSimulationModal } from '../src/components/PaymentSimulationModal';
import { CourseEnrollModal } from '../src/components/CourseEnrollModal';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../src/services/api', () => ({ api: { post } }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'student' } }) }));
vi.mock('../src/components/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const course = { id: 'paid', title: 'Curso de teste', price: 19.99, isFree: false };
const approved = {
  id: 'receipt',
  status: 'approved',
  amountCents: 1999,
  currency: 'EUR',
  method: 'card',
  createdAt: '2026-10-16T10:00:00Z',
};
beforeEach(() => {
  post.mockReset();
});
afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('confirmação de compras simuladas', () => {
  it('permite rever e voltar sem efetuar um pagamento e exige confirmação explícita', async () => {
    const onSuccess = vi.fn();
    post.mockResolvedValue({ data: approved });
    render(<PaymentSimulationModal course={course} onClose={vi.fn()} onSuccess={onSuccess} />);
    fireEvent.click(await screen.findByRole('button', { name: /Rever compra/ }));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Confirmar compra');
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Rever compra/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar compra/ }));
    await screen.findByText('Simulação aprovada');
    expect(post).toHaveBeenCalledExactlyOnceWith('/payments/simulate/paid', {
      method: 'card',
      outcome: 'approved',
      expectedAmountCents: 1999,
    });
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar para o curso' }));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('impede submissões duplicadas e o fecho durante o pedido', async () => {
    let finish;
    post.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const onClose = vi.fn();
    render(<PaymentSimulationModal course={course} onClose={onClose} onSuccess={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Rever compra/ }));
    const form = screen.getByRole('button', { name: /Confirmar compra/ }).closest('form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(post).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    finish({ data: approved });
    await screen.findByText('Simulação aprovada');
  });

  it('não concede acesso num pagamento recusado e permite repetir a simulação', async () => {
    post.mockResolvedValue({ data: { status: 'declined' } });
    const onSuccess = vi.fn();
    render(<PaymentSimulationModal course={course} onClose={vi.fn()} onSuccess={onSuccess} />);
    fireEvent.change(await screen.findByLabelText('Resultado a simular'), {
      target: { value: 'declined' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Rever compra/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar compra/ }));
    await screen.findByRole('alert');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Rever compra/ })).toBeTruthy();
  });

  it('mantém a confirmação e mostra o erro se o preço tiver mudado', async () => {
    post.mockRejectedValue(new Error('O preço do curso mudou.'));
    render(<PaymentSimulationModal course={course} onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Rever compra/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar compra/ }));
    await screen.findByText('O preço do curso mudou.');
    expect(screen.getByRole('button', { name: 'Voltar' }).disabled).toBe(false);
  });

  it('Escape fecha apenas o pagamento, mantendo a janela de inscrição', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CourseEnrollModal isOpen course={course} onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Simular pagamento/ }));
    await screen.findByRole('button', { name: /Rever compra/ });
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('button', { name: /Rever compra/ })).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Simular pagamento/ })).toBeTruthy();
  });
});
