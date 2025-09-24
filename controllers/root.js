// Health check endpoint - confirms the server is running. This is the root endpoint, hence '/'
const handleRoot = async (req, res) => {
    try {
        // You can return any JSON object. In this case, a status message is included
        res.status(200).json({ status: 'success', message: 'Backend is working!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
};

export { handleRoot };