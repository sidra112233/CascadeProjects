const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { redirectIfAuthenticated } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

const router = express.Router();

// Session status endpoint
router.get('/status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});
// Get all users (for onboarding agents etc.)
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, role FROM users ORDER BY name'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Login page
router.get('/', redirectIfAuthenticated, (req, res) => {
    res.redirect('/login');
});

router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.redirect('/login');
});

// Login POST
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Please provide valid email and password' });
    }

    const { email, password } = req.body;
    
    // For demo purposes, accept the demo credentials
    if (email === 'admin@flourcrm.com' && password === 'admin123') {
        req.session.user = {
            id: 1,
            name: 'Admin User',
            email: 'admin@flourcrm.com',
            role: 'admin'
        };
        return res.json({ success: true });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

// Example: Only allow agents with edit permission on customers page
router.post('/customers', checkPermission('customers', 'add'), async (req, res) => {
    // ...add customer logic...
});

module.exports = router;
