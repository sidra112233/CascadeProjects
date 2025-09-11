const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Products list with filtering
router.get('/', requireAuth, async (req, res) => {
    try {
        const { customer_type } = req.query; // B2B, B2C filter
        // Return ALL products so frontend can show Active/Inactive tabs properly
        let query = 'SELECT * FROM products';
        let params = [];
        
        if (customer_type && ['B2B', 'B2C'].includes(customer_type)) {
            query += ' WHERE (target_customer = ? OR target_customer = "Both")';
            params.push(customer_type);
        }
        
        query += ' ORDER BY name';
        
        const [products] = await db.execute(query, params);
        res.json({ products });
    } catch (error) {
        console.error('Products list error:', error);
        res.status(500).json({ error: 'Error loading products data' });
    }
});

// New product form
router.get('/new', requireAuth, requireRole(['admin']), (req, res) => {
    res.json({ 
        errors: null,
        formData: {}
    });
});

// Create product
router.post('/', requireAuth, requireRole(['admin']), [
    body('name').notEmpty().withMessage('Product name is required'),
    body('unit').isIn(['kg', 'bag']).withMessage('Invalid unit'),
    body('weight_per_unit').isFloat({ min: 0.01 }).withMessage('Weight per unit must be greater than 0'),
    body('price_per_unit').isFloat({ min: 0.01 }).withMessage('Price per unit must be greater than 0')
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array(),
            formData: req.body
        });
    }

    const { name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active } = req.body;

    try {
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO products (name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, category, target_customer || 'Both', unit, weight_per_unit, price_per_unit, is_active !== undefined ? is_active : true]
        );
        
        connection.release();
        res.json({ id: result.insertId, message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();
        const [products] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
        connection.release();
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(products[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
router.post('/', async (req, res) => {
    try {
        const { name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active } = req.body;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO products (name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, category, target_customer || 'Both', unit, weight_per_unit, price_per_unit, is_active !== undefined ? is_active : true]
        );
        
        connection.release();
        res.json({ id: result.insertId, message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', requireAuth, async (req, res) => {
    const { name, category,target_customer, unit, weight_per_unit, price_per_unit, is_active } = req.body;
    const { id } = req.params;
    try {
        // Update product in DB (example for MySQL)
        await db.query(
            'UPDATE products SET name=?, category=?,target_customer=?, unit=?, weight_per_unit=?, price_per_unit=?, is_active=? WHERE id=?',
            [name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active ? 1 : 0, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Update product price only
router.patch('/:id/price', async (req, res) => {
    try {
        const { id } = req.params;
        const { price_per_unit } = req.body;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'UPDATE products SET price_per_unit = ? WHERE id = ?',
            [price_per_unit, id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product price updated successfully' });
    } catch (error) {
        console.error('Error updating product price:', error);
        res.status(500).json({ error: 'Failed to update product price' });
    }
});
// Deactivate product (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'UPDATE products SET is_active = 0 WHERE id = ?',
            [id]
        );
        
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating product:', error);
        res.status(500).json({ error: 'Failed to deactivate product' });
    }
});

// Create product with additional product_type field
router.post('/', requireAuth, requireRole(['admin']), [
    body('name').notEmpty().withMessage('Product name is required'),
    body('unit').isIn(['kg', 'bag']).withMessage('Invalid unit'),
    body('weight_per_unit').isFloat({ min: 0.01 }).withMessage('Weight per unit must be greater than 0'),
    body('price_per_unit').isFloat({ min: 0.01 }).withMessage('Price per unit must be greater than 0'),
    body('product_type').notEmpty().withMessage('Product type is required') // New validation rule
], async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array(),
            formData: req.body
        });
    }

    const { name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active, product_type } = req.body;

    try {
        const connection = await db.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO products (name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active, product_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, target_customer || 'Both', unit, weight_per_unit, price_per_unit, is_active !== undefined ? is_active : true, product_type]
        );
        
        connection.release();
        res.json({ id: result.insertId, message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product including product_type
router.put('/:id', requireAuth, async (req, res) => {
    const { name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active, product_type } = req.body;
    const { id } = req.params;
    try {
        // Update product in DB (example for MySQL)
        await db.query(
            'UPDATE products SET name=?, category=?, target_customer=?, unit=?, weight_per_unit=?, price_per_unit=?, is_active=?, product_type=? WHERE id=?',
            [name, category, target_customer, unit, weight_per_unit, price_per_unit, is_active ? 1 : 0, product_type, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Example Express route
router.get('/api/products', async (req, res) => {
    const { target_customer } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    if (target_customer) {
        query += ' WHERE target_customer = ?';
        params.push(target_customer);
    }
    const products = await db.query(query, params);
    res.json({ products });
});

module.exports = router;
