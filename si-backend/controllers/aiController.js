// controllers/aiController.js
const { appendRow } = require("../services/googleSheet");
const { fetchCompanyEventUrls } = require("../services/companyEvent");

exports.processCompany = async (req, res) => {
  try {
    const { companyName, companyUrl } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: "companyName is required" });
    }

    // 🔍 Fetch events using company URL (your requirement)
    const scrapedEvents = await fetchCompanyEventUrls(companyUrl);

    if (!Array.isArray(scrapedEvents) || scrapedEvents.length === 0) {
      return res.status(400).json({ success: false, error: "No events found" });
    }

    for (const event of scrapedEvents) {
      const row = [
        companyName || "",
        event.title || "",
        event.date || "",
        event.location || "",
        event.link || "",
        event.thirdPartyURL || event.link || "",
        event.source || "Google Search",
        event.boothNumber || ""
      ];
      await appendRow(row);
    }

    console.log(`Saved ${scrapedEvents.length} events for ${companyName} to Google Sheets.`);
    res.json({ success: true, message: `Saved ${scrapedEvents.length} events to Google Sheets!` });

  } catch (err) {
    console.error("Error processing company:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
