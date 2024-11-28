-- Create the database
CREATE DATABASE IF NOT EXISTS ecommerce_db;

-- Use the created database
USE ecommerce_db;

-- Create the table for users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);