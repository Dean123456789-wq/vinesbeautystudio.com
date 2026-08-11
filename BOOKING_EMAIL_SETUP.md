# Booking Email Setup Guide

## ✅ What's Been Done

The booking system has been completely updated to send **elegant, professionally formatted HTML emails** when customers submit bookings.

### Frontend Changes:
- Updated form to send to backend API `/api/contact`
 - Added `server/.env.example` with SMTP placeholders
- Form now properly validates and submits to the Python server
- Beautiful success message with redirect to thank-you page

### Backend Changes:
- Enhanced email formatting with gradient backgrounds and color-coded sections
- Automatic date formatting (e.g., "Monday, August 5, 2026")
- Automatic time formatting (e.g., "2:30 PM")
- Client information section with contact details
- Appointment details with highlighted date and time
- Professional footer with studio information

## 🚀 How to Run

### Step 1: Install Python Dependencies
```bash
cd server
pip install -r requirements.txt
```

### Step 2: Configure Gmail Credentials

You need a **Gmail App Password** (not your regular password):

1. Go to: https://myaccount.google.com/
2. Navigate to **Security** → **App passwords**
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Copy that password

### Step 3: Update `.env` File

Edit `server/.env` and add your app password:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=vinacanoy@gmail.com
MAIL_PASSWORD=your_16_character_app_password_here
MAIL_TO=vinacanoy@gmail.com
MAIL_FROM=vinacanoy@gmail.com
```

Replace `your_16_character_app_password_here` with the password you generated.

### Step 4: Run the Backend Server

```bash
cd server
python app.py
```

The server will run on `http://localhost:5000`

### Step 5: Test the Booking Form

1. Open the website: http://localhost:5000
2. Scroll to "Book your visit" section
3. Fill in the form with test data
4. Click "Send request"
5. Check your email inbox for the beautifully formatted booking email

## 📧 Email Features

Each booking email now includes:

✦ **Header Section**
- Gradient green background
- "✦ New Booking Request" title
- Studio branding

✦ **Client Information**
- Customer name
- Customer email (clickable mailto link)

✦ **Appointment Details** (color-coded)
- Service name
- **📅 Date** - Formatted nicely (Monday, August 5, 2026)
- **🕐 Time** - Formatted clearly (2:30 PM)

✦ **Message Section** (if provided)
- Customer's additional message/questions

✦ **Action Items**
- Reminder to review, contact customer, and confirm

✦ **Professional Footer**
- Studio contact information
- Phone, email, address, and links

## 🔧 Troubleshooting

### Email Not Sending?

1. **Check credentials in `.env`**
   - Make sure you used an App Password, not your regular Gmail password
   - Verify the email address is correct

2. **Check Python output**
   - Look for error messages in the terminal

3. **Check logs**
   - `server/submissions.log` contains all booking records locally
   - Even if email fails, bookings are saved here
    - Even if email fails, bookings are saved here

4. **Gmail Security**
   - Make sure "Less secure app access" is OFF (use App Passwords instead)
   - Check if Gmail is blocking the login

### Using SendGrid or Mailgun instead of SMTP

If you prefer a transactional provider (recommended for reliability), set `MAIL_PROVIDER` in `server/.env` to `sendgrid` or `mailgun` and add the provider credentials:

- SendGrid (recommended):
```
MAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxx
MAIL_FROM=daneague123@gmail.com
MAIL_TO=daneague123@gmail.com
```

- Mailgun:
```
MAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAIL_FROM=booking@yourdomain.com
MAIL_TO=daneague123@gmail.com
```

After updating the env, restart the server and submit a test booking.

### Alternative: Use Formspree (no SMTP or App Password required)

If you don't want to manage SMTP credentials, Formspree lets the form send directly to an email address.

1. Create a free account at https://formspree.io and create a new form; copy the endpoint (looks like `https://formspree.io/f/xyz123`).
2. Open `index.html` and locate the booking form script near the bottom. Replace the placeholder `FORM_ENDPOINT` value with your Formspree URL, e.g.:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/xyz123';
```

3. Reload the site and submit a booking. Formspree will forward the submission to the email you verified in your Formspree account.

Notes:
- This sends directly from the browser to Formspree; the server will no longer be used for delivery but will still log submissions locally if you keep `/api/booking` in use.
- Formspree's free tier has submission limits; see their dashboard for limits and settings.

### Form Not Submitting?

1. Make sure the backend server is running (`python app.py`)
2. Check browser console for any JavaScript errors
3. Verify the form fields have correct IDs:
   - `user_name`, `user_email`, `service`, `preferred_date`, `preferred_time`, `message`

## 🎨 Email Template Customization

To modify the email design, edit the HTML template in `server/app.py` in the `send_submission_email()` function.

You can customize:
- Colors (use the Vine's color palette)
- Layout
- Font sizes
- Sections to include/exclude

## 📝 Notes

- Bookings are always saved to `server/submissions.log` as backup
- Rate limiting: 3 requests per 20 seconds per IP
- All inputs are sanitized for security
- The thank-you page redirects automatically after 2 seconds

Enjoy your elegant booking emails! 🌿✨
