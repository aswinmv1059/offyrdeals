# OffeyrDeals

Production-ready Progressive Web App for location-based offers with secure coupon redemption, JWT authentication, and RBAC.

## Tech Stack

- Frontend: React (Vite), TailwindCSS, PWA (Manifest + Service Worker + Offline fallback)
- Backend: Node.js, Express.js
- Database: MongoDB
- Security: Helmet, CORS allowlist, JWT auth, RBAC middleware, rate limiting, input validation/sanitization, bcrypt hashing
- Deployment: Docker, Docker Compose, `.env` support

## Project Structure

```text
offeyrdeals/
  client/
  server/
  docker-compose.yml
  README.md
  .env.example
```

## Features

- Register, login, JWT session
- First registered user automatically assigned `ADMIN`
- RBAC roles: `ADMIN`, `VENDOR`, `USER`
- OTP simulation endpoint
- USER offer browsing, category filtering, redeem flow
- Coupon generation with UUID, QR code, 5-minute expiry
- Vendor redemption confirmation with strict checks
- Admin dashboards: users, role management, vendor approval, block/unblock, offers, redemption logs, CSV export
- Audit logs with IP + timestamp
- PWA installable with offline fallback page

## Role Rules

- First account created => `ADMIN`
- Only `ADMIN` can change roles
- `ADMIN` can promote to `VENDOR` and downgrade roles
- Vendor actions require role `VENDOR`/`ADMIN`

## Security Controls

- `helmet` secure headers
- `cors` restricted to `CLIENT_URL`
- bcrypt password hashing
- JWT middleware for protected routes
- Role middleware for RBAC
- `express-validator` input validation
- `express-mongo-sanitize` payload sanitization
- Login rate limiter (10 attempts / 15 mins)
- Coupon anti-reuse via atomic conditional update (`ACTIVE` + not expired only)
- Coupon expiration auto-handled and enforced at redemption
- Redemption and system logs store IP and timestamps

## Database Collections

### Users
- `id`
- `name`
- `email`
- `phone`
- `password` (hashed)
- `role`
- `created_at`
- `isBlocked`
- `isVendorApproved`

### Offers
- `vendor_id`
- `title`
- `description`
- `expiry_date`
- `max_redemptions`
- `category`
- `isActive`

### Coupons
- `coupon_id`
- `user_id`
- `vendor_id`
- `offer_id`
- `status` (`ACTIVE`, `REDEEMED`, `EXPIRED`)
- `expires_at`
- `redeemed_at`

### Redemptions
- `coupon_id`
- `user_id`
- `vendor_id`
- `offer_id`
- `redeemed_at`
- `ip`

### Logs
- `user_id`
- `action`
- `ip`
- `meta`
- `created_at`

## Environment Variables

Copy and edit:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Required:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `VITE_API_URL`

## Local Setup

### 1) Backend

```bash
cd server
npm install
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

### 3) MongoDB

Run local MongoDB on `mongodb://localhost:27017/offeyrdeals`, or use Docker Compose.

## Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

## Seed First Admin (Optional)

```bash
cd server
npm run seed
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `GET /api/auth/me`

### User
- `GET /api/user/offers?category=`
- `POST /api/user/redeem`
- `GET /api/user/coupons`
- `GET /api/user/logs`

### Vendor
- `GET /api/vendor/offers`
- `POST /api/vendor/offers`
- `PUT /api/vendor/offers/:offerId`
- `POST /api/vendor/confirm-redemption`

### Admin
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/role`
- `PATCH /api/admin/users/:userId/approve-vendor`
- `PATCH /api/admin/users/:userId/block`
- `GET /api/admin/offers`
- `GET /api/admin/redemptions`
- `GET /api/admin/system-logs`
- `GET /api/admin/export/csv`

## Deployment

### Backend
- Set production env vars (`NODE_ENV=production`, secure `JWT_SECRET`, production `MONGO_URI`)
- Build and deploy container from `server/Dockerfile`

### Frontend
- Set `VITE_API_URL` to deployed backend URL
- Build and deploy static output from `client/dist` or deploy container from `client/Dockerfile`

## GitHub

Repository name target: `offeyrdeals`

```bash
git init
git add .
git commit -m "Initial production-ready OffeyrDeals PWA"
git branch -M main
git remote add origin https://github.com/<your-username>/offeyrdeals.git
git push -u origin main
```
