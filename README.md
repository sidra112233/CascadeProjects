# Flour CRM System

A comprehensive Customer Relationship Management system designed specifically for flour-selling businesses operating in Pakistan (Punjab & KPK regions).

## Features

### 🏠 Dashboard
- Real-time sales analytics (today, week, month)
- Regional sales breakdown (Punjab, KPK)
- Payment type analysis (deposit vs credit)
- B2B vs B2C comparison
- Top customers and recent sales

### 💰 Sales Management
- Record sales from multiple channels (Website, WhatsApp, Phone, In-Person)
- Auto-calculation of totals
- Payment tracking (deposit/credit, paid/pending)
- Agent assignment and performance tracking

### 👥 Customer Management
- Separate B2B (business) and B2C (individual) customer types
- Complete contact information with WhatsApp integration
- Regional tracking (city, area, province)
- Customer sales history and profiles

### 📦 Product Management
- Flexible product catalog (bags, per kg)
- Category management (Premium, Wholesale, etc.)
- Price management per unit
- Active/inactive product status

### 📊 Reports & Analytics
- Sales by region and city
- Channel performance analysis
- Agent performance tracking
- Payment analysis
- Export to Excel and PDF

### 🔐 Role-Based Access Control
- **Admin**: Full system access
- **Sales Agent**: Can add sales only
- **Accountant**: Can view reports and update payment status

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Frontend**: EJS templates + Bootstrap 5
- **Charts**: Chart.js
- **Export**: ExcelJS, PDFKit
- **Authentication**: Express sessions with bcrypt

## Installation

1. **Clone and Install Dependencies**
   ```bash
   cd C:\Users\hp\CascadeProjects\flour-crm
   npm install
   ```

2. **Database Setup**
   - Install MySQL and create a database
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=flour_crm
     SESSION_SECRET=your_secret_key
     PORT=3000
     ```

3. **Initialize Database**
   ```bash
   npm run setup-db
   ```

4. **Start the Application**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the System**
   - Open http://localhost:3000
   - Login with default admin credentials:
     - Email: `admin@flourcrm.com`
     - Password: `admin123`

## Usage Guide

### Adding Customers
1. Navigate to Customers → New Customer
2. Select B2B (business) or B2C (individual)
3. Fill in contact details and location
4. For B2B customers, include business name

### Recording Sales
1. Go to Sales → New Sale
2. Select customer and product
3. Enter quantity (auto-calculates total)
4. Choose payment type and status
5. Select sales channel and agent

### Viewing Reports
1. Access Reports (Admin/Accountant only)
2. Apply date and region filters
3. View analytics charts and tables
4. Export data to Excel or PDF

### Managing Products
1. Products → New Product (Admin only)
2. Set name, category, unit type
3. Define weight per unit and pricing
4. Activate/deactivate as needed

## Database Schema

### Users
- Authentication and role management
- Roles: admin, agent, accountant

### Customers
- B2B/B2C classification
- Contact information and location
- Regional tracking (Punjab/KPK)

### Products
- Flexible unit system (kg/bag)
- Pricing and category management
- Active/inactive status

### Sales
- Complete transaction records
- Payment tracking
- Channel and agent assignment
- Regional sales data

### Regions
- Province and city management
- Area-level tracking

## Regional Coverage

### Punjab
- Lahore (Walton Road, Gulberg, DHA)
- Gujranwala, Faisalabad, Sialkot

### KPK
- Peshawar (University Town, Hayatabad)
- Mardan, Abbottabad

## Business Use Cases

### B2B Sales Example
Sales agent visits a bakery in Walton Road, Lahore:
- Customer: Bakery (B2B)
- Product: 10 bags of 20kg flour
- Payment: Credit (to be paid later)
- Channel: In-person visit
- Result: Tracked in regional analytics

### B2C Sales Example
Individual customer orders via WhatsApp:
- Customer: Home buyer (B2C)
- Product: 2 bags of 10kg flour
- Payment: Deposit (cash on delivery)
- Channel: WhatsApp
- Result: Recorded with contact tracking

## Future Enhancements

- SMS/WhatsApp integration for invoices
- Inventory management system
- Google Maps integration for sales heatmap
- Multi-language support (English/Urdu)
- Mobile app for field agents

## Support

For technical support or feature requests, contact the development team.

---

**Flour CRM System** - Empowering flour businesses across Pakistan with modern technology.
