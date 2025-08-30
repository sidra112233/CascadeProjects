const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple test route
app.get('/', (req, res) => {
    res.render('layout', { 
        title: 'Bootstrap Test',
        user: null,
        success: null,
        error: null,
        body: `
            <div class="container mt-4">
                <h1 class="text-primary">🔍 Bootstrap Diagnostic</h1>
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i> If this alert is styled with an icon, Bootstrap is working!
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Card Test</h5>
                                <p class="card-text">Bootstrap grid and cards working</p>
                                <button class="btn btn-primary">Primary</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Icons Test</h5>
                                <p>
                                    <i class="bi bi-check-circle text-success"></i> Success
                                    <i class="bi bi-x-circle text-danger ms-3"></i> Error
                                    <i class="bi bi-info-circle text-info ms-3"></i> Info
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send('Server Error: ' + err.message);
});

app.listen(PORT, () => {
    console.log(`✓ Minimal server running on http://localhost:${PORT}`);
    console.log('✓ Testing Bootstrap functionality...');
});
