const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    const authenticate = (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        next();
    };

    // Public Route - No Authentication
    router.get('/products', (req, res) => {
        db.query('SELECT * FROM products', (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
            }
            res.json({ status: 'success', data: results });
        });
    });

    // Protected Routes
    router.use('/user', authenticate); // Apply middleware to /user
    router.get('/user', (req, res) => {
        const userId = req.session.user.id;
        db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
            }
            res.json({ status: 'success', data: results[0] });
        });
    });

    return router;
};