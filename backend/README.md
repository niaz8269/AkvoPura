# AkvoPura Backend

NestJS + Postgres + Prisma + JWT auth.

Slice B-1 ships the bare minimum: users table, seed data matching the
mobile app's mock accounts, and a working `/auth/login` endpoint.

## One-time setup

### 1. Install Docker Desktop

Download from <https://www.docker.com/products/docker-desktop/> and install.
Open Docker Desktop once after install so it starts the engine.

### 2. Install Node dependencies

From this `backend/` folder:

```sh
npm install
```

### 3. Create your local `.env`

**macOS / Linux:**
```sh
cp .env.example .env
```

**Windows (cmd):**
```bat
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

(You can leave the defaults — they match `docker-compose.yml`.)

### 4. Start Postgres

```sh
docker compose up -d
```

This runs Postgres 16 in a container named `akvopura-postgres` on
port `5432`. To stop it later: `docker compose down`.

### 5. Create the database schema

```sh
npm run prisma:migrate -- --name init
```

This creates the `users` table.

### 6. Seed the demo accounts

```sh
npm run seed
```

Output should list all 8 accounts (owner, manager_t, manager_s, pets,
pets2, cans, cans2, customer) — the same logins the mobile app already
uses.

## Daily development

```sh
docker compose up -d        # start postgres if not already running
npm run start:dev           # watches src/, restarts on change
```

API will be on <http://localhost:3000>.

## Quick smoke test

```sh
# Health check
curl http://localhost:3000/health

# Login as owner
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"owner","password":"owner"}'
```

You'll get back a JSON `{ token, user }`. Use the token as a Bearer
header to hit `/auth/me`:

```sh
curl http://localhost:3000/auth/me -H "Authorization: Bearer <TOKEN>"
```

## Reset everything

```sh
npm run prisma:reset    # drops + recreates schema, re-runs seed
```

## What's next

Slice B-2 will wire the mobile app's login screen to call this endpoint
instead of the local `mockAccounts` array.
