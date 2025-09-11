const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Reports API data
router.get('/api', requireAuth, async (req, res) => {
    try {
        // Get date filters from query
        const { start_date, end_date, region } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (start_date) {
            whereClause += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }
        
        if (region) {
            // Use LOWER() to make the filter case-insensitive (e.g., 'punjab' matches 'Punjab')
            whereClause += ' AND LOWER(pr.name) = ?';
            params.push(region.toLowerCase());
        }

        // Get total revenue
        const [revenueResult] = await db.execute(`
            SELECT COALESCE(SUM(s.total_price), 0) as total_revenue 
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
        `, params);

        // Get total orders
        const [ordersResult] = await db.execute(`
            SELECT COUNT(*) as total_orders 
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
        `, params);

        // Get average order value
        const [avgResult] = await db.execute(`
            SELECT COALESCE(AVG(s.total_price), 0) as avg_order_value 
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
        `, params);

        // Get active products (number of distinct products sold that are currently active)
        const [productsResult] = await db.execute(`
            SELECT COUNT(DISTINCT s.product_id) as active_products 
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause} AND p.is_active = 1
        `, params);

        // Monthly sales trend (filtered)
        const [salesTrend] = await db.execute(`
            SELECT 
                DATE_FORMAT(s.created_at, '%Y-%m') as month,
                COALESCE(SUM(s.total_price), 0) as revenue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
            GROUP BY DATE_FORMAT(s.created_at, '%Y-%m')
            ORDER BY month
        `, params);

        // Payment methods breakdown
        const [paymentMethods] = await db.execute(`
            SELECT s.payment_type as type, COALESCE(SUM(s.total_price), 0) as amount
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
            GROUP BY s.payment_type
        `, params);

        // Customer types breakdown
        const [customerTypes] = await db.execute(`
            SELECT c.customer_type as type, COALESCE(SUM(s.total_price), 0) as revenue
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
            GROUP BY c.customer_type
        `, params);

        // Regional performance
        const [regionalPerformance] = await db.execute(`
            SELECT 
                pr.name as name,
                COALESCE(SUM(s.total_price), 0) as revenue,
                COUNT(s.id) as orders
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
            GROUP BY pr.name
            HAVING pr.name IS NOT NULL
            ORDER BY revenue DESC
        `, params);

        // Top performing products
        const [topProducts] = await db.execute(`
            SELECT 
                p.name,
                COALESCE(SUM(s.quantity), 0) as unitsSold,
                COALESCE(SUM(s.total_price), 0) as revenue
            FROM sales s
            JOIN products p ON s.product_id = p.id
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        `, params);

        res.json({
            totalRevenue: revenueResult[0].total_revenue,
            totalOrders: ordersResult[0].total_orders,
            avgOrderValue: Math.round(avgResult[0].avg_order_value),
            activeProducts: productsResult[0].active_products,
            salesTrend: salesTrend,
            paymentMethods: paymentMethods,
            customerTypes: customerTypes,
            regionalPerformance: regionalPerformance,
            topProducts: topProducts
        });
    } catch (error) {
        console.error('Reports API error:', error);
        res.status(500).json({ error: 'Error loading reports data' });
    }
});

// Export to Excel
router.get('/export/excel', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
        const { start_date, end_date, region, sales_channel, customer_type } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (start_date) {
            whereClause += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }
        
        if (region) {
            // Use LOWER() to make the filter case-insensitive
            whereClause += ' AND LOWER(pr.name) = ?';
            params.push(region.toLowerCase());
        }
        
        if (sales_channel) {
            whereClause += ' AND s.sales_channel = ?';
            params.push(sales_channel);
        }
        
        if (customer_type) {
            whereClause += ' AND c.type = ?';
            params.push(customer_type);
        }

        const [sales] = await db.execute(`
            SELECT s.id, s.created_at, c.full_name as customer_name, c.customer_type, ci.name as city, pr.name as region,
                   p.name as product_name, s.quantity, s.price_per_unit, s.total_price,
                   s.payment_type, s.payment_status, s.sales_channel, u.name as agent_name, s.notes
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN products p ON s.product_id = p.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            LEFT JOIN cities ci ON c.city_id = ci.id
            LEFT JOIN sales_agents sa ON s.sales_agent_id = sa.id
            LEFT JOIN users u ON sa.user_id = u.id
            ${whereClause}
            ORDER BY s.created_at DESC
        `, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add headers
        worksheet.columns = [
            { header: 'Sale ID', key: 'id', width: 10 },
            { header: 'Date', key: 'created_at', width: 15 },
            { header: 'Customer', key: 'customer_name', width: 20 },
            { header: 'Type', key: 'customer_type', width: 10 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'Region', key: 'region', width: 10 },
            { header: 'Product', key: 'product_name', width: 20 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Price/Unit', key: 'price_per_unit', width: 12 },
            { header: 'Total', key: 'total_price', width: 12 },
            { header: 'Payment Type', key: 'payment_type', width: 12 },
            { header: 'Payment Status', key: 'payment_status', width: 12 },
            { header: 'Channel', key: 'sales_channel', width: 12 },
            { header: 'Agent', key: 'agent_name', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Add data
        sales.forEach(sale => {
            worksheet.addRow({
                ...sale,
                created_at: new Date(sale.created_at).toLocaleDateString()
            });
        });

        // Style the header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: 'Error exporting to Excel' });
    }
});

// Export to PDF
router.get('/export/pdf', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
        const { start_date, end_date, region, sales_channel, customer_type } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (start_date) {
            whereClause += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }

        if (region) {
            whereClause += ' AND LOWER(pr.name) = ?';
            params.push(region.toLowerCase());
        }

        // Get summary data
        const [summary] = await db.execute(`
            SELECT COUNT(s.id) as total_sales, COALESCE(SUM(s.total_price), 0) as total_revenue,
                   COALESCE(SUM(CASE WHEN s.payment_type IN ('cash', 'bank_transfer') THEN s.total_price ELSE 0 END), 0) as paid_upfront_amount,
                   COALESCE(SUM(CASE WHEN s.payment_type = 'credit' THEN s.total_price ELSE 0 END), 0) as credit_amount
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            LEFT JOIN provinces pr ON c.province_id = pr.id
            ${whereClause}
        `, params);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('Flour CRM Sales Report', 50, 50);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

        // Summary
        doc.fontSize(16).text('Summary', 50, 120);
        doc.fontSize(12)
           .text(`Total Sales: ${summary[0].total_sales}`, 50, 150)
           .text(`Total Revenue: Rs. ${summary[0].total_revenue.toLocaleString()}`, 50, 170)
           .text(`Paid Upfront (Cash/Bank): Rs. ${summary[0].paid_upfront_amount.toLocaleString()}`, 50, 190)
           .text(`Credit Amount: Rs. ${summary[0].credit_amount.toLocaleString()}`, 50, 210);

        doc.end();

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: 'Error exporting to PDF' });
    }
});

module.exports = router;
