# Google Sheets API Setup Guide

Follow these steps to generate the necessary keys for your application.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top and select **"New Project"**.
3. Name your project (e.g., "FinManage") and click **"Create"**.
4. Select the newly created project.

## 2. Enable Google Sheets API
1. In the sidebar, go to **"APIs & Services" > "Library"**.
2. Search for **"Google Sheets API"**.
3. Click on the result and then click **"Enable"**.

## 3. Create API Key (`NEXT_PUBLIC_GOOGLE_API_KEY`)
1. Go to **"APIs & Services" > "Credentials"**.
2. Click **"+ CREATE CREDENTIALS"** and select **"API Key"**.
3. Copy the generated key. This is your `NEXT_PUBLIC_GOOGLE_API_KEY`.
4. (Optional but recommended) Click "Edit API key" to restrict it to "Google Sheets API" and "HTTP referrers (websites)" like `http://localhost:3000`.

## 4. Configure OAuth Consent Screen
1. Go to **"APIs & Services" > "OAuth consent screen"**.
2. Select **"External"** (or "Internal" if you have a Google Workspace organization) and click **"Create"**.
3. Fill in the App Name (e.g., "FinManage") and User Support Email.
4. Skip the "Scopes" section for now (or add `.../auth/spreadsheets`).
5. Add your email to **"Test Users"** so you can log in during development.
6. Save and continue back to the dashboard.

## 5. Create OAuth Client ID (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
1. Go back to **"APIs & Services" > "Credentials"**.
2. Click **"+ CREATE CREDENTIALS"** and select **"OAuth client ID"**.
3. Application type: **"Web application"**.
4. Name: "FinManage Web".
5. **Authorized JavaScript origins**: Add `http://localhost:3000` (and your production URL later).
6. **Authorized redirect URIs**: Add `http://localhost:3000`.
7. Click **"Create"**.
8. Copy the **"Client ID"**. This is your `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## 6. Get Spreadsheet ID (`NEXT_PUBLIC_SPREADSHEET_ID`)
1. Open your Google Sheet in the browser.
2. The URL looks like this: `https://docs.google.com/spreadsheets/d/1GfHcS3UACISvreLhRetpTyRCgTnVcqaV63zFCiZeR20/edit#gid=0`
3. The long string between `/d/` and `/edit` is your **Spreadsheet ID**.
   - Example ID: `1GfHcS3UACISvreLhRetpTyRCgTnVcqaV63zFCiZeR20`
4. Copy this ID. This is your `NEXT_PUBLIC_SPREADSHEET_ID`.

## 7. Update `.env.local`
Paste the values into your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_copied_in_step_5
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_copied_in_step_3
NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_copied_in_step_6
```

## 8. Restart Application
Stop your running server and run `npm run dev` again to load the new environment variables.
