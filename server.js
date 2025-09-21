// Since I am using ES modules, I need to add the modeule type to the package.json file
import express from 'express';
import bodyParser from 'body-parser'; // To parse the incoming request bodies in a middleware before your handlers, available under the req.body property.
import bcrypt from "bcryptjs"; // (ESM)
import cors from 'cors'; // To allow cross-origin requests
import knex from 'knex'; // To connect to the database

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

// db.select('*').from('users').then(data => {
// 	console.log(data);
// });

const app = express();
app.use(bodyParser.json()); // To parse JSON bodies
app.use(cors()); // To allow cross-origin requests

app.get('/', async (req, res) => {
	try {
	  // You can return any JSON object; here we include a status message
	  res.status(200).json({ status: 'success', message: 'Backend is working!' });
	} catch (err) {
	  console.error(err);
	  res.status(500).json({ status: 'error', message: 'Something went wrong' });
	}
  });
  

app.post('/signin', async (req, res) => {
	const { email, password } = req.body;
  
	try {
	  // Get the login hash for the given email
	  const loginData = await db('login')
		.select('email', 'hash')
		.where({ email });
  
	  if (loginData.length === 0) {
		return res.status(400).json('wrong credentials');
	  }
  
	  const isValid = await bcrypt.compare(password, loginData[0].hash);
  
	  if (isValid) {
		// Fetch user info
		const user = await db('users').select('*').where({ email });
  
		if (user.length) {
		  return res.json(user[0]);
		} else {
		  return res.status(400).json('unable to get user');
		}
	  } else {
		return res.status(400).json('wrong credentials');
	  }
  
	} catch (err) {
	  console.error(err);
	  return res.status(500).json('internal server error');
	}
  });
  

app.post('/register', async (req, res) => {
	const saltRounds = 10; // this will iterate 2^10 times (1024 times)
  
	try {
	  const { email, name, password } = req.body;
  	  const hash = await bcrypt.hash(password, saltRounds); // hashing the password with a salt round of 10, hence the cost factor
  
	  // Start a transaction
	  const newUser = await db.transaction(async trx => {
		// Insert into login table
		await trx('login')
		  .insert({
			hash: hash,
			email: email
		  })
		  .returning('email');
  
		// Insert into users table
		const insertedUser = await trx('users')
		  .insert({
			email: email,
			name: name,
			joined: new Date()
		  })
		  .returning('*'); // returns an array
  
		return insertedUser[0]; // return the newly created user object
	  });
  
	  res.json(newUser); // send the new user as response
  
	} catch (err) {
	  console.error(err);
	  res.status(400).json('unable to register');
	}
});
  

app.get('/profile/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const user = await db('users').where({ id }).select('*');

		if (user.length) { // check if user array is not empty
		res.json(user[0]); // return the first matching user
		} else {
		res.status(400).json('not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).json('error getting user');
	}
});

app.put('/image', async (req, res) => {
	const { id } = req.body; // destructuring the req.params object

	try {
		const entries = await db('users')
			.where('id', '=', id)
			.increment('entries', 1)
			.returning('entries'); // returning the updated entries count
		
		if (entries.length) {
			res.json(entries[0].entries);
		} else {
			res.status(400).json('not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).json('unable to get entries');
	}
});

app.put('/image', (req, res) => {
	const { id } = req.body; // destructuring the req.params object
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0].entries);
	})
	.catch(err => res.status(400).json('unable to get entries'));
});

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000');
});

/*
Different routes/endpoints for the API:
/ res = this is working // root endpoint
/signIn => POST => success/fail // Everytime we enter the password, we want to send it inside of the body, ideally over HTTPS, so it is hidden
/register => POST => user
/profile/:userId => GET => user
/image => PUT => user (count) // PUT because we are updating the data
*/