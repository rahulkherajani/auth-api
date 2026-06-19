# auth-api

A TypeScript/Express authentication API that uses Redis as its only data store — no SQL, no ORM.

## Video

https://github.com/user-attachments/assets/b4693ae3-a2b0-49ee-8f0f-5ee146ac19b3

## Endpoints

```
POST /user/register
POST /user/login
GET  /health
```

That's it for now. Refresh and logout are stubbed as TODOs.

## How it works

**Registration** stores `user:{username}` as a Redis hash containing the bcrypt-hashed password, creation timestamp, and lockout state. Uniqueness is enforced with `HSETNX` — atomic by design, no race conditions.

**Login** runs `bcrypt.compare` whether the user exists or not (constant-time behaviour, no user enumeration). On success it issues a short-lived JWT (15m) and an opaque refresh token. Both are backed by Redis keys with a 7-day TTL:

```
session:{jti}          →  username
refresh:{refreshToken}  →  jti
```

After 5 failed attempts the account locks for 15 minutes. All thresholds are configurable via env.

## Running locally

You need Node 24 and a Redis instance:

```bash
docker run -p 6379:6379 redis:7-alpine
```

Then:

```bash
cp .env.example .env
# set JWT_SECRET to something random and at least 32 chars

npm install
npm run dev
```

## Tests

Integration tests spin up a real Redis container via Testcontainers — no local Redis needed, just Docker.

```bash
npm run test:unit          # fast, no Docker
npm run test:integration   # needs Docker
npm run test:coverage      # runs both, reports coverage
```

## Environment variables

See `.env.example` — every variable is validated at startup with Zod. Missing or malformed values will exit immediately with a clear error.

| Variable | Description |
|---|---|
| `JWT_SECRET` | HS256 signing secret, min 32 chars |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_TTL` | Refresh token TTL in seconds |
| `BCRYPT_ROUNDS` | bcrypt cost factor |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | Max requests per IP per window |
| `LOCKOUT_THRESHOLD` | Failed attempts before lockout |
| `LOCKOUT_DURATION` | Lockout duration in seconds |

## What's missing

- `POST /user/refresh` — refresh token is stored in Redis but the endpoint doesn't exist yet
- `POST /user/logout` — needs to delete both `session:` and `refresh:` keys
- Protected routes — `verifyAccessToken` needs to be implemented and wired up as middleware
