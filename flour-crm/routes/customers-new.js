const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all customers with location details
router.get('/', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [customers] = await connection.execute(`
            SELECT c.*, 
                   p.name as province_name,
                   ci.name as city_name,
                   t.name as town_name
            FROM customers c
            LEFT JOIN provinces p ON c.province_id = p.id
            LEFT JOIN cities ci ON c.city_id = ci.id
            LEFT JOIN towns t ON c.town_id = t.id
            ORDER BY c.full_name
        `);
        connection.release();
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customer by ID with location details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();
        const [customers] = await connection.execute(`
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
        connection.release();
        
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(customers[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create new customer
router.post('/', async (req, res) => {
    try {
        const { 
            full_name, 
            customer_type, 
            business_name, 
            contact, 
            whatsapp, 
            email, 
            address, 
            province_id, 
            city_id, 
            town_id 
        } = req.body;

        if (!full_name || !customer_type || !contact || !province_id || !city_id || !town_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (customer_type === 'B2B' && !business_name) {
            return res.status(400).json({ error: 'Business name required for B2B customers' });
        }
        
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
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
    const { 
        full_name, 
        customer_type, 
        business_name, 
        contact, 
        whatsapp, 
        email, 
        address,   // 👈 optional street
        province_id, 
        city_id, 
        town_id     
    } = req.body;
        
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
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute('DELETE FROM customers WHERE id = ?', [id]);
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;
