const express = require('express');
const app = express();
const port = 3000;

require('dotenv').config();

app.use(express.json());

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const LIST_ID = process.env.LIST_ID;

const createProfile = async (data) => {
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            revision: '2024-07-15',
            'content-type': 'application/json',
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`
        },
        body: JSON.stringify({
            data: {
                type: 'profile',
                attributes: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    properties: { 'Retail Shopper': 'true' }
                }
            }
        })
    };

    try {
        const response = await fetch(`https://a.klaviyo.com/api/profile-import/`, options);

        if (response.ok) {
            const jsonResponse = await response.json();
            return jsonResponse.data.id;
        }

    } catch (error) {
        console.error('Error creating profile:', error);
    }
};

const addToList = async (profileId) => {
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            revision: '2024-07-15',
            'content-type': 'application/json',
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`
        },
        body: JSON.stringify({
            data: [
                {
                    type: 'profile',
                    id: profileId
                }
            ]
        })
    };

    try {
        const response = await fetch(`https://a.klaviyo.com/api/lists/${LIST_ID}/relationships/profiles/`, options);
        if (response.ok) {
            return response;
        }
    } catch (error) {
        console.error('Error adding profile to list:', error);
    }
};

app.post('/api/profile/add', async (req, res) => {
    try {
        const profileId = await createProfile(req.body);

        if (profileId) {
            const response = await addToList(profileId);

            if (response.ok) {
                res.status(201).json({ message: 'Profile created and added to list successfully', profileId });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create profile or add to list', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
