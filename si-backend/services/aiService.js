// services/aiService.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateAIResponse = async (companyName, companyUrl) => {
  try {
    const prompt = `
Check if ${companyName} is exhibiting or has exhibited at any event, conference, or expo in 2025.

First provide:
- Meta Title
- Meta Description
- H1 Tag
- Category (Positioning phrase starting with "Top" ending with "2026")

Then table with columns:
Event/News Title | Date | Location | Event URL | 3rd Party URL | Source | Booth Number  

Rules:
- Only include updates about ${companyName} (${companyUrl})
- Only 2025 or last 6 months
- Leave blank if no info found
- Each row must have at least one valid URL
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const aiText = response.choices[0].message.content;
    return aiText;
  } catch (err) {
    console.error("Error generating AI response:", err);
    throw new Error("Failed to generate AI response");
  }
};
