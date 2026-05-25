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

## Tech Stack

- React + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- ImgBB image uploads

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
```

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
