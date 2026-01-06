import fetch from 'node-fetch';

/**
 * Send WhatsApp message using Facebook Cloud API
 * @param {string} recipientPhone - Phone number with country code (e.g., "919876543210")
 * @param {string} message - Message text to send
 * @returns {Promise<object>} API response
 */
export const sendWhatsAppMessage = async (recipientPhone, message) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
        console.error('WhatsApp credentials not configured');
        return { success: false, error: 'WhatsApp not configured' };
    }

    // Clean phone number - remove spaces, dashes, plus sign
    const cleanPhone = recipientPhone.replace(/[\s\-\+]/g, '');

    // Ensure it has country code (assume India +91 if not)
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone :
        cleanPhone.startsWith('0') ? '91' + cleanPhone.slice(1) :
            '91' + cleanPhone;

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
                type: 'text',
                text: {
                    preview_url: true,
                    body: message
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ WhatsApp message sent to ${formattedPhone}`);
            return { success: true, data };
        } else {
            console.error(`❌ WhatsApp API error:`, data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send SOS alert to multiple emergency contacts
 * @param {Array} contacts - Array of {name, phone} objects
 * @param {object} victim - Victim info {name, phone}
 * @param {object} location - {latitude, longitude}
 */
export const sendSOSToEmergencyContacts = async (contacts, victim, location) => {
    const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    const message = `🚨 *SOS ALERT* 🚨

*${victim.name}* has triggered an emergency alert!

📍 *Location:* ${mapsLink}
📞 *Contact:* ${victim.phone}

⚠️ Please check on them immediately!

_This is an automated message from Saheli Safety App_`;

    const results = [];

    for (const contact of contacts) {
        if (contact.phone) {
            const result = await sendWhatsAppMessage(contact.phone, message);
            results.push({ contact: contact.name, ...result });
        }
    }

    return results;
};
