// services/googleSearchEvents.js
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

// Extract domain (clean)
const extractDomain = (companyUrl) => {
  try {
    return new URL(companyUrl).hostname.replace("www.", "");
  } catch {
    return companyUrl;
  }
};

// Better date extraction
const extractEventDate = (text) => {
  if (!text) return null;

  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];

  const patterns = [
    /\b(20\d{2})\b/i,   // year
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}\b/i,
    new RegExp(`(${months.join("|")})\\s*\\d{1,2},?\\s*(20\\d{2})`, 'i'),
    new RegExp(`(${months.join("|")})\\s*(20\\d{2})`, 'i')
  ];

  for (let p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }

  return null;
};

const parseToDate = (rawDate) => {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  return isNaN(d) ? null : d;
};

const isUpcoming = (eventDate) => {
  if (!eventDate) return true;
  return eventDate >= new Date();
};

const fetchCompanyEventUrls = async (companyUrl) => {
  try {
    const domain = extractDomain(companyUrl);

    // IMPORTANT FIX: force search only inside company website
    const query = `site:${domain} ("event" OR "conference" OR "expo" OR "seminar" OR "webinar" OR "展示会" OR "出展")`;

    console.log("🔍 Query Used:", query);

    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: GOOGLE_API_KEY,
          cx: SEARCH_ENGINE_ID,
          q: query,
          num: 10
        }
      }
    );

    const items = response.data.items || [];
    if (!items.length) {
      console.log("⚠ No results returned.");
      return [];
    }

    const unique = new Set();
    const results = [];

    for (const item of items) {
      if (!item.link) continue;

      // Avoid repeated URLs
      if (unique.has(item.link)) continue;
      unique.add(item.link);

      const fullText = `${item.title} ${item.snippet}`;
      const rawDate = extractEventDate(fullText);
      const parsedDate = parseToDate(rawDate);

      results.push({
        eventTitle: item.title || "",
        eventURL: item.link || "",
        thirdPartyURL: item.link || "",
        source: item.displayLink || domain,
        rawDate: rawDate || "",
        date: parsedDate ? parsedDate.toISOString() : "",
        location: "",
        boothNumber: ""
      });
    }

    // Filter upcoming
    const upcoming = results.filter((r) => {
      if (!r.date) return true;
      return isUpcoming(new Date(r.date));
    });

    console.log("🎯 Final upcoming results:", upcoming.length);
    return upcoming;

  } catch (err) {
    console.error("💥 ERROR:", err.response?.data || err.message);
    return [];
  }
};

module.exports = { fetchCompanyEventUrls };
