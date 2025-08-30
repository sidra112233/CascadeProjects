const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all sales with enhanced details
router.get('/', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [sales] = await connection.execute(`
            SELECT s.*, 
                   c.full_name as customer_name, 
                   c.customer_type,
                   p.name as product_name, 
                   u.name as agent_name,
                   sa.agent_type,
                   pr.name as province_name,
                   ci.name as city_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            JOIN sales_agents sa ON s.sales_agent_id = sa.id
            JOIN users u ON sa.user_id = u.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            LEFT JOIN cities ci ON c.city_id = ci.id
            ORDER BY s.created_at DESC
        `);
        connection.release();
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// Create new sale with tax calculation
router.post('/', async (req, res) => {
    try {
        const { 
            customer_id, 
            product_id, 
            quantity, 
            price_per_unit, 
            tax_rate,
            payment_type, 
            payment_status, 
            sales_channel, 
            sales_agent_id, 
            notes 
        } = req.body;
        
        // Calculate amounts
        const subtotal = parseFloat(quantity) * parseFloat(price_per_unit);
        const tax_amount = subtotal * (parseFloat(tax_rate) / 100);
        const total_price = subtotal + tax_amount;
        
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO sales (
                customer_id, product_id, quantity, price_per_unit, subtotal,
                tax_rate, tax_amount, total_price, payment_type, payment_status, 
                sales_channel, sales_agent_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_id, product_id, quantity, price_per_unit, subtotal, tax_rate || 0, tax_amount, total_price, payment_type, payment_status, sales_channel, sales_agent_id, notes]
        );
        
        connection.release();
        res.json({ id: result.insertId, message: 'Sale created successfully' });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Failed to create sale' });
    }
});

// Update sale payment status
router.patch('/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'UPDATE sales SET payment_status = ? WHERE id = ?',
            [payment_status, id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sale not found' });
        }
        
        res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

module.exports = router;
