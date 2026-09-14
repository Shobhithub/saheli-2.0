import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Normalise emails so 'Police1@Gmail.com ' and 'police1@gmail.com' are the
// same account on both register and login.
const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

// Distinguishes "wrong password" (401) from "database unreachable" (503) so the
// request always gets a response instead of hanging until the client times out.
const handleServerError = (res, error, context) => {
    console.error(`${context}:`, error);

    const isDbDown =
        error.name === 'MongooseError' ||          // buffering timed out
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoServerSelectionError';

    if (isDbDown) {
        return res.status(503).json({
            message: 'Database unavailable. Please make sure MongoDB is running.',
        });
    }

    return res.status(500).json({ message: 'Server error. Please try again.' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { password } = req.body;
        const email = normaliseEmail(req.body.email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            generateToken(res, user._id);

            return res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                emergencyContacts: user.emergencyContacts || [],
            });
        }

        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        return handleServerError(res, error, 'Login failed');
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { fullName, password, phone } = req.body;
        const email = normaliseEmail(req.body.email);

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                message: 'Full name, email, phone and password are required',
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Role is deliberately NOT taken from the request body: accepting it
        // would let anyone self-register as 'police' and reach the police
        // dashboard. Privileged accounts are created by the seeder only.
        const user = await User.create({
            fullName,
            email,
            password,
            phone,
            role: 'user',
        });

        generateToken(res, user._id);

        return res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
        });
    } catch (error) {
        return handleServerError(res, error, 'Registration failed');
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Update emergency contacts
// @route   PUT /api/auth/emergency-contacts
// @access  Private
const updateEmergencyContacts = async (req, res) => {
    try {
        const { userId, contacts } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!Array.isArray(contacts)) {
            return res.status(400).json({ message: 'contacts must be an array' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.emergencyContacts = contacts.map(c => ({
            name: c.name,
            phone: c.phone,
            relation: c.relation || ''
        }));

        await user.save();

        res.json({
            message: 'Emergency contacts updated',
            emergencyContacts: user.emergencyContacts
        });
    } catch (error) {
        return handleServerError(res, error, 'Error updating emergency contacts');
    }
};

export {
    loginUser,
    registerUser,
    logoutUser,
    updateEmergencyContacts,
};
