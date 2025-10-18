const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const GHL_API_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImZ1WVlUVllYWWdSTGhPSGVXOHhYIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU3NTM1NTkyNzEyLCJzdWIiOiJadHNSRTlIbVRTdTNWMzExRlBaNCJ9.QA9KqtcEXIFLaDvuQoE49J6nB1zWHpjtLdgFugmoBhY; // Netlify env variable

app.post('/pandadoc-webhook', async (req, res) => {
    try {
        const payload = req.body;

        if(payload.event !== 'document.state.changed') return res.status(200).send('Ignored');

        const docData = payload.data;
        const status = docData.status; // completed / declined

        if(status !== 'completed' && status !== 'declined') return res.status(200).send('Ignored');

        const recipient = docData.recipients[0];
        const contactData = {
            firstName: recipient.first_name,
            lastName: recipient.last_name,
            email: recipient.email,
            tags: [`PandaDoc ${status}`]
        };

        const response = await axios.post(
            'https://rest.gohighlevel.com/v1/contacts/',
            contactData,
            {
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('GHL Response:', response.data);
        res.status(200).send('Webhook processed');

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send('Server error');
    }
});

// For Netlify serverless functions
module.exports = app;
