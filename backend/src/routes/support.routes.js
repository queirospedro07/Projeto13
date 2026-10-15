import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '../middleware/auth.js';
import { queryAll, queryOne, execute } from '../database/connection.js';

const router = Router();
const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
router.get('/tickets', authenticate, (req, res) => {
  return res.json(
    req.user.role === 'ADMIN'
      ? queryAll(
          'SELECT p.*, u.name AS studentName FROM pedidos_suporte p JOIN users u ON u.id = p.id_utilizador ORDER BY criado_em DESC LIMIT 200',
        )
      : queryAll(
          'SELECT * FROM pedidos_suporte WHERE id_utilizador = ? ORDER BY criado_em DESC LIMIT 100',
          [req.user.id],
        ),
  );
});
router.post('/tickets', authenticate, ticketLimiter, (req, res) => {
  const { subject, message } = req.body;
  if (
    typeof subject !== 'string' ||
    subject.trim().length < 5 ||
    subject.length > 160 ||
    typeof message !== 'string' ||
    message.trim().length < 20 ||
    message.length > 5000
  )
    return res.status(400).json({
      error: 'Use um assunto de 5 a 160 caracteres e uma mensagem de 20 a 5000 caracteres.',
    });
  const id = randomUUID(),
    now = new Date().toISOString();
  execute(
    'INSERT INTO pedidos_suporte (id, id_utilizador, assunto, mensagem, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.user.id, subject.trim(), message.trim(), now, now],
  );
  return res.status(201).json(queryOne('SELECT * FROM pedidos_suporte WHERE id = ?', [id]));
});
router.put('/tickets/:id', authenticate, requireRole('ADMIN'), (req, res) => {
  if (!queryOne('SELECT id FROM pedidos_suporte WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (
    !['OPEN', 'RESOLVED'].includes(req.body.status) ||
    typeof req.body.reply !== 'string' ||
    !req.body.reply.trim() ||
    req.body.reply.length > 5000
  )
    return res.status(400).json({ error: 'Indique uma resposta e um estado válidos.' });
  execute('UPDATE pedidos_suporte SET estado = ?, resposta = ?, atualizado_em = ? WHERE id = ?', [
    req.body.status,
    req.body.reply.trim(),
    new Date().toISOString(),
    req.params.id,
  ]);
  return res.json({ success: true });
});

const faq = [
  {
    category: 'Conta e perfil',
    description: 'Sessão, dados pessoais e privacidade.',
    items: [
      {
        q: 'Como edito o meu perfil?',
        a: 'Abra o Perfil e escolha Editar perfil. Pode alterar os dados, as imagens e as redes sociais, consultar a pré-visualização e guardar. As definições de privacidade controlam o que outras pessoas podem ver.',
      },
      {
        q: 'Como recupero a palavra-passe?',
        a: 'No início de sessão, escolha Esqueceu-se da palavra-passe e indique o seu email. O envio depende da configuração de email da plataforma. A ligação expira após 30 minutos e só pode ser usada uma vez.',
      },
    ],
  },
  {
    category: 'Cursos e acesso',
    description: 'Inscrições, biblioteca e materiais.',
    items: [
      {
        q: 'Como entro num curso?',
        a: 'Abra um curso em Explorar. Os cursos gratuitos permitem inscrição direta. Para cursos pagos, contacte o formador: o pagamento online ainda não está integrado. Os cursos com acesso concedido aparecem em Os Meus Cursos.',
      },
      {
        q: 'Onde estão os materiais do curso?',
        a: 'No ambiente do curso, abra Documentos ou os recursos da aula. A lista mostra apenas os materiais disponibilizados pelo formador. Alguns materiais podem abrir num serviço externo.',
      },
    ],
  },
  {
    category: 'Avaliações e certificados',
    description: 'Questionários, projetos e conclusão.',
    items: [
      {
        q: 'Como são avaliados os questionários?',
        a: 'As respostas são enviadas ao servidor. As perguntas de escolha têm correção automática; as respostas abertas podem aguardar a revisão do formador. A nota mínima é definida no questionário.',
      },
      {
        q: 'Como envio um projeto?',
        a: 'Na aula de projeto, envie uma ligação para o seu trabalho. A submissão fica guardada e o formador pode aprovar ou pedir alterações. A aula só conta como concluída após aprovação.',
      },
      {
        q: 'Quando recebo o certificado?',
        a: 'Depois de concluir todas as aulas e obter aprovação nas avaliações e projetos. O servidor verifica estes requisitos antes de emitir a credencial. Pode verificar um certificado através da respetiva ligação pública.',
      },
    ],
  },
  {
    category: 'Comunidade e chamadas',
    description: 'Conversas e sessões em direto.',
    items: [
      {
        q: 'Quem pode entrar nos canais?',
        a: 'Os canais do curso estão disponíveis aos alunos com acesso, ao formador, aos colaboradores e à administração. A equipa do curso gere canais e modera mensagens. Para partilhar ficheiros no chat, utilize uma ligação.',
      },
      {
        q: 'O que preciso para entrar numa chamada?',
        a: 'Use uma ligação segura e autorize o microfone ou a câmara no navegador. Pode escolher as preferências antes de entrar. Algumas redes empresariais e móveis podem bloquear chamadas se o servidor não tiver TURN configurado.',
      },
    ],
  },
  {
    category: 'Formadores e suporte',
    description: 'Criação de cursos e ajuda.',
    items: [
      {
        q: 'Como publico um curso?',
        a: 'Depois de aprovada a candidatura a formador, crie o curso, organize os conteúdos e envie-o para revisão. A administração decide a publicação. Alterações posteriores feitas por formadores voltam a deixar o curso em rascunho para nova revisão.',
      },
      {
        q: 'Como acompanho um pedido de suporte?',
        a: 'Inicie sessão, abra um pedido nesta página e consulte o histórico no final. As respostas da administração ficam no respetivo pedido. Não inclua palavras-passe ou dados sensíveis na descrição.',
      },
    ],
  },
];
router.get('/faq', (_req, res) => res.json(faq));
export default router;
