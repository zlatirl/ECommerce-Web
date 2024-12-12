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

-- Create the table for products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data into the products table
INSERT INTO products (name, description, price) VALUES
-- Electronics
('iPhone 14', 'Latest Apple smartphone', 999.99),
('Samsung Galaxy S23', 'Flagship Android smartphone', 899.99),
('Sony WH-1000XM5 Headphones', 'Noise-canceling wireless headphones', 349.99),
('Apple Watch Series 8', 'Smartwatch with fitness tracking', 399.99),
('Dell XPS 13', 'Compact and powerful ultrabook', 1099.99),

-- Home Appliances
('Dyson V15 Vacuum Cleaner', 'Cordless vacuum cleaner', 699.99),
('Instant Pot Duo', 'Multi-functional pressure cooker', 89.99),
('Philips Hue Smart Bulb', 'Smart home LED bulb', 19.99),
('LG Smart Refrigerator', 'Wi-Fi enabled fridge', 1499.99),
('KitchenAid Stand Mixer', 'Professional kitchen mixer', 279.99),

-- Fashion
('Levis 501 Jeans', 'Classic straight-fit jeans', 69.99),
('Nike Air Max 270', 'Comfortable athletic sneakers', 129.99),
('Ray-Ban Aviator Sunglasses', 'Timeless sunglasses design', 159.99),
('North Face Winter Jacket', 'Warm and durable jacket', 249.99),

-- Books
('Atomic Habits', 'Self-help book by James Clear', 15.99),
('The Great Gatsby', 'Classic novel by F. Scott Fitzgerald', 10.99),
('Sapiens', 'A brief history of humankind by Yuval Noah Harari', 18.99),
('The Subtle Art of Not Giving a F*ck', 'Self-improvement book', 14.99),
('Harry Potter and the Sorcerers Stone', 'Fantasy novel by J.K. Rowling', 12.99),

-- Beauty & Personal Care
('Dove Body Wash', 'Moisturizing body wash', 5.99),
('Maybelline Mascara', 'Volumizing mascara', 8.99),
('Old Spice Deodorant', 'Long-lasting antiperspirant', 4.99),
('Cetaphil Facial Cleanser', 'Gentle skin cleanser', 7.99),
('LOreal Hair Serum', 'Nourishing hair treatment', 14.99),

-- Food & Beverages 
('Nutella Spread', 'Hazelnut chocolate spread', 3.49),
('Kelloggs Corn Flakes', 'Breakfast cereal', 2.99),
('Starbucks Coffee Beans', 'Medium roast whole coffee beans', 14.99),
('Oreo Cookies', 'Classic chocolate sandwich cookies', 3.49),
('Coca-Cola (12-pack)', 'Carbonated soft drink', 5.99),

-- Fitness
('Yoga Mat', 'Non-slip exercise mat', 19.99),
('Dumbbell Set', 'Adjustable dumbbell set', 99.99),
('Fitbit Versa 3', 'Smartwatch with fitness tracking', 199.99),
('Resistance Bands', 'Set of 5 resistance bands', 14.99),
('Peloton Bike', 'Interactive stationary bike', 1499.99),

-- Toys & Games
('LEGO Star Wars Set', 'Buildable Star Wars-themed LEGO set', 69.99),
('Monopoly Board Game', 'Classic family board game', 19.99),
('Funko Pop Figure', 'Collectible pop culture figure', 11.99),
('Nintendo Switch', 'Hybrid gaming console', 299.99),
('RC Car', 'Remote-controlled racing car', 49.99);

-- Create the table for basket
CREATE TABLE IF NOT EXISTS basket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create the table for orders placed
CREATE TABLE IF NOT EXISTS `order` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
