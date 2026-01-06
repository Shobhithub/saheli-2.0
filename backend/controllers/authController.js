import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id);

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            emergencyContacts: user.emergencyContacts || [],
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { fullName, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        fullName,
        email,
        password,
        phone,
        role: role || 'user'
    });

    if (user) {
        generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
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
        console.error('Error updating emergency contacts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export {
    loginUser,
    registerUser,
    logoutUser,
    updateEmergencyContacts,
};
