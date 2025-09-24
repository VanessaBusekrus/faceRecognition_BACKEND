// Update face detection count - increments the entries counter when faces are detected
const handleImage = async (req, res, db) => {
    const { id, faceCount = 1 } = req.body; // Extract both id and faceCount (default to 1)

    try {
        const entries = await db('users')
            .where('id', '=', id)
            .increment('entries', faceCount) // Use faceCount instead of hardcoded 1
            .returning('entries'); // returning the updated entries count
        
        if (entries.length) {
            res.json(entries[0].entries);
        } else {
            res.status(400).json('user not found');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json('unable to get entries');
    }
};

export { handleImage };