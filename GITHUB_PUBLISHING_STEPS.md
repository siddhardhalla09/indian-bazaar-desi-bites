# GitHub Publishing Steps

Use the files inside the `publish` folder. If you want the simplest copy/paste option, use the `publish-single-file` folder instead.

## Best Way: Upload The Publish Folder

1. Open GitHub.
2. Create a new repository.
3. Name it `indian-bazaar-desi-bites`.
4. Make it **Public**.
5. Open the new repository.
6. Click **uploading an existing file**.
7. Drag everything from the `publish` folder into GitHub.
8. Click **Commit changes**.
9. Go to **Settings** > **Pages**.
10. Set:
    - Source: **Deploy from a branch**
    - Branch: **main**
    - Folder: **/root**
11. Click **Save**.

GitHub will show the live website link after it finishes publishing.

## Files To Upload From `publish`

- `index.html`
- `admin.html`
- `admin.css`
- `admin.js`
- `config.js`
- `styles.css`
- `script.js`
- `.nojekyll`
- `assets/indian-bazaar-hero.png`
- `README.md`

## One-File Copy/Paste Option

Use this if you only want to paste one file into GitHub:

1. Open `publish-single-file/index.html`.
2. Copy all of it.
3. In GitHub, click **Add file** > **Create new file**.
4. Name the file `index.html`.
5. Paste the copied code.
6. Commit it.
7. Turn on GitHub Pages from **Settings** > **Pages**.

This version has the design, image, and ordering behavior all inside one file.

The one-file version is best for a basic website only. Use the normal `publish` folder if you want the staff order manager.

## Replace These Placeholders

Before giving the website to customers, replace:

- `(555) 123-4567`
- `15551234567`
- `orders@indianbazaar.example`
- `123 Market Street`
- `Your City, ST 00000`

These are currently placeholders so the site can work as a demo.

## Staff Order Manager

The staff page is:

```text
admin.html
```

To receive real orders in that page, follow:

```text
ORDER_BACKEND_SETUP.md
```
