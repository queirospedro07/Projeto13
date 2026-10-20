import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PaymentSimulationModal } from '../src/components/PaymentSimulationModal';
import { CourseEnrollModal } from '../src/components/CourseEnrollModal';
import CoursePlayerPage from '../src/pages/CoursePlayerPage';

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('../src/services/api', () => ({ api: { post, get } }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'student', role: 'STUDENT' } }),
}));
vi.mock('../src/context/SocketContext', () => ({
  useSocket: () => ({ socket: null, joinChannel: vi.fn(), leaveChannel: vi.fn() }),
}));
vi.mock('../src/context/ActiveCallContext', () => ({
  useActiveCall: () => ({ activeCall: null }),
}));
vi.mock('../src/components/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const course = { id: 'paid', title: 'Curso de teste', price: 19.99, isFree: false };
const approved = { id: 'receipt', status: 'approved', amountCents: 1999 };
beforeEach(() => {
  post.mockReset();
  get.mockReset();
});
afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
  localStorage.clear();
});

it('mostra uma confirmação simples e só compra depois do clique explícito', async () => {
  const onSuccess = vi.fn(),
    onClose = vi.fn();
  post.mockResolvedValue({ data: approved });
  render(<PaymentSimulationModal course={course} onClose={onClose} onSuccess={onSuccess} />);
  const confirm = await screen.findByRole('button', { name: 'Pagar' });
  expect(post).not.toHaveBeenCalled();
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(confirm);
  await screen.findByText('Pagamento confirmado. Já pode aceder às aulas.');
  expect(post).toHaveBeenCalledExactlyOnceWith('/payments/simulate/paid', {
    method: 'card',
    outcome: 'approved',
    expectedAmountCents: 1999,
  });
  expect(onSuccess).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar para o curso' }));
  expect(onSuccess).toHaveBeenCalledOnce();
});

it('impede pedidos duplicados e o fecho enquanto a compra é guardada', async () => {
  let finish;
  post.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const onClose = vi.fn();
  render(<PaymentSimulationModal course={course} onClose={onClose} onSuccess={vi.fn()} />);
  const form = (await screen.findByRole('button', { name: 'Pagar' })).closest('form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(post).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();
  finish({ data: approved });
  await screen.findByText('Pagamento confirmado. Já pode aceder às aulas.');
});

it('mantém a inscrição por confirmar se o servidor recusar a compra', async () => {
  post.mockRejectedValue(new Error('O preço do curso mudou.'));
  const onSuccess = vi.fn();
  render(<PaymentSimulationModal course={course} onClose={vi.fn()} onSuccess={onSuccess} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Pagar' }));
  await screen.findByText('O preço do curso mudou.');
  expect(onSuccess).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(false);
});

it('não inscreve ao abrir a janela de um curso gratuito', async () => {
  render(
    <MemoryRouter>
      <CourseEnrollModal
        isOpen
        course={{ ...course, id: 'free', price: 0, isFree: true }}
        onClose={vi.fn()}
      />
    </MemoryRouter>,
  );
  const enroll = await screen.findByRole('button', { name: /Inscrever-me gratuitamente/ });
  expect(post).not.toHaveBeenCalled();
  post.mockResolvedValue({ data: {} });
  fireEvent.click(enroll);
  await waitFor(() => expect(post).toHaveBeenCalledExactlyOnceWith('/courses/free/enroll'));
});

it('um curso pago abre diretamente a confirmação simples e Escape cancela sem comprar', async () => {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <CourseEnrollModal isOpen course={course} onClose={onClose} />
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'Pagar' });
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
  expect(post).not.toHaveBeenCalled();
});

it.each([
  { isFree: true, price: 0 },
  { isFree: false, price: 19.99 },
])(
  'abrir o leitor sem inscrição redireciona para os detalhes sem inscrever ($isFree)',
  async (pricing) => {
    get.mockResolvedValue({ data: { ...course, ...pricing, isEnrolled: false, modules: [] } });
    render(
      <MemoryRouter initialEntries={['/learn/paid']}>
        <Routes>
          <Route path="/learn/:courseId" element={<CoursePlayerPage />} />
          <Route path="/courses/:courseId" element={<p>Detalhes do curso</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('Detalhes do curso');
    expect(get).toHaveBeenCalledWith('/courses/paid');
    expect(post).not.toHaveBeenCalled();
  },
);

it('abre a página do certificado após a conclusão da última aula', async () => {
  get.mockResolvedValue({
    data: {
      ...course,
      isEnrolled: true,
      modules: [
        {
          id: 'module',
          title: 'Módulo',
          lessons: [{ id: 'last', title: 'Última aula', type: 'text', content: 'Conteúdo' }],
        },
      ],
    },
  });
  post.mockResolvedValue({
    data: {
      certificate: { id: 'certificate' },
      enrollment: { progressPercent: 100, lessonProgresses: [] },
    },
  });
  render(
    <MemoryRouter initialEntries={['/learn/paid']}>
      <Routes>
        <Route path="/learn/:courseId" element={<CoursePlayerPage />} />
        <Route path="/certificates/verify/:id" element={<p>Certificado do curso concluído</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Concluir última aula' }));
  await screen.findByText('Certificado do curso concluído');
  expect(post).toHaveBeenCalledWith('/courses/paid/lessons/last/complete');
});
