# eCommerce Web

eCommerce Web is an eCommerce web application built with Node.js, Express, EJS, BCrypt and MySQL.

## Installation

To run this application, follow these steps:

1. Clone the repo to your local machine.

`git clone https://github.com/zlatirl/ECommerce-Web.git`

2. Navigate to the project directory

`cd ECommerce-Web`

3. Install the required dependencies

`npm install`

4. Setup the MySQL database

5. Make adjustments to `index.js`, `auth.js` and `register.ejs`

- In `index.js` replace `root` and `root` with your sql username and password.
- In `auth.js` replace `YOUR_SECRET_KEY` with your hCaptcha key after you register on hCaptcha and add a site
- Follow the same steps in `register.ejs` as you will need your hCaptcha key there too.

6. Start the application:

`node .`

7. Open your web browser and go to http://localhost:3000 to access eCommerce Web

## Dependencies

- Axios
- BCrypt
- Express
- EJS
- MySQL