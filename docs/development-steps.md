# Development Steps

Deployment is intentionally skipped for now.

## Completed

1. Project setup
   - React client, Express server, workspaces, Tailwind, repo hygiene.

2. Backend setup
   - Express app, MongoDB connection, health route, global error handling.

3. Auth system
   - User model, bcrypt password hashing, JWT login, protected profile route, admin bootstrap.

4. Registration and admin approval system
   - Public registration, pending status, registration fee capture, admin approve/reject.

5. Role-based access control
   - `protect` middleware and reusable role authorization middleware.

6. Financial system
   - Monthly fee settings, member payment submission, paid/unpaid tracking, expenses, donations, verification flows.

7. Organization features
   - Notices, meetings, tours, educational activities, rules, and member directory APIs.

8. Frontend structure
   - React Router, Axios API client, auth context, protected routes, shared layout, reusable UI components.

9. Admin dashboard
   - Pending approvals, finance settings, payment/donation verification, expense management, content management, member management.

10. Member dashboard
    - Private updates, rules, meetings, tours, activities, member directory, monthly payment, payment history.

11. Public site
    - Public homepage, public notices/meetings/tours/activities/rules, registration entry, donation submission.

12. ImgBB image uploads
    - Admin image upload endpoint, content image fields, image rendering on admin/member/public content.

13. Admin management completion pass
    - Edit/delete content, edit/delete expenses, edit/update users, public meetings and tours display.

14. Operations and communication pass
    - Audit logs, admin backup export, member notifications, printable receipts, public verified donation wall, and profile document uploads.

15. UI and reporting pass
    - Confirmation dialog, searchable admin/member lists, finance category summaries, member photo display, and Bengali/English navigation toggle.

16. Workflow completion pass
    - Meeting minutes and attendance tracking, tour participant/cost tracking, member-visible workflow summaries, and admin password reset.

17. Demo seed data
    - Repeatable seed script for visual testing across members, registrations, payments, donations, expenses, content, meetings, tours, notifications, and audit logs.

18. Gallery and blog community features
    - Public/member gallery, member-created blogs, likes, comments, moderation controls, and seeded sample posts/photos.

19. Finance analytics and PDF receipts
    - Admin finance analytics endpoint, income vs expense bar chart, donation trend chart, overdue fee tracker, additive receipt fields, and PDF receipt downloads.

20. QR payment verification
    - Payment QR generation, verification URLs, admin scan page, QR-enabled printable/PDF receipts, and admin payment lookup route.

21. SMS and WhatsApp notification pass
    - Twilio-ready SMS/WhatsApp sending service, admin notification trigger settings, manual message endpoint, first-day monthly fee reminder scheduler, notice/meeting message triggers, and Bangladeshi phone validation.

22. Meeting poll system
    - Poll collection, admin poll creation attached to meetings, one-vote-per-member voting, live result counts/charts, seed polls, backup export, and poll API docs.

23. Event RSVP system
    - Additive meeting/tour RSVP fields, member RSVP endpoints/buttons, admin RSVP counts/lists, seeded RSVP responses, and API documentation.

24. UI improvement pass
    - Bengali default navigation with English toggle, mobile bottom navigation, status color consistency, 44px touch targets, loading skeletons, and member tab deep links.

25. Frontend redesign pass
    - Indigo/gray design system, Hind Siliguri and Inter fonts, reusable UI primitives, Headless UI dialogs/dropdowns, Framer Motion cards, toast notifications, dashboard sidebars/top bars, public homepage refresh, and multi-step registration.

26. Advanced controls and PWA pass
    - `/admin/controls` seven-tab control panel, site/finance/member/content/notification/appearance/security settings, CSV member import/export, PDF reports, blog moderation, gallery albums, notice interactions, dashboard widgets, Socket.IO presence, member profile data controls, PWA manifest/service worker, global search, route lazy loading, and advanced UI animations.

27. Public homepage redesign
    - Fixed glass navbar, full-viewport animated hero, dynamic public stats, about/story cards, latest notices, upcoming events, donation form with quick amounts and confetti success, gallery masonry preview, approved blog cards, membership CTA, nonprofit footer, SEO meta tags, and public settings stats.

## Verification Command Set

Run these before every push:

```bash
npm test
npm run lint
npm run build
```

## Demo Seed Command

Run this when you want sample data in the connected MongoDB database:

```bash
npm run seed
```

## Local URLs

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/v1/health
```

## Current Main Branch

Every completed step above has been committed and pushed to `main`.
