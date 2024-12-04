const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');

module.exports = (app, webData, db) => {
    const router = express.Router();

    // Register Page
    router.get('/register', (req, res) => {
        res.render('register', { webData, error: null }); // Add error to the render
    });

    // Register Page - Handle user registration
    router.post('/register', async (req, res) => {
        const { username, password, 'h-captcha-response': hCaptchaToken } = req.body;
    
        const secretKey = '23865b08-02ac-4eb0-a868-c72cdf461e2c'; // Replace with your hCaptcha secret key
    
        try {
            const response = await axios.post('https://hcaptcha.com/siteverify', null, {
                params: {
                    secret: secretKey,
                    response: hCaptchaToken
                }
            });
    
            if (!response.data.success) {
                return res.render('register', { webData, error: 'Failed to verify hCaptcha.' });
            }
    
            db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
                if (err) {
                    console.error('Error checking for existing username:', err);
                    return res.status(500).send('Internal Server Error');
                }
    
                if (results.length > 0) {
                    return res.render('register', { webData, error: 'Username is already taken.' });
                }
    
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
    
                    db.query(
                        'INSERT INTO users (username, password) VALUES (?, ?)',
                        [username, hashedPassword],
                        (err, results) => {
                            if (err) {
                                console.error('Error inserting user:', err);
                                return res.status(500).send('Internal Server Error');
                            }
    
                            console.log(`User ${username} has registered successfully.`);
                            res.redirect('/auth/login');
                        }
                    );
                } catch (err) {
                    console.error('Error hashing password:', err);
                    res.status(500).send('Internal Server Error');
                }
            });
        } catch (err) {
            console.error('Error verifying hCaptcha:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    // Login Page - Render the login page
    router.get('/login', (req, res) => {
        res.render('login', { webData, error: null }); // Add error to the render
    });

    // Login Page - Handle user login
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
    
        // Check if the username exists in the database
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Error checking for existing username:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            if (results.length === 0) {
                // If the username does not exist, render the login page with an error message
                return res.render('login', { webData, error: 'Invalid username or password.' });
            }
    
            const user = results[0]; // Get the first user from the results
    
            try {
                // Compare the hashed password with the one provided
                const isMatch = await bcrypt.compare(password, user.password);
    
                if (!isMatch) {
                    // Incorrect password
                    return res.render('login', { webData, error: 'Invalid username or password.' });
                }
    
                // Create a session and store user details
                req.session.user = {
                    id: user.id,
                    username: user.username
                };
    
                console.log(`User ${username} has logged in successfully.`);
    
                // Merge guest basket into the user's basket
                const guestBasket = req.session.guestBasket || []; // Get the guest basket from session
                guestBasket.forEach(item => {
                    db.query(
                        'INSERT INTO basket (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
                        [user.id, item.productId, item.quantity, item.quantity],
                        (err) => {
                            if (err) {
                                console.error('Error merging basket:', err);
                            }
                        }
                    );
                });
    
                // Clear the guest basket from the session
                req.session.guestBasket = [];
    
                // Redirect to the basket page
                res.redirect('/basket');
            } catch (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).send('Internal Server Error');
            }
        });
    });

    // Logout Route - Destroy the session and redirect to the login page
    router.get('/logout', (req, res) => {
        if (req.session.user) {
            console.log(`User ${req.session.user.username} has logged out.`); // Log the user logout
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.redirect('/auth/login'); // Redirect to login page after logout
        });
    });
    
    return router;
};
