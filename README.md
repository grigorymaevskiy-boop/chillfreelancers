# The Chill Freelancers Club — static site

A hand-built replacement for the Framer site at https://www.chillfreelancers.com.
Plain HTML, CSS and a little JavaScript. No build step.

```
index.html               Home page
events.html              Events page (Luma calendar embed)
styles.css               All styles. Breakpoints: desktop ≥1170, tablet 810–1169, phone ≤809
main.js                  Phone menu, scroll animations, footer year, join form
favicon.svg              Browser tab icon
assets/                  Illustrations, team photos, og-image.png (social preview), apple-touch-icon.png
google-apps-script/      Code.gs, the backend that writes form submissions to the Google Sheet
tools/                   Sources for og-image.png and apple-touch-icon.png, plus render-images.sh
CNAME, .nojekyll         For GitHub Pages
```

## Preview locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Form backend (Google Sheet)

The join form posts to a Google Apps Script web app attached to the sheet Framer
currently writes to. New rows land under the existing columns
**Name / Email / What field / How long / Purpose**. A column named Timestamp, Date or
Submitted gets the time. Any field without a column gets a new one at the end, so nothing is lost.

1. Open the existing responses sheet in Google Sheets → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with `google-apps-script/Code.gs` from this repo. Save.
   - If the responses aren't on the first tab, set `SHEET_NAME` at the top.
   - Set `NOTIFY_EVERY_SUBMISSION = true` if you want an email for every application.
     Either way, you get an email if saving to the sheet fails, like Framer's fallback.
3. **Deploy → New deployment →** type **Web app**. Execute as **Me**. Who has access: **Anyone**. Deploy and allow the permissions.
4. Copy the URL that ends in `/exec` and paste it into `index.html`:
   ```html
   <form class="form" id="join-form" novalidate
         data-endpoint="https://script.google.com/macros/s/XXXX/exec">
   ```
5. Open the `/exec` URL in a browser. You should see `{"result":"ok",...}`.
6. Submit a test application on the site and check that a row appears in the sheet.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**.
That keeps the same URL.

Spam protection: there's a hidden honeypot field, plus email validation on the server and
in the browser. Values starting with `= + - @` are escaped so they can't run as sheet formulas.

## Deploy

**GitHub Pages:** push to a repo → Settings → Pages → Deploy from branch `main` / root.
The `CNAME` file already sets `www.chillfreelancers.com`. `/events` keeps working because
Pages serves `events.html` for it.

**Netlify / Vercel:** import the repo with no build command and publish directory `/`.
You can delete `CNAME` and `.nojekyll`.

## Going live checklist

1. Deploy, and check the site on the host's temporary URL.
2. Set up the form backend and confirm a test submission lands in the sheet.
3. Point DNS for `chillfreelancers.com` / `www` at the new host, and remove the custom domain in Framer.
4. Turn on HTTPS on the host. Paste the URL into https://www.opengraph.xyz to check the social preview.

## Notes

- Fonts come from Google Fonts. Fraunces is pinned to its small optical size (`"opsz" 14`)
  to match the chunkier headings on the Framer site.
- The hand-drawn underlines are CSS backgrounds on the phrases, so they stay under the
  right words at every width. The second one now covers "company of like-minded"
  (Framer's started mid-word).
- Tablet layout follows the brief: cards are a single column capped at 340px, and the
  frame outlines line up with the photos.
- `bash tools/render-images.sh` re-renders the social image and touch icon (needs Google Chrome).
- `.claude/` is only a local preview config. It's fine to delete or leave out of the repo.
