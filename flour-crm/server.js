const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

async function testConnection() {
    try {
        const db = require('./config/database');
        const connection = await db.getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
    } catch (error) {
        console.log('⚠ Database connection failed:', error.message);
        console.log('Server will start anyway - some features may not work');
    }
}
// Don't wait for database connection to start server
testConnection();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'flour-crm-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import auth middleware
const { requireAuth, redirectIfAuthenticated } = require('./middleware/auth');

// Static HTML routes
app.get('/', redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Protected routes - require authentication
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/customers', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customers.html'));
});

app.get('/customers/edit/:id?', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customers-edit.html'));
});

app.get('/sales', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sales.html'));
});

app.get('/sales/new', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sales-new.html'));
});

app.get('/products', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/reports', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/sales-agents', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sales-agents.html'));
});


// API routes for data operations (keep existing route handlers for AJAX calls)
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const customerRoutes = require('./routes/customers');
const customernewRoutes = require('./routes/customers-new');

const productRoutes = require('./routes/products');
const reportRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');
const salesAgentRoutes = require('./routes/sales-agents');

app.use('/api/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customers', customernewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sales-agents', salesAgentRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Flour CRM Server running on http://localhost:${PORT}`);
});
