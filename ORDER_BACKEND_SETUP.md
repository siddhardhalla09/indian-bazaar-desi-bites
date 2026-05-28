# Order Manager Setup

The website can run in demo mode without setup, but real orders need a small backend.

This setup uses Google Sheets as the order database and Google Apps Script as the order service.

## What Staff Will Get

- A Google Sheet called `Orders`
- A staff page called `admin.html`
- Status buttons for:
  - New
  - Accepted
  - Ready
  - Completed
  - Cancelled

## Step 1: Create The Google Sheet

1. Go to Google Sheets.
2. Create a blank spreadsheet.
3. Name it `Indian Bazaar Orders`.
4. Click **Extensions**.
5. Click **Apps Script**.

## Step 2: Paste The Backend Script

1. Delete the starter code in Apps Script.
2. Open either of these files:
   - `google-sheets-backend/Code.gs`
   - `GOOGLE_SHEETS_BACKEND_CODE.txt`
3. Copy all of it.
4. Paste it into Apps Script.
5. Change this line near the top:

```js
const ADMIN_KEY = "CHANGE_THIS_ADMIN_KEY";
```

Use a private staff key, for example:

```js
const ADMIN_KEY = "my-store-orders-2026";
```

6. Click **Save**.

## Step 3: Deploy The Web App

1. Click **Deploy**.
2. Click **New deployment**.
3. Choose **Web app**.
4. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**.
6. Copy the Web App URL.

The URL usually starts with:

```text
https://script.google.com/macros/s/...
```

## Step 4: Connect The Website

Open `config.js` and paste the Web App URL here:

```js
backendUrl: "",
```

Example:

```js
backendUrl: "https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec",
```

Also replace:

- `businessPhoneDigits`
- `businessEmail`

## Step 5: Publish To GitHub

Upload the files from the `publish` folder to GitHub Pages.

## Staff Page

After the site is published, open:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/admin.html
```

Enter the admin key you chose in Apps Script.

## Important

Do not put card payments or sensitive payment information in this system. It is for pickup requests and order status only.
