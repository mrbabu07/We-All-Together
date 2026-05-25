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

Step 1 runs the React client only. The Express API will be added in Step 2.

Environment variables must be created from the example files. Never commit real credentials.
