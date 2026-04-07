# uevent

Full-stack event platform. Organizers create and publish events; attendees discover, buy tickets, and get QR-code confirmations.

**Stack:** React 18 · NestJS · PostgreSQL 16 · TypeORM · Stripe · Google OAuth · Nodemailer · Docker

---

## Quick start

```bash
git clone ssh://git@git.green-lms.app:22022/challenge-528/vvalko-9903.git
cd uevent
cp .env.example .env
docker compose up --build
```

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | http://localhost:3000          |
| Backend  | http://localhost:5000          |

---

## Local dev (without Docker)

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend (separate terminal)
cd frontend && npm install && npm start
```

Frontend proxies `/api` to `localhost:5000` automatically.

---

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend port (default `5000`) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `JWT_ACCESS_SECRET` | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password |
| `MAIL_FROM` | Sender address |
| `FRONTEND_URL` | Used in email links |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `REACT_APP_API_URL` | Backend URL for frontend (e.g. `http://localhost:5000`) |

In `development`, real SMTP is used only if `MAIL_HOST`/`MAIL_USER`/`MAIL_PASS` are set to real values; otherwise emails are written to stdout.

---

## Payments

In development, Stripe is replaced by a mock form at `/payment/mock` — enter any card number, any future date, any CVV. A real ticket and QR code are created.

In production, set `NODE_ENV=production` and configure both Stripe variables.

---

## API

Full Swagger docs at `/api/docs`. Key endpoints:

| Method | Path | Auth |
|---|---|---|
| `POST` | `/auth/register` | — |
| `POST` | `/auth/login` | — |
| `POST` | `/auth/refresh` | — |
| `GET` | `/events` | optional |
| `POST` | `/events` | user + company |
| `POST` | `/payments/mock-pay` | user |
| `GET` | `/tickets/:id` | owner |
| `GET` | `/admin/stats` | admin |
