// netlify/functions/pandadoc.js
const axios = require("axios");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    const payload = JSON.parse(event.body);

    if (payload.event !== "document.state.changed") {
      return {
        statusCode: 200,
        body: "Ignored event",
      };
    }

    const docData = payload.data;
    const status = docData.status;

    if (status !== "completed" && status !== "declined") {
      return {
        statusCode: 200,
        body: "Ignored status",
      };
    }

    const recipient = docData.recipients[0];
    if (!recipient) {
      return {
        statusCode: 400,
        body: "No recipient found",
      };
    }

    const contactData = {
      firstName: recipient.first_name,
      lastName: recipient.last_name,
      email: recipient.email,
      tags: [`PandaDoc ${status}`],
    };

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

    console.log("GHL Response:", ghlResponse.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: "Server error",
    };
  }
};
