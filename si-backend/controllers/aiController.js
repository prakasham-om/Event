// controllers/aiController.js
const { appendRow } = require("../services/googleSheet");
const { fetchCompanyEventUrls } = require("../services/companyEvent");

exports.processCompany = async (req, res) => {
  try {
    const { companyName, companyUrl } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: "companyName is required" });
    }

    // Fetch events from your scraper
    const scrapedEvents = await fetchCompanyEventUrls(companyUrl);

    if (!Array.isArray(scrapedEvents) || scrapedEvents.length === 0) {
      return res.status(400).json({ success: false, error: "No events found" });
    }

    for (const event of scrapedEvents) {
      const row = [
        companyName || "",              // Company Name
        event.eventTitle || "",         // Event/News Title
        event.date || "",               // Date
        event.location || "",           // Location
        event.eventURL || "",           // Event URL
        event.thirdPartyURL || "",      // 3rd Party URL
        event.source || "Google Search",// Source
        event.boothNumber || ""         // Booth Number
      ];

      await appendRow(row);
    }

    console.log(`Saved ${scrapedEvents.length} events for ${companyName} to Google Sheets.`);
    res.json({
      success: true,
      message: `Saved ${scrapedEvents.length} events to Google Sheets!`
    });

  } catch (err) {
    console.error("Error processing company:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
