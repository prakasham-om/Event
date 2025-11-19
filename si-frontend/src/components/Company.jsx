import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function CompanyForm() {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const handleSubmit = async () => {
    if (!companyUrl) {
      alert("Please enter a company URL");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("https://event-1-cvel.onrender.com/api/events/process", { companyName, companyUrl });
      // Make sure to access res.data.data
      setEvents(res.data.data || []);
     // console.log("Events fetched:", res.data.data);
    } catch (err) {
      console.error("Error fetching events:", err.response || err.message);
      setEvents([]);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-start py-12 px-4"
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
        AI Event Finder
      </h1>

      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-3 mb-8">
        <input
          className="flex-1 p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <input
          className="flex-1 p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="Company Website URL"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition"
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : "Search"}
        </button>
      </div>

      {events.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className="space-y-4">
            {events.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-4 bg-gray-800 text-white rounded-xl shadow-md text-sm"
              >
                <h2 className="text-lg font-bold mb-1">{event.eventTitle || "-"}</h2>
                <p className="mb-1"><strong>Date:</strong> {event.date || "-"}</p>
                <p className="mb-1"><strong>Location:</strong> {event.location || "-"}</p>
                <p className="underline mb-1 break-words text-blue-400">
                  <strong>Event URL:</strong> <a href={event.eventURL || "#"} target="_blank" rel="noopener noreferrer">{event.eventURL || "-"}</a>
                </p>
                <p className="underline mb-1 break-words text-blue-400">
                  <strong>3rd Party URL:</strong> <a href={event.thirdPartyURL || event.eventURL || "#"} target="_blank" rel="noopener noreferrer">{event.thirdPartyURL || event.eventURL || "-"}</a>
                </p>
                <p className="mb-1"><strong>Source:</strong> {event.source || "LLM"}</p>
                <p><strong>Booth Number:</strong> {event.boothNumber || "-"}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
