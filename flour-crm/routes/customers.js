const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Customers list
router.get('/', requireAuth, async (req, res) => {
    const { type } = req.query;
    
    try {
        let query = 'SELECT * FROM customers';
        let params = [];
        
        if (type && ['B2B', 'B2C'].includes(type)) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [customers] = await db.execute(query, params);
        res.json({ customers, filterType: type || 'all' });
    } catch (error) {
        console.error('Customers list error:', error);
        res.status(500).json({ error: 'Error loading customers data' });
    }
});

// New customer form
router.get('/new', requireAuth, requireRole(['admin']), (req, res) => {
    res.json({ 
        errors: null,
        formData: {}
    });
});

// Create customer
router.post('/', requireAuth, requireRole(['admin']), [
    body('type').isIn(['B2B', 'B2C']).withMessage('Invalid customer type'),
    body('name').notEmpty().withMessage('Name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('region').isIn(['Punjab', 'KPK']).withMessage('Invalid region')
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array(),
            formData: req.body
        });
    }

    const { type, name, business_name, contact, whatsapp, email, address, city, region, area } = req.body;

    try {
        await db.execute(`
            INSERT INTO customers (type, name, business_name, contact, whatsapp, email, address, city, region, area)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [type, name, business_name || null, contact, whatsapp || null, email || null, address || null, city, region, area || null]);

        res.redirect('/customers?success=Customer added successfully');
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Error creating customer' });
    }
});

// Edit customer form
router.get('/:id/edit', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const [customers] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
        
        if (customers.length === 0) {
            return res.status(500).json({ error: 'Customer not found' });
        }

        res.json({ 
            customer: customers[0],
            errors: null,
            formData: customers[0]
        });
    } catch (error) {
        console.error('Edit customer form error:', error);
        res.status(500).json({ error: 'Error loading customer data' });
    }
});

// Update customer
router.post('/:id', requireAuth, requireRole(['admin']), [
    body('type').isIn(['B2B', 'B2C']).withMessage('Invalid customer type'),
    body('name').notEmpty().withMessage('Name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('region').isIn(['Punjab', 'KPK']).withMessage('Invalid region')
], async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            customer: { id, ...req.body },
            errors: errors.array(),
            formData: req.body
        });
    }

    const { type, name, business_name, contact, whatsapp, email, address, city, region, area } = req.body;

    try {
        await db.execute(`
            UPDATE customers 
            SET type = ?, name = ?, business_name = ?, contact = ?, whatsapp = ?, email = ?, address = ?, city = ?, region = ?, area = ?
            WHERE id = ?
        `, [type, name, business_name || null, contact, whatsapp || null, email || null, address || null, city, region, area || null, id]);

        res.redirect('/customers?success=Customer updated successfully');
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Error updating customer' });
    }
});

// Delete customer
router.post('/:id/delete', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        // Check if customer has sales
        const [sales] = await db.execute('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?', [id]);
        
        if (sales[0].count > 0) {
            return res.redirect('/customers?error=Cannot delete customer with existing sales records');
        }

        await db.execute('DELETE FROM customers WHERE id = ?', [id]);
        res.redirect('/customers?success=Customer deleted successfully');
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Error deleting customer' });
    }
});

// Customer profile with sales history
router.get('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const [customers] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
        
        if (customers.length === 0) {
            return res.status(500).json({ error: 'Customer not found' });
        }

        const [sales] = await db.execute(`
            SELECT s.*, p.name as product_name, u.name as agent_name
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN users u ON s.sales_agent_id = u.id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
        `, [id]);

        const [summary] = await db.execute(`
            SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_spent,
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

module.exports = router;
