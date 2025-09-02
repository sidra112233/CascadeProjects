const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard page (render with EJS)
router.get('/', requireAuth, async (req, res) => {
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

        // Get sales channel breakdown (all-time)
        const [salesChannels] = await db.execute(`
            SELECT COUNT(DISTINCT sales_channel) as channels_count
            FROM sales
        `);

        // Pass values into EJS template
        res.render('dashboard', {
            totalRevenue: revenueResult[0].total_revenue,
            totalSales: salesResult[0].total_sales,
            totalCustomers: customersResult[0].total_customers,
            pendingPayments: pendingResult[0].pending_amount,
            salesChannelsCount: salesChannels[0].channels_count
        });

    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).send('Error loading dashboard data');
    }
});

// Keep your API JSON version too (optional)
router.get('/api', requireAuth, async (req, res) => {
    try {
        const [revenueResult] = await db.execute(`SELECT COALESCE(SUM(total_price), 0) as total_revenue FROM sales`);
        const [salesResult] = await db.execute(`SELECT COUNT(*) as total_sales FROM sales`);
        const [customersResult] = await db.execute(`SELECT COUNT(*) as total_customers FROM customers`);
        const [pendingResult] = await db.execute(`SELECT COALESCE(SUM(total_price), 0) as pending_amount FROM sales WHERE payment_status = 'pending'`);
        const [paymentTypes] = await db.execute(`SELECT payment_type as type, SUM(total_price) as amount FROM sales GROUP BY payment_type`);
        const [customerTypes] = await db.execute(`
            SELECT c.customer_type as type, COALESCE(SUM(s.total_price), 0) as revenue
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id
            GROUP BY c.customer_type
        `);
        const [salesChannels] = await db.execute(`SELECT sales_channel as channel, COUNT(*) as count, SUM(total_price) as revenue FROM sales GROUP BY sales_channel`);

        res.json({
            totalRevenue: revenueResult[0].total_revenue,
            totalSales: salesResult[0].total_sales,
            totalCustomers: customersResult[0].total_customers,
            pendingPayments: pendingResult[0].pending_amount,
            paymentTypes,
            customerTypes,
            salesChannels: salesChannels,
    salesChannelsCount: salesChannels.length
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Error loading dashboard data' });
    }
});

module.exports = router;
