// Categorias de cursos disponíveis na plataforma NEXO
export const COURSE_CATEGORIES = [
  { value: 'all',           label: 'Todas as Categorias' },
  { value: 'programming',   label: 'Programação & Engenharia de Software' },
  { value: 'design',        label: 'Design & Experiência de Utilizador (UX/UI)' },
  { value: 'ai',            label: 'Inteligência Artificial & Ciência de Dados' },
  { value: 'cybersecurity', label: 'Cibersegurança & Redes' },
  { value: 'cloud',         label: 'Cloud, DevOps & Infraestruturas' },
];

export const COURSE_DIFFICULTIES = [
  { value: 'all',         label: 'Todos os Níveis' },
  { value: 'Iniciante',   label: 'Iniciante' },
  { value: 'Intermédio',  label: 'Intermédio' },
  { value: 'Avançado',    label: 'Avançado' },
];

export const USER_ROLES = {
  STUDENT:  'STUDENT',
  CREATOR:  'CREATOR',
  ADMIN:    'ADMIN',
  SUBADMIN: 'SUBADMIN',
};

export const APPROVAL_STATUSES = {
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const XP_PER_LEVEL = 500;

export const LEVEL_TITLES = [
  'Aprendiz',       // 1
  'Explorador',     // 2
  'Estudante',      // 3
  'Praticante',     // 4
  'Avançado',       // 5
  'Especialista',   // 6
  'Mestre',         // 7
  'Sénior',         // 8
  'Expert',         // 9
  'Lendário',       // 10+
];
