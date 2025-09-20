// Since I am using ES modules, I need to add the modeule type to the package.json file
import express from 'express';
import bodyParser from 'body-parser'; // To parse the incoming request bodies in a middleware before your handlers, available under the req.body property.
import bcrypt from "bcryptjs"; // (ESM)
import cors from 'cors'; // To allow cross-origin requests

const app = express();
app.use(bodyParser.json()); // To parse JSON bodies
app.use(cors()); // To allow cross-origin requests

const database = {
	users: [
		{
			id: '123',
			name: 'John',
			password: 'cookies', // In a real application, never store passwords in plain text
			email: 'john@gmail.com',
			entries: 0,
			joined: new Date()
		},
		{
			id: '124',
			name: 'sally',
			password: 'bananas',
			email: 'sally@gmail.com',
			entries: 0,
			joined: new Date()
		}
	],
	login: [
		{
			id: '987',
			hash: '',
			email: 'john@gmail.com'
		}
	]
}

app.get('/', (req, res) => {
	  res.send(database.users);
});

app.post('/signin', (req, res) => {
	// bcrypt.compare("apple", "$2b$10$Og6GAkN0F3OfWUgIRjkeUedGaj89MqSxYt/BU6O1lqUuaXf3pOyO6", function(err, res) {
	// 	console.log('first guess',res);
	// }); 
	// bcrypt.compare("pears", "$2b$10$Og6GAkN0F3OfWUgIRjkeUedGaj89MqSxYt/BU6O1lqUuaXf3pOyO6", function(err, res) {
	// 	console.log('second guess',res);
	// }); 
	if (req.body.email === database.users[0].email &&
		req.body.password === database.users[0].password) {
		res.json(database.users[0]);
	} else {
		res.status(400).json('error logging in');
	}
});

app.post('/register', async (req, res) => {
	// const saltRounds = 10; // this will iterate 2^10 times (1024 times)
	
	try {
		const { email, name } = req.body; // destructuring the req.body object
		// const hash = await bcrypt.hash(password, saltRounds); // hashing the password with a salt round of 10, hence the cost factor
  
		database.users.push({
			id: '125',
			name,
			email,
			entries: 0,
			joined: new Date()
	  });
  
	  res.json(database.users[database.users.length - 1]);
	} catch (err) {
	  res.status(500).json('Hashing failed');
	}
  });
  

app.get('/profile/:id', (req, res) => {
	const { id } = req.params; // destructuring the req.params object
	let found = false;
	database.users.forEach(user => {
		if (user.id === id) {
			found = true;
			return res.json(user);
		}
	})
	if (!found) {
		res.status(400).json('not found');
	}
});

app.put('/image', (req, res) => {
	const { id } = req.body; // destructuring the req.params object
	let found = false;
	database.users.forEach(user => {
		if (user.id === id) {
			found = true;
			user.entries++;
			return res.json(user.entries);
		}
	})
	if (!found) {
		res.status(400).json('not found');
	}
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