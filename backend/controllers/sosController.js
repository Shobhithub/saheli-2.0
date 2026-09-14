import SOSAlert from '../models/SOSAlert.js';
import User from '../models/User.js';
import { sendSOSToEmergencyContacts } from '../utils/whatsappService.js';

export const createSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const victimName = user.fullName || 'Unknown';
    const victimPhone = user.phone || '';

    const newAlert = await SOSAlert.create({
      victimId: user._id,
      victimName,
      victimPhone,
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      status: 'ACTIVE',
    });

    // Socket update
    req.io?.emit('new_sos_alert', newAlert);

    // WhatsApp
    let whatsappResults = [];
    try {
      const contacts = user.emergencyContacts || [];
      if (contacts.length > 0) {
        whatsappResults = await sendSOSToEmergencyContacts(
          contacts,
          { name: victimName, phone: victimPhone },
          { latitude: Number(latitude), longitude: Number(longitude) }
        );
      } else {
        console.log('No emergency contacts found for user:', user._id.toString());
      }
    } catch (e) {
      console.error('WhatsApp sending failed (SOS still created):', e);
    }

    return res.status(201).json({
      alert: newAlert,
      whatsappSent: whatsappResults.filter(r => r.success).length,
      whatsappResults,
    });
  } catch (error) {
    console.error('Error creating SOS:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const getActiveSOS = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const resolveSOS = async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (alert.status === 'RESOLVED') {
      return res.status(400).json({ message: 'Alert is already resolved' });
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    await alert.save();

    req.io?.emit('sos_resolved', { id: alert._id });

    res.json(alert);
  } catch (error) {
    console.error('Error resolving SOS:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};