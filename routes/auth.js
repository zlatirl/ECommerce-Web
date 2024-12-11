const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');

module.exports = (app, webData, db) => {
    const router = express.Router();

    // Password validation
    function validatePassword(password) {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must include at least one uppercase letter.';
        }
        if (!/\d/.test(password)) {
            return 'Password must include at least one number.';
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return 'Password must include at least one special character (!@#$%^&*).';
        }
        return null; // No errors, password is valid
    }

    // Register Page
    router.get('/register', (req, res) => {
        res.render('register', { webData, error: null }); // Add error to the render
    });

    // Register Page - Handle user registration
    router.post('/register', async (req, res) => {
        const { username, password, 'h-captcha-response': hCaptchaToken } = req.body;

        const secretKey = 'YOUR_SECRET_KEY'; // Replace with your hCaptcha secret key

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.render('register', { webData, error: passwordError });
        }

        try {
            // Verify hCaptcha token
            const response = await axios.post('https://hcaptcha.com/siteverify', null, {
                params: {
                    secret: secretKey,
                    response: hCaptchaToken,
                },
            });

            if (!response.data.success) {
                return res.render('register', { webData, error: 'Failed to verify hCaptcha.' });
            }

            // Check for existing username
            db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
                if (err) {
                    console.error('Error checking for existing username:', err);
                    return res.status(500).send('Internal Server Error');
                }

                if (results.length > 0) {
                    return res.render('register', { webData, error: 'Username is already taken.' });
                }

                // Hash and store the password
                const hashedPassword = await bcrypt.hash(password, 10);
                db.query(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    (err) => {
                        if (err) {
                            console.error('Error inserting user:', err);
                            return res.status(500).send('Internal Server Error');
                        }
                        console.log(`User ${username} registered successfully.`);
                        res.redirect('/auth/login');
                    }
                );
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
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Fetch the user from the database
            const results = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            });

            // Handle invalid username
            if (results.length === 0) {
                return res.render('login', { webData, error: 'Invalid username or password.' });
            }

            const user = results[0];

            // Compare the hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.render('login', { webData, error: 'Invalid username or password.' });
            }

            // Create a session for the logged-in user
            req.session.user = { id: user.id, username: user.username };
            console.log(`User ${username} has logged in successfully.`);

            // Merge guest basket into the user's basket
            const guestBasket = req.session.guestBasket || [];
            if (guestBasket.length > 0) {
                // Use Promise.all to ensure all items are merged before clearing guest basket
                await Promise.all(
                    guestBasket.map(item => {
                        return new Promise((resolve, reject) => {
                            db.query(
                                'INSERT INTO basket (user_id, product_id, quantity) VALUES (?, ?, ?) ' +
                                'ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
                                [user.id, item.productId, item.quantity],
                                (err) => {
                                    if (err) {
                                        console.error(`Error merging item ${item.productId}:`, err);
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                }
                            );
                        });
                    })
                );
                
                req.session.guestBasket = []; // Clear guest basket after merging
                console.log('Guest basket merged successfully.');
            }

            // Redirect to the basket page
            res.redirect('/');
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).send('Internal Server Error');
        }
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

    // User Profile
    router.get('/profile', (req, res) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
    
        const userId = req.session.user.id;
        const successMessage = req.session.successMessage || null; // Get the success message
        delete req.session.successMessage; // Clear the message after use
    
        db.query('SELECT username FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching user details:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            if (results.length === 0) {
                return res.status(404).send('User not found');
            }
    
            const user = results[0];
            res.render('profile', { webData, user, error: null, success: successMessage });
        });
    });
    
    // Update User Details
    router.post('/profile', async (req, res) => {
        const { username, currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        try {
            const userResults = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            });

            if (userResults.length === 0) {
                return res.status(404).send('User not found');
            }

            const user = userResults[0];
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.render('profile', { webData, user, error: 'Incorrect current password', success: null });
            }

            // Validate the new password if provided
            if (newPassword) {
                const passwordError = validatePassword(newPassword);
                if (passwordError) {
                    return res.render('profile', { webData, user, error: passwordError, success: null });
                }
            }

            // Hash the new password if provided
            const hashedPassword = newPassword
                ? await bcrypt.hash(newPassword, 10)
                : user.password;

            db.query(
                'UPDATE users SET username = ?, password = ? WHERE id = ?',
                [username, hashedPassword, userId],
                (err) => {
                    if (err) {
                        console.error('Error updating user:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    req.session.user.username = username; // Update session username
                    req.session.successMessage = 'Profile updated successfully'; // Set success message
                    res.redirect('/auth/profile'); // Redirect back to profile
                }
            );
        } catch (err) {
            console.error('Error updating profile:', err);
            res.status(500).send('Internal Server Error');
        }
    });
    
    return router;
};
