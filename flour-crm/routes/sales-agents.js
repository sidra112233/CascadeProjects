const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper to build permissions JSON from body flags
function buildPermissions(body) {
  const pages = ['dashboard', 'sales', 'customers', 'products', 'reports', 'agents'];
  const actions = ['view', 'add', 'edit', 'delete'];
  const permissions = {};
  pages.forEach(page => {
    permissions[page] = {};
    actions.forEach(action => {
      permissions[page][action] = !!body[`${page}_${action}`];
    });
  });
  return permissions;
}

// ========== GET all sales agents (joined with users) ==========
router.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.execute(`
      SELECT sa.id, sa.agent_type, sa.commission_rate, sa.is_active,
             u.name, u.email
      FROM sales_agents sa
      JOIN users u ON sa.user_id = u.id
      ORDER BY u.name
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sales agents:', error);
    res.status(500).json({ error: 'Failed to fetch sales agents' });
  }
});

// ========== POST assign existing user as agent ==========
router.post('/', async (req, res) => {
  try {
    const { user_id, agent_type, commission_rate } = req.body;
    if (!user_id || !agent_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    // (Optional) ensure not already an agent
    const [exists] = await connection.execute(
      'SELECT id FROM sales_agents WHERE user_id = ? LIMIT 1',
      [user_id]
    );
    if (exists.length) {
      connection.release();
      return res.status(409).json({ error: 'This user is already a sales agent' });
    }

    const [result] = await connection.execute(
      'INSERT INTO sales_agents (user_id, agent_type, commission_rate, is_active) VALUES (?, ?, ?, 1)',
      [user_id, agent_type, commission_rate || 0]
    );
    connection.release();
    res.json({ id: result.insertId, message: 'Agent created successfully' });
  } catch (error) {
    console.error('Error creating sales agent:', error);
    res.status(500).json({ error: 'Failed to create sales agent' });
  }
});

// ========== PUT update agent (type/commission/status) ==========
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { agent_type, commission_rate, is_active } = req.body;

    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'UPDATE sales_agents SET agent_type = COALESCE(?, agent_type), commission_rate = COALESCE(?, commission_rate), is_active = COALESCE(?, is_active) WHERE id = ?',
      [agent_type ?? null, commission_rate ?? null, typeof is_active === 'boolean' ? is_active : null, id]
    );
    connection.release();

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Sales agent not found' });
    res.json({ message: 'Sales agent updated successfully' });
  } catch (error) {
    console.error('Error updating sales agent:', error);
    res.status(500).json({ error: 'Failed to update sales agent' });
  }
});

// ========== POST onboard new user + create sales agent ==========
router.post('/onboard', async (req, res) => {
  const {
    name, email, phone,
    access_level,                // 'view' | 'edit' | 'full' | 'custom'
    agent_type,                  // 'B2B' | 'B2C' | 'Both'
    commission_rate,             // number
    password                     // optional; if absent, default will be used
  } = req.body;

  if (!name || !email || !phone || !access_level || !agent_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure email not used
    const [dupes] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (dupes.length) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Password handling
    const rawPassword = password && String(password).trim().length >= 6 ? String(password) : 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Build permissions JSON only if custom
    let permissionsJSON = null;
    if (access_level === 'custom') {
      permissionsJSON = JSON.stringify(buildPermissions(req.body));
    }

    // Create user (role=agent)
    // NOTE: If your schema uses `password` instead of `password_hash`, replace the column name accordingly.
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, phone, role, password, access_level, permissions)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, 'agent', passwordHash, access_level, permissionsJSON]
    );
    const userId = userResult.insertId;

    // Create sales agent row
    await connection.execute(
      'INSERT INTO sales_agents (user_id, agent_type, commission_rate, is_active) VALUES (?, ?, ?, 1)',
      [userId, agent_type, commission_rate || 0]
    );

    await connection.commit();
    connection.release();

    res.json({
      message: 'Agent onboarded successfully',
      user_id: userId
      // (Security note) We deliberately do not return the password; if you passed one in, you already have it.
      // If the default was used, the user can reset it on first login.
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error onboarding agent:', error);
    // Handle duplicate email nicely
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to onboard agent' });
  }
});

module.exports = router;
