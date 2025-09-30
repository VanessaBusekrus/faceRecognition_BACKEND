import express from 'express';
import bodyParser from 'body-parser'; // To parse the incoming request bodies in a middleware before your handlers, available under the req.body property.
import bcrypt from "bcryptjs";
import cors from 'cors'; // To allow cross-origin requests
import knex from 'knex'; // To connect to the database
import dotenv from 'dotenv'; // To load environment variables
import { handleRegister } from './controllers/register.js';
import { handleSignin } from './controllers/signin.js';
import { handleProfileGet } from './controllers/profile.js';
import { handleImage } from './controllers/image.js';
import { handleRoot } from './controllers/root.js';
import { handleClarifaiAPI }  from './controllers/clarifai.js';

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
        // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
	},
});

const app = express(); // Initialize the web server - this is the main object that handles all incoming HTTP requests
app.use(bodyParser.json()); // Middleware that converts JSON strings from frontend into JavaScript objects (req.body)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' // Set your deployed frontend URL
}));

// Route handlers using controller functions
// Health check
app.get('/', (req, res) => handleRoot(req, res));

// Authentication routes
app.post('/signin', (req, res) => handleSignin(req, res, db, bcrypt));
app.post('/register', (req, res) => handleRegister(req, res, db, bcrypt));

// User profile routes
app.get('/profile/:id', (req, res) => handleProfileGet(req, res, db));

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

