const axios = require("axios");
const cheerio = require("cheerio");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Extract meta info from LLM text
const extractMeta = (text) => {
  const meta = { title: "", description: "", h1: "", positioning: "" };
  const titleMatch = text.match(/- Meta Title:\s*(.+)/i);
  const descMatch = text.match(/- Meta Description:\s*(.+)/i);
  const h1Match = text.match(/- H1 Tag:\s*(.+)/i);
  const posMatch = text.match(/- Category\/Positioning phrase:\s*(.+)/i);

  if (titleMatch) meta.title = titleMatch[1].trim();
  if (descMatch) meta.description = descMatch[1].trim();
  if (h1Match) meta.h1 = h1Match[1].trim();
  if (posMatch) meta.positioning = posMatch[1].trim();

  return meta;
};

// Fetch news from GNews API
const fetchGNews = async (companyName) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      `"${companyName}"`
    )}&lang=en&max=10&token=${apiKey}&from=${new Date(
      new Date().setMonth(new Date().getMonth() - 6)
    ).toISOString()}`;

    const res = await axios.get(url);
    if (!res.data.articles) return [];

    return res.data.articles.map((item) => ({
      eventTitle: item.title,
      date: item.publishedAt ? item.publishedAt.split("T")[0] : "",
      location: "",
      eventURL: item.url,
      thirdPartyURL: item.url,
      source: item.source.name,
      boothNumber: "",
    }));
  } catch (err) {
    console.error("💥 GNews API error:", err.message);
    return [];
  }
};

// Scrape company website for events/news
const scrapeCompanySite = async (companyUrl) => {
  try {
    const res = await axios.get(companyUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);
    const results = [];

    // Scrape links in /news or /events sections
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && text && (href.includes("/news") || href.includes("/events"))) {
        let fullUrl = href.startsWith("http") ? href : `${companyUrl}${href}`;
        results.push({
          eventTitle: text,
          date: "",
          location: "",
          eventURL: fullUrl,
          thirdPartyURL: fullUrl,
          source: "Company Website",
          boothNumber: "",
        });
      }
    });

    return results;
  } catch (err) {
    console.error("💥 Company site scrape error:", err.message);
    return [];
  }
};

// Main function
const fetchCompanyEventInfo = async (companyName, companyUrl) => {
  try {
    // Step 1: LLM for meta info
    const prompt = `
Check meta info for ${companyName} (${companyUrl}) website.
Return:
- Meta Title
- Meta Description
- H1 Tag
- Category/Positioning phrase (Top ... 2026)
Output in single-line text format.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const rawText = response.choices[0].message.content.trim();
    const meta = extractMeta(rawText);

    // Step 2: Fetch GNews articles
    const newsEvents = await fetchGNews(companyName);

    // Step 3: Scrape company website
    const siteEvents = await scrapeCompanySite(companyUrl);

    // Merge all events
    let allEvents = [...newsEvents, ...siteEvents];

    // Deduplicate by URL first, then by title
    const seenUrls = new Set();
    const seenTitles = new Set();
    allEvents = allEvents.filter((e) => {
      if ((e.eventURL && seenUrls.has(e.eventURL)) || (e.eventTitle && seenTitles.has(e.eventTitle))) {
        return false;
      }
      if (e.eventURL) seenUrls.add(e.eventURL);
      if (e.eventTitle) seenTitles.add(e.eventTitle);
      return true;
    });

    // Ensure at least one row
    if (allEvents.length === 0) {
      allEvents.push({
        eventTitle: "",
        date: "",
        location: "",
        eventURL: "",
        thirdPartyURL: "",
        source: "",
        boothNumber: "",
      });
    }

    return { meta, events: allEvents };
  } catch (err) {
    console.error("💥 ERROR:", err.message);
    return { meta: { title: companyName }, events: [] };
  }
};

module.exports = { fetchCompanyEventInfo };
