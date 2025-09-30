// User registration - creates a new user account with email, name, and hashed password
const handleRegister = async (req, res, db, bcrypt) => {
    const saltRounds = 10; // How many times bcrypt will scramble the password - higher = more secure but slower

    // Password validation function
    const validatePassword = (password) => {
        // rules is an object where each property is a validation rule
        const rules = {
            minLength: password.length >= 8,
            // /pattern/.test(string) to check if string matches the pattern. The pattern is a regular expression. The test() method returns a boolean.
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const errors = [];
        // with every error message a new string gets pushed to the errors array
        if (!rules.minLength) errors.push('at least 8 characters');
        if (!rules.hasUppercase) errors.push('at least one uppercase letter');
        if (!rules.hasLowercase) errors.push('at least one lowercase letter');
        if (!rules.hasNumber) errors.push('at least one number');
        if (!rules.hasSpecialChar) errors.push('at least one special character (!@#$%^&*(),.?":{}|<>)');

        // Returning an object with isValid boolean and errors array
        return {
            // isValid is based on the length of the errors array
            isValid: errors.length === 0,
            // the property 'errors' holds the array of error messages
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
                // message and passwordRequirements are properties of the JSON object being sent in the response
                
                // passwordValidation.errors is expected to be an array of strings, each describing a password rule that was not met (e.g., "a number", "an uppercase letter").
                // .join(', ') combines all elements of the array into a single string, separated by commas and spaces.
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

        // trx = database transaction object provided by Knex.js
        const newUser = await db.transaction(async trx => {
            // Insert into 'login' table
            await trx('login').insert({ hash, email });

            // Insert into 'users' table
            const insertedUsers = await trx('users')
            .insert({
                email,
                name,
                entries: 0,
                joined: new Date()
            })
            .returning('*'); // returning('*') returns all columns of the newly inserted rows, hence all data of the new user

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
