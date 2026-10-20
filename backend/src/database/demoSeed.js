const { asyncForEach } = require('../utils/asyncCollections.js');
const { queryOne, execute, transaction } = require('./connection.js');
const bcrypt = require('bcryptjs');
const DEMO_PASSWORD = 'nexoDemo2026!';
const demoUsers = [
  {
    id: 'demo-creator-sofia',
    email: 'sofia.almeida@example.test',
    username: 'sofia.almeida',
    name: 'Sofia Almeida',
    role: 'CREATOR',
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
    bio: 'A reforçar fundamentos de programação e bases de dados.',
    location: 'Leiria, Portugal',
    headline: 'Estudante de Engenharia de Software',
  },
];
const demoCourses = [
  {
    id: 'demo-course-html-css',
    creatorId: 'demo-creator-sofia',
    title: 'HTML e CSS: páginas responsivas',
    slug: 'demo-html-css-paginas-responsivas',
    category: 'programming',
    difficulty: 'Iniciante',
    description: 'Aprenda a estruturar páginas web e a criar layouts responsivos com HTML e CSS.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&auto=format&fit=crop&q=80',
    durationHours: 3.5,
    price: 0,
    isFree: 1,
    featured: 1,
    module: 'Fundamentos de HTML e CSS',
    lessons: [
      ['Estrutura de uma página HTML', 'UB1O30fR-EE', 15],
      ['Estilos e layouts com CSS', 'yfoY53QXEnI', 18],
    ],
  },
  {
    id: 'demo-course-javascript',
    creatorId: 'demo-creator-miguel',
    title: 'JavaScript: fundamentos e interação',
    slug: 'demo-javascript-fundamentos-interacao',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Domine os conceitos base de JavaScript e transforme páginas estáticas em experiências interativas.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&auto=format&fit=crop&q=80',
    durationHours: 4.0,
    price: 0,
    isFree: 1,
    featured: 1,
    module: 'Primeiros passos com JavaScript',
    lessons: [
      ['Sintaxe e primeiros programas', 'hdI2bqOjy3c', 17],
      ['Variáveis, funções e lógica', 'W6NZfCO5SIk', 18],
    ],
  },
  {
    id: 'demo-course-python',
    creatorId: 'demo-creator-sofia',
    title: 'Python para principiantes',
    slug: 'demo-python-para-principiantes',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Comece a programar com Python através de exemplos, exercícios e pequenos projetos.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=900&auto=format&fit=crop&q=80',
    durationHours: 5.0,
    price: 0,
    isFree: 1,
    featured: 0,
    module: 'Introdução à programação com Python',
    lessons: [
      ['Primeiros passos em Python', '_uQrJ0TkZlc', 20],
      ['Tipos de dados e estruturas de controlo', 'rfscVS0vtbw', 22],
    ],
  },
  {
    id: 'demo-course-git',
    creatorId: 'demo-creator-miguel',
    title: 'Git e GitHub na prática',
    slug: 'demo-git-github-na-pratica',
    category: 'programming',
    difficulty: 'Iniciante',
    description:
      'Aprenda a controlar versões, organizar alterações e colaborar em projetos com Git e GitHub.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=900&auto=format&fit=crop&q=80',
    durationHours: 2.5,
    price: 0,
    isFree: 1,
    featured: 0,
    module: 'Controlo de versões essencial',
    lessons: [
      ['Repositórios, commits e histórico', 'RGOj5yH7evk', 16],
      ['Branches e colaboração no GitHub', '8JJ101D3knE', 15],
    ],
  },
  {
    id: 'demo-course-sql',
    creatorId: 'demo-creator-miguel',
    title: 'SQL e bases de dados relacionais',
    slug: 'demo-sql-bases-dados-relacionais',
    category: 'data',
    difficulty: 'Iniciante',
    description:
      'Consulte e organize dados com SQL, desde as primeiras consultas até relações entre tabelas.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900&auto=format&fit=crop&q=80',
    durationHours: 3.0,
    price: 29,
    isFree: 0,
    featured: 0,
    module: 'Consultas e relações em SQL',
    lessons: [
      ['Consultas SELECT e filtros', 'HXV3zeQKqGY', 20],
      ['Junções e relações entre tabelas', 'p3qvj9hO_Bo', 18],
    ],
  },
];

async function seedDemoShowcaseData({ teacherId } = {}) {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Demonstração indisponível em produção.');
  if (
    teacherId &&
    !(await queryOne(
      "SELECT id FROM utilizadores WHERE id = $1 AND papel IN ('ADMIN', 'CREATOR')",
      [teacherId],
    ))
  )
    throw new Error('O responsável pelos cursos tem de ser formador ou administrador.');
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 12);

  return await transaction(async () => {
    const insertUser = async (...params) =>
      await execute(
        `INSERT INTO utilizadores (id, email, nome_utilizador, hash_palavra_passe, nome, papel, url_avatar, biografia, localizacao, meta_diaria_minutos, minutos_hoje, minutos_totais, esta_suspenso, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 45, 0, 0, 0, $10, $11) ON CONFLICT DO NOTHING`,
        params,
      );
    const insertProfile = async (...params) =>
      await execute(
        `INSERT INTO perfis (id, id_utilizador, titulo_perfil, e_publico, mostrar_classificacao, preferencia_tema)
      VALUES ($1, $2, $3, 1, 1, 'light') ON CONFLICT DO NOTHING`,
        params,
      );

    await asyncForEach(demoUsers, async (user) => {
      await insertUser(
        user.id,
        user.email,
        user.username,
        passwordHash,
        user.name,
        user.role,
        user.avatarUrl,
        user.bio,
        user.location,
        now,
        now,
      );
      await insertProfile(`prof-${user.id}`, user.id, user.headline);
    });
    await execute(
      `INSERT INTO categorias (id, nome, slug, descricao, icone)
      VALUES ('cat-data-demo', 'Dados & Bases de Dados', 'data', 'Consultas, modelação e gestão de bases de dados.', 'Database') ON CONFLICT DO NOTHING`,
      [],
    );

    const insertCourse = async (...params) =>
      await execute(
        `INSERT INTO cursos (id, titulo, slug, descricao, categoria, dificuldade, url_miniatura, url_banner, preco, e_gratuito, e_publicado, estado_aprovacao, destaque, duracao_horas, idioma, id_criador, id_espaco, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 'APPROVED', $11, $12, 'Português', $13, NULL, $14, $15) ON CONFLICT DO NOTHING`,
        params,
      );
    const insertModule = async (...params) =>
      await execute(
        `INSERT INTO modulos_curso (id, id_curso, titulo, descricao, indice_ordem)
      VALUES ($1, $2, $3, $4, 0) ON CONFLICT DO NOTHING`,
        params,
      );
    const insertLesson = async (...params) =>
      await execute(
        `INSERT INTO aulas (id, id_modulo, titulo, tipo, conteudo, url_video, duracao_minutos, indice_ordem, recompensa_xp)
      VALUES ($1, $2, $3, 'video', $4, $5, $6, $7, 25) ON CONFLICT DO NOTHING`,
        params,
      );

    await asyncForEach(demoCourses, async (course) => {
      await insertCourse(
        course.id,
        course.title,
        course.slug,
        course.description,
        course.category,
        course.difficulty,
        course.thumbnailUrl,
        course.thumbnailUrl,
        course.price,
        course.isFree,
        course.featured,
        course.durationHours,
        teacherId && course.id === 'demo-course-html-css' ? teacherId : course.creatorId,
        now,
        now,
      );

      const moduleId = `${course.id}-module-1`;

      await insertModule(moduleId, course.id, course.module, course.description);
      await asyncForEach(course.lessons, async ([title, youtubeId, durationMin], index) => {
        await insertLesson(
          `${course.id}-lesson-${index + 1}`,
          moduleId,
          title,
          `Vídeo de demonstração sobre ${title.toLowerCase()}.`,
          `https://www.youtube.com/watch?v=${youtubeId}`,
          durationMin,
          index,
        );
      });
    });

    const insertEnrollment = async (...params) =>
      await execute(
        `INSERT INTO inscricoes (id, id_utilizador, id_curso, inscrito_em, percentagem_progresso, id_ultima_aula)
      VALUES ($1, $2, $3, $4, $5, NULL) ON CONFLICT DO NOTHING`,
        params,
      );
    const demoEnrollments = [
      ['marta', 'demo-course-html-css'],
      ['diogo', 'demo-course-javascript'],
      ['beatriz', 'demo-course-python'],
      ['joao', 'demo-course-git'],
      ['ines', 'demo-course-sql'],
      ['rafael', 'demo-course-javascript'],
      ['marta', 'demo-course-git'],
      ['diogo', 'demo-course-sql'],
    ];

    await asyncForEach(demoEnrollments, async ([student, courseId], index) => {
      await insertEnrollment(
        `demo-enrollment-${index + 1}`,
        `demo-student-${student}`,
        courseId,
        now,
        index % 2 ? 24 : 0,
      );
    });
  });
}

exports.seedDemoShowcaseData = seedDemoShowcaseData;
