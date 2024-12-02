const express = require('express');

module.exports = (app, webData, db) => {
    const router = express.Router();

    // Home Page
    router.get('/', (req, res) => {
        res.render('index', { webData });
    });

    // About Page
    router.get('/about', (req, res) => {
        res.render('about', { webData });
    });

    // Search Route
    router.get('/search', (req, res) => {
        const searchTerm = req.query.query; // Get the search term from the query string

        // Search for products that match the search term
        db.query(
            'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?',
            [`%${searchTerm}%`, `%${searchTerm}%`],
            (err, results) => {
                if (err) {
                    console.error('Error searching for products:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Const the price field to a number
                const parsedResults = results.map(product => ({
                    ...product,
                    price: parseFloat(product.price),
                }));

                // Render the results page with the search results
                res.render('search-results', { webData, searchTerm, results: parsedResults });
            }
        );
    });

    return router;
};
