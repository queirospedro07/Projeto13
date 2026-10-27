const { assincronoParaCada } = require('../utilitarios/colecoesAssincronas.js');
const { consultarUm, executar, transacao } = require('./ligacao.js');
const bcrypt = require('bcryptjs');
const DEMO_PASSWORD = 'nexoDemo2026!';
const demonstracaoUtilizadores = [
  {
    id: 'demo-creator-sofia',
    email: 'sofia.almeida@example.test',
    username: 'sofia.almeida',
    name: 'Sofia Almeida',
    role: 'CREATOR',
    urlAvatar: null,
    bio: 'Formadora de desenvolvimento web e interfaces digitais.',
    location: 'Lisboa, Portugal',
    headline: 'Formadora de Desenvolvimento Web',
  },
  {
    id: 'demo-creator-miguel',
    email: 'miguel.ferreira@example.test',
    username: 'miguel.ferreira',
    name: 'Miguel Ferreira',
    role: 'CREATOR',
    urlAvatar: null,
    bio: 'Programador e formador nas áreas de JavaScript, Git e bases de dados.',
    location: 'Porto, Portugal',
    headline: 'Programador e Formador',
  },
  {
    id: 'demo-student-marta',
    email: 'marta.lopes@example.test',
    username: 'marta.lopes',
    name: 'Marta Lopes',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'A aprender desenvolvimento web e design de interfaces.',
    location: 'Braga, Portugal',
    headline: 'Estudante de Desenvolvimento Web',
  },
  {
    id: 'demo-student-diogo',
    email: 'diogo.costa@example.test',
    username: 'diogo.costa',
    name: 'Diogo Costa',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'Interessado em programação, automação e tecnologia.',
    location: 'Coimbra, Portugal',
    headline: 'Estudante de Tecnologia',
  },
  {
    id: 'demo-student-beatriz',
    email: 'beatriz.martins@example.test',
    username: 'beatriz.martins',
    name: 'Beatriz Martins',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'A desenvolver competências em programação e dados.',
    location: 'Aveiro, Portugal',
    headline: 'Estudante de Programação',
  },
  {
    id: 'demo-student-joao',
    email: 'joao.neves@example.test',
    username: 'joao.neves',
    name: 'João Neves',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'A explorar JavaScript, Python e ferramentas de colaboração.',
    location: 'Viseu, Portugal',
    headline: 'Estudante Full Stack',
  },
  {
    id: 'demo-student-ines',
    email: 'ines.carvalho@example.test',
    username: 'ines.carvalho',
    name: 'Inês Carvalho',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'Interessada em criação de produtos digitais e tecnologia.',
    location: 'Faro, Portugal',
    headline: 'Estudante de Produtos Digitais',
  },
  {
    id: 'demo-student-rafael',
    email: 'rafael.moreira@example.test',
    username: 'rafael.moreira',
    name: 'Rafael Moreira',
    role: 'STUDENT',
    urlAvatar: null,
    bio: 'A reforçar fundamentos de programação e bases de dados.',
    location: 'Leiria, Portugal',
    headline: 'Estudante de Engenharia de Software',
  },
];
const demonstracaoCursos = [
  {
    id: 'demo-course-html-css',
    idFormador: 'demo-creator-sofia',
    title: 'HTML e CSS: páginas responsivas',
    slug: 'demo-html-css-paginas-responsivas',
    category: 'programming',
    difficulty: 'Iniciante',
    description: 'Aprenda a estruturar páginas web e a criar layouts responsivos com HTML e CSS.',
    urlMiniatura:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&auto=format&fit=crop&q=80',
    duracaoHoras: 3.5,
    price: 0,
    eGratuito: 1,
    featured: 1,
    module: 'Fundamentos de HTML e CSS',
    lessons: [
      ['Estrutura de uma página HTML', 'UB1O30fR-EE', 15],
      ['Estilos e layouts com CSS', 'yfoY53QXEnI', 18],
    ],
  },
  {
    id: 'demo-course-javascript',
    idFormador: 'demo-creator-miguel',
    title: 'JavaScript: fundamentos e interação',
    slug: 'demo-javascript-fundamentos-interacao',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Domine os conceitos base de JavaScript e transforme páginas estáticas em experiências interativas.',
    urlMiniatura:
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&auto=format&fit=crop&q=80',
    duracaoHoras: 4.0,
    price: 0,
    eGratuito: 1,
    featured: 1,
    module: 'Primeiros passos com JavaScript',
    lessons: [
      ['Sintaxe e primeiros programas', 'hdI2bqOjy3c', 17],
      ['Variáveis, funções e lógica', 'W6NZfCO5SIk', 18],
    ],
  },
  {
    id: 'demo-course-python',
    idFormador: 'demo-creator-sofia',
    title: 'Python para principiantes',
    slug: 'demo-python-para-principiantes',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Comece a programar com Python através de exemplos, exercícios e pequenos projetos.',
    urlMiniatura:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=900&auto=format&fit=crop&q=80',
    duracaoHoras: 5.0,
    price: 0,
    eGratuito: 1,
    featured: 0,
    module: 'Introdução à programação com Python',
    lessons: [
      ['Primeiros passos em Python', '_uQrJ0TkZlc', 20],
      ['Tipos de dados e estruturas de controlo', 'rfscVS0vtbw', 22],
    ],
  },
  {
    id: 'demo-course-git',
    idFormador: 'demo-creator-miguel',
    title: 'Git e GitHub na prática',
    slug: 'demo-git-github-na-pratica',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Aprenda a controlar versões, organizar alterações e colaborar em projetos com Git e GitHub.',
    urlMiniatura:
      'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=900&auto=format&fit=crop&q=80',
    duracaoHoras: 2.5,
    price: 0,
    eGratuito: 1,
    featured: 0,
    module: 'Controlo de versões essencial',
    lessons: [
      ['Repositórios, commits e histórico', 'RGOj5yH7evk', 16],
      ['Branches e colaboração no GitHub', '8JJ101D3knE', 15],
    ],
  },
  {
    id: 'demo-course-sql',
    idFormador: 'demo-creator-miguel',
    title: 'SQL e bases de dados relacionais',
    slug: 'demo-sql-bases-dados-relacionais',
    category: 'data',
    difficulty: 'Iniciante',
    description:
      'Consulte e organize dados com SQL, desde as primeiras consultas até relações entre tabelas.',
    urlMiniatura:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900&auto=format&fit=crop&q=80',
    duracaoHoras: 3.0,
    price: 29,
    eGratuito: 0,
    featured: 0,
    module: 'Consultas e relações em SQL',
    lessons: [
      ['Consultas SELECT e filtros', 'HXV3zeQKqGY', 20],
      ['Junções e relações entre tabelas', 'p3qvj9hO_Bo', 18],
    ],
  },
];

async function prepararDadosDemonstracao({ idFormadorResponsavel: formadorId } = {}) {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Demonstração indisponível em produção.');
  if (
    formadorId &&
    !(await consultarUm(
      "SELECT id FROM utilizadores WHERE id = $1 AND papel IN ('ADMIN', 'CREATOR')",
      [formadorId],
    ))
  )
    throw new Error('O responsável pelos cursos tem de ser formador ou administrador.');
  const agora = new Date().toISOString();
  const palavraPasseResumo = bcrypt.hashSync(DEMO_PASSWORD, 12);

  return await transacao(async () => {
    const inserirUtilizador = async (...parametros) =>
      await executar(
        `INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 45, 0, 0, 0, $10, $11) ON CONFLICT DO NOTHING`,
        parametros,
      );
    const inserirPerfil = async (...parametros) =>
      await executar(
        `INSERT INTO perfis (id, id_utilizador, titulo_perfil, e_publico, mostrar_classificacao, preferencia_tema)
      VALUES ($1, $2, $3, 1, 1, 'light') ON CONFLICT DO NOTHING`,
        parametros,
      );

    await assincronoParaCada(demonstracaoUtilizadores, async (utilizador) => {
      await inserirUtilizador(
        utilizador.id,
        utilizador.email,
        utilizador.username,
        palavraPasseResumo,
        utilizador.name,
        utilizador.role,
        utilizador.urlAvatar,
        utilizador.bio,
        utilizador.location,
        agora,
        agora,
      );
      await inserirPerfil(`prof-${utilizador.id}`, utilizador.id, utilizador.headline);
    });
    await executar(
      `INSERT INTO categorias (id, nome, slug, descricao, icone)
      VALUES ('cat-data-demo', 'Dados & Bases de Dados', 'data', 'Consultas, modelação e gestão de bases de dados.', 'Database') ON CONFLICT DO NOTHING`,
      [],
    );

    const inserirCurso = async (...parametros) =>
      await executar(
        `INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, url_banner, preco, e_gratuito, e_publicado, estado_aprovacao, destaque, duracao_horas, idioma, id_criador, id_espaco, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 'APPROVED', $11, $12, 'Português', $13, NULL, $14, $15) ON CONFLICT DO NOTHING`,
        parametros,
      );
    const inserirModulo = async (...parametros) =>
      await executar(
        `INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem)
      VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING`,
        parametros,
      );
    const inserirAula = async (...parametros) =>
      await executar(
        `INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
      VALUES ($1, $2, $3, 'video', $4, $5, $6, $7, 25) ON CONFLICT DO NOTHING`,
        parametros,
      );

    await assincronoParaCada(demonstracaoCursos, async (curso) => {
      await inserirCurso(
        curso.id,
        curso.title,
        curso.slug,
        curso.description,
        curso.category,
        curso.difficulty,
        curso.urlMiniatura,
        curso.urlMiniatura,
        curso.price,
        curso.eGratuito,
        curso.featured,
        curso.duracaoHoras,
        formadorId && curso.id === 'demo-course-html-css' ? formadorId : curso.idFormador,
        agora,
        agora,
      );

      const moduloId = `${curso.id}-module-1`;

      await inserirModulo(moduloId, curso.id, curso.module, curso.description);
      await assincronoParaCada(curso.lessons, async ([titulo, YouTubeId, duracaoMin], indice) => {
        await inserirAula(
          `${curso.id}-lesson-${indice + 1}`,
          moduloId,
          titulo,
          `Vídeo de demonstração sobre ${titulo.toLowerCase()}.`,
          `https://www.youtube.com/watch?v=${YouTubeId}`,
          duracaoMin,
          indice,
        );
      });
    });

    const inserirInscricao = async (...parametros) =>
      await executar(
        `INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso, id_ultima_aula)
      VALUES ($1, $2, $3, $4, $5, NULL) ON CONFLICT DO NOTHING`,
        parametros,
      );
    const demonstracaoInscricoes = [
      ['marta', 'demo-course-html-css'],
      ['diogo', 'demo-course-javascript'],
      ['beatriz', 'demo-course-python'],
      ['joao', 'demo-course-git'],
      ['ines', 'demo-course-sql'],
      ['rafael', 'demo-course-javascript'],
      ['marta', 'demo-course-git'],
      ['diogo', 'demo-course-sql'],
    ];

    await assincronoParaCada(demonstracaoInscricoes, async ([aluno, cursoId], indice) => {
      await inserirInscricao(
        `demo-enrollment-${indice + 1}`,
        `demo-student-${aluno}`,
        cursoId,
        agora,
        indice % 2 ? 24 : 0,
      );
    });
  });
}

exports.prepararDadosDemonstracao = prepararDadosDemonstracao;
