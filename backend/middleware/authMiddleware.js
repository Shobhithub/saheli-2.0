import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_SAHELI);
            req.user = await User.findById(decoded.userId).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // For development/demo, we might want to allow permissive access if no token
        // But strict implementation:
        // res.status(401).json({ message: 'Not authorized, no token' });

        // Temporarily, let's just next() with a warning if we want soft fail, or error.
        // Given the user is claiming "buttons not working", we don't want auth errors to block basic testing if they aren't logged in.
        // However, I see `verify_interactivity` test didn't log in explicitly in the browser session.
        // So I should make `protect` soft or ensure `createSOS` handles missing `req.user`.
        // My `createSOS` does: `const userId = req.user ? req.user._id : (req.body.userId || ...)`
        // So `protect` logic is actually needed to populate `req.user`.

        // If I enforce auth here, my test (which doesn't login) will fail with 401.
        // I will make `protect` optional for now or just log failure but continue (for demo purposes).
        // Or better, just return 401 and I should fix my test to login or rely on the fallback in controller if I remove `protect` from route.

        // In `sosRoutes.js`, I imported `protect` but didn't use it in `router.post('/create', createSOS)`.
        // Wait, did I use it?
        // Let's check `sosRoutes.js` again.

        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
