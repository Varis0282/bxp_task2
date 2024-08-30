const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 4000;
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Load credentials from a file
app.use(cors());
app.use(express.json());
const credentials = JSON.parse(fs.readFileSync('cred.json'));

// Extract the necessary credentials
const { client_id, client_secret, redirect_uris } = credentials.installed;
const redirectUri = redirect_uris[0];

// Create an OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
);;

// Set up the authorization URL
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});


app.get('/auth', (req, res) => {
    res.json({ success: true, error: false, type: 'success', data: authUrl });
});

// api to check authorized or not
app.get('/authorized', (req, res) => {
    if (oAuth2Client.credentials.access_token) {
        res.json({ success: true, error: false, type: 'success', data: true });
    } else {
        res.json({ success: true, error: false, type: 'success', data: false });
    }
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        res.send('<h1>Authentication Success ! Please close the window</h1>');
    } catch (err) {
        console.error('Error retrieving access token', err);
        res.send('<h1>Authentication Failure ! Please close the window</h1>');
    }
});

app.get('/emails', async (req, res) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: '-from:me',
        });

        const messages = response.data.messages || [];
        const emailDetails = await Promise.all(
            messages.map(async (message) => {
                const msgResponse = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                });
                const headers = msgResponse.data.payload.headers;
                const subject = headers.find((header) => header.name === 'Subject').value;
                const from = headers.find((header) => header.name === 'From').value;
                return { from, subject };
            })
        );

        res.json({ success: true, error: false, type: 'success', data: emailDetails });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
