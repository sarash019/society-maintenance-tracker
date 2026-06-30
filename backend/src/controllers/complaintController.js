const { pool } = require('../config/db');
const { sendComplaintStatusEmail } = require('../utils/email');

// Resident: raise a complaint
const createComplaint = async (req, res) => {
  const { category, description } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  const resident_id = req.user.id;

  if (!category || !description) {
    return res.status(400).json({ error: 'Category and description are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO complaints (resident_id, category, description, photo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [resident_id, category, description, photo_url]
    );
    const complaint = result.rows[0];
    // Record initial history entry
    await pool.query(
      'INSERT INTO complaint_history (complaint_id, actor_id, actor_role, old_status, new_status, note) VALUES ($1, $2, $3, $4, $5, $6)',
      [complaint.id, resident_id, 'resident', null, 'Open', 'Complaint raised']
    );
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resident: get their own complaints with history
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await pool.query(
      'SELECT * FROM complaints WHERE resident_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    // Attach history to each complaint
    const withHistory = await Promise.all(complaints.rows.map(async (c) => {
      const history = await pool.query(
        `SELECT ch.*, u.name as actor_name FROM complaint_history ch
         LEFT JOIN users u ON ch.actor_id = u.id
         WHERE ch.complaint_id = $1 ORDER BY ch.changed_at ASC`,
        [c.id]
      );
      return { ...c, history: history.rows };
    }));
    res.json(withHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all complaints with filters
const getAllComplaints = async (req, res) => {
  const { category, status, from_date, to_date } = req.query;
  let conditions = [];
  let params = [];
  let idx = 1;

  if (category) { conditions.push(`c.category = $${idx++}`); params.push(category); }
  if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
  if (from_date) { conditions.push(`c.created_at >= $${idx++}`); params.push(from_date); }
  if (to_date) { conditions.push(`c.created_at <= $${idx++}`); params.push(to_date); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    // Run overdue detection first
    await detectOverdue();
    const result = await pool.query(
      `SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number
       FROM complaints c JOIN users u ON c.resident_id = u.id
       ${where}
       ORDER BY c.is_overdue DESC, c.created_at DESC`,
      params
    );
    const withHistory = await Promise.all(result.rows.map(async (c) => {
      const history = await pool.query(
        `SELECT ch.*, u.name as actor_name FROM complaint_history ch
         LEFT JOIN users u ON ch.actor_id = u.id
         WHERE ch.complaint_id = $1 ORDER BY ch.changed_at ASC`,
        [c.id]
      );
      return { ...c, history: history.rows };
    }));
    res.json(withHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update status and/or priority
const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, priority, note } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Complaint not found' });

    const complaint = existing.rows[0];

    // Build update query dynamically
    const updates = [];
    const params = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (priority) { updates.push(`priority = $${idx++}`); params.push(priority); }
    updates.push(`updated_at = NOW()`);
    params.push(id);

    await pool.query(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );

    // Record history if status changed
    if (status && status !== complaint.status) {
      await pool.query(
        'INSERT INTO complaint_history (complaint_id, actor_id, actor_role, old_status, new_status, note) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, req.user.id, 'admin', complaint.status, status, note || null]
      );
      // Send email to resident
      const residentResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [complaint.resident_id]);
      if (residentResult.rows.length > 0) {
        const { name, email } = residentResult.rows[0];
        await sendComplaintStatusEmail(email, name, id, complaint.category, status, note);
      }
    }

    const updated = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: mark complaint as overdue manually
const markOverdue = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE complaints SET is_overdue = TRUE WHERE id = $1 AND status != $2', [id, 'Resolved']);
    res.json({ message: 'Marked as overdue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Internal: auto detect overdue based on configured threshold
const detectOverdue = async () => {
  try {
    const setting = await pool.query("SELECT value FROM settings WHERE key = 'overdue_days'");
    const days = parseInt(setting.rows[0]?.value || '7');
    await pool.query(
      `UPDATE complaints SET is_overdue = TRUE
       WHERE status != 'Resolved'
       AND created_at < NOW() - INTERVAL '${days} days'
       AND is_overdue = FALSE`
    );
  } catch (err) {
    console.error('Overdue detection error:', err.message);
  }
};

// Admin: update overdue threshold
const updateOverdueSetting = async (req, res) => {
  const { days } = req.body;
  if (!days || isNaN(days)) return res.status(400).json({ error: 'Valid days value required' });
  try {
    await pool.query("UPDATE settings SET value = $1 WHERE key = 'overdue_days'", [String(days)]);
    res.json({ message: `Overdue threshold updated to ${days} days` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: dashboard stats
const getDashboard = async (req, res) => {
  try {
    await detectOverdue();
    const [byStatus, byCategory, overdue] = await Promise.all([
      pool.query("SELECT status, COUNT(*) as count FROM complaints GROUP BY status"),
      pool.query("SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC"),
      pool.query("SELECT COUNT(*) as count FROM complaints WHERE is_overdue = TRUE AND status != 'Resolved'")
    ]);
    res.json({
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      overdue_count: parseInt(overdue.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createComplaint, getMyComplaints, getAllComplaints, updateComplaint, markOverdue, updateOverdueSetting, getDashboard };
