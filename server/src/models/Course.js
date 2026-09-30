import { queryOne, queryAll, execute, transaction } from '../database/connection.js';

export const Course = {
  findAll({ search, category, difficulty, isFree, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM courses WHERE isPublished = 1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (difficulty && difficulty !== 'all') {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (isFree !== undefined && isFree !== 'all') {
      sql += ' AND isFree = ?';
      params.push(isFree === 'true' || isFree === true ? 1 : 0);
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    return queryAll(sql, params);
  },

  findById(id) {
    return queryOne('SELECT * FROM courses WHERE id = ?', [id]);
  },

  findBySlug(slug) {
    return queryOne('SELECT * FROM courses WHERE slug = ?', [slug]);
  },

  delete(id) {
    return execute('DELETE FROM courses WHERE id = ?', [id]);
  }
};

export default Course;
