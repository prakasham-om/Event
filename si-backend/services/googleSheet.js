// services/googleSheets.js
const { google } = require("googleapis");
require("dotenv").config();

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const DEFAULT_SHEET_NAME = "prakasham"; // your target sheet tab
const HEADERS = ["Company", "Event", "Date", "URL", "3rd Party URL", "Source", "Booth Number"];

// Parse service account credentials
const cred = JSON.parse(Buffer.from(process.env.CRED, "base64").toString("utf8"));
const auth = new google.auth.GoogleAuth({
  credentials: cred,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

// Get list of sheets
async function getSheetList() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return (meta.data.sheets || []).map((s) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));
}

// Ensure the specific sheet exists, throw error if missing
async function ensureSheetExists(sheetName = DEFAULT_SHEET_NAME) {
  const sheetList = await getSheetList();
  const sheet = sheetList.find((s) => s.title === sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" does not exist. Please create it manually in your spreadsheet.`);
  }

  return sheet;
}

// Append a row
exports.appendRow = async (row) => {
  if (!Array.isArray(row)) throw new Error("Row must be an array");

  const sheet = await ensureSheetExists();
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet.title}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });

  return response.data;
};

// Get all rows (skip header)
exports.getRows = async () => {
  const sheets = await getSheetsClient();
  const sheet = await ensureSheetExists();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheet.title,
  });

  const rows = resp.data.values || [];
  return rows.slice(1); // skip header
};
