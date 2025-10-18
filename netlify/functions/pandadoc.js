// pandadoc.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// ---------------------------
// ⚠️ Replace with your GHL API key
const GHL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImZ1WVlUVllYWWdSTGhPSGVXOHhYIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU3NTM1NTkyNzEyLCJzdWIiOiJadHNSRTlIbVRTdTNWMzExRlBaNCJ9.QA9KqtcEXIFLaDvuQoE49J6nB1zWHpjtLdgFugmoBhY';
// ---------------------------

app.post('/pandadoc-webhook', async (req, res) => {
    try {
        const payload = req.body;

        // Ensure we only handle document state changes
        if (payload.event !== 'document.state.changed') {
            return res.status(200).send('Ignored event');
        }

        const docData = payload.data;
        const status = docData.status; // 'completed' or 'declined'

        // Only handle completed or declined documents
        if (status !== 'completed' && status !== 'declined') {
            return res.status(200).send('Ignored status');
        }

        // Take first recipient (can loop if multiple)
        const recipient = docData.recipients[0];
        if (!recipient) {
            return res.status(400).send('No recipient found');
        }

        const contactData = {
            firstName: recipient.first_name,
            lastName: recipient.last_name,
            email: recipient.email,
            tags: [`PandaDoc ${status}`]
        };

        // Send to GoHighLevel
        const response = await axios.post(
            'https://rest.gohighlevel.com/v1/contacts/',
            contactData,
            {
                headers: {
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImZ1WVlUVllYWWdSTGhPSGVXOHhYIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU3NTM1NTkyNzEyLCJzdWIiOiJadHNSRTlIbVRTdTNWMzExRlBaNCJ9.QA9KqtcEXIFLaDvuQoE49J6nB1zWHpjtLdgFugmoBhY`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('GHL Response:', response.data);

        // Return success to PandaDoc
        res.status(200).send('Webhook processed successfully');

    } catch (error) {
        console.error('Error processing webhook:', error.response?.data || error.message);
        res.status(500).send('Server error');
    }
});

// Start server locally (for testing)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
