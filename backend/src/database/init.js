import bcrypt from 'bcryptjs';

export function initializeSchemaAndSeed(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      avatarUrl TEXT,
      bio TEXT,
      location TEXT,
      streakDays INTEGER NOT NULL DEFAULT 0,
      lastActiveDate TEXT,
      dailyGoalMinutes INTEGER NOT NULL DEFAULT 45,
      minutesToday INTEGER NOT NULL DEFAULT 0,
      totalMinutes INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      isSuspended INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      headline TEXT,
      website TEXT,
      github TEXT,
      twitter TEXT,
      linkedin TEXT,
      instagram TEXT,
      youtube TEXT,
      tiktok TEXT,
      discord TEXT,
      twitch TEXT,
      bannerUrl TEXT,
      isPublic INTEGER NOT NULL DEFAULT 1,
      showStreak INTEGER NOT NULL DEFAULT 1,
      showLeaderboard INTEGER NOT NULL DEFAULT 1,
      themePreference TEXT NOT NULL DEFAULT 'light',
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermédio',
      thumbnailUrl TEXT,
      bannerUrl TEXT,
      price REAL NOT NULL DEFAULT 0.0,
      isFree INTEGER NOT NULL DEFAULT 1,
      isPublished INTEGER NOT NULL DEFAULT 1,
      approvalStatus TEXT NOT NULL DEFAULT 'APPROVED',
      adminNotes TEXT,
      submittedForReviewAt TEXT,
      reviewedAt TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      durationHours REAL NOT NULL DEFAULT 10.0,
      language TEXT NOT NULL DEFAULT 'Português',
      creatorId TEXT NOT NULL,
      spaceId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(creatorId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_modules (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      moduleId TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'video',
      content TEXT,
      videoUrl TEXT,
      durationMin INTEGER NOT NULL DEFAULT 15,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      xpReward INTEGER NOT NULL DEFAULT 25,
      FOREIGN KEY(moduleId) REFERENCES course_modules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      enrolledAt TEXT NOT NULL,
      completedAt TEXT,
      progressPercent REAL NOT NULL DEFAULT 0,
      lastLessonId TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(userId, courseId)
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      enrollmentId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completedAt TEXT,
      timeSpentSeconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(enrollmentId) REFERENCES enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY(lessonId) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(enrollmentId, lessonId)
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      iconUrl TEXT,
      bannerUrl TEXT,
      isPrivate INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      memberCount INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      spaceId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      topic TEXT,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      isVoice INTEGER NOT NULL DEFAULT 0,
      isLocked INTEGER NOT NULL DEFAULT 0,
      guidingQuestion TEXT,
      guidelines TEXT,
      FOREIGN KEY(spaceId) REFERENCES spaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      spaceId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joinedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(spaceId) REFERENCES spaces(id) ON DELETE CASCADE,
      UNIQUE(userId, spaceId)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channelId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      parentId TEXT,
      attachments TEXT,
      isPinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      userId TEXT NOT NULL,
      emoji TEXT NOT NULL,
      FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(messageId, userId, emoji)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      userId TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      lessonId TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      passingScore INTEGER NOT NULL DEFAULT 70,
      xpReward INTEGER NOT NULL DEFAULT 50,
      FOREIGN KEY(lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correctOptionIndex INTEGER NOT NULL,
      explanation TEXT,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      userId TEXT NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      attemptedAt TEXT NOT NULL,
      FOREIGN KEY(quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      xpReward INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      achievementId TEXT NOT NULL,
      unlockedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(achievementId) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(userId, achievementId)
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      recipientName TEXT NOT NULL,
      courseTitle TEXT NOT NULL,
      credentialId TEXT UNIQUE NOT NULL,
      issuedAt TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 100,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qa_questions (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      isAnswered INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qa_answers (
      id TEXT PRIMARY KEY,
      questionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      body TEXT NOT NULL,
      isAccepted INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(questionId) REFERENCES qa_questions(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      link TEXT,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      requesterId TEXT NOT NULL,
      addresseeId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(requesterId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(addresseeId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(requesterId, addresseeId)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      followerId TEXT NOT NULL,
      followingId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(followerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(followingId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(followerId, followingId)
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      content TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiverId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_roles (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'indigo',
      canPostAnnouncements INTEGER NOT NULL DEFAULT 0,
      canSpeakInStage INTEGER NOT NULL DEFAULT 0,
      canShareScreen INTEGER NOT NULL DEFAULT 0,
      canModerateChat INTEGER NOT NULL DEFAULT 0,
      canManageVoice INTEGER NOT NULL DEFAULT 0,
      orderIndex INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_member_roles (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      userId TEXT NOT NULL,
      roleId TEXT NOT NULL,
      assignedAt TEXT NOT NULL,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(roleId) REFERENCES course_roles(id) ON DELETE CASCADE,
      UNIQUE(courseId, userId, roleId)
    );

    -- Inquéritos e Candidaturas para Formador / Criador
    CREATE TABLE IF NOT EXISTS creator_applications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      fullName TEXT NOT NULL,
      bio TEXT,
      expertise TEXT NOT NULL,
      experienceYears INTEGER NOT NULL DEFAULT 0,
      portfolioUrl TEXT,
      motivation TEXT NOT NULL,
      proposedCourses TEXT NOT NULL,
      sampleVideoUrl TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      adminFeedback TEXT,
      reviewedBy TEXT,
      reviewedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Inquéritos e Candidaturas para Equipa de Administração / Sub-Admin
    CREATE TABLE IF NOT EXISTS admin_applications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      motivation TEXT NOT NULL,
      experience TEXT NOT NULL,
      weeklyAvailabilityHours INTEGER NOT NULL DEFAULT 10,
      areasOfInterest TEXT NOT NULL,
      situationScenario TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      adminFeedback TEXT,
      reviewedBy TEXT,
      reviewedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Sistema de Suporte e Tickets
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Dúvidas Gerais',
      priority TEXT NOT NULL DEFAULT 'MÉDIA',
      status TEXT NOT NULL DEFAULT 'ABERTO',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      resolvedAt TEXT,
      assignedAdminId TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(assignedAdminId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      content TEXT NOT NULL,
      isAdminReply INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(ticketId) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY(senderId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indices for high performance queries
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
    CREATE INDEX IF NOT EXISTS idx_courses_creator ON courses(creatorId);
    CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(courseId);
    CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(moduleId);
    CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(userId);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(courseId);
    CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channelId);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_creator_apps_user ON creator_applications(userId);
    CREATE INDEX IF NOT EXISTS idx_creator_apps_status ON creator_applications(status);
    CREATE INDEX IF NOT EXISTS idx_admin_apps_user ON admin_applications(userId);
    CREATE INDEX IF NOT EXISTS idx_admin_apps_status ON admin_applications(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(userId);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticketId);
  `);

  try {
    db.exec(`ALTER TABLE courses ADD COLUMN approvalStatus TEXT DEFAULT 'APPROVED'`);
  } catch (_) {}
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_courses_approval ON courses(approvalStatus)`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN adminNotes TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN submittedForReviewAt TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN reviewedAt TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN defaultCallMode TEXT DEFAULT 'open'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN allowStudentScreenShare INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN allowStudentCamera INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN learningOutcomes TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN requirements TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN documents TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE channels ADD COLUMN accessMode TEXT DEFAULT 'discussion'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE channels ADD COLUMN voiceMode TEXT DEFAULT 'open'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN bannerPosition TEXT DEFAULT '50% 50%'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN bannerPosition TEXT DEFAULT '50% 50%'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN thumbnailPosition TEXT DEFAULT '50% 50%'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE spaces ADD COLUMN bannerPosition TEXT DEFAULT '50% 50%'`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN instagram TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN bannerUrl TEXT`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showBio INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showLocation INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showSocials INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showStats INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showCourses INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN showBadges INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_applications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT NOT NULL,
        motivation TEXT NOT NULL,
        experience TEXT NOT NULL,
        weeklyAvailabilityHours INTEGER NOT NULL DEFAULT 10,
        areasOfInterest TEXT NOT NULL,
        situationScenario TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        adminFeedback TEXT,
        reviewedBy TEXT,
        reviewedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_admin_apps_user ON admin_applications(userId);
      CREATE INDEX IF NOT EXISTS idx_admin_apps_status ON admin_applications(status);
    `);
  } catch (_) {}

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedData(db);
  }
}

function seedData(db) {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, username, passwordHash, name, role, avatarUrl, bio, location, streakDays, dailyGoalMinutes, minutesToday, totalMinutes, xp, level, isSuspended, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, userId, headline, website, github, twitter, linkedin, isPublic, showStreak, showLeaderboard, themePreference)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 'light')
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, slug, description, category, difficulty, thumbnailUrl, bannerUrl, price, isFree, isPublished, approvalStatus, adminNotes, featured, durationHours, language, creatorId, spaceId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertModule = db.prepare(`
    INSERT INTO course_modules (id, courseId, title, description, orderIndex)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, moduleId, title, type, content, videoUrl, durationMin, orderIndex, xpReward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSpace = db.prepare(`
    INSERT INTO spaces (id, name, slug, description, iconUrl, bannerUrl, isPrivate, category, ownerId, memberCount, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChannel = db.prepare(`
    INSERT INTO channels (id, spaceId, name, type, topic, orderIndex, isVoice, isLocked, guidingQuestion, guidelines)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMembership = db.prepare(`
    INSERT INTO memberships (id, userId, spaceId, role, joinedAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (id, userId, courseId, enrolledAt, progressPercent, lastLessonId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAchievement = db.prepare(`
    INSERT INTO achievements (id, slug, title, description, icon, category, rarity, xpReward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, lessonId, title, description, passingScore, xpReward)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuizQuestion = db.prepare(`
    INSERT INTO quiz_questions (id, quizId, question, options, correctOptionIndex, explanation, orderIndex)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertApplication = db.prepare(`
    INSERT INTO creator_applications (id, userId, fullName, bio, expertise, experienceYears, portfolioUrl, motivation, proposedCourses, sampleVideoUrl, status, adminFeedback, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    // 1. UTILIZADORES
    // Aluno Demo
    insertUser.run(
      'user-student',
      'aluno@nexo.pt',
      'aluno',
      passwordHash,
      'Pedro Silva',
      'STUDENT',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'Estudante focado em desenvolvimento web moderno, TypeScript e interfaces cinemáticas.',
      'Lisboa, Portugal',
      12,
      45,
      35,
      1450,
      1450,
      4,
      now,
      now
    );
    insertProfile.run('prof-student', 'user-student', 'Estudante Full Stack @ NEXO', 'https://nexo.pt', 'https://github.com/pedrosilva', '', '');

    // Formadora Criadora
    insertUser.run(
      'user-sarah',
      'sarah@nexo.pt',
      'sarah_dev',
      passwordHash,
      'Sarah Jenkins',
      'CREATOR',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'Arquiteta de Software e Formadora Especialista em React 19, TypeScript e Design Systems.',
      'Porto, Portugal',
      45,
      90,
      85,
      8900,
      8900,
      15,
      now,
      now
    );
    insertProfile.run('prof-sarah', 'user-sarah', 'Arquiteta de Software & Criadora NEXO', 'https://sarahjenkins.dev', 'https://github.com/sarahjenkins', '', '');

    // Administrador
    insertUser.run(
      'user-alex',
      'alex@nexo.pt',
      'alex_admin',
      passwordHash,
      'Alex Vance',
      'ADMIN',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'Administrador de infraestruturas e moderador-chefe da plataforma NEXO.',
      'Braga, Portugal',
      120,
      120,
      120,
      25400,
      25400,
      32,
      now,
      now
    );
    insertProfile.run('prof-alex', 'user-alex', 'Administrador Global NEXO', '', 'https://github.com/alexvance', '', '');

    // Aluno com Candidatura a Criador Pendente (para testes de aprovação pelo Admin)
    insertUser.run(
      'user-tiago',
      'tiago@nexo.pt',
      'tiago_sec',
      passwordHash,
      'Tiago Ramos',
      'STUDENT',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'Engenheiro de Redes e Especialista em Segurança Ofensiva.',
      'Coimbra, Portugal',
      5,
      60,
      20,
      820,
      820,
      3,
      now,
      now
    );
    insertProfile.run('prof-tiago', 'user-tiago', 'Engenheiro de Redes & Aspirante a Formador', '', 'https://github.com/tiagoramos', '', '');

    // 2. CANDIDATURA A CRIADOR PENDENTE (Inquérito para moderação pelo Admin)
    insertApplication.run(
      'app-tiago-1',
      'user-tiago',
      'Tiago Ramos',
      'Consultor de Cibersegurança Sénior com certificação OSCP e 6 anos de experiência em auditorias de segurança aplicacional.',
      'Cibersegurança & Redes',
      6,
      'https://github.com/tiagoramos-sec',
      'Desejo partilhar conhecimento prático e preparar os alunos do NEXO para os desafios reais de segurança ofensiva em ambiente de produção.',
      '1. Fundamentos de Cibersegurança & Ethical Hacking\n2. Defesa Ativa e Auditoria de Aplicações Web',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'PENDING',
      null,
      now,
      now
    );

    // 3. CATEGORIAS (PT-PT)
    insertCategory.run('cat-prog', 'Programação & Engenharia de Software', 'programming', 'Desenvolvimento Web, APIs escaláveis, TypeScript e arquitetura de código.', 'Code');
    insertCategory.run('cat-design', 'Design & Experiência de Utilizador (UX/UI)', 'design', 'Design Systems no Figma, prototipagem avançada e micro-interações.', 'Palette');
    insertCategory.run('cat-ai', 'Inteligência Artificial & Ciência de Dados', 'ai', 'Modelos de Linguagem, Machine Learning e automação prática com Python.', 'Cpu');
    insertCategory.run('cat-sec', 'Cibersegurança & Redes Defensivas', 'cybersecurity', 'Segurança ofensiva, análise de vulnerabilidades e proteção de redes.', 'ShieldCheck');
    insertCategory.run('cat-cloud', 'Cloud, DevOps & Infraestruturas', 'cloud', 'Docker, Kubernetes, fluxos de integração contínua (CI/CD) e servidores Linux.', 'Server');

    // 4. ESPAÇOS COMUNITÁRIOS E CANAIS DEDICADOS POR CURSO (PT-PT)
    // Espaço 1: React 19 & TypeScript
    insertSpace.run(
      'space-react',
      'Comunidade React & Engenharia Web',
      'comunidade-react-portugal',
      'Espaço oficial de mentoria, partilha de código, esclarecimento de dúvidas e salas de estudo coletivo com áudio e partilha de ecrã.',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      0,
      'programming',
      'user-sarah',
      142,
      now
    );

    insertChannel.run('ch-general', 'space-react', 'geral', 'text', 'Discussões gerais sobre programação e a comunidade NEXO', 0, 0, 0, 'Qual é o seu objetivo de estudo para esta semana?', 'Mantenha uma comunicação cordial e apoie os colegas.');
    insertChannel.run('ch-qa', 'space-react', 'duvidas-exercicios', 'text', 'Canal para colocar dúvidas de aulas e desafios técnicos', 1, 0, 0, 'Qual foi a mensagem de erro específica ou comportamento verificado?', 'Partilhe excertos de código formatados com blocos markdown.');
    insertChannel.run('ch-showcase', 'space-react', 'projetos-showcase', 'text', 'Apresente os seus projetos concluídos e receba feedback', 2, 0, 0, 'Que desafio técnico superou na construção deste projeto?', 'Adicione links de repositório e pré-visualização.');
    insertChannel.run('ch-voice-1', 'space-react', 'Sala de Estudo 01 (Voz / Vídeo)', 'voice', 'Sala ao vivo com partilha de ecrã e microfone aberto', 3, 1, 0, 'Que aula ou projeto está a rever em grupo?', 'Silencie o microfone quando não estiver a intervir.');

    // Espaço 2: Design Systems & UX/UI
    insertSpace.run(
      'space-ui-ux',
      'Comunidade Design Systems & UI/UX',
      'comunidade-design-systems',
      'Comunidade para designers de interfaces, partilha de ficheiros Figma, critiques de design e sessões de co-design ao vivo.',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      0,
      'design',
      'user-sarah',
      98,
      now
    );

    insertChannel.run('ch-uiux-general', 'space-ui-ux', 'geral-design', 'text', 'Discussões sobre UI/UX, tendências e sistemas visuais', 0, 0, 0, 'Que novidade do Figma descobriu recentemente?', 'Respeite a diversidade de abordagens visuais.');
    insertChannel.run('ch-uiux-feedback', 'space-ui-ux', 'design-critique', 'text', 'Peça feedback e análises de heurística das suas interfaces', 1, 0, 0, 'Qual o objetivo do utilizador neste fluxo de ecrãs?', 'Forneça contexto do público-alvo da interface.');
    insertChannel.run('ch-uiux-showcase', 'space-ui-ux', 'prototipos-showcase', 'text', 'Partilhe protótipos interativos e design tokens criados', 2, 0, 0, 'Que animações ou micro-interações implementou?', 'Disponibilize o link de visualização do protótipo.');
    insertChannel.run('ch-uiux-voice', 'space-ui-ux', 'Atelier de Design (Voz / Vídeo)', 'voice', 'Sessões de crítica ao vivo e partilha de ecrã no Figma', 3, 1, 0, 'Que componente do sistema de design está a arquitetar?', 'Partilhe o ecrã em alta resolução.');

    // Espaço 3: Cloud & DevOps
    insertSpace.run(
      'space-cloud-devops',
      'Comunidade DevOps & Cloud Architecture',
      'comunidade-cloud-devops',
      'Espaço focado em infraestruturas, contentorização, orquestração Kubernetes, pipelines CI/CD e auditorias de produção.',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      0,
      'cloud',
      'user-sarah',
      76,
      now
    );

    insertChannel.run('ch-cloud-general', 'space-cloud-devops', 'geral-cloud', 'text', 'Discussões de arquiteturas cloud, Docker e Linux', 0, 0, 0, 'Qual provedor de cloud costuma utilizar nos seus projetos?', 'Evite partilhar chaves de API ou segredos.');
    insertChannel.run('ch-cloud-qa', 'space-cloud-devops', 'debug-containers', 'text', 'Resolução de problemas de Dockerfile, redes e pods', 1, 0, 0, 'Cole aqui os logs do contentor ou docker-compose.', 'Utilize blocos de código com formatação yaml/bash.');
    insertChannel.run('ch-cloud-labs', 'space-cloud-devops', 'laboratorios-praticos', 'text', 'Partilhe as suas configurações de CI/CD e testes de carga', 2, 0, 0, 'Quantos passos tem o seu pipeline automatizado?', 'Descreva a stack técnica utilizada.');
    insertChannel.run('ch-cloud-voice', 'space-cloud-devops', 'War Room DevOps (Voz / Vídeo)', 'voice', 'Debug colaborativo ao vivo e orquestração de servidores', 3, 1, 0, 'Que ambiente de cluster está a analisar?', 'Mantenha o áudio nítido.');

    // Espaço 4: Inteligência Artificial
    insertSpace.run(
      'space-ai-applied',
      'Comunidade IA Aplicada & Engenharia de Prompts',
      'comunidade-ia-aplicada',
      'Laboratório de experimentação com LLMs, agentes autónomos, frameworks de RAG e integração de IA em produtos digitais.',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=100&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
      0,
      'ai',
      'user-sarah',
      115,
      now
    );

    insertChannel.run('ch-ai-general', 'space-ai-applied', 'geral-ia', 'text', 'Conversas sobre os avanços de modelos de inteligência artificial', 0, 0, 0, 'Que modelo generativo testou esta semana?', 'Debates fundamentados e partilha de artigos científicos.');
    insertChannel.run('ch-ai-prompts', 'space-ai-applied', 'engenharia-prompts', 'text', 'Técnicas de few-shot, chain-of-thought e estruturação de system prompts', 1, 0, 0, 'Qual prompt gerou os melhores resultados consistentes?', 'Partilhe o prompt completo e a saída gerada.');
    insertChannel.run('ch-ai-projects', 'space-ai-applied', 'agentes-projetos', 'text', 'Apresentação de agentes e arquiteturas RAG desenvolvidas pelos alunos', 2, 0, 0, 'Que base de vetores utilizou para o RAG?', 'Inclua instruções sobre como reproduzir localmente.');
    insertChannel.run('ch-ai-voice', 'space-ai-applied', 'Lab IA & Pair Prompting (Voz / Vídeo)', 'voice', 'Sessões de teste e desenvolvimento de agentes ao vivo', 3, 1, 0, 'Que workflow com IA está a implementar?', 'Silencie quando em escuta ativa.');

    // Relações de Membros
    ['space-react', 'space-ui-ux', 'space-cloud-devops', 'space-ai-applied'].forEach((spId, idx) => {
      insertMembership.run(`mem-sarah-${idx}`, 'user-sarah', spId, 'OWNER', now);
      insertMembership.run(`mem-student-${idx}`, 'user-student', spId, 'MEMBER', now);
      insertMembership.run(`mem-alex-${idx}`, 'user-alex', spId, 'ADMIN', now);
      insertMembership.run(`mem-tiago-${idx}`, 'user-tiago', spId, 'MEMBER', now);
    });

    // 5. CURSOS APROVADOS (PT-PT)
    // Curso 1: React & TS (Aprovado e publicado)
    insertCourse.run(
      'course-react-ts',
      'React 19 & TypeScript de Alta Performance',
      'react-19-typescript-alta-performance',
      'Domine os novos padrões do React 19, Server Components, Gestão de Estado Eficiente, Hooks Modernos e TypeScript Avançado com projetos práticos prontos para produção.',
      'programming',
      'Intermédio',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      0.0,
      1,
      1,
      'APPROVED',
      'Curso validado pela equipa pedagógica do NEXO. Conteúdo de excelência.',
      1,
      14.5,
      'Português',
      'user-sarah',
      'space-react',
      now,
      now
    );

    insertModule.run('mod-1', 'course-react-ts', 'Módulo 1: Fundamentos do React 19 & Tipagem Estrita', 'Conceitos essenciais, padrões de Server Components e TypeScript moderno.', 0);
    insertLesson.run('les-1', 'mod-1', '1.1 Introdução e Configuração do Ambiente Moderno', 'video', 'Nesta aula configuramos o TypeScript com definições estritas, Vite e ESLint para máxima estabilidade.', 'https://www.w3schools.com/html/mov_bbb.mp4', 12, 0, 30);
    insertLesson.run('les-2', 'mod-1', '1.2 Tipagem Avançada de Hooks & Props no React 19', 'video', 'Aprenda a tipar useState, useReducer, useRef e handlers de eventos com rigor e elegância.', 'https://www.w3schools.com/html/mov_bbb.mp4', 18, 1, 35);
    insertLesson.run('les-3', 'mod-1', '1.3 Questionário de Avaliação: Fundamentos', 'quiz', 'Avalie a sua compreensão sobre tipagem de componentes funcionais.', '', 10, 2, 50);

    insertQuiz.run('quiz-1', 'les-3', 'Questionário: Fundamentos do React com TypeScript', 'Teste prático de 2 perguntas essenciais de arquitetura.', 70, 50);
    insertQuizQuestion.run('qq-1', 'quiz-1', 'Qual é a forma recomendada de tipar as propriedades de um componente React funcional?', JSON.stringify(['Utilizar interface ou type dedicado com tipagem estrita', 'Utilizar o tipo "any"', 'Não definir tipos e deixar implícito', 'Utilizar a função genérica Object']), 0, 'Interfaces e types dedicados garantem verificação estrita em tempo de compilação.', 0);
    insertQuizQuestion.run('qq-2', 'quiz-1', 'Qual o benefício principal do modo estrito do TypeScript no React?', JSON.stringify(['Prevenir bugs e detetar referências nulas antes da execução', 'Aumentar a velocidade da rede Wi-Fi', 'Adicionar efeitos visuais CSS automaticamente', 'Permitir ignorar erros de sintaxe']), 0, 'O modo estrito previne erros comuns como acesso a propriedades indefinidas.', 1);

    // Curso 2: Design Systems (Aprovado e publicado)
    insertCourse.run(
      'course-ui-ux',
      'Design Systems & Interfaces Cinemáticas no Figma',
      'design-systems-interfaces-cinematicas-figma',
      'Crie sistemas de design industriais, tokens de cores, tipografia responsiva, componentes reutilizáveis e protótipos de alta fidelidade prontos para implementação em código.',
      'design',
      'Avançado',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      29.0,
      0,
      1,
      'APPROVED',
      'Aprovado pelo Administrador.',
      1,
      14.0,
      'Português',
      'user-sarah',
      'space-ui-ux',
      now,
      now
    );

    insertModule.run('mod-design-1', 'course-ui-ux', 'Módulo 1: Fundações de Design & Tokens', 'Paletas semânticas, tipografia, espaçamento e acessibilidade WCAG.', 0);
    insertLesson.run('les-design-1', 'mod-design-1', '1.1 Definição de Variáveis e Design Tokens no Figma', 'video', 'Como estruturar tokens primitivos e semânticos para alimentar tanto o Figma como variáveis CSS.', 'https://www.w3schools.com/html/mov_bbb.mp4', 15, 0, 30);

    // Curso 3: Cloud & DevOps (Aprovado e publicado)
    insertCourse.run(
      'course-cloud-devops',
      'DevOps Moderno, Docker & Arquitetura Cloud',
      'devops-moderno-docker-arquitetura-cloud',
      'Implemente pipelines automatizados de CI/CD, orquestre contentores com Docker e publique aplicações escaláveis na nuvem com segurança máxima.',
      'cloud',
      'Intermédio',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      39.0,
      0,
      1,
      'APPROVED',
      'Aprovado pelo Administrador.',
      0,
      20.0,
      'Português',
      'user-sarah',
      'space-cloud-devops',
      now,
      now
    );

    // 6. CURSO PENDENTE DE APROVAÇÃO (Para testar moderação do Administrador)
    insertCourse.run(
      'course-ai-pending',
      'Inteligência Artificial Aplicada & Engenharia de Prompts',
      'inteligencia-artificial-aplicada-engenharia-prompts',
      'Formação avançada sobre integração de modelos generativos, embeddings, recuperação aumentada (RAG) e fluxos de trabalho inteligentes em aplicações reais.',
      'ai',
      'Intermédio',
      'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
      45.0,
      0,
      0,
      'PENDING',
      'Submetido pelo formador para aprovação do Administrador.',
      0,
      16.0,
      'Português',
      'user-sarah',
      'space-ai-applied',
      now,
      now
    );

    insertModule.run('mod-ai-1', 'course-ai-pending', 'Módulo 1: Fundamentos de IA & LLMs', 'Conceitos de redes neurais e arquitetura Transformer.', 0);
    insertLesson.run('les-ai-1', 'mod-ai-1', '1.1 Visão Geral dos Grandes Modelos de Linguagem', 'video', 'Entenda como funcionam os modelos de linguagem modernos e tokenização.', 'https://www.w3schools.com/html/mov_bbb.mp4', 16, 0, 30);

    // 7. INSCRIÇÃO DEMO
    insertEnrollment.run('enr-1', 'user-student', 'course-react-ts', now, 68.0, 'les-2');

    // 8. CONQUISTAS (PT-PT)
    insertAchievement.run('ach-first-step', 'primeiro-passo', 'Primeiro Passo', 'Concluiu a sua primeira aula na plataforma NEXO.', 'CheckCircle2', 'learning', 'Comum', 100);
    insertAchievement.run('ach-quiz-master', 'mestre-quizzes', 'Mestre dos Questionários', 'Alcançou pontuação máxima de 100% num questionário de avaliação técnica.', 'Award', 'quiz', 'Raro', 250);
    insertAchievement.run('ach-streak-7', 'consistencia-7', 'Foco de Aço (7 Dias)', 'Manteve uma sequência ativa de estudo durante 7 dias consecutivos.', 'Flame', 'streak', 'Épico', 500);
    insertAchievement.run('ach-creator', 'criador-destaque', 'Formador Verificado', 'Teve a sua candidatura a criador aprovada e publicou o primeiro curso no NEXO.', 'Sparkles', 'creator', 'Lendário', 1000);

    // 9. NOTIFICAÇÕES (PT-PT)
    insertNotification.run('notif-1', 'user-student', 'achievement', 'Bem-vindo ao NEXO!', 'Explore o catálogo de cursos e junte-se às salas de estudo ao vivo.', '/explore', 0, now);
    insertNotification.run('notif-admin', 'user-alex', 'admin', 'Nova Candidatura a Criador', 'O utilizador Tiago Ramos submeteu um inquérito para se tornar Formador.', '/admin', 0, now);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}