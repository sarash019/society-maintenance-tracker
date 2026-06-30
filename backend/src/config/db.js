const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
        flat_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        photo_url VARCHAR(500),
        status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
        priority VARCHAR(10) DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
        is_overdue BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS complaint_history (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
        actor_id INTEGER REFERENCES users(id),
        actor_role VARCHAR(20),
        old_status VARCHAR(30),
        new_status VARCHAR(30),
        note TEXT,
        changed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id),
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        is_important BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL
      );

      INSERT INTO settings (key, value) VALUES ('overdue_days', '7')
        ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Database tables created/verified.');
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };
