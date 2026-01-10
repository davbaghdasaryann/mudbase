# MudBase Setup Guide

This is a full-stack application with a Next.js frontend and Express backend. Follow these steps to get started.

## Prerequisites

- Node.js >= 20.0.0 (you have v23.11.0 ✅)
- Yarn 4.x (you have 4.10.3 ✅)
- MongoDB instance (for main database)
- MySQL instance (for session storage)

## Quick Start

### 1. Install Dependencies

Install dependencies for all three parts of the project:

```bash
# Install backend dependencies
cd backend
yarn install

# Install frontend dependencies
cd ../frontend
yarn install

# Install backend-tools dependencies (optional, for database tools)
cd ../backend-tools
yarn install
```

### 2. Configure Backend

The backend uses a YAML configuration file at `backend/config/config-mudbase.yaml`.

**Important:** The current config file points to remote databases. For local development, you may need to:

- Update MongoDB connection settings (host, port, user, password)
- Update MySQL connection settings for session storage
- Update `authSecret` if needed
- Update email settings (Mailgun) if you plan to test email features

Current config shows:

- MongoDB: `3.75.127.170:37017`
- MySQL: `3.75.127.170:33306`
- Frontend URL: `http://localhost:3008`

### 3. Configure Frontend

The frontend expects environment variables. Create a `.env.local` file in the `frontend/` directory:

```env
PORT=3008
SERVER_PORT=7787
NEXTAUTH_URL=http://localhost:3008
NEXTAUTH_SECRET=7UazozzlGyvipSdF77+tB97affb0bGoyG87YbR50Gd0=
```

### 4. Database Setup

#### MySQL (Session Database)

The backend uses Drizzle ORM for MySQL. Run migrations:

```bash
cd backend
yarn drizzle
```

#### MongoDB (Main Database)

Ensure MongoDB is running and accessible at the configured host/port. The backend will initialize the connection on startup.

### 5. Start the Application

You need to run both backend and frontend:

#### Terminal 1 - Backend:

```bash
cd backend
yarn start
```

The backend will start on `http://localhost:7787` (or the port specified in config)

#### Terminal 2 - Frontend:

```bash
cd frontend
yarn dev
```

The frontend will start on `http://localhost:3008` (or PORT from env)

### 6. Access the Application

Open your browser and navigate to:

- Frontend: http://localhost:3008
- Backend API: http://localhost:7787/api

## Project Structure

- `backend/` - Express/TypeScript backend API
- `frontend/` - Next.js/React frontend application
- `backend-tools/` - Database migration and utility tools
- `shared/` - Shared TypeScript modules

## Troubleshooting

1. **Database Connection Issues**: Verify your MongoDB and MySQL instances are running and accessible
2. **Port Conflicts**: Check if ports 3008 (frontend) and 7787 (backend) are available
3. **Missing Dependencies**: Run `yarn install` in each directory
4. **Type Errors**: Run `yarn check-types` in the backend directory

## Development Scripts

### Backend

- `yarn start` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn check-types` - Type check TypeScript
- `yarn drizzle` - Run database migrations

### Frontend

- `yarn dev` - Start Next.js development server
- `yarn build` - Build for production
- `yarn lint` - Run ESLint

## Notes

- The project uses Yarn v4 (Berry) with zero-installs. Dependencies should be committed to the repository.
- Configuration files contain production credentials - ensure they are not committed to public repositories
- Check `TODO.md` for known issues and planned features
