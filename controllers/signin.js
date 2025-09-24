// User authentication - validates email and password, returns user data if successful
const handleSignin = async (req, res, db, bcrypt) => {
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
};

export { handleSignin };