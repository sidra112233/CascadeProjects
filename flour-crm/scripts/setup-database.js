const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without specifying database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'flour_crm'}`);
        console.log('Database created or already exists');

        // Use the database
        await connection.execute(`USE ${process.env.DB_NAME || 'flour_crm'}`);

        // Create Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'agent', 'accountant') DEFAULT 'agent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create Regions table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS regions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                province ENUM('Punjab', 'KPK') NOT NULL,
                city VARCHAR(100) NOT NULL,
                area VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Customers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('B2B', 'B2C') NOT NULL,
                name VARCHAR(100) NOT NULL,
                business_name VARCHAR(100),
                contact VARCHAR(20) NOT NULL,
                whatsapp VARCHAR(20),
                email VARCHAR(100),
                address TEXT,
                city VARCHAR(100),
                region ENUM('Punjab', 'KPK'),
                area VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create Products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                unit ENUM('kg', 'bag') DEFAULT 'kg',
                weight_per_unit DECIMAL(8,2) DEFAULT 1.00,
                price_per_unit DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create Sales table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity DECIMAL(10,2) NOT NULL,
                price_per_unit DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(12,2) NOT NULL,
                payment_type ENUM('deposit', 'credit') NOT NULL,
                payment_status ENUM('paid', 'pending') DEFAULT 'pending',
                sales_channel ENUM('website', 'whatsapp', 'call', 'in-person') NOT NULL,
                sales_agent_id INT NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (sales_agent_id) REFERENCES users(id)
            )
        `);

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await connection.execute(`
            INSERT IGNORE INTO users (name, email, password, role) 
            VALUES ('Admin User', 'admin@flourcrm.com', ?, 'admin')
        `, [hashedPassword]);

        // Insert sample regions
        await connection.execute(`
            INSERT IGNORE INTO regions (province, city, area) VALUES
            ('Punjab', 'Lahore', 'Walton Road'),
            ('Punjab', 'Lahore', 'Gulberg'),
            ('Punjab', 'Lahore', 'DHA'),
            ('Punjab', 'Gujranwala', 'Civil Lines'),
            ('Punjab', 'Faisalabad', 'Jaranwala Road'),
            ('KPK', 'Peshawar', 'University Town'),
            ('KPK', 'Peshawar', 'Hayatabad'),
            ('KPK', 'Mardan', 'City Center')
        `);

        // Insert sample products
        await connection.execute(`
            INSERT IGNORE INTO products (name, category, unit, weight_per_unit, price_per_unit) VALUES
            ('Flour 5kg Bag', 'Premium', 'bag', 5.00, 450.00),
            ('Flour 10kg Bag', 'Premium', 'bag', 10.00, 850.00),
            ('Flour 20kg Bag', 'Premium', 'bag', 20.00, 1650.00),
            ('Flour 50kg Bag', 'Wholesale', 'bag', 50.00, 4000.00),
            ('Flour Per KG', 'Bulk', 'kg', 1.00, 85.00)
        `);

        console.log('Database setup completed successfully!');
        console.log('Default admin credentials:');
        console.log('Email: admin@flourcrm.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
