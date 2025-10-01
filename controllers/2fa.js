// helper functions to update a user dynamically based on provided fields
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
    const secret = speakeasy.generateSecret({
      name: `Smart Brain - Face Detection (${user.email})`,
      issuer: 'Smart Brain - Face Detection App',
      length: 20
    });

    // Store temporary secret in database (not enabled yet)
    await updateUser(db, userId, { 
      temp_two_factor_secret: secret.base32 // Store temporarily until verified
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

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
    const verified = speakeasy.totp.verify({
      secret: user.temp_two_factor_secret,
      encoding: 'base32', // Specify encoding of the secret
      token: String(token), // Ensure token is a string
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (verified) {
      // Move temp secret to permanent and enable 2FA
      await updateUser(db, userId, {
        two_factor_secret: user.temp_two_factor_secret, // ‼️ Move temp secret to permanent - WHY?
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
      secret: user.two_factor_secret,
      encoding: 'base32', // Specify encoding of the secret
      token: String(code), // Ensure code is a string
      window: 2
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


// Note: Helper functions like getUserById, authenticateUser, and verifyPassword are assumed to be defined elsewhere in your codebase.