import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/lesson/:lessonId', authenticate, async (req, res) => {
  try {
    const {
      lessonId
    } = req.params;
    const quiz = queryOne('SELECT * FROM quizzes WHERE lessonId = ?', [lessonId]);
    if (!quiz) {
      return res.status(404).json({
        error: 'Nenhum questionário associado a esta aula'
      });
    }
    const questions = queryAll('SELECT id, quizId, question, options, explanation, orderIndex FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex ASC', [quiz.id]);
    const formattedQuestions = questions.map(q => {
      let optionsArray = [];
      try { optionsArray = JSON.parse(q.options || '[]'); } catch (_) { optionsArray = []; }
      return {
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        options: optionsArray.map((opt, idx) => ({
          id: `opt-${idx}`,
          text: opt
        })),
        explanation: q.explanation,
        orderIndex: q.orderIndex
      };
    });
    const attempts = queryAll('SELECT * FROM quiz_attempts WHERE quizId = ? AND userId = ? ORDER BY attemptedAt DESC LIMIT 3', [quiz.id, req.user.id]);
    return res.json({
      ...quiz,
      questions: formattedQuestions,
      attempts
    });
  } catch (err) {
    console.error('Quiz fetch error:', err);
    return res.status(500).json({
      error: 'Falha ao obter questionário'
    });
  }
});
router.post('/:quizId/submit', authenticate, async (req, res) => {
  try {
    const {
      quizId
    } = req.params;
    const {
      answers
    } = req.body || {};
    const safeAnswers = answers && typeof answers === 'object' ? answers : {};
    const userId = req.user.id;
    const now = new Date().toISOString();
    const quiz = queryOne('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz) {
      return res.status(404).json({
        error: 'Questionário não encontrado'
      });
    }
    const questions = queryAll('SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex ASC', [quiz.id]);
    let correctCount = 0;
    const results = [];
    for (const q of questions) {
      const selectedOptionId = safeAnswers[q.id];
      const correctOptionId = `opt-${q.correctOptionIndex}`;
      const altCorrectOptionId = `opt-${q.id}-${q.correctOptionIndex}`;
      const isCorrect =
        selectedOptionId === correctOptionId ||
        selectedOptionId === altCorrectOptionId ||
        String(selectedOptionId) === String(q.correctOptionIndex);
      if (isCorrect) correctCount++;
      results.push({
        questionId: q.id,
        question: q.question,
        explanation: q.explanation,
        selectedOptionId,
        correctOptionId,
        isCorrect
      });
    }
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 100;
    const passed = score >= quiz.passingScore;
    const alreadyPassed = Boolean(queryOne('SELECT id FROM quiz_attempts WHERE quizId = ? AND userId = ? AND passed = 1 LIMIT 1', [quiz.id, userId]));
    const alreadyAttempted = Boolean(queryOne('SELECT id FROM quiz_attempts WHERE quizId = ? AND userId = ? LIMIT 1', [quiz.id, userId]));
    transaction(() => {
      execute(`INSERT INTO quiz_attempts (id, quizId, userId, score, passed, attemptedAt) VALUES (?, ?, ?, ?, ?, ?)`, [`att-${Date.now()}`, quiz.id, userId, score, passed ? 1 : 0, now]);
    });
    return res.json({
      score,
      passed,
      results
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    return res.status(500).json({
      error: 'Falha ao submeter respostas do questionário'
    });
  }
});
export default router;