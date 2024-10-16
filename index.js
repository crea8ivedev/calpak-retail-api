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
                attributes: data
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

const subscribeProfile = async (profileId, data) => {
    const profilesData = {
        type: "profile",
        id: profileId,
        attributes: {
            subscriptions: {}
        }
    };

    if (data.email) {
        profilesData.attributes.email = data.email;
        profilesData.attributes.subscriptions.email = {
            marketing: {
                consent: "SUBSCRIBED",
                consented_at: "2023-10-01T12:00:00Z"
            }
        };
    }

    if (data.phone_number) {
        profilesData.attributes.phone_number = data.phone_number;
        profilesData.attributes.subscriptions.sms = {
            marketing: {
                consent: "SUBSCRIBED",
                consented_at: "2023-10-01T12:00:00Z"
            }
        };
    }

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/vnd.api+json',
            revision: '2024-10-15',
            'content-type': 'application/vnd.api+json',
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`
        },
        body: JSON.stringify({
            data: {
                type: "profile-subscription-bulk-create-job",
                attributes: {
                    custom_source: "POS",
                    profiles: {
                        data: [profilesData]
                    },
                    historical_import: true
                },
                relationships: {
                    list: {
                        data: {
                            type: "list",
                            id: LIST_ID
                        }
                    }
                }
            }
        })
    };

    try {
        const response = await fetch(`https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs`, options);
        return response;
    } catch (error) {
        console.error('Error adding profile to list:', error);
    }
};

app.post('/api/profile/add', async (req, res) => {
    try {
        const profileId = await createProfile(req.body);

        if (profileId) {
            const subscribeResponse = await subscribeProfile(profileId, req.body);

            if (subscribeResponse && subscribeResponse.ok) {
                return res.status(201).json({ message: 'Profile created, subscribed, and added to list successfully', profileId });
            } else {
                return res.status(500).json({ message: 'Profile created, but failed to subscribe to marketing', profileId });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create profile or add to list', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
