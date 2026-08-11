## Vine's Brows Studio — Deployment

This repository contains a static site (HTML/CSS/JS) for Vine's Brows Studio.

Quick steps to publish to GitHub Pages (free):

1. Create a new GitHub repository (for example `vinesbrowstudio`).
2. On your machine, in the project folder run:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vinesbrowstudio.git
git push -u origin main
```

3. The repository includes a GitHub Actions workflow that automatically deploys the site to GitHub Pages when you push to `main`.

4. After the first push, go to your repo Settings → Pages (or Actions → Pages deployment) to confirm the site URL. The default URL will be:

```
https://YOUR_USERNAME.github.io/vinesbrowstudio/
```

5. (Optional) To use a custom domain (e.g. `vinesbrowstudio.com`):
   - Purchase the domain from a registrar.
   - In the repo root create a file named `CNAME` containing your domain on a single line, for example:

```
vinesbrowstudio.com
```

   - Add the DNS records at your registrar. For GitHub Pages, add the GitHub A records if using an apex domain, or a CNAME to `YOUR_USERNAME.github.io` for subdomains. See your registrar docs for details.

Local testing:

```bash
# serve locally with Python
python -m http.server 8000
# open http://localhost:8000
```

If you want, I can prepare the repo on GitHub and walk you through pushing and enabling Pages deployment.
# Vine's Brows Studio

A simple one-page website for an eyebrow studio — services, about, gallery, and booking contact form.

## Run locally

### Static site (browser-only preview)

```powershell
cd C:\Users\danea\vines-studio
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080), or double-click `index.html` to open it directly in your browser.

### Secure local backend with form handling

```powershell
cd C:\Users\danea\vines-studio
python server/app.py
```

Then open [http://localhost:5000](http://localhost:5000).

The submission API is available at:

- `POST /api/contact`
- `POST /api/booking`

These endpoints validate input, reject honeypot values, enforce basic rate limiting, and store submissions in `server/submissions.log`.

### Email delivery setup

To send booking alerts by email, create a `.env` file in the `server` folder based on `.env.example` and provide real Gmail SMTP settings:

```powershell
cd C:\Users\danea\vines-studio\server
copy .env.example .env
```

Then edit `.env` and put your real values. Gmail users should use an App Password rather than their normal password.

For a complete email delivery and design setup, including the elegant booking email template, see [BOOKING_EMAIL_SETUP.md](BOOKING_EMAIL_SETUP.md).

If SMTP credentials are not configured, the backend still logs the request locally and continues without failing.

## Basic security hardening

This site now includes a few baseline protections for a static front-end:

- Content Security Policy to restrict scripts, styles, and external content.
- Referrer and permissions policies to reduce data leakage.
- Form input sanitization before sending booking requests.
- Input length and format checks to reduce malformed submissions.
- Hidden honeypot fields and short submission throttling to reduce spam/bot traffic.
- External links that open in a new tab use `rel="noopener noreferrer"`.

For production hosting, keep the site on HTTPS, restrict form submissions to trusted endpoints, and rotate the Formspree key if it ever leaks.

## Production security checklist

- Use HTTPS everywhere.
- Add a `security.txt` file for responsible disclosure contact info.
- Monitor form submissions and block repeated spam patterns.
- Consider adding a server-side endpoint for email sending instead of relying only on a client-side form submission.

## Booking email setup

For elegant, client-facing booking emails, open the full setup guide here:

- [BOOKING_EMAIL_SETUP.md](BOOKING_EMAIL_SETUP.md)

This guide includes the SMTP configuration, App Password instructions, and email template customization so your booking requests arrive in a professional, easy-to-read format.

## Customize

Update contact details, prices, hours, and Instagram handle in `index.html`. Replace gallery placeholders with real photos when ready.
