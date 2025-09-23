const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/customers
 * List all customers (optionally filter by type)
 */
router.get('/', requireAuth, async (req, res) => {
    const { customer_type } = req.query;

    try {
        let query = `
            SELECT c.*, 
                   p.name as province_name,
                   ci.name as city_name,
                   t.name as town_name
            FROM customers c
            LEFT JOIN provinces p ON c.province_id = p.id
            LEFT JOIN cities ci ON c.city_id = ci.id
            LEFT JOIN towns t ON c.town_id = t.id
        `;
        let params = [];

        if (customer_type && ['B2B', 'B2C'].includes(customer_type)) {
            query += ' WHERE c.customer_type = ?';
            params.push(customer_type);
        }

        query += ' ORDER BY c.created_at DESC';

        const [customers] = await db.execute(query, params);
        res.json({ customers, filterType: customer_type || 'all' });
    } catch (error) {
        console.error('Customers list error:', error);
        res.status(500).json({ error: 'Error loading customers data' });
    }
});

/**
 * GET /api/customers/:id
 * Get customer by ID with sales history
 */
router.get('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const [customers] = await db.execute(`
            SELECT c.*, 
                   p.name as province_name,
                   ci.name as city_name,
                   t.name as town_name
            FROM customers c
            LEFT JOIN provinces p ON c.province_id = p.id
            LEFT JOIN cities ci ON c.city_id = ci.id
            LEFT JOIN towns t ON c.town_id = t.id
            WHERE c.id = ?
        `, [id]);

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Fetch sales history
        const [sales] = await db.execute(`
            SELECT s.*, p.name as product_name, u.name as agent_name
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN users u ON s.sales_agent_id = u.id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
        `, [id]);

        const [summary] = await db.execute(`
            SELECT COUNT(*) as total_orders, 
                   COALESCE(SUM(total_price), 0) as total_spent,
                   COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_price ELSE 0 END), 0) as pending_amount
            FROM sales WHERE customer_id = ?
        `, [id]);

        res.json({
            customer: customers[0],
            sales,
            summary: summary[0]
        });
    } catch (error) {
        console.error('Customer profile error:', error);
        res.status(500).json({ error: 'Error loading customer profile' });
    }
});

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/', requireAuth, requireRole(['admin']), [
    body('customer_type').isIn(['B2B', 'B2C']).withMessage('Invalid customer type'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('province_id').notEmpty().withMessage('Province is required'),
    body('city_id').notEmpty().withMessage('City is required'),
    body('town_id').notEmpty().withMessage('Town is required')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), formData: req.body });
    }

    const {
        full_name, customer_type, business_name, contact, whatsapp,
        email, address, province_id, city_id, town_id
    } = req.body;

    try {
        const connection = await db.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO customers (
                full_name, customer_type, business_name, contact, whatsapp,
                email, address, province_id, city_id, town_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, customer_type, business_name, contact, whatsapp, email, address, province_id, city_id, town_id]
        );
        connection.release();

        res.json({ id: result.insertId, message: 'Customer created successfully' });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Error creating customer' });
    }
});

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', requireAuth, requireRole(['admin']), [
    body('customer_type').isIn(['B2B', 'B2C']).withMessage('Invalid customer type'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('province_id').notEmpty().withMessage('Province is required'),
    body('city_id').notEmpty().withMessage('City is required'),
    body('town_id').notEmpty().withMessage('Town is required')
], async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), formData: req.body });
    }

    const {
        full_name, customer_type, business_name, contact, whatsapp,
        email, address, province_id, city_id, town_id
    } = req.body;

    try {
        const connection = await db.getConnection();
        const [result] = await connection.execute(
            `UPDATE customers SET 
                full_name = ?, customer_type = ?, business_name = ?, contact = ?, 
                whatsapp = ?, email = ?, address = ?, province_id = ?, city_id = ?, town_id = ?
            WHERE id = ?`,
            [full_name, customer_type, business_name, contact, whatsapp, email, address, province_id, city_id, town_id, id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Error updating customer' });
    }
});

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        // Prevent delete if customer has sales
        const [sales] = await db.execute('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?', [id]);

        if (sales[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete customer with existing sales records' });
        }

        const connection = await db.getConnection();
        const [result] = await connection.execute('DELETE FROM customers WHERE id = ?', [id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Error deleting customer' });
    }
});

module.exports = router;
