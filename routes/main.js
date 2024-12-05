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

                const parsedResults = results.map(product => ({
                    ...product,
                    price: parseFloat(product.price),
                }));

                // Render the results page with the search results
                res.render('search-results', { webData, searchTerm, results: parsedResults });
            }
        );
    });

    // Product Route
    router.get('/product/:id', (req, res) => {
        const productId = req.params.id;
    
        db.query(
            'SELECT * FROM products WHERE id = ?',
            [productId],
            (err, results) => {
                if (err) {
                    console.error('Error fetching product:', err);
                    return res.status(500).send('Internal Server Error');
                }
    
                if (results.length === 0) {
                    return res.status(404).send('Product not found');
                }
    
                const product = results[0];
                product.price = parseFloat(product.price);
                res.render('product', { product });
            }
        );
    });

    // Basket Route
    router.get('/basket', (req, res) => {
        const userId = req.session.user?.id; // Check if the user is logged in
    
        if (!userId) {
            // Handle guest basket
            const guestBasket = req.session.guestBasket || [];
            
            // Calculate the total price for the guest basket
            const basketTotal = guestBasket.reduce((total, item) => total + (item.price * item.quantity), 0); 
    
            // Render the basket page for guests
            return res.render('basket', {
                basketItems: guestBasket.map(item => ({
                    ...item,
                    productId: item.productId,
                })),
                basketTotal
            });
        }
    
        // Handle logged-in user basket
        db.query(
            `SELECT p.name, p.price, b.quantity, b.product_id
             FROM basket b
             JOIN products p ON b.product_id = p.id
             WHERE b.user_id = ?`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error fetching basket:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Convert the price to number for each item
                const basketItems = results.map(item => ({
                    ...item,
                    productId: item.product_id,
                    price: parseFloat(item.price), // Convert price to a number
                }));

                // Calculate the total price of all items in the logged-in user's basket
                const basketTotal = basketItems.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                );

                res.render('basket', { basketItems, basketTotal });
            }
        );
    });

    // Basket Add
    router.post('/basket/add', (req, res) => {
        const { productId, quantity } = req.body;
        const userId = req.session.user?.id;

        if (!userId) {
            // Handle guest users
            if (!req.session.guestBasket) {
                req.session.guestBasket = []; // Initialize the guest basket if it doesn't exist
            }

            // Fetch product details to include price
            db.query(
                'SELECT name, price FROM products WHERE id = ?',
                [productId],
                (err, results) => {
                    if (err) {
                        console.error('Error fetching product details for guest basket:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    if (results.length === 0) {
                        return res.status(404).send('Product not found.');
                    }

                    const product = results[0];
                    const existingItem = req.session.guestBasket.find(item => item.productId == productId);
    
                    if (existingItem) {
                        // Update quantity if the item exists
                        existingItem.quantity += parseInt(quantity);
                    } else {
                        // Add new item with price
                        req.session.guestBasket.push({
                            productId: parseInt(productId),
                            name: product.name,
                            price: parseFloat(product.price), // Include price
                            quantity: parseInt(quantity),
                        });
                    }
    
                    res.redirect('/basket'); // Redirect to the basket page
                }
            );
            return;
        }
        
        // Handle logged-in users
        db.query(
            'SELECT * FROM basket WHERE user_id = ? AND product_id = ?',
            [userId, productId],
            (err, results) => {
                if (err) {
                    console.error('Error checking basket:', err);
                    return res.status(500).send('Internal Server Error');
                }
    
                if (results.length > 0) {
                    // Update quantity if the item already exists
                    db.query(
                        'UPDATE basket SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                        [parseInt(quantity), userId, productId],
                        (err) => {
                            if (err) {
                                console.error('Error updating basket:', err);
                                return res.status(500).send('Internal Server Error');
                            }
                            res.redirect('/basket');
                        }
                    );
                } else {
                    // Add new item to basket
                    db.query(
                        'INSERT INTO basket (user_id, product_id, quantity) VALUES (?, ?, ?)',
                        [userId, productId, parseInt(quantity)],
                        (err) => {
                            if (err) {
                                console.error('Error adding to basket:', err);
                                return res.status(500).send('Internal Server Error');
                            }
                            res.redirect('/basket');
                        }
                    );
                }
            }
        );
    });

    // Basket Quantity
    router.post('/basket/update', (req, res) => {
        const { productId, action } = req.body;
        const userId = req.session.user?.id;

        if (!userId) {
            // Guest users
            const guestBasket = req.session.guestBasket || [];
            const item = guestBasket.find(i => i.productId == productId);

            if (item) {
                if (action === 'increase') {
                    item.quantity += 1;
                } else if (action === 'decrease') {
                    item.quantity = Math.max(item.quantity - 1, 1);
                }
            }
            return res.redirect('/basket');
        }

        // Logged-in users
        const query = action === 'increase'
            ? 'UPDATE basket SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?'
            : 'UPDATE basket SET quantity = GREATEST(quantity - 1, 1) WHERE user_id = ? AND product_id = ?';

        db.query(query, [userId, productId], (err) => {
            if (err) {
                console.error('Error updating basket quantity:', err);
                return res.status(500).send('Internal Server Error');
            }

            // Fetch updated basket data
            db.query(
                `SELECT p.name, p.price, b.quantity, b.product_id
                FROM basket b
                JOIN products p ON b.product_id = p.id
                WHERE b.user_id = ?`,
                [userId],
                (err, results) => {
                    if (err) {
                        console.error('Error fetching updated basket:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    req.session.updatedBasket = results; // Cache updated basket for rendering
                    res.redirect('/basket');
                }
            );
        });
    });

    // Remove from Basket
    router.post('/basket/remove', (req, res) => {
        const { productId } = req.body;
        const userId = req.session.user?.id;

        if (!userId) {
            // Guest users
            req.session.guestBasket = (req.session.guestBasket || []).filter(
                item => item.productId != productId
            );
            return res.redirect('/basket');
        }

        // Logged-in users
        db.query(
            'DELETE FROM basket WHERE user_id = ? AND product_id = ?',
            [userId, productId],
            (err) => {
                if (err) {
                    console.error('Error removing item from basket:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetch updated basket data
                db.query(
                    `SELECT p.name, p.price, b.quantity, b.product_id
                    FROM basket b
                    JOIN products p ON b.product_id = p.id
                    WHERE b.user_id = ?`,
                    [userId],
                    (err, results) => {
                        if (err) {
                            console.error('Error fetching updated basket:', err);
                            return res.status(500).send('Internal Server Error');
                        }

                        req.session.updatedBasket = results; // Cache updated basket for rendering
                        res.redirect('/basket');
                    }
                );
            }
        );
    });

    // Checkout Route
    router.post('/checkout', (req, res) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
    });

    return router;
};
