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
                        res.redirect('/auth/login');
                    }
                );
            } catch (err) {
                console.error('Error hashing password:', err);
                res.status(500).send('Internal Server Error');
            }
        });

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

                if(!isMatch) {
                    // Incorrect password
                    return res.render('login', { webData, error: 'Invalid username or password.' });
                }

                // Create a session and store user details
                req.session.user = {
                    id: user.id,
                    username: user.username
                };

                console.log(`User ${username} has logged in successfully.`);

                // Redirect to the home page
                res.redirect('/');
            } catch (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).send('Internal Server Error');
            }
        });
    });

    // Logout Route - Destroy the session and redirect to the login page
    router.get('/logout', (req, res) => {
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
