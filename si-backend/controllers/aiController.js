// controllers/aiController.js
const { appendRow } = require("../services/googleSheet");
const { fetchCompanyEventInfo } = require("../services/companyEvent");

exports.processCompany = async (req, res) => {
  try {
    const { companyName, companyUrl } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: "companyName is required" });
    }

    // 🔍 Fetch events using company URL
    const scrapedData = await fetchCompanyEventInfo(companyName, companyUrl);
    const events = scrapedData.events || [];

    // If no events found, still write one row with empty event details
    if (events.length === 0) {
      const row = [
        companyName || "",
        "", // eventTitle
        "", // date
        "", // location
        "", // eventURL
        "", // thirdPartyURL
        "", // source
        ""  // boothNumber
      ];
      await appendRow(row);
      console.log(`Saved empty event row for ${companyName} to Google Sheets.`);
      return res.json({ success: true, message: "No events found, but row added to Google Sheets." });
    }

    // Write all events
    for (const event of events) {
      const row = [
        companyName || "",
        event.eventTitle || "",
        event.date || "",
        event.location || "",
        event.eventURL || "",
        event.thirdPartyURL || event.eventURL || "",
        event.source || "LLM",
        event.boothNumber || ""
      ];
      await appendRow(row);
    }

  //  console.log(`Saved ${events.length} events for ${companyName} to Google Sheets.`);
    res.json({ success: true, message: `Saved ${events.length} events to Google Sheets!`, data: events });

  } catch (err) {
    console.error("Error processing company:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
