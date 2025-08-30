-- Flour CRM Database Setup Script
-- Run this in phpMyAdmin or MySQL command line

USE flour_crm;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent', 'accountant') DEFAULT 'agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Regions table
CREATE TABLE IF NOT EXISTS regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province ENUM('Punjab', 'KPK') NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table
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
);

-- Create Products table
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
);

-- Create Sales table
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
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@flourcrm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample regions
INSERT IGNORE INTO regions (province, city, area) VALUES
('Punjab', 'Lahore', 'Walton Road'),
('Punjab', 'Lahore', 'Gulberg'),
('Punjab', 'Lahore', 'DHA'),
('Punjab', 'Gujranwala', 'Civil Lines'),
('Punjab', 'Faisalabad', 'Jaranwala Road'),
('KPK', 'Peshawar', 'University Town'),
('KPK', 'Peshawar', 'Hayatabad'),
('KPK', 'Mardan', 'City Center');

-- Insert sample products
INSERT IGNORE INTO products (name, category, unit, weight_per_unit, price_per_unit) VALUES
('Flour 5kg Bag', 'Premium', 'bag', 5.00, 450.00),
('Flour 10kg Bag', 'Premium', 'bag', 10.00, 850.00),
('Flour 20kg Bag', 'Premium', 'bag', 20.00, 1650.00),
('Flour 50kg Bag', 'Wholesale', 'bag', 50.00, 4000.00),
('Flour Per KG', 'Bulk', 'kg', 1.00, 85.00);

-- Insert sample customers
INSERT IGNORE INTO customers (type, name, business_name, contact, whatsapp, city, region, area) VALUES
('B2B', 'Ahmed Ali', 'Golden Bakery', '03001234567', '03001234567', 'Lahore', 'Punjab', 'Walton Road'),
('B2B', 'Fatima Khan', 'Khan Flour Mills', '03009876543', '03009876543', 'Peshawar', 'KPK', 'University Town'),
('B2C', 'Muhammad Hassan', NULL, '03005555555', '03005555555', 'Gujranwala', 'Punjab', 'Civil Lines'),
('B2B', 'Sadia Malik', 'Malik Trading Co', '03007777777', '03007777777', 'Faisalabad', 'Punjab', 'Jaranwala Road');

-- Show success message
SELECT 'Database setup completed successfully!' as Status;
SELECT 'Default admin login: admin@flourcrm.com / admin123' as Credentials;
