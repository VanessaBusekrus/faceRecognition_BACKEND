// User authentication - validates email and password, returns user data if successful
const handleSignin = async (req, res, db, bcrypt) => {
    const { email, password } = req.body;

    try {
      // Query the login table to find the email and retrieve its hashed password
      const loginData = await db('login')
        .select('email', 'hash')
        .where({ email });
  
      // loginData is an array of objects. Each object (row) in loginData contains the columns that were selected in the query
      // Check if user exists and password is valid - both boolean values
      const userExists = loginData.length > 0;
      const isValid = userExists && await bcrypt.compare(password, loginData[0].hash); // If userExists is false, isValid will be false without calling bcrypt.compare
  
      if (!userExists || !isValid) {
        // Single generic message for both cases. 401 = Unauthorized (authentication failed)
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Fetch user info (we know user exists and password is correct), hence we select all columns from users table
      // user is an array of user objects (should contain only one object since emails are unique)
      const user = await db('users').select('*').where({ email });
    
      if (user.length) {
        return res.json(user[0]); // Send the first (and only) user object as JSON response to the frontend
      } else {
        // Credentials valid, but user row missing
        return res.status(500).json({ message: 'Authentication error' });
      }
      
    } catch (err) {
      console.error(err);
      // 500 = Internal Server Error - something went wrong on the server side
      return res.status(500).json({ message: 'Server error' });
    }
};

export { handleSignin };