import { queryOne, queryAll, execute } from '../database/connection.js';
import { lessonWithCourse } from './courseAccess.js';
import { randomUUID } from 'node:crypto';

const parse = (value, fallback) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value || fallback;
  } catch {
    return fallback;
  }
};
const normalise = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function loadAssessment(lessonId) {
  const lesson = lessonWithCourse(lessonId);
  if (!lesson || lesson.type !== 'quiz') return null;
  const stored = queryOne('SELECT * FROM quizzes WHERE lessonId = ?', [lesson.id]);
  const content = parse(lesson.content, {});
  let questions = Array.isArray(content.questions) ? content.questions : [];
  if (!questions.length && stored)
    questions = queryAll('SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex', [
      stored.id,
    ]).map((q) => ({ ...q, options: parse(q.options, []) }));
  const formatted = questions.map((q, index) => ({
    ...q,
    id: String(q.id || `q-${index}`),
    type: q.type || 'single',
    points: Math.max(1, Math.min(100, Number(q.points) || 10)),
    options: (Array.isArray(q.options) ? q.options : []).map((option, optionIndex) => ({
      id: String(option?.id || `opt-${index}-${optionIndex}`),
      text: typeof option === 'string' ? option : String(option?.text || ''),
      isCorrect:
        typeof option === 'string'
          ? optionIndex === Number(q.correctOptionIndex ?? -1)
          : option?.isCorrect === true,
    })),
  }));
  return {
    lessonId: lesson.id,
    courseId: lesson.courseId,
    id: lesson.id,
    title: content.title || stored?.title || lesson.title,
    description: content.description || '',
    passingScore: Math.max(
      1,
      Math.min(100, Number(content.passingScore || stored?.passingScore) || 70),
    ),
    questions: formatted,
  };
}

export function publicAssessment(quiz) {
  if (!quiz) return null;
  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      points: q.points,
      gradingMode: q.gradingMode,
      minWords: q.minWords,
      options: q.options.map(({ id, text }) => ({ id, text })),
    })),
  };
}

export function gradeAssessment(quiz, answers) {
  if (
    !answers ||
    typeof answers !== 'object' ||
    Array.isArray(answers) ||
    JSON.stringify(answers).length > 60000
  )
    throw new Error('Respostas inválidas.');
  if (!quiz.questions.length) throw new Error('O questionário ainda não tem perguntas.');
  let earned = 0,
    total = 0,
    correctCount = 0,
    pending = 0;
  const results = quiz.questions.map((q) => {
    const answer = answers[q.id];
    let isCorrect = false;
    if (q.type === 'open-ended') {
      if (typeof answer !== 'string' || !answer.trim() || answer.length > 5000)
        throw new Error('Responda a todas as perguntas. Use até 5000 caracteres por resposta.');
      const keywords = Array.isArray(q.keywords) ? q.keywords.map(normalise).filter(Boolean) : [];
      if (q.gradingMode === 'teacher' || !keywords.length) {
        pending++;
        isCorrect = null;
      } else {
        const matched = keywords.filter((word) => normalise(answer).includes(word)).length;
        isCorrect =
          answer.trim().split(/\s+/).length >= (Number(q.minWords) || 1) &&
          (matched / keywords.length >= 0.5 || matched >= Math.min(2, keywords.length));
      }
    } else {
      const selected = q.type === 'multiple' ? answer : [answer];
      if (
        !Array.isArray(selected) ||
        !selected.length ||
        selected.some((id) => typeof id !== 'string' || !q.options.some((o) => o.id === id))
      )
        throw new Error('Selecione uma resposta válida em cada pergunta.');
      const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (!correct.length)
        throw new Error('O formador ainda não configurou as respostas deste questionário.');
      const unique = new Set(selected);
      isCorrect = unique.size === correct.length && correct.every((id) => unique.has(id));
    }
    total += q.points;
    if (isCorrect) {
      earned += q.points;
      correctCount++;
    }
    return {
      questionId: q.id,
      isCorrect,
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
      explanation: q.explanation || '',
      expectedAnswer: q.expectedAnswer || '',
    };
  });
  const score = Math.round((earned / total) * 100);
  return {
    score,
    passed: pending === 0 && score >= quiz.passingScore,
    correctCount,
    totalCount: quiz.questions.length,
    earnedXp: 0,
    pendingTeacherReviewCount: pending,
    results,
  };
}

export function recordAssessment(userId, quiz, answers, result) {
  const id = randomUUID();
  execute(
    `INSERT INTO submissoes_questionario (id, id_utilizador, id_aula, respostas, resultado, nota, aprovado, pendente, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      quiz.lessonId,
      JSON.stringify(answers),
      JSON.stringify(result),
      result.score,
      result.passed ? 1 : 0,
      result.pendingTeacherReviewCount ? 1 : 0,
      new Date().toISOString(),
    ],
  );
  return id;
}

export function hasPassedAssessment(userId, lessonId) {
  return Boolean(
    queryOne(
      'SELECT id FROM submissoes_questionario WHERE id_utilizador = ? AND id_aula = ? AND aprovado = 1 LIMIT 1',
      [userId, lessonId],
    ),
  );
}
