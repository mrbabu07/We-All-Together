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
GET  /notices/public
GET  /meetings/public
GET  /tours/public
GET  /activities/public
GET  /rules/public
```

## Auth Routes

```text
POST /auth/bootstrap-admin
POST /auth/login
GET  /auth/me
```

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

GET    /payments
GET    /payments/monthly-status?month=YYYY-MM
PATCH  /payments/:id/verify
PATCH  /payments/:id/reject

GET    /donations
PATCH  /donations/:id/verify
PATCH  /donations/:id/reject

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
GET  /notices/members
GET  /meetings/members
GET  /tours/members
GET  /activities/members
GET  /rules/members
```

## Auth Header

Protected routes require:

```text
Authorization: Bearer <jwt_token>
```
