// User registration - creates a new user account with email, name, and hashed password
const handleRegister = async (req, res, db, bcrypt) => {
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
};

export { handleRegister };
