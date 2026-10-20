const Notes = require('../models/Notes.js');
const { randomUUID } = require('node:crypto');
const { transaction, lockTransaction } = require('../database/connection.js');
const { canStudyCourse, lessonWithCourse } = require('../services/courseAccess.js');
const getNotesByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const selectedLesson = await lessonWithCourse(req.params.lessonId);
    if (
      req.params.lessonId &&
      (!selectedLesson ||
        !(await canStudyCourse(req.user, await Notes.findCoursesById([selectedLesson.courseId]))))
    )
      return res.status(403).json({
        error: 'Sem acesso a esta aula.',
      });
    const note = await Notes.findNoteByUserIdAndLessonId([userId, lessonId]);

    return res.json(
      note || {
        content: '',
      },
    );
  } catch {
    return res.status(500).json({
      error: 'Falha ao obter anotação',
    });
  }
};

const postNotesByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    if (typeof content !== 'string' || content.length > 20000)
      return res.status(400).json({
        error: 'A anotação deve ter até 20 000 caracteres.',
      });
    const now = new Date().toISOString();
    const lesson = await lessonWithCourse(lessonId);
    if (lesson && !(await canStudyCourse(req.user, await Notes.findCoursesById([lesson.courseId]))))
      return res.status(403).json({
        error: 'Sem acesso a esta aula.',
      });
    if (!lesson) {
      return res.status(404).json({
        error: 'Aula não encontrada',
      });
    }

    const note = await transaction(async () => {
      await lockTransaction(`note:${userId}:${lessonId}`);

      const existing = await Notes.findExistingByUserIdAndLessonId([userId, lessonId]);
      if (existing) await Notes.updateNotesByContentAndUpdatedAtAndId([content, now, existing.id]);
      else await Notes.insertNotes([randomUUID(), userId, lessonId, content, now, now]);

      return Notes.findNoteByUserIdAndLessonId([userId, lessonId]);
    });

    return res.json(note);
  } catch {
    return res.status(500).json({
      error: 'Falha ao guardar anotação',
    });
  }
};

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Notes.listNotesByUserId([userId]);

    return res.json(
      notes.map((n) => ({
        id: n.id,
        content: n.content,
        updatedAt: n.updatedAt,
        lesson: {
          id: n.lessonId,
          title: n.lesson_title,
          module: {
            title: n.module_title,
            course: {
              id: n.course_id,
              title: n.course_title,
            },
          },
        },
      })),
    );
  } catch {
    return res.status(500).json({
      error: 'Falha ao obter anotações',
    });
  }
};

exports.getNotesByLessonId = getNotesByLessonId;
exports.postNotesByLessonId = postNotesByLessonId;
exports.getNotes = getNotes;
