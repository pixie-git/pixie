export class LoginController {
    static async login(req, res) {
        try {
            const { username } = req.body;

            if (!username || username.trim().length === 0) {
                return res.status(400).json({ error: 'Username is required' });
            }

            // Mock logic: simply echo back the user
            // In a real app with DB: 
            // let user = await User.findOne({ username });
            // if (!user) user = await User.create({ username });

            return res.status(200).json({
                username: username,
                id: Date.now(),
                token: 'mock-server-jwt-token'
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
