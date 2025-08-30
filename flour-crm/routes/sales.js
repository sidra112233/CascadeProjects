const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Sales list
router.get('/', requireAuth, async (req, res) => {
    try {
        const [sales] = await db.execute(`
            SELECT s.*, c.name as customer_name, c.type as customer_type, c.city, c.region,
                   p.name as product_name, u.name as agent_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            JOIN users u ON s.sales_agent_id = u.id
            ORDER BY s.created_at DESC
        `);

        res.json({ sales });
    } catch (error) {
        console.error('Sales list error:', error);
        res.status(500).json({ error: 'Error loading sales data' });
    }
});

// New sale form
router.get('/new', requireAuth, async (req, res) => {
    try {
        const [customers] = await db.execute('SELECT * FROM customers ORDER BY name');
        const [products] = await db.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
        const [agents] = await db.execute('SELECT id, name FROM users WHERE role IN ("admin", "agent") ORDER BY name');

        res.json({ 
            customers, 
            products, 
            agents,
            errors: null,
            formData: {}
        });
    } catch (error) {
        console.error('New sale form error:', error);
        res.status(500).json({ error: 'Error loading form data' });
    }
});

// Create sale
router.post('/', requireAuth, [
    body('customer_id').isInt().withMessage('Please select a customer'),
    body('product_id').isInt().withMessage('Please select a product'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
    body('price_per_unit').isFloat({ min: 0.01 }).withMessage('Price per unit must be greater than 0'),
    body('payment_type').isIn(['deposit', 'credit']).withMessage('Invalid payment type'),
    body('payment_status').isIn(['paid', 'pending']).withMessage('Invalid payment status'),
    body('sales_channel').isIn(['website', 'whatsapp', 'call', 'in-person']).withMessage('Invalid sales channel'),
    body('sales_agent_id').isInt().withMessage('Please select a sales agent')
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        try {
            const [customers] = await db.execute('SELECT * FROM customers ORDER BY name');
            const [products] = await db.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
            const [agents] = await db.execute('SELECT id, name FROM users WHERE role IN ("admin", "agent") ORDER BY name');

            return res.status(400).json({ 
                customers, 
                products, 
                agents,
                errors: errors.array(),
                formData: req.body
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error loading form data' });
        }
    }

    const { customer_id, product_id, quantity, price_per_unit, payment_type, payment_status, sales_channel, sales_agent_id, notes } = req.body;
    const total_price = parseFloat(quantity) * parseFloat(price_per_unit);

    try {
        await db.execute(`
            INSERT INTO sales (customer_id, product_id, quantity, price_per_unit, total_price, payment_type, payment_status, sales_channel, sales_agent_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [customer_id, product_id, quantity, price_per_unit, total_price, payment_type, payment_status, sales_channel, sales_agent_id, notes || null]);

        res.redirect('/sales?success=Sale recorded successfully');
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Error creating sale record' });
    }
});

// Update payment status (for accountants)
router.post('/:id/payment', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    try {
        await db.execute('UPDATE sales SET payment_status = ? WHERE id = ?', [payment_status, id]);
        res.redirect('/sales?success=Payment status updated');
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ error: 'Error updating payment status' });
    }
});

// Delete sale (admin only)
router.post('/:id/delete', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM sales WHERE id = ?', [id]);
        res.redirect('/sales?success=Sale deleted successfully');
    } catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({ error: 'Error deleting sale' });
    }
});

module.exports = router;
