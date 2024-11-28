const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (app, webData, db) => {
    const router = express.Router();

    // Register Page
    router.get('/register', (req, res) => {
        res.render('register', { webData, error: null }); // Add error to the render
    });

    // Register Page - Handle user registration
    router.post('/register', async (req, res) => {
        const { username, password } = req.body;

        // Check if the username is already taken
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Error checking for existing username:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length > 0) {
                // If the username is already taken, render the register page with an error message
                return res.render('register', { webData, error: 'Username is already taken.' });
            }

            try {
                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert user into the database
                db.query(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    (err, results) => {
                        if (err) {
                            console.error('Error inserting user:', err);
                            return res.status(500).send('Internal Server Error');
                        }

                        // Log the successful registration
                        console.log(`User ${username} has registered successfully.`);

                        // Redirect to the login page
                        res.redirect('/login');
                    }
                );
            } catch (err) {
                console.error('Error hashing password:', err);
                res.status(500).send('Internal Server Error');
            }
        });

    });

    // Login Page
    router.post('/login', async (req, res) => {
        res.send('Login');
    });

    return router;
};
