import express from 'express';
import bodyParser from 'body-parser'; // To parse the incoming request bodies in a middleware before your handlers, available under the req.body property.
import bcrypt from "bcryptjs";
import cors from 'cors'; // To allow cross-origin requests
import knex from 'knex'; // To connect to the database

// Connect to PostgreSQL database using Knex, which is a SQL query builder for Node.js
const db = knex({
	client: 'pg',
	connection: {
	  host: '127.0.0.1',
	//   port: 3306,
	  user: 'vanessa',
	  password: '',
	  database: 'smart-brain',
	},
});

const app = express(); // Initialize the web server - this is the main object that handles all incoming HTTP requests
app.use(bodyParser.json()); // Middleware that converts JSON strings from frontend into JavaScript objects (req.body)
app.use(cors()); // Allows frontend (different port/domain) to make requests to this backend API

// Health check endpoint - confirms the server is running. This is the root endpoint, hence '/'
app.get('/', async (req, res) => {
	try {
	  // You can return any JSON object. In this case, a status message is included
	  res.status(200).json({ status: 'success', message: 'Backend is working!' });
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ status: 'error', message: 'Something went wrong' });
	}
  });
  

// User authentication - validates email and password, returns user data if successful
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Query the login table to find the email and retrieve its hashed password
      const loginData = await db('login')
        .select('email', 'hash')
        .where({ email });
  
      // Check if user exists and password is valid
	  // Both boolean values
      const userExists = loginData.length > 0;
      const isValid = userExists && await bcrypt.compare(password, loginData[0].hash); // If userExists is false, isValid will be false without calling bcrypt.compare
  
      if (!userExists || !isValid) {
        // Single generic message for both cases. 401 = Unauthorized (authentication failed)
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Fetch user info (we know user exists and password is correct)
      const user = await db('users').select('*').where({ email });
  
      if (user.length) {
        return res.json(user[0]);
      } else {
        // 500 = Internal Server Error - something went wrong on the server side
        return res.status(500).json({ message: 'Authentication error' });
      }
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Authentication error' });
    }
});
  
// User registration - creates a new user account with email, name, and hashed password
app.post('/register', async (req, res) => {
    const saltRounds = 10; // How many times bcrypt will scramble the password - higher = more secure but slower
    const genericErrorMessage = 'Registration failed. Please check your information';
  
    try {
      const { email, name, password } = req.body;
  
      // Basic validation if user filled in all fields
      if (!email || !name || !password) {
        return res.status(400).json({ message: genericErrorMessage });
      }
  
      const hash = await bcrypt.hash(password, saltRounds);
  
      // Start a transaction
      const newUser = await db.transaction(async trx => {
        // Insert into login table
        await trx('login').insert({ hash, email });
  
        // Insert into users table
        const [insertedUser] = await trx('users')
          .insert({
            email,
            name,
            joined: new Date()
          })
          .returning('*');
  
        return insertedUser;
      });
  
      res.json(newUser);
  
    } catch (err) {
      console.error(err);
      
      // Check if it's a unique constraint violation (duplicate email). 23505 is the PostgreSQL error code for unique violations.
      const isDuplicateEmail = err.code === '23505';
      
      if (isDuplicateEmail) {
        // User tried to register with an email that already exists. 400 = Bad Request (client error - user sent invalid data)
        return res.status(400).json({ message: genericErrorMessage });
      } else {
        // Some other database or server error occurred. 500 = Internal Server Error
        return res.status(500).json({ message: 'Registration failed. Please try again later' });
      }
    }
});
  

// Get user profile - retrieves user information by ID
app.get('/profile/:id', async (req, res) => {
	const { id } = req.params; // Extract user ID from URL path (/profile/123)

	try {
		const user = await db('users').where({ id }).select('*'); // The user array holds all info about the user with that ID

		if (user.length) { // Check if user was found (array is not empty)
		res.json(user[0]); // Send the user object as JSON response to the frontend
		} else {
		res.status(400).json('not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).json('error getting user');
	}
});

// Update face detection count - increments the entries counter when faces are detected
app.put('/image', async (req, res) => {
    const { id, faceCount = 1 } = req.body; // Extract both id and faceCount (default to 1)

    try {
        const entries = await db('users')
            .where('id', '=', id)
            .increment('entries', faceCount) // Use faceCount instead of hardcoded 1
            .returning('entries'); // returning the updated entries count
        
        if (entries.length) {
            res.json(entries[0].entries);
        } else {
            res.status(400).json('user not found');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json('unable to get entries');
    }
});

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000');
});

