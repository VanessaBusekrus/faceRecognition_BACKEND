// Get user profile - retrieves user information by ID
const handleProfileGet = async (req, res, db) => {
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
};

export { handleProfileGet };