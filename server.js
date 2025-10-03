import express from 'express'; // Node.js web application framework
import bodyParser from 'body-parser'; // parsing incoming request bodies in a middleware before your handlers, available under the req.body property.
import bcrypt from "bcryptjs"; // For hashing passwords
import cors from 'cors'; // To allow cross-origin requests. CORS = Cross-Origin Resource Sharing. A mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the resource originated.
import knex from 'knex'; // To connect to the database
import dotenv from 'dotenv'; // To load environment variables
import speakeasy from 'speakeasy'; // Node.js library for Two-Factor Authentication. Generates and validates Time-based One-Time Passwords (TOTPs).
import qrcode from 'qrcode'; // Node.js library to generate QR codes for 2FA setup
import { handleRegister } from './controllers/register.js';
import { handleSignin } from './controllers/signin.js';
import { handleProfileGet } from './controllers/profile.js';
import { handleImage } from './controllers/image.js';
import { handleRoot } from './controllers/root.js';
import { handleClarifaiAPI }  from './controllers/clarifai.js';
import { handleEnable2FA, handleVerify2FASetup, handleVerify2FA } from './controllers/2fa.js';

// Load environment variables
dotenv.config();

// Connect to PostgreSQL database using Knex, which is a SQL query builder for Node.js
const db = knex({
	client: 'pg',
	connection: {
	    host: process.env.DB_HOST,
	    port: process.env.DB_PORT,
	    user: process.env.DB_USER,
	    password: process.env.DB_PASSWORD,
	    database: process.env.DB_NAME,
	},
});

const app = express(); // Initialize the web server - this is the main object that handles all incoming HTTP requests
app.use(bodyParser.json()); // Middleware that converts JSON strings from frontend into JavaScript objects (req.body)
app.use(cors({
  origin: process.env.FRONTEND_URL // Set your deployed frontend URL that is allowed to make requests to this backend
}));

// Route handlers using controller functions
// Health check
app.get('/', (req, res) => handleRoot(req, res));

// Authentication routes
app.post('/signin', (req, res) => handleSignin(req, res, db, bcrypt));
app.post('/register', (req, res) => handleRegister(req, res, db, bcrypt));
app.post('/enable-2fa', (req, res) => handleEnable2FA(req, res, db, speakeasy, qrcode));
app.post('/verify-2fa-setup', (req, res) => handleVerify2FASetup(req, res, db, speakeasy));
app.post('/verify-2fa', (req, res) => handleVerify2FA(req, res, db, speakeasy));

// User profile routes - retrieving all user data by ID (all data that is in the users table)
app.get('/profile/:id', (req, res) => handleProfileGet(req, res, db)); // :id is a route parameter - a variable part of the URL that can be accessed via req.params.id

// Image processing routes
app.put('/image', (req, res) => handleImage(req, res, db));
app.post('/clarifaiAPI', async (req, res) => {
    try {
        const data = await handleClarifaiAPI(req.body.url);
        res.json(data);
    } catch (error) {
        console.error('Clarifai API error:', error);
        res.status(500).json({ error: 'Failed to process image with Clarifai API' });
    }
});

// In bash, set the PORT variable "PORT=3000 node server.js" or use a .env file
const PORT = process.env.PORT;
app.listen(PORT || 3000, () => {
	console.log(`Server is running on ${PORT || 3000}`);
});

