const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard API data
router.get('/api', requireAuth, async (req, res) => {
    try {
        // Get total revenue (all-time)
        const [revenueResult] = await db.execute(`
            SELECT COALESCE(SUM(total_price), 0) as total_revenue 
            FROM sales
        `);

        // Get total sales count (all-time)
        const [salesResult] = await db.execute(`
            SELECT COUNT(*) as total_sales 
            FROM sales
        `);

        // Get total customers (all-time)
        const [customersResult] = await db.execute(`
            SELECT COUNT(*) as total_customers 
            FROM customers
        `);

        // Get pending payments (all-time)
        const [pendingResult] = await db.execute(`
            SELECT COALESCE(SUM(total_price), 0) as pending_amount 
            FROM sales 
            WHERE payment_status = 'pending'
        `);

        // Get payment type breakdown (all-time)
        const [paymentTypes] = await db.execute(`
            SELECT payment_type as type, SUM(total_price) as amount
            FROM sales 
            GROUP BY payment_type
        `);

        // Get customer type revenue breakdown (all-time)
        const [customerTypes] = await db.execute(`
            SELECT c.customer_type as type, COALESCE(SUM(s.total_price), 0) as revenue
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id
            GROUP BY c.customer_type
        `);

        // Get sales channel breakdown (all-time)
        const [salesChannels] = await db.execute(`
            SELECT sales_channel as channel, COUNT(*) as count, SUM(total_price) as revenue
            FROM sales 
            GROUP BY sales_channel
        `);

        res.json({
            totalRevenue: revenueResult[0].total_revenue,
            totalSales: salesResult[0].total_sales,
            totalCustomers: customersResult[0].total_customers,
            pendingPayments: pendingResult[0].pending_amount,
            paymentTypes: paymentTypes,
            customerTypes: customerTypes,
            salesChannels: salesChannels
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Error loading dashboard data' });
    }
});

// Dashboard home page
router.get('/', requireAuth, (req, res) => {
    res.sendFile('dashboard.html', { root: './public' });
});

module.exports = router;
