import { validationResult } from 'express-validator';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';

export const getCourses = async (req, res) => {
  try {
    const { search, category, difficulty, isFree, sort } = req.query;
    let sql = `
      SELECT c.*,
             u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl,
             (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
             (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount
      FROM courses c
      JOIN users u ON c.creatorId = u.id
      WHERE c.isPublished = 1 AND (c.approvalStatus = 'APPROVED' OR c.approvalStatus IS NULL)
    `;
    const params = [];
    if (search) { sql += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category && category !== 'all') { sql += ' AND c.category = ?'; params.push(category); }
    if (difficulty && difficulty !== 'all') { sql += ' AND c.difficulty = ?'; params.push(difficulty); }
    if (isFree === 'true') sql += ' AND c.isFree = 1';
    else if (isFree === 'false') sql += ' AND c.isFree = 0';
    if (sort === 'popular') sql += ' ORDER BY studentsCount DESC';
    else sql += ' ORDER BY c.createdAt DESC';

    const courses = queryAll(sql, params);
    return res.json(courses.map(c => ({
      id: c.id, title: c.title, slug: c.slug, description: c.description,
      category: c.category, difficulty: c.difficulty, thumbnailUrl: c.thumbnailUrl,
      price: c.price, isFree: c.isFree === 1, durationHours: c.durationHours,
      studentsCount: c.studentsCount, modulesCount: c.modulesCount,
      creator: { id: c.creator_id, name: c.creator_name, username: c.creator_username, avatarUrl: c.creator_avatarUrl }
    })));
  } catch (err) {
    console.error('getCourses error:', err);
    return res.status(500).json({ message: 'Falha ao carregar catálogo de cursos.', error: 'Falha ao carregar catálogo de cursos.' });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = queryOne(
      'SELECT c.*, u.id as creator_id, u.name as creator_name, u.username as creator_username, u.avatarUrl as creator_avatarUrl FROM courses c LEFT JOIN users u ON c.creatorId = u.id WHERE c.id = ? OR c.slug = ?',
      [id, id]
    );
    if (!course) return res.status(404).json({ message: 'Curso não encontrado.', error: 'Curso não encontrado.' });
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar detalhes do curso.', error: 'Falha ao carregar detalhes do curso.' });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const course = queryOne('SELECT id, title, spaceId FROM courses WHERE id = ? OR slug = ?', [id, id]);
    if (!course) return res.status(404).json({ message: 'Curso não encontrado.', error: 'Curso não encontrado.' });

    const existing = queryOne('SELECT id FROM enrollments WHERE userId = ? AND courseId = ?', [userId, course.id]);
    if (existing) return res.json({ message: 'Já inscrito no curso.', enrollment: existing });

    const now = new Date().toISOString();
    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    transaction(() => {
      execute('INSERT INTO enrollments (id, userId, courseId, enrolledAt, progressPercent) VALUES (?, ?, ?, ?, 0)', [enrollmentId, userId, course.id, now]);
      if (course.spaceId) {
        const memExists = queryOne('SELECT id FROM memberships WHERE userId = ? AND spaceId = ?', [userId, course.spaceId]);
        if (!memExists) execute('INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, \'MEMBER\', ?)', [`mem-${Date.now()}`, userId, course.spaceId, now]);
      }
    });
    return res.status(201).json({ message: 'Inscrição realizada com sucesso.', enrollment: queryOne('SELECT * FROM enrollments WHERE id = ?', [enrollmentId]) });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao inscrever no curso.', error: 'Falha ao inscrever no curso.' });
  }
};

export default { getCourses, getCourse, enrollCourse };
