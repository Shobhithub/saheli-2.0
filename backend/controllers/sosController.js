import SOSAlert from '../models/SOSAlert.js';
import User from '../models/User.js';
import { sendSOSToEmergencyContacts } from '../utils/whatsappService.js';

// @desc    Trigger a new SOS alert
// @route   POST /api/sos/create
// @access  Private
export const createSOS = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        // In a real app, we get userId from auth middleware (req.user.id)
        // For now, we'll assume the client sends userId or we default to a test user if not authenticated
        // But since we want "proper" functionality, let's verify if we have auth middleware working.
        // The authController sets a cookie. We need a middleware to read it.
        // For this iteration, let's allow passing userId in body for simplicity if middleware isn't ready.

        let user;
        if (req.user) {
            user = req.user;
        } else if (req.body.userId) {
            user = await User.findById(req.body.userId);
        }

        // Fallback for demo: find by email
        if (!user) {
            user = await User.findOne({ email: 'shreya@example.com' });
        }

        if (!user) {
            // Create a temporary user if even the demo user is missing? 
            // Better to return 404 but log it clearly.
            console.log('User not found for SOS. ID:', req.body.userId);
            return res.status(404).json({ message: 'User not found' });
        }

        const newAlert = await SOSAlert.create({
            victimId: user._id,
            victimName: user.fullName || user.username || 'Unknown', // Handle different schema field names
            victimPhone: user.phone || 'Unknown',
            location: { latitude, longitude },
            status: 'ACTIVE'
        });

        // Emit Socket.io event for real-time updates to Police/Community
        if (req.io) {
            req.io.emit('new_sos_alert', newAlert);
            console.log('Socket event new_sos_alert emitted');
        }

        // Send WhatsApp SOS to emergency contacts
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            console.log('Sending WhatsApp SOS to emergency contacts...');
            const whatsappResults = await sendSOSToEmergencyContacts(
                user.emergencyContacts,
                { name: user.fullName || user.username || 'Unknown', phone: user.phone || '' },
                { latitude, longitude }
            );
            console.log('WhatsApp SOS results:', whatsappResults);
        } else {
            console.log('No emergency contacts configured for WhatsApp SOS');
        }

        res.status(201).json(newAlert);
    } catch (error) {
        console.error('Error creating SOS:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all active SOS alerts
// @route   GET /api/sos/active
// @access  Public (or Police only)
export const getActiveSOS = async (req, res) => {
    try {
        const alerts = await SOSAlert.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resolve an SOS alert
// @route   PUT /api/sos/:id/resolve
// @access  Police only
export const resolveSOS = async (req, res) => {
    try {
        const alert = await SOSAlert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        if (alert.status === 'RESOLVED') {
            return res.status(400).json({ message: 'Alert is already resolved' });
        }

        alert.status = 'RESOLVED';
        alert.resolvedAt = new Date();
        await alert.save();

        // Emit Socket.io event for real-time updates
        if (req.io) {
            req.io.emit('sos_resolved', { id: alert._id });
            console.log('Socket event sos_resolved emitted');
        }

        res.json(alert);
    } catch (error) {
        console.error('Error resolving SOS:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
