const axios = require('axios');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

const fetchGoogleSearchEvents = async (companyName) => {
  try {
    const query = `site:linkedin.com OR site:eventbrite.com "${companyName} events"`;
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        num: 10
      }
    });

    return response.data.items.map(item => item.link);
  } catch (err) {
    console.warn('Google Search API error:', err.message);
    return [];
  }
};

