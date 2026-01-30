# Running MudBase locally

You need **two processes**: backend (API) and frontend (Next.js). The frontend proxies `/api/*` to the backend.

## Prerequisites

- **Node.js** ≥ 20
- **npm** (or Node.js, which includes npm)
- **MongoDB** (main DB)
- **MySQL** (Auth.js session store)

## 1. Backend

```bash
cd backend
npm install
```

**Config:** Backend reads `config/config-mudbase.yaml`. Copy from the template and fill in DB URLs and secrets:

```bash
cp config/config-mudbase-template.yaml config/config-mudbase.yaml
# Edit config/config-mudbase.yaml:
#   - db: MongoDB host, port, dbse, user, pswd
#   - auth.sessdb: MySQL for Auth.js sessions (host, port, dbse, user, pswd)
#   - auth.authSecret: random string (e.g. openssl rand -base64 32)
#   - auth.frontUrl: http://localhost:3000   (must match where the Next app runs)
```

Start the backend:

```bash
npm start
```

Backend listens on **port 7787** (or whatever `server.port` is in config).

## 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Frontend runs on **http://localhost:3000** (or `PORT` env).
- In dev, Next.js rewrites `/api/*` to `http://localhost:7787/api/*` (see `next.config.ts`; override with `SERVER_PORT` if your backend uses another port).
- The dev script may open the browser automatically; otherwise open **http://localhost:3000**.

## Summary

| Service   | Command     | URL                    |
|----------|-------------|------------------------|
| Backend  | `npm start` (in backend/) | http://localhost:7787 |
| Frontend | `npm run dev` (in frontend/)   | http://localhost:3000 |

Use **http://localhost:3000** in the browser; the app will call the backend via the proxy.
