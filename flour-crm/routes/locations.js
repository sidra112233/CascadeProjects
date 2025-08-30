const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all provinces
router.get('/provinces', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [provinces] = await connection.execute('SELECT * FROM provinces ORDER BY name');
        connection.release();
        res.json(provinces);
    } catch (error) {
        console.error('Error fetching provinces:', error);
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
});

// Get cities by province
router.get('/cities/:provinceId', async (req, res) => {
    try {
        const { provinceId } = req.params;
        const connection = await db.getConnection();
        const [cities] = await connection.execute(
            'SELECT * FROM cities WHERE province_id = ? ORDER BY name',
            [provinceId]
        );
        connection.release();
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});

// Get towns by city
router.get('/towns/:cityId', async (req, res) => {
    try {
        const { cityId } = req.params;
        const connection = await db.getConnection();
        const [towns] = await connection.execute(
            'SELECT * FROM towns WHERE city_id = ? ORDER BY name',
            [cityId]
        );
        connection.release();
        res.json(towns);
    } catch (error) {
        console.error('Error fetching towns:', error);
        res.status(500).json({ error: 'Failed to fetch towns' });
    }
});

module.exports = router;
