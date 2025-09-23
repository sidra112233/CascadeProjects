const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const [sales] = await db.execute(`
            SELECT 
                s.*, 
                c.full_name AS customer_name,
                c.customer_type, 
                p.name AS product_name, 
                u.name AS agent_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            LEFT JOIN sales_agents sa ON s.sales_agent_id = sa.id
            LEFT JOIN users u ON sa.user_id = u.id
            ORDER BY s.created_at DESC
        `);

      res.json({ sales });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error loading sales data' });
    }
});

// GET a single sale by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [sales] = await db.execute(`
            SELECT 
                s.*, 
                c.full_name AS customer_name,
                c.customer_type, 
                p.name AS product_name, 
                u.name AS agent_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            LEFT JOIN sales_agents sa ON s.sales_agent_id = sa.id
            LEFT JOIN users u ON sa.user_id = u.id
            WHERE s.id = ?
        `, [id]);

        if (sales.length === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json(sales[0]);
    } catch (err) {
        console.error('Error loading sale data:', err);
        res.status(500).json({ error: 'Error loading sale data' });
    }
});

// Create sale
router.post('/', requireAuth, async (req, res) => {
    const { 
        customer_id, product_id, quantity, price_per_unit, tax_rate,
        payment_type, payment_status, sales_channel, sales_agent_id, notes 
    } = req.body;

    // Basic validation
    if (!customer_id || !product_id || !quantity || !price_per_unit || !payment_type || !payment_status || !sales_channel || !sales_agent_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate amounts
    const subtotal = parseFloat(quantity) * parseFloat(price_per_unit);
    const tax_amount = subtotal * (parseFloat(tax_rate || 0) / 100);
    const total_price = subtotal + tax_amount;

    try {
        const [result] = await db.execute(
            `INSERT INTO sales (
                customer_id, product_id, quantity, price_per_unit, subtotal,
                tax_rate, tax_amount, total_price, payment_type, payment_status, 
                sales_channel, sales_agent_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_id, product_id, quantity, price_per_unit, subtotal, tax_rate || 0, tax_amount, total_price, payment_type, payment_status, sales_channel, sales_agent_id, notes || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Sale created successfully' });
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Error creating sale record' });
    }
});

// Update a sale
router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const {
        customer_id, product_id, quantity, price_per_unit, tax_rate,
        sales_channel, sales_agent_id, payment_type, payment_status, notes
    } = req.body;

    // Add validation to prevent undefined parameters
    if (!customer_id || !product_id || !quantity || !price_per_unit || !sales_channel || !sales_agent_id || !payment_type || !payment_status) {
        return res.status(400).json({ error: 'Missing required fields for update' });
    }

    // Recalculate total price
    const subtotal = parseFloat(quantity) * parseFloat(price_per_unit);
    const tax_amount = subtotal * (parseFloat(tax_rate || 0) / 100);
    const total_price = subtotal + tax_amount;

    try {
        const [result] = await db.execute(`
            UPDATE sales SET
                customer_id = ?, product_id = ?, quantity = ?, price_per_unit = ?,
                tax_rate = ?, total_price = ?, sales_channel = ?, sales_agent_id = ?,
                payment_type = ?, payment_status = ?, notes = ?
            WHERE id = ?
        `, [
            customer_id, product_id, quantity, price_per_unit, tax_rate || 0,
            total_price, sales_channel, sales_agent_id, payment_type,
            payment_status, notes || null, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json({ message: 'Sale updated successfully' });
    } catch (error) {
        console.error('Update sale error:', error);
        res.status(500).json({ error: 'Error updating sale record' });
    }
});

// Delete a sale
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute('DELETE FROM sales WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({ error: 'Error deleting sale' });
    }
});

module.exports = router;
