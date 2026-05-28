# Indian Bazaar & Desi Bites Website

This is a static first version of the website for Indian Bazaar and Desi Bites.

## GitHub-ready files

- Use `publish` if you want the normal website files for GitHub Pages.
- Use `publish-single-file` if you want one big `index.html` that you can paste into GitHub.
- Read `GITHUB_PUBLISHING_STEPS.md` for the exact steps.
- Read `ORDER_BACKEND_SETUP.md` to connect the order manager to Google Sheets.

## What is included

- Homepage hero with grocery and restaurant positioning
- Indian Bazaar grocery category cards
- Desi Bites menu section
- Pickup/catering order-request builder
- Staff order manager at `admin.html`
- Copy, email, and WhatsApp request actions
- Google Sheets backend script in `google-sheets-backend/Code.gs`
- Contact, hours, phone, and address section
- No online payment flow

## Replace before publishing

Update these placeholders in `index.html` and `script.js`:

- Phone: `(555) 123-4567`
- Phone digits: `15551234567`
- Email: `orders@indianbazaar.example`
- Address: `123 Market Street, Your City, ST 00000`
- Hours: `10:00 AM - 9:00 PM`
- Backend URL in `config.js` after deploying the Google Apps Script

The site can be opened directly from `index.html` or hosted as a normal static website.
