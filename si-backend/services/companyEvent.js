const axios = require("axios");
const cheerio = require("cheerio");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* -------------------------------------------------------
   1️⃣  Extract Meta Info From LLM Raw Text
------------------------------------------------------- */
const extractMeta = (text) => {
  const meta = { title: "", description: "", h1: "", positioning: "" };
  const patterns = {
    title: /- Meta Title:\s*(.+)/i,
    description: /- Meta Description:\s*(.+)/i,
    h1: /- H1 Tag:\s*(.+)/i,
    positioning: /- Category\/Positioning phrase:\s*(.+)/i,
  };

  Object.keys(patterns).forEach((key) => {
    const match = text.match(patterns[key]);
    if (match) meta[key] = match[1].trim();
  });

  return meta;
};

/* -------------------------------------------------------
   2️⃣  GNews — STRICT COMPANY FILTERS
------------------------------------------------------- */
const fetchGNews = async (companyName, companyUrl) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    const domain = new URL(companyUrl).hostname;

    // 🎯 STRICT CORPORATE QUERY (removes gaming, celebrity noise)
    const query = `"${companyName}" 
      AND (company OR corporation OR inc OR ltd OR limited OR earnings OR press OR release OR announcement OR event OR acquisition OR partnership)
      AND site:${domain}
      -game -gaming -actor -celebrity -movie -football -music -sports -rapper`;

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      query
    )}&lang=en&max=10&token=${apiKey}`;

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

/* -------------------------------------------------------
   3️⃣  LLM — Validate if an article truly belongs to company
------------------------------------------------------- */
const validateArticle = async (companyName, title) => {
  try {
    const prompt = `
Does the following article belong *specifically* to the company "${companyName}"?
Article title: "${title}"
Answer only Yes or No.
`;

    const r = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    return r.choices[0].message.content.trim().toLowerCase().includes("yes");
  } catch {
    return false;
  }
};

/* -------------------------------------------------------
   4️⃣  Scrape Company Website For Events/News Links
------------------------------------------------------- */
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

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();

      if (!href || !text) return;

      if (href.includes("news") || href.includes("event")) {
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

/* -------------------------------------------------------
   5️⃣  MAIN FUNCTION
------------------------------------------------------- */
const fetchCompanyEventInfo = async (companyName, companyUrl) => {
  try {
    /* ---------- (A) LLM Meta Info ---------- */
    const prompt = `
Analyze the official website of: ${companyName} (${companyUrl})
Return:
- Meta Title
- Meta Description
- H1 Tag
- Category/Positioning phrase
Return clean structured lines only.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const rawText = response.choices[0].message.content.trim();
    const meta = extractMeta(rawText);

    /* ---------- (B) GNews + domain-filtered corporate news ---------- */
    let newsEvents = await fetchGNews(companyName, companyUrl);

    /* ---------- (C) Validate GNews articles using LLM ---------- */
    const validatedNews = [];
    for (let e of newsEvents) {
      const valid = await validateArticle(companyName, e.eventTitle);
      if (valid) validatedNews.push(e);
    }

    /* ---------- (D) Scrape company website ---------- */
    const siteEvents = await scrapeCompanySite(companyUrl);

    /* ---------- (E) Merge + Deduplicate ---------- */
    let allEvents = [...validatedNews, ...siteEvents];

    const seenUrls = new Set();
    const seenTitles = new Set();

    allEvents = allEvents.filter((e) => {
      if (
        (e.eventURL && seenUrls.has(e.eventURL)) ||
        (e.eventTitle && seenTitles.has(e.eventTitle))
      )
        return false;

      if (e.eventURL) seenUrls.add(e.eventURL);
      if (e.eventTitle) seenTitles.add(e.eventTitle);
      return true;
    });

    /* ---------- (F) At least 1 empty row (for Sheets) ---------- */
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

    console.log(allEvents);

    return { meta, events: allEvents };
  } catch (err) {
    console.error("💥 ERROR:", err.message);
    return { meta: { title: companyName }, events: [] };
  }
};

module.exports = { fetchCompanyEventInfo };
