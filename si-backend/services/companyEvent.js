// services/googleSearchEvents.js
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

// Extract only domain from URL
const extractDomain = (companyUrl) => {
  try {
    return new URL(companyUrl).hostname.replace("www.", "");
  } catch {
    return companyUrl;
  }
};

// Try to extract a date from title/snippet
const extractEventDate = (text) => {
  if (!text) return null;

  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];

  const patterns = [
    /\b(20\d{2})\b/i,                                            // Year only
    new RegExp(`(${months.join("|")})\\s*\\d{1,2},?\\s*(20\\d{2})`, 'i'), // Month Day, Year
    new RegExp(`(${months.join("|")})\\s*(20\\d{2})`, 'i'),       // Month Year
  ];

  for (let p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
};

// Convert found date → real JS Date
const parseToDate = (rawDate) => {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  return isNaN(d) ? null : d;
};

// Return true only if eventDate is in future
const isUpcoming = (eventDate) => {
  if (!eventDate) return true; // if no date found → assume upcoming
  const now = new Date();
  return eventDate >= now;
};

const fetchCompanyEventUrls = async (companyUrl) => {
  try {
    console.log("🔎 API Key:", GOOGLE_API_KEY ? "OK" : "MISSING");
    console.log("🔎 Search Engine ID:", SEARCH_ENGINE_ID ? "OK" : "MISSING");

    const domain = extractDomain(companyUrl);
    const query = `"${domain}" ("event" OR "conference" OR "summit" OR "expo" OR "launch" OR "webinar") upcoming`;

    console.log("🔍 Query:", query);

    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        num: 10
      }
    });

    if (!response.data.items) {
      console.log("⚠ Google returned no items");
      return [];
    }

    let results = response.data.items.map(item => {
      const text = `${item.title} ${item.snippet}`;
      const raw = extractEventDate(text);
      const parsed = parseToDate(raw);

      return {
        eventTitle: item.title || "",
        eventURL: item.link || "",
        thirdPartyURL: item.link || "",
        source: item.displayLink || "Google",
        date: parsed ? parsed.toISOString() : "",
        rawDate: raw,
        location: "",
        boothNumber: ""
      };
    });

    // Filter ONLY upcoming events
    results = results.filter(r => {
      return isUpcoming(r.date ? new Date(r.date) : null);
    });

    console.log("🎯 Upcoming Event Count:", results.length);

    return results;

  } catch (err) {
    console.error("💥 Google API ERROR:", err.response?.data || err.message);
    return [];
  }
};

module.exports = { fetchCompanyEventUrls };
