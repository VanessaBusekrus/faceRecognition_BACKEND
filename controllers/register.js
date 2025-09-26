// User registration - creates a new user account with email, name, and hashed password
const handleRegister = async (req, res, db, bcrypt) => {
    const saltRounds = 10; // How many times bcrypt will scramble the password - higher = more secure but slower

    // Password validation function
    const validatePassword = (password) => {
        const rules = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const errors = [];
        if (!rules.minLength) errors.push('at least 8 characters');
        if (!rules.hasUppercase) errors.push('at least one uppercase letter');
        if (!rules.hasLowercase) errors.push('at least one lowercase letter');
        if (!rules.hasNumber) errors.push('at least one number');
        if (!rules.hasSpecialChar) errors.push('at least one special character (!@#$%^&*(),.?":{}|<>)');

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };

    try {
    const { email, name, password } = req.body;

    // Basic validation if user filled in all fields
    if (!email || !name || !password) {
        return res.status(400).json({ message: 'Registration failed. Please check your information' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ 
            message: 'Password must contain ' + passwordValidation.errors.join(', '),
            passwordRequirements: {
                minLength: 'at least 8 characters',
                uppercase: 'at least one uppercase letter (A-Z)',
                lowercase: 'at least one lowercase letter (a-z)',
                number: 'at least one number (0-9)',
                specialChar: 'at least one special character (!@#$%^&*(),.?":{}|<>)'
            }
        });
    }

    const hash = await bcrypt.hash(password, saltRounds);

    // Start a transaction
    const newUser = await db.transaction(async trx => {
        // Insert into login table
        await trx('login').insert({ hash, email });

        // Insert into users table
        const insertedUsers = await trx('users')
        .insert({
            email,
            name,
            entries: 0,
            joined: new Date()
        })
        .returning('*');

        return insertedUsers[0]; // Return first (and only) user
    });

    res.json(newUser);

    } catch (err) {
    console.error('Registration error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint
    });
    
    // Check if it's a unique constraint violation (duplicate email). 23505 is the PostgreSQL error code for unique violations.
    const isDuplicateEmail = err.code === '23505';
    
    if (isDuplicateEmail) {
        // User tried to register with an email that already exists. 400 = Bad Request (client error - user sent invalid data)
        return res.status(400).json({ message: 'Registration failed. Please check your information' });
    } else if (err.code === '42P01') {
        // Table does not exist error
        console.error('Database table does not exist:', err.message);
        return res.status(500).json({ message: 'Database configuration error' });
    } else {
        // Some other database or server error occurred. 500 = Internal Server Error
        return res.status(500).json({ message: 'Registration failed. Please try again later' });
    }
    }
};

export { handleRegister };
