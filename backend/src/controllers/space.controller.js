import { queryAll, queryOne, execute, transaction } from '../database/connection.js';

export const getSpaces = async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql = `
      SELECT s.*,
             u.name as owner_name, u.username as owner_username, u.avatarUrl as owner_avatarUrl,
             (SELECT COUNT(*) FROM memberships WHERE spaceId = s.id) as memberCount
      FROM spaces s
      LEFT JOIN users u ON s.ownerId = u.id
      WHERE s.isPrivate = 0
    `;
    const params = [];
    if (search) { sql += ' AND (s.name LIKE ? OR s.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category && category !== 'all') { sql += ' AND s.category = ?'; params.push(category); }
    sql += ' ORDER BY s.memberCount DESC';

    const spaces = queryAll(sql, params);
    return res.json(spaces.map(s => ({
      id: s.id, name: s.name, slug: s.slug, description: s.description,
      iconUrl: s.iconUrl, bannerUrl: s.bannerUrl, category: s.category,
      memberCount: s.memberCount, isPrivate: s.isPrivate === 1,
      owner: { name: s.owner_name, username: s.owner_username, avatarUrl: s.owner_avatarUrl }
    })));
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar espaços comunitários.', error: 'Falha ao carregar espaços comunitários.' });
  }
};

export const getSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const space = queryOne('SELECT * FROM spaces WHERE id = ? OR slug = ?', [id, id]);
    if (!space) return res.status(404).json({ message: 'Espaço não encontrado.', error: 'Espaço não encontrado.' });

    const channels = queryAll('SELECT * FROM channels WHERE spaceId = ? ORDER BY orderIndex ASC', [space.id]);
    const members = queryAll(
      'SELECT m.*, u.name, u.username, u.avatarUrl, u.role FROM memberships m JOIN users u ON m.userId = u.id WHERE m.spaceId = ? LIMIT 50',
      [space.id]
    );
    return res.json({ ...space, channels, members });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar espaço comunitário.', error: 'Falha ao carregar espaço comunitário.' });
  }
};

export const joinSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const space = queryOne('SELECT id, name FROM spaces WHERE id = ? OR slug = ?', [id, id]);
    if (!space) return res.status(404).json({ message: 'Espaço não encontrado.', error: 'Espaço não encontrado.' });

    const existing = queryOne('SELECT id FROM memberships WHERE userId = ? AND spaceId = ?', [userId, space.id]);
    if (existing) return res.json({ message: 'Já é membro deste espaço.' });

    const now = new Date().toISOString();
    execute('INSERT INTO memberships (id, userId, spaceId, role, joinedAt) VALUES (?, ?, ?, \'MEMBER\', ?)', [`mem-${Date.now()}`, userId, space.id, now]);
    return res.status(201).json({ message: 'Aderiu ao espaço com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao aderir ao espaço.', error: 'Falha ao aderir ao espaço.' });
  }
};

export default { getSpaces, getSpace, joinSpace };
