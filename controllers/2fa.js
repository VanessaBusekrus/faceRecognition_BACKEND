// helper functions to update a user dynamically based on provided fields
// 'updates' is an object with key-value pairs representing the columns to be updated and their new values
const updateUser = async (db, userId, updates) => {
  try {
    // db('users').where({ id }).update(updates).returning('*') is Knex syntax
    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update(updates)
      .returning('*'); // Returns updated row(s) as an array

    return updatedUser; // single user object
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};

// Helper function to get a user by ID
const getUserById = async (db, userId) => {
  try {
    const user = await db('users').where({ id: userId }).first();
    return user; // returns undefined if not found
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    throw err;
  }
};


// 1. Enable 2FA - Generate QR Code
const handleEnable2FA = async (req, res, db, speakeasy, QRCode) => {
  try {
    const { userId } = req.body;
    
    // Get user from database
    const user = await getUserById(db, userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({ // generate a unique secret for the user that gets encoded with base32
      name: `Smart Brain - Face Detection (${user.email})`, // used in the otpauth:// URL that Speakeasy generates. Shown in the Authenticator app to identify the account
      issuer: 'Smart Brain - Face Detection App', // also used in the otpauth:// URL. This is the name of the app
      length: 20 // specify how long the secret should be. 20 is default - of course the longer the more secure
    });

    // Store temporary secret in database (not enabled yet)
    await updateUser(db, userId, { 
      temp_two_factor_secret: secret.base32 // Store the base32 encoded secret temporarily in the database until user verifies it and enables 2FA
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url); // the unique secret is also encoded in the otpauth_url (a URL format that 2FA apps understand), which is then converted to a QR code

    res.json({
      qrCode: qrCodeUrl,
      manualEntry: secret.base32
    });

  } catch (error) {
    console.error('Error enabling 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Verify 2FA Setup
const handleVerify2FASetup = async (req, res, db, speakeasy) => {
  try {
    const { userId, token } = req.body;

    const user = await getUserById(db, userId);
    if (!user || !user.temp_two_factor_secret) {
      return res.status(400).json({ message: 'No pending 2FA setup found' });
    }
    
    // Verify the token using the temporary secret
    // 1. Takes the secret and decodes it from base32
    // 2. Calculates the TOTP (Time-based One-Time Password) based on the current time and the previous/next 2 steps (because of window: 2)
    // 3. Compares the calculated TOTP with the user-entered token
    // If they match, the token is valid (hence, 'verified' = true)
    const verified = speakeasy.totp.verify({
      secret: user.temp_two_factor_secret,
      encoding: 'base32', // Specify encoding of the secret
      token: String(token), // Ensure token is a string
      window: 2 // Allow 2 time steps (60 seconds) tolerance. Each step = 30 seconds → window of 2 steps = 2 × 30s = 60 seconds in each direction. So the server will accept codes from: 60 seconds ago, current 30-second step and next 60 seconds
    });

    if (verified) {
      // Move temp secret to permanent and enable 2FA
      await updateUser(db, userId, {
        two_factor_secret: user.temp_two_factor_secret,
        two_factor_enabled: true,
        temp_two_factor_secret: null // Clear temporary secret
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }

  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Verify 2FA during sign-in
const handleVerify2FA = async (req, res, db, speakeasy) => {
  try {
    const { userID, code } = req.body;

    // Get user and check if 2FA is enabled
    const user = await getUserById(db, userID);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Verify the 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret, // Use the permanent secret stored in the database
      encoding: 'base32', // Tells speakeasy that the secret is base32 encoded
      token: String(code), // the 6-digit code from the user - String() ensures it's treated as a string
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (verified) {
      // Return user data
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          entries: user.entries,
          joined: user.joined,
          two_factor_enabled: user.two_factor_enabled
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid 2FA code' });
    }

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Database schema updates needed:
/*
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN temp_two_factor_secret VARCHAR(255);
*/

export { handleEnable2FA, handleVerify2FASetup, handleVerify2FA };
