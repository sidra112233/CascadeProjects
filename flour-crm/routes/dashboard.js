const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard home
router.get('/', requireAuth, async (req, res) => {
    try {
        // Get today's sales
        const [todaySales] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
            FROM sales 
            WHERE DATE(created_at) = CURDATE()
        `);

        // Get this week's sales
        const [weekSales] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
            FROM sales 
            WHERE YEARWEEK(created_at) = YEARWEEK(NOW())
        `);

        // Get this month's sales
        const [monthSales] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
            FROM sales 
            WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
        `);

        // Sales by region
        const [regionSales] = await db.execute(`
            SELECT c.region, COUNT(s.id) as sales_count, COALESCE(SUM(s.total_price), 0) as total_revenue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            WHERE c.region IS NOT NULL
            GROUP BY c.region
        `);

        // Payment type breakdown
        const [paymentBreakdown] = await db.execute(`
            SELECT payment_type, COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
            FROM sales
            GROUP BY payment_type
        `);

        // B2B vs B2C breakdown
        const [customerTypeBreakdown] = await db.execute(`
            SELECT c.type, COUNT(s.id) as sales_count, COALESCE(SUM(s.total_price), 0) as total_revenue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            GROUP BY c.type
        `);

        // Top 5 customers
        const [topCustomers] = await db.execute(`
            SELECT c.name, c.business_name, c.type, COUNT(s.id) as sales_count, COALESCE(SUM(s.total_price), 0) as total_spent
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            GROUP BY c.id
            ORDER BY total_spent DESC
            LIMIT 5
        `);

        // Recent sales
        const [recentSales] = await db.execute(`
            SELECT s.*, c.name as customer_name, c.type as customer_type, p.name as product_name, u.name as agent_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            JOIN users u ON s.sales_agent_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

        res.json({
            todaySales: todaySales[0] || { count: 0, total: 0 },
            weekSales: weekSales[0] || { count: 0, total: 0 },
            monthSales: monthSales[0] || { count: 0, total: 0 },
            regionSales: regionSales || [],
            paymentBreakdown: paymentBreakdown || [],
            customerTypeBreakdown: customerTypeBreakdown || [],
            topCustomers: topCustomers || [],
            recentSales: recentSales || []
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        // Render dashboard with empty data instead of error page
        res.json({
            todaySales: todaySales[0] || { count: 0, total: 0 },
            weekSales: weekSales[0] || { count: 0, total: 0 },
            monthSales: monthSales[0] || { count: 0, total: 0 },
            regionSales,
            paymentBreakdown,
            customerTypeBreakdown,
            topCustomers,
            recentSales,
            error: 'Database connection issue - showing demo data'
        });
    }
});

module.exports = router;
