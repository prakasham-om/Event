import { useState } from "react";
import axios from "axios";

export default function CompanyForm() {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("https://event-1-cvel.onrender.com/api/events/process", {
        companyName,
        companyUrl
      });

      setEvents(res.data.data || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">AI Event Finder</h2>

      <input 
        className="border p-2 w-full mb-3"
        placeholder="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />

      <input 
        className="border p-2 w-full mb-3"
        placeholder="Company Website URL"
        value={companyUrl}
        onChange={(e) => setCompanyUrl(e.target.value)}
      />

      <button 
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        {loading ? "Processing..." : "Submit"}
      </button>

      {/* Render events */}
      {events.length > 0 && (
        <div className="mt-4">
          {events.map((event, idx) => (
            <div key={idx} className="mb-3 p-3 border rounded bg-gray-100">
              <p><strong>Title:</strong> {event.eventTitle}</p>
              <p><strong>Date:</strong> {event.date || "N/A"}</p>
              <p><strong>Location:</strong> {event.location || "N/A"}</p>
              <p><strong>Event URL:</strong> <a href={event.eventURL} target="_blank">{event.eventURL}</a></p>
              <p><strong>3rd Party URL:</strong> <a href={event.thirdPartyURL} target="_blank">{event.thirdPartyURL}</a></p>
              <p><strong>Source:</strong> {event.source}</p>
              <p><strong>Booth Number:</strong> {event.boothNumber || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
