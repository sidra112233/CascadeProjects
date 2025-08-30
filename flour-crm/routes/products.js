const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Products list
router.get('/', requireAuth, async (req, res) => {
    try {
        const [products] = await db.execute('SELECT * FROM products ORDER BY name');
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

    const { name, category, unit, weight_per_unit, price_per_unit } = req.body;

    try {
        await db.execute(`
            INSERT INTO products (name, category, unit, weight_per_unit, price_per_unit)
            VALUES (?, ?, ?, ?, ?)
        `, [name, category || null, unit, weight_per_unit, price_per_unit]);

        res.redirect('/products?success=Product added successfully');
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Error creating product' });
    }
});

// Edit product form
router.get('/:id/edit', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const [products] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        
        if (products.length === 0) {
            return res.status(500).json({ error: 'Product not found' });
        }

        res.json({ 
            product: products[0],
            errors: null,
            formData: products[0]
        });
    } catch (error) {
        console.error('Edit product form error:', error);
        res.status(500).json({ error: 'Error loading product data' });
    }
});

// Update product
router.post('/:id', requireAuth, requireRole(['admin']), [
    body('name').notEmpty().withMessage('Product name is required'),
    body('unit').isIn(['kg', 'bag']).withMessage('Invalid unit'),
    body('weight_per_unit').isFloat({ min: 0.01 }).withMessage('Weight per unit must be greater than 0'),
    body('price_per_unit').isFloat({ min: 0.01 }).withMessage('Price per unit must be greater than 0')
], async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            product: { id, ...req.body },
            errors: errors.array(),
            formData: req.body
        });
    }

    const { name, category, unit, weight_per_unit, price_per_unit, is_active } = req.body;

    try {
        await db.execute(`
            UPDATE products 
            SET name = ?, category = ?, unit = ?, weight_per_unit = ?, price_per_unit = ?, is_active = ?
            WHERE id = ?
        `, [name, category || null, unit, weight_per_unit, price_per_unit, is_active ? 1 : 0, id]);

        res.redirect('/products?success=Product updated successfully');
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
});

// Toggle product status
router.post('/:id/toggle', requireAuth, requireRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute('UPDATE products SET is_active = NOT is_active WHERE id = ?', [id]);
        res.redirect('/products?success=Product status updated');
    } catch (error) {
        console.error('Toggle product status error:', error);
        res.status(500).json({ error: 'Error updating product status' });
    }
});

module.exports = router;
