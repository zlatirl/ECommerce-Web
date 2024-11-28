const express = require('express');

module.exports = (app, webData) => {
    const router = express.Router();

    // Home Page
    router.get('/', (req, res) => {
        res.render('index', { webData });
    });

    // About Page
    router.get('/about', (req, res) => {
        res.render('about', { webData });
    });

    return router;
};
