# Dargah Para OIkko Porishod

A MERN organization management system for member registration, admin approval, financial tracking, notices, meetings, tours, activities, and rules.

## Features

- Public registration with registration fee payment information
- Admin approval and rejection workflow
- JWT authentication and role-based access
- Admin dashboard for settings, members, finance, donations, expenses, and content
- Member dashboard for private updates, monthly fee submission, and payment history
- Public homepage with donation submission and public organization updates
- ImgBB image uploads for notices, meetings, tours, activities, and rules
- Audit logs, admin JSON backup export, member notifications, printable receipts, and profile document uploads
- Searchable admin/member lists, confirmation dialogs, finance summaries, and Bengali/English navigation toggle
- Meeting attendance/minutes, tour participant cost tracking, and admin password reset
- Public/member gallery and member-created blogs with likes and comments
- Finance analytics dashboard with income/expense charts, donation trend, and overdue fee tracking
- Server-generated PDF receipts for monthly payments and donations
- QR code payment verification with admin scan/confirm page
- Twilio SMS/WhatsApp alerts with admin-controlled triggers and Bangladeshi phone validation
- Meeting poll system with one-vote-per-member voting and live admin result charts
- Meeting and tour RSVP tracking with admin counts and member response buttons
- Bengali-first navigation, mobile bottom nav, consistent status colors, 44px touch targets, and loading skeletons
- App-wide light/dark/system theme controls with quick user toggle and admin appearance settings
- Advanced admin control panel at `/admin/controls` for site, member, finance, content, notification, appearance, and security settings
- Framer Motion route transitions, count-up stat cards, ripple buttons, animated modals, shimmer skeletons, global Ctrl+K search, and live dashboard widgets
- Full member profile controls with emergency contact, notification preferences, data export print/PDF flow, delete request, and downloadable digital ID card
- PWA support with manifest, service worker, offline fallback, cached notices/payment history, and connection-lost banner
- World-class public homepage with glass navigation, animated hero/stats, dynamic notices/events/gallery/blogs, donation CTA, confetti success feedback, and nonprofit-style Bengali presentation
- Admin-controlled homepage extras: WhatsApp button, news ticker, countdown, Google Maps, committee, achievements, testimonials, partners, YouTube/Facebook embeds, trust badges, notice share modal, cookie consent, and lightbox gallery

## Tech Stack

- React + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- ImgBB image uploads
- Recharts analytics charts
- PDFKit receipt generation
- QRCode payment verification
- Twilio SMS/WhatsApp notifications
- Headless UI, react-hot-toast, and Framer Motion for frontend interactions
- NProgress, React Share, Yet Another React Lightbox, and React IS for homepage UX and chart compatibility
- Socket.IO presence updates, node-cron jobs, react-quill, react-colorful, browser image compression, Zustand, and PWA service worker assets

## Project Structure

```text
.
|-- client/          # React frontend
|-- server/          # Express backend following MVC structure
|-- docs/            # Planning and project notes
`-- package.json     # Root scripts for the full app
```

## Development

Install dependencies:

```bash
npm install
npm install --workspace client
npm install --workspace server
```

Run the app during development:

```bash
npm run dev
```

Run only the API:

```bash
npm run server
```

Run only the client:

```bash
npm run client
```

Seed sample dashboard data:

```bash
npm run seed
```

The seed command adds demo members, pending registrations, finance records, donations, expenses, notices, meetings, tours, activities, rules, gallery photos, blogs, notifications, and audit logs. Demo admin login is `admin@gmail.com` with password `123456`; phone login still works with `01700000000`. Demo member phones are `01710000001` to `01710000006`; their password is `Member@123`.

Environment variables must be created from the example files. Never commit real credentials.

## Environment

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_ACCESS_EXPIRES_IN=7d
IMGBB_API_KEY=your_imgbb_api_key
ADMIN_BOOTSTRAP_SECRET=replace_with_a_temporary_admin_setup_secret
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=123456
SEED_ADMIN_PHONE=01700000000
TWILIO_ACCOUNT_SID=optional_twilio_account_sid
TWILIO_AUTH_TOKEN=optional_twilio_auth_token
TWILIO_SMS_FROM=optional_twilio_sms_sender
TWILIO_WHATSAPP_FROM=optional_twilio_whatsapp_sender
```

Member, donation, and payment phone numbers are validated in Bangladeshi mobile format, such as `017XXXXXXXX`.

Create `client/.env` from `client/.env.example` when needed:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Admin Setup

Use `POST /api/v1/auth/bootstrap-admin` with the local `ADMIN_BOOTSTRAP_SECRET` to create the first admin if one does not already exist.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Documentation

- [Development steps](docs/development-steps.md)
- [API overview](docs/api-overview.md)
