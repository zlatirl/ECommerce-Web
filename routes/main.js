const express = require('express');
const router = express.Router();

const webData = { webName: "eCommerce Web" };

// Home Page
router.get('/', (req, res) => {
    res.render('index', { webData });
});

// About Page
router.get('/about', (req, res) => {
    res.render('about', { webData });
});

module.exports = router;