const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../index').db;

// Register Page
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
        if (err) throw err;
        res.redirect('/auth/login');
    });
});

router.post('/login', async (req, res) => {
    res.send('Login');
});

module.exports = router;
