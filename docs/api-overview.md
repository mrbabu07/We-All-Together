# API Overview

Base URL:

```text
http://localhost:5000/api/v1
```

## Public Routes

```text
GET  /health
GET  /settings/public
POST /registrations
POST /donations
GET  /donations/verified
POST /uploads/payment-proof
GET  /blogs/public
GET  /gallery/public
GET  /notices/public
GET  /meetings/public
GET  /tours/public
GET  /activities/public
GET  /rules/public
```

`GET /settings/public` also returns homepage stats: `totalMembers`, `yearlyDonation`, `completedActivities`, and `yearsActive`.

## Auth Routes

```text
POST /auth/bootstrap-admin
POST /auth/login
GET  /auth/me
PATCH /auth/me
PATCH /auth/change-password
POST /uploads/profile-document
```

`POST /auth/login` accepts `identifier` as either an email address or a Bangladeshi phone number.

## Admin Routes

```text
GET    /registrations/pending
PATCH  /registrations/:id/approve
PATCH  /registrations/:id/reject

GET    /members/users
PATCH  /members/:id
PATCH  /members/:id/access
DELETE /members/:id

PATCH  /settings/registration-fee
PATCH  /settings/monthly-fee
PATCH  /settings/donation-number
PATCH  /settings/notification-settings

GET    /payments
GET    /payments/:id
GET    /payments/monthly-status?month=YYYY-MM
PATCH  /payments/:id/verify
PATCH  /payments/:id/reject

GET    /polls
POST   /polls
GET    /polls/:id

GET    /donations
PATCH  /donations/:id/verify
PATCH  /donations/:id/reject

GET    /audit-logs
GET    /backup
GET    /finance/analytics
GET    /admin-controls
PATCH  /admin-controls
GET    /admin-controls/widgets
GET    /admin-controls/search?q=query
GET    /admin-controls/finance-report.pdf
GET    /admin-controls/members-report.pdf
POST   /admin-controls/members/import
POST   /admin-controls/members/bulk-approve
POST   /admin-controls/members/bulk-reject
PATCH  /admin-controls/members/:id/suspension
POST   /admin-controls/finance/manual-fee
POST   /admin-controls/finance/waive-fee
GET    /notifications
POST   /notifications/broadcast
POST   /notifications/send
GET    /receipts/donations/:id
GET    /receipts/payments/:id
GET    /receipts/registrations/:id
GET    /receipts/:id
PATCH  /members/:id/password
PATCH  /meetings/:id/attendance
PATCH  /meetings/:id/advanced
GET    /meetings/:id/rsvp
PATCH  /tours/:id/participants
GET    /tours/:id/rsvp
PATCH  /blogs/:id/moderation

GET    /blogs/members
DELETE /blogs/:id
DELETE /blogs/:id/comments/:commentId
PATCH  /blogs/:id

GET    /gallery/members
DELETE /gallery/:id
PATCH  /gallery/:id

GET    /expenses
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id

POST   /uploads/image
```

## Admin Content Routes

Each content module supports public read, member read, admin create, admin update, and admin delete.

```text
GET    /notices/public
GET    /notices/members
POST   /notices
PATCH  /notices/:id
DELETE /notices/:id
POST   /notices/archive-bulk
POST   /notices/:id/read
POST   /notices/:id/reactions
POST   /notices/:id/comments

GET    /meetings/public
GET    /meetings/members
POST   /meetings
PATCH  /meetings/:id
DELETE /meetings/:id

GET    /tours/public
GET    /tours/members
POST   /tours
PATCH  /tours/:id
DELETE /tours/:id

GET    /activities/public
GET    /activities/members
POST   /activities
PATCH  /activities/:id
DELETE /activities/:id

GET    /rules/public
GET    /rules/members
POST   /rules
PATCH  /rules/:id
DELETE /rules/:id
```

## Member Routes

```text
GET  /members
GET  /payments/my
POST /payments/monthly
GET  /polls
GET  /polls/:id
POST /polls/:id/vote
GET  /notices/members
GET  /meetings/members
POST /meetings/:id/rsvp
GET  /tours/members
POST /tours/:id/rsvp
POST /tours/:id/register
POST /tours/:id/feedback
GET  /activities/members
GET  /rules/members
GET  /blogs/members
POST /blogs
POST /blogs/:id/like
POST /blogs/:id/comments
DELETE /blogs/:id
DELETE /blogs/:id/comments/:commentId
GET  /gallery/members
POST /gallery
DELETE /gallery/:id
GET  /notifications/my
PATCH /notifications/:id/read
PATCH /notifications/my/read-all
GET  /members/my-data
GET  /members/my-activity
POST /members/delete-request
GET  /receipts/payments/:id
GET  /receipts/registrations/:id
GET  /receipts/:id
```

## Auth Header

Protected routes require:

```text
Authorization: Bearer <jwt_token>
```

## Phone and Message Notes

Phone inputs for users, donations, and payment submissions are normalized and validated as Bangladeshi mobile numbers, for example `017XXXXXXXX`.

`POST /notifications/send` creates in-app notifications and can send SMS, WhatsApp, or both through Twilio when the server has Twilio credentials configured. Notice, meeting, and monthly fee reminder SMS/WhatsApp triggers are controlled by `PATCH /settings/notification-settings`.
