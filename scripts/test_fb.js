const axios = require('axios');
// require('dotenv').config({ path: '../.env.local' });

const API_KEY = process.env.SERPAPI_KEY || 'ecdede96e555ae031fe4521998ec1dcca7957c1992cec85bffce38dc277e4133';

async function testFlow() {
    try {
        // 1. Search for a business on Google Maps
        console.log('Searching Google Maps...');
        // A query likely to have a Facebook page as website or in links
        const mapsResponse = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_maps',
                q: 'Gym in Monterrey',
                api_key: API_KEY,
                type: 'search'
            }
        });

        const place = mapsResponse.data.local_results?.[0];
        if (!place) {
            console.log('No place found');
            return;
        }

        console.log('Place Name:', place.title);
        console.log('Website:', place.website);
        console.log('Links:', place.links ? JSON.stringify(place.links, null, 2) : 'None');
        console.log('Extensions:', place.extensions ? JSON.stringify(place.extensions, null, 2) : 'None');
        console.log('Place ID:', place.place_id);

        // 2. Extract Facebook ID
        let facebookUrl = '';
        if (place.website && place.website.includes('facebook.com')) {
            facebookUrl = place.website;
        } else if (place.links) {
            const fbLink = place.links.find(l => l.link.includes('facebook.com'));
            if (fbLink) facebookUrl = fbLink.link;
        }

        if (!facebookUrl) {
            console.log('No Facebook URL found directly. Trying explicit query...');
            // Fallback: This is what we might verify later
            return;
        }

        console.log('Found Facebook URL:', facebookUrl);

        // Extract ID (basic regex)
        const match = facebookUrl.match(/facebook\.com\/([^\/\?]+)/);
        const profileId = match ? match[1] : null;

        if (!profileId) {
            console.log('Could not extract Profile ID');
            return;
        }

        console.log('Extracted Profile ID:', profileId);

        // 3. Call Facebook Profile API
        console.log('Calling Facebook Profile API...');
        const fbResponse = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'facebook_profile',
                profile_id: profileId,
                api_key: API_KEY
            }
        });

        console.log('Facebook Data:', JSON.stringify(fbResponse.data.profile_results, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testFlow();
