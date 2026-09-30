import fetch from "node-fetch";

/**
 * Send an approved WhatsApp template message using
 * Meta WhatsApp Cloud API.
 *
 * Template:
 * saheli_sos_alert
 *
 * Template variables:
 * {{1}} = Victim name
 * {{2}} = Google Maps location
 * {{3}} = Victim contact number
 */

export const sendWhatsAppSOSMessage = async (
  recipientPhone,
  victimName,
  locationUrl,
  victimPhone
) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME || "saheli_sos_alert";
  const templateLanguage =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

  // Check WhatsApp configuration
  if (!accessToken || !phoneNumberId) {
    console.error("❌ WhatsApp credentials are not configured");

    return {
      success: false,
      error: "WhatsApp credentials not configured",
    };
  }

  // Validate recipient number
  if (!recipientPhone) {
    return {
      success: false,
      error: "Recipient phone number is required",
    };
  }

  // Clean phone number
  const cleanPhone = String(recipientPhone).replace(/[^\d]/g, "");

  // Format Indian number
  const formattedPhone = cleanPhone.startsWith("91")
    ? cleanPhone
    : cleanPhone.startsWith("0")
      ? `91${cleanPhone.slice(1)}`
      : `91${cleanPhone}`;

  /*
   * IMPORTANT:
   * Keep this API version the same as the version supported
   * by your Meta WhatsApp Cloud API setup.
   *
   * We are currently using v18.0 because that is what
   * your existing WhatsApp service was using.
   */
  const apiVersion = "v18.0";

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const requestBody = {
      messaging_product: "whatsapp",

      recipient_type: "individual",

      to: formattedPhone,

      type: "template",

      template: {
        name: templateName,

        language: {
          code: templateLanguage,
        },

        components: [
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text: String(victimName || "Unknown"),
              },
              {
                type: "text",
                text: String(locationUrl || "Location unavailable"),
              },
              {
                type: "text",
                text: String(victimPhone || "Not available"),
              },
            ],
          },
        ],
      },
    };

    console.log("📱 Sending WhatsApp SOS template...");
    console.log("Recipient:", formattedPhone);
    console.log("Template:", templateName);

    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "❌ WhatsApp API Error:",
        JSON.stringify(data, null, 2)
      );

      return {
        success: false,
        error: data,
      };
    }

    console.log(
      `✅ SOS WhatsApp template sent to ${formattedPhone}`
    );

    console.log("WhatsApp API response:", data);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "❌ WhatsApp request failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};


/**
 * Send SOS alert to all emergency contacts.
 *
 * contacts:
 * [
 *   {
 *     name: "Emergency Contact",
 *     phone: "9876543210"
 *   }
 * ]
 *
 * victim:
 * {
 *   name: "Shobhit Saurabh",
 *   phone: "9876543210"
 * }
 *
 * location:
 * {
 *   latitude: 29.9457,
 *   longitude: 78.1642
 * }
 */
export const sendSOSToEmergencyContacts = async (
  contacts,
  victim,
  location
) => {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    console.log("⚠️ No emergency contacts available");

    return [];
  }

  // Create Google Maps location URL
  const mapsLink =
    `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

  console.log("📍 SOS location:", mapsLink);

  const results = [];

  for (const contact of contacts) {
    if (!contact?.phone) {
      console.log(
        `⚠️ Skipping contact ${contact?.name || "Unknown"}: no phone number`
      );

      continue;
    }

    try {
      const result = await sendWhatsAppSOSMessage(
        contact.phone,
        victim.name,
        mapsLink,
        victim.phone
      );

      results.push({
        contact: contact.name || "Unknown",
        phone: contact.phone,
        ...result,
      });
    } catch (error) {
      console.error(
        `❌ Failed to send SOS to ${contact.phone}:`,
        error.message
      );

      results.push({
        contact: contact.name || "Unknown",
        phone: contact.phone,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};