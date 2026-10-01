import { validationResult } from 'express-validator';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';

export const getDashboard = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courses = queryAll(`
      SELECT c.*,
             (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as studentsCount,
             (SELECT COUNT(*) FROM course_modules WHERE courseId = c.id) as modulesCount
      FROM courses c
      WHERE c.creatorId = ?
      ORDER BY c.createdAt DESC
    `, [creatorId]);

    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);

    return res.json({
      courses: courses.map(c => ({
        ...c, isFree: c.isFree === 1, isPublished: c.isPublished === 1,
        studentsCount: c.studentsCount, modulesCount: c.modulesCount
      })),
      stats: { totalCourses: courses.length, totalStudents, publishedCourses: courses.filter(c => c.isPublished).length }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar painel do criador.', error: 'Falha ao carregar painel do criador.' });
  }
};

export const applyCreator = async (req, res) => {
  try {
    const { fullName, bio, expertise, experienceYears, portfolioUrl, motivation, proposedCourses, sampleVideoUrl } = req.body;
    if (!fullName || !expertise || !motivation || !proposedCourses) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.', error: 'Campos obrigatórios em falta.' });
    }

    const existing = queryOne("SELECT id FROM creator_applications WHERE userId = ? AND status = 'PENDING'", [req.user.id]);
    if (existing) {
      return res.status(409).json({ message: 'Já tem uma candidatura pendente de avaliação.', error: 'Candidatura pendente existente.' });
    }

    const now = new Date().toISOString();
    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    execute(`
      INSERT INTO creator_applications (id, userId, fullName, bio, expertise, experienceYears, portfolioUrl, motivation, proposedCourses, sampleVideoUrl, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `, [appId, req.user.id, fullName, bio || '', expertise, Number(experienceYears) || 0, portfolioUrl || '', motivation, proposedCourses, sampleVideoUrl || '', now, now]);

    return res.status(201).json({ message: 'Candidatura submetida com sucesso!', applicationId: appId });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao submeter candidatura.', error: 'Falha ao submeter candidatura.' });
  }
};

export const getApplicationStatus = async (req, res) => {
  try {
    const application = queryOne(
      'SELECT id, status, adminFeedback, createdAt, updatedAt FROM creator_applications WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
      [req.user.id]
    );
    return res.json({ application: application || null });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar estado da candidatura.', error: 'Falha ao carregar estado da candidatura.' });
  }
};

export default { getDashboard, applyCreator, getApplicationStatus };
