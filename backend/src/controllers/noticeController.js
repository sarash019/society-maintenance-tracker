const { pool } = require('../config/db');
const { sendImportantNoticeEmail } = require('../utils/email');

// Admin: post a notice
const createNotice = async (req, res) => {
  const { title, body, is_important } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
  try {
    const result = await pool.query(
      'INSERT INTO notices (admin_id, title, body, is_important) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, body, is_important || false]
    );
    const notice = result.rows[0];

    // Send email to all residents if important
    if (is_important) {
      const residents = await pool.query("SELECT name, email FROM users WHERE role = 'resident'");
      for (const r of residents.rows) {
        await sendImportantNoticeEmail(r.email, r.name, title, body);
      }
    }
    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// All: get all notices (important ones pinned to top)
const getNotices = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name as admin_name FROM notices n
       LEFT JOIN users u ON n.admin_id = u.id
       ORDER BY n.is_important DESC, n.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: delete a notice
const deleteNotice = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notices WHERE id = $1', [id]);
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createNotice, getNotices, deleteNotice };
