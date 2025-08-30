const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all sales agents
router.get('/', async (req, res) => {
    try {
        const { type } = req.query; // B2B, B2C, or Both
        const connection = await db.getConnection();
        
        let query = `
            SELECT sa.*, u.name, u.email 
            FROM sales_agents sa 
            JOIN users u ON sa.user_id = u.id 
            WHERE sa.is_active = 1
        `;
        let params = [];
        
        if (type && type !== 'Both') {
            query += ' AND (sa.agent_type = ? OR sa.agent_type = "Both")';
            params.push(type);
        }
        
        query += ' ORDER BY u.name';
        
        const [agents] = await connection.execute(query, params);
        connection.release();
        res.json(agents);
    } catch (error) {
        console.error('Error fetching sales agents:', error);
        res.status(500).json({ error: 'Failed to fetch sales agents' });
    }
});

// Create new sales agent
router.post('/', async (req, res) => {
    try {
        const { user_id, agent_type, commission_rate } = req.body;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO sales_agents (user_id, agent_type, commission_rate) VALUES (?, ?, ?)',
            [user_id, agent_type, commission_rate || 0]
        );
        
        connection.release();
        res.json({ id: result.insertId, message: 'Sales agent created successfully' });
    } catch (error) {
        console.error('Error creating sales agent:', error);
        res.status(500).json({ error: 'Failed to create sales agent' });
    }
});

// Update sales agent
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { agent_type, commission_rate, is_active } = req.body;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'UPDATE sales_agents SET agent_type = ?, commission_rate = ?, is_active = ? WHERE id = ?',
            [agent_type, commission_rate, is_active, id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sales agent not found' });
        }
        
        res.json({ message: 'Sales agent updated successfully' });
    } catch (error) {
        console.error('Error updating sales agent:', error);
        res.status(500).json({ error: 'Failed to update sales agent' });
    }
});

module.exports = router;
