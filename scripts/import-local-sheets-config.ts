import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environmental variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/database/db';

const EXCEL_DIR = path.resolve(process.cwd(), '../excel');
const CONFIG_FILE = path.join(EXCEL_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(EXCEL_DIR, 'credentials.json');

async function main() {
  console.log("Reading configuration files from local excel project...");

  let spreadsheetId = "";
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      spreadsheetId = config.spreadsheet_id || "";
      console.log(`- Found Spreadsheet URL/ID in config.json: ${spreadsheetId}`);
    } catch (err: any) {
      console.error(`- Error reading config.json: ${err.message}`);
    }
  } else {
    console.warn(`- config.json not found at ${CONFIG_FILE}`);
  }

  let credentialsJson = "";
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      // Validate that it is correct JSON
      const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      credentialsJson = JSON.stringify(creds);
      console.log("- Found valid credentials.json service account key.");
    } catch (err: any) {
      console.error(`- Error reading credentials.json: ${err.message}`);
    }
  } else {
    console.warn(`- credentials.json not found at ${CREDENTIALS_FILE}`);
  }

  if (!spreadsheetId && !credentialsJson) {
    console.error("No valid local settings found to import. Aborting.");
    process.exit(1);
  }

  console.log("Connecting to Neon PostgreSQL database and writing settings...");

  if (spreadsheetId) {
    await prisma.appSettings.upsert({
      where: { settingKey: 'google_sheet_url' },
      update: { settingValue: spreadsheetId },
      create: { settingKey: 'google_sheet_url', settingValue: spreadsheetId }
    });
    console.log("✅ Successfully saved 'google_sheet_url' setting to Neon DB.");
  }

  if (credentialsJson) {
    await prisma.appSettings.upsert({
      where: { settingKey: 'google_credentials_json' },
      update: { settingValue: credentialsJson },
      create: { settingKey: 'google_credentials_json', settingValue: credentialsJson }
    });
    console.log("✅ Successfully saved 'google_credentials_json' setting to Neon DB.");
  }

  console.log("Neon database configuration sync complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration crashed:", err);
  process.exit(1);
});
