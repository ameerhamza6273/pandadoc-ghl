const axios = require("axios");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const payload = JSON.parse(event.body);
    const events = Array.isArray(payload) ? payload : [payload];

    for (const item of events) {
      console.log("📩 Incoming item:", JSON.stringify(item, null, 2));

      // Updated event name to match PandaDoc
      if (item.event !== "document_state_changed") {
        console.log("⚠️ Ignored event:", item.event);
        continue;
      }

      const docData = item.data;
      const status = docData.status.replace("document.", ""); // e.g., "document.declined" → "declined"

      if (status !== "completed" && status !== "declined") {
        console.log("⚠️ Ignored status:", status);
        continue;
      }

      const recipient = docData.recipients?.[0];
      if (!recipient) {
        console.log("❌ No recipient found");
        continue;
      }

      const contactData = {
        firstName: recipient.first_name,
        lastName: recipient.last_name,
        email: recipient.email,
        tags: [`PandaDoc ${status}`],
      };

      console.log("📦 Sending to GHL:", contactData);

      try {
        const ghlResponse = await axios.post(
          "https://rest.gohighlevel.com/v1/contacts/",
          contactData,
          {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImZ1WVlUVllYWWdSTGhPSGVXOHhYIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU3NTM1NTkyNzEyLCJzdWIiOiJadHNSRTlIbVRTdTNWMzExRlBaNCJ9.QA9KqtcEXIFLaDvuQoE49J6nB1zWHpjtLdgFugmoBhY`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ GHL Response:", ghlResponse.data);
      } catch (error) {
        console.error("❌ GHL Error:", error.response?.data || error.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook processed successfully" }),
    };
  } catch (error) {
    console.error("🔥 Server Error:", error.response?.data || error.message);
    return { statusCode: 500, body: "Server error" };
  }
};
