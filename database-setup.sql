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

-- Create Provinces table
CREATE TABLE IF NOT EXISTS provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- Create Towns table
CREATE TABLE IF NOT EXISTS towns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Create Customers table (updated)
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    customer_type ENUM('B2B', 'B2C') NOT NULL,
    business_name VARCHAR(100),
    contact VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    province_id INT,
    city_id INT,
    town_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (town_id) REFERENCES towns(id)
);

-- Create Products table (updated)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    target_customer ENUM('B2B', 'B2C', 'Both') DEFAULT 'Both',
    unit ENUM('kg', 'bag') DEFAULT 'kg',
    weight_per_unit DECIMAL(8,2) DEFAULT 1.00,
    price_per_unit DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Sales Agents table
CREATE TABLE IF NOT EXISTS sales_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    agent_type ENUM('B2B', 'B2C', 'Both') DEFAULT 'Both',
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Sales table (updated)
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    payment_type ENUM('cash', 'bank_transfer', 'credit', 'cheque') NOT NULL,
    payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    sales_channel ENUM('referral', 'phone', 'website', 'whatsapp', 'in_person', 'existing_customer') NOT NULL,
    sales_agent_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (sales_agent_id) REFERENCES sales_agents(id)
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@flourcrm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert provinces
INSERT IGNORE INTO provinces (name) VALUES
('Punjab'),
('KPK'),
('Sindh'),
('Balochistan');

-- Insert cities
INSERT IGNORE INTO cities (province_id, name) VALUES
(1, 'Lahore'),
(1, 'Gujranwala'),
(1, 'Faisalabad'),
(1, 'Multan'),
(1, 'Rawalpindi'),
(2, 'Peshawar'),
(2, 'Mardan'),
(2, 'Abbottabad'),
(3, 'Karachi'),
(3, 'Hyderabad'),
(4, 'Quetta'),
(4, 'Gwadar');

-- Insert towns
INSERT IGNORE INTO towns (city_id, name) VALUES
(1, 'Walton Road'),
(1, 'Gulberg'),
(1, 'DHA'),
(1, 'Model Town'),
(2, 'Civil Lines'),
(2, 'Satellite Town'),
(3, 'Jaranwala Road'),
(3, 'Sargodha Road'),
(6, 'University Town'),
(6, 'Hayatabad'),
(7, 'City Center'),
(9, 'Clifton'),
(9, 'Gulshan'),
(9, 'North Nazimabad');

-- Insert sample products
INSERT IGNORE INTO products (name, category, target_customer, unit, weight_per_unit, price_per_unit) VALUES
('Premium Wheat Flour', 'Premium', 'Both', 'bag', 50.00, 5000.00),
('Standard Flour', 'Standard', 'Both', 'bag', 25.00, 2500.00),
('Bulk Flour', 'Wholesale', 'B2B', 'bag', 100.00, 10000.00),
('Organic Flour', 'Organic', 'B2C', 'bag', 20.00, 3500.00),
('Flour Per KG', 'Bulk', 'B2B', 'kg', 1.00, 85.00);

-- Insert sample customers
INSERT IGNORE INTO customers (full_name, customer_type, business_name, contact, whatsapp, province_id, city_id, town_id) VALUES
('Ahmed Ali Khan', 'B2B', 'Golden Bakery', '03001234567', '03001234567', 1, 1, 1),
('Fatima Khan', 'B2B', 'Khan Flour Mills', '03009876543', '03009876543', 2, 6, 9),
('Muhammad Hassan', 'B2C', NULL, '03005555555', '03005555555', 1, 2, 5),
('Sadia Malik', 'B2B', 'Malik Trading Co', '03007777777', '03007777777', 1, 3, 7);

-- Insert sales agents
INSERT IGNORE INTO sales_agents (user_id, agent_type, commission_rate) VALUES
(1, 'Both', 2.50);

-- Insert sample sales data
INSERT IGNORE INTO sales (customer_id, product_id, quantity, price_per_unit, subtotal, tax_rate, tax_amount, total_price, payment_type, payment_status, sales_channel, sales_agent_id, notes) VALUES
-- Sale 1: Ahmed Ali Khan (Golden Bakery) - Premium Wheat Flour
(1, 1, 10.00, 5000.00, 50000.00, 17.00, 8500.00, 58500.00, 'bank_transfer', 'paid', 'existing_customer', 1, 'Regular monthly order for bakery'),

-- Sale 2: Fatima Khan (Khan Flour Mills) - Bulk Flour
(2, 3, 5.00, 10000.00, 50000.00, 17.00, 8500.00, 58500.00, 'bank_transfer', 'paid', 'phone', 1, 'Wholesale order for distribution'),

-- Sale 3: Muhammad Hassan - Standard Flour
(3, 2, 2.00, 2500.00, 5000.00, 17.00, 850.00, 5850.00, 'cash', 'paid', 'whatsapp', 1, 'Home use purchase'),

-- Sale 4: Sadia Malik (Malik Trading Co) - Flour Per KG
(4, 5, 500.00, 85.00, 42500.00, 17.00, 7225.00, 49725.00, 'credit', 'pending', 'referral', 1, 'Large bulk order for retail distribution'),

-- Sale 5: Ahmed Ali Khan - Organic Flour
(1, 4, 3.00, 3500.00, 10500.00, 17.00, 1785.00, 12285.00, 'cash', 'paid', 'in_person', 1, 'Special order for premium bakery items'),

-- Sale 6: Muhammad Hassan - Flour Per KG
(3, 5, 50.00, 85.00, 4250.00, 17.00, 722.50, 4972.50, 'cash', 'paid', 'website', 1, 'Online order for home use'),

-- Sale 7: Fatima Khan - Premium Wheat Flour
(2, 1, 20.00, 5000.00, 100000.00, 17.00, 17000.00, 117000.00, 'cheque', 'partial', 'phone', 1, 'Large order, partial payment received'),

-- Sale 8: Sadia Malik - Standard Flour
(4, 2, 8.00, 2500.00, 20000.00, 17.00, 3400.00, 23400.00, 'bank_transfer', 'paid', 'existing_customer', 1, 'Regular monthly supply');

-- Show success message
SELECT 'Database setup completed successfully!' as Status;
SELECT 'Default admin login: admin@flourcrm.com / admin123' as Credentials;
