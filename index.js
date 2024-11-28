// Import the modules we need
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}));

// // SQL Database Connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: 'ecommerce_db'
// });

// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to Database');
// });

// Routes
app.use('/', require('./routes/main'));
app.use('/auth', require('./routes/auth'));

// Start the web app listening
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});