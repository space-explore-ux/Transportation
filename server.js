const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const userRoutes = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
// You can add userRoutes, notificationRoutes, etc. here later

// frontend routes (if needed, otherwise these can be handled by the frontend framework)
const pages = require('./src/routes/pages');


const app = express();

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());
// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount the routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/billing', billingRoutes);

app.use('/', pages); // Serve frontend pages

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'CRM API is running cleanly.' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,"0.0.0.0", () => {
    console.log(`Server initialized. Listening on port ${PORT}`);
});