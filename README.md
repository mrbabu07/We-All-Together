# Dargah Para OIkko Porishod

A MERN organization management system for member registration, admin approval, financial tracking, notices, meetings, tours, activities, and rules.

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
├── client/          # React frontend
├── server/          # Express backend following MVC structure
├── docs/            # Planning and project notes
└── package.json     # Root scripts for the full app
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
