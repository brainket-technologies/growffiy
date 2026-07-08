# Zerodha Kite to Google Sheets Real-Time Streamer
## Setup and Configuration Guide

This guide will show you how to configure and run the real-time stock price streamer. Once set up, it automatically logs into your Zerodha account, maps your stock list, and streams real-time updates directly to your Google Sheet.

---

## 1. Project Folder Structure

Ensure your project folder contains the following files and folders:
```text
/your-project-folder/
├── docs/
│   └── KITE_SHEETS_SETUP_GUIDE.md  (This Setup Guide)
├── src/
│   └── kite_to_gspread.py          (Main Stock Streaming Python Code)
├── config.json                     (API Keys & Settings Config File)
├── credentials.json                (Google Cloud Service Account Key File)
├── excel.xlsx                      (Local Backup of Stock Data Sheet)
└── requirements.txt                (Required Python Packages List)
```

---

## 2. Step-by-Step Settings Configuration

Open the `config.json` file in your editor. It should look like this:
```json
{
  "kite_api_key": "YOUR_KITE_API_KEY",
  "kite_api_secret": "YOUR_KITE_API_SECRET",
  "kite_client_id": "YOUR_ZERODHA_CLIENT_ID",
  "kite_password": "YOUR_ZERODHA_PASSWORD",
  "kite_totp_secret": "YOUR_ZERODHA_TOTP_SECRET",
  "google_credentials_file": "credentials.json",
  "spreadsheet_id": "YOUR_GOOGLE_SPREADSHEET_ID"
}
```

Follow the guides below to get each value:

### A. Zerodha Kite API Key & Secret
1. Open the [Zerodha Kite Connect Developer Portal](https://kite.trade/).
2. Sign up or log in.
3. Create a developer app. *(Note: Zerodha charges a monthly subscription of ₹2000 for API access).*
4. Copy the **API Key** and **API Secret** from your app dashboard.
5. Paste them into `kite_api_key` and `kite_api_secret` fields in `config.json`.

### B. Zerodha Client ID & Password
1. Enter your Zerodha account Login ID (e.g. `RZJ500`) in `kite_client_id`.
2. Enter your Zerodha login password in `kite_password`.

### C. Zerodha TOTP Secret (for Automatic Login)
To allow the script to log in automatically every day without prompting you for manual OTP codes:
1. Log into your Zerodha Kite portal or mobile app.
2. Go to **Profile Settings > Password & Security**.
3. Click **Enable 2FA TOTP**.
4. You will see a QR code on the screen. Do **NOT** scan it yet. Instead, look for a link that says **"Can't scan? Copy key"** or similar.
5. Copy this long alphanumeric secret key.
6. Paste this key into the `kite_totp_secret` field in `config.json`.
7. You can now scan the QR code using any authenticator app (like Google Authenticator or Microsoft Authenticator) to complete the setup on Zerodha.

### D. Google Spreadsheet ID
1. Open your private Google Sheet in your browser.
2. Look at the URL in the address bar. It looks like this:
   `https://docs.google.com/spreadsheets/d/1NtcJiesrNTcYQLL3cr76f1aI5M-TuZijsXJPmnOCdC8/edit#gid=0`
3. Copy the long code between `/d/` and `/edit`. This is your **Spreadsheet ID**.
   *(In the example above, it is: `1NtcJiesrNTcYQLL3cr76f1aI5M-TuZijsXJPmnOCdC8`)*
4. Paste it into the `spreadsheet_id` field in `config.json`.

---

## 3. Google Sheets API Credentials Setup

To give the script permission to write values into your Google Sheet:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. In the search bar at the top, search for **Google Sheets API** and click **Enable**.
4. Search for **Google Drive API** and click **Enable**.
5. Go to **IAM & Admin > Service Accounts** in the left sidebar menu.
6. Click **Create Service Account** at the top.
7. Fill in any name (e.g., `my-stock-streamer`) and click **Done**.
8. Copy the generated service account email (it looks like: `my-stock-streamer@project-id.iam.gserviceaccount.com`).
9. Click on the service account you created, go to the **Keys** tab, click **Add Key > Create New Key**, select **JSON**, and click **Create**.
10. A file will download to your computer. Rename this downloaded file to **`credentials.json`** and place it in the root folder of the project.
11. Open your Google Sheet in your browser, click the **Share** button in the top-right corner, paste the service account email, set the permission role to **Editor**, and click **Share**.

---

## 4. How to Run the Script

1. Open your terminal, command prompt, or terminal inside your code editor.
2. Navigate to the project root folder.
3. Install all required Python packages using this command:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the streaming script:
   ```bash
   python src/kite_to_gspread.py
   ```

### What Happens on Startup?
- The script downloads the latest NSE instrument list from Zerodha to automatically map stock symbols.
- It scans the first column of your Google Sheet to find the row numbers for each stock symbol under the `SYMBOL` header.
- It logs into Zerodha, performs automatic 2FA TOTP verification, and starts the live WebSocket connection.
- During market hours, it batch-updates your sheet's columns (LTP/CMP, Open, High, Low, and Change %) every second.
