# Deploying AkvoPura to Render

This guide walks you through hosting the AkvoPura backend on **Render**
(free tier) so your team can use the mobile app from anywhere — not just
on the same Wi-Fi as your laptop.

You'll do this **once**. After that, every `git push` to GitHub
auto-deploys.

---

## What you need before starting

1. A **GitHub** account (free) — https://github.com/signup
2. A **Render** account (free) — https://render.com/register — sign up
   with the same email that owns your GitHub repo. No credit card needed.
3. The AkvoPura code pushed to a GitHub repository (any name; can be
   private).

---

## Step 1 — Push the code to GitHub

If you haven't already, create a new empty repository on GitHub (e.g.
`akvopura`), then from your project folder run:

```
git remote add origin https://github.com/YOUR_USERNAME/akvopura.git
git branch -M main
git push -u origin main
```

(If `git remote add` says it already exists, you're fine — skip it.)

---

## Step 2 — Connect Render to your repo

1. Go to https://dashboard.render.com
2. Click the **+ New** button (top right) → **Blueprint**
3. Click **Connect** next to GitHub. Authorise Render.
4. Pick the `akvopura` repo. Click **Connect**.
5. Render reads `render.yaml` from the repo root and shows you the plan:
   - 1 web service: `akvopura-backend` (free)
   - 1 PostgreSQL database: `akvopura-postgres` (free)
6. It asks you to set the **JWT_SECRET** secret. Generate a strong one
   by opening any terminal and running:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```
   Paste the output into the JWT_SECRET field.
7. Click **Apply**. Render starts provisioning.

The first deploy takes about **5 minutes** (subsequent deploys take ~2).
You'll see the build logs stream live. Wait for the status to turn green.

---

## Step 3 — Seed the database

The fresh database has no users yet. To create the owner / managers /
salesmen / customers, run the seed script once via Render's shell:

1. In the Render dashboard, click the **akvopura-backend** service
2. Click **Shell** in the left sidebar
3. Type:
   ```
   npm run seed
   ```
4. Hit Enter. You should see "Seeded N users / M branches" output.

**Important:** the seed includes default passwords. Once you've logged
into each role at least once and changed those passwords, never run
`npm run seed` again in production — it would re-create the demo users.

---

## Step 4 — Find your backend URL

In the Render dashboard → akvopura-backend → top of the page you'll see
a URL like:

```
https://akvopura-backend.onrender.com
```

Open it in a browser and add `/health` to the end:

```
https://akvopura-backend.onrender.com/health
```

You should see `{"status":"ok","service":"akvopura-api","ts":...}`.
That confirms the backend is live.

---

## Step 5 — Point the mobile app at the deployed backend

In the project folder:

1. Copy `mobile/.env.example` to `mobile/.env`
2. Open `mobile/.env` and set:
   ```
   EXPO_PUBLIC_API_URL=https://akvopura-backend.onrender.com
   ```
   (use your actual URL from Step 4)
3. Stop Expo if it's running (Ctrl+C), then start it again:
   ```
   cd mobile
   npx expo start --tunnel
   ```
   The `--tunnel` flag lets your phone reach Expo even off your home
   Wi-Fi.

Now reload the app on your phone (shake → Reload). It should be hitting
the hosted backend instead of your laptop.

To verify: try logging in with one of the seeded accounts. If it works,
deployment is complete. 🎉

---

## Step 6 — Keep the backend awake (important for the daily cron)

**Render's free tier sleeps the web service after 15 minutes of
inactivity.** That means the daily 6 AM subscription cron may not fire
if no one used the app in the night.

Free fix: set up an external pinger to hit `/health` every 10 minutes.

### Recommended: cron-job.org (free, no signup required for 1 job)

1. Go to https://cron-job.org/en/signup/ (free signup)
2. Click **Create cronjob**
3. Title: `AkvoPura keep-alive`
4. URL: `https://akvopura-backend.onrender.com/health` (your URL)
5. Schedule: **Every 10 minutes**
6. Save.

That's it. The pinger keeps Render awake, the cron fires at 6 AM, and
your subscriptions generate orders reliably.

### Alternative: UptimeRobot (free, 50 monitors)

https://uptimerobot.com — same idea, also free.

---

## Updating the app later

Once Step 1-6 are done, deploys are automatic:

- Edit code locally → `git commit` → `git push origin main`
- Render detects the push, rebuilds, and re-deploys (~2 minutes)
- Migrations apply automatically (`prisma migrate deploy` runs before
  the server starts)
- Mobile app keeps working — no rebuild needed unless you changed
  `EXPO_PUBLIC_API_URL` or native code

---

## Watching out for free-tier limits

| Resource | Free tier | What happens when exceeded |
|---|---|---|
| Backend CPU/RAM | 512 MB RAM, 0.1 CPU | Slow under load — fine for ~10 concurrent users |
| Backend uptime | Sleeps after 15 min idle | Solved by pinger (Step 6) |
| Database size | 1 GB | Need to upgrade or back up + recreate |
| Database lifespan | **90 days** | DB is deleted! Back up before then |
| Bandwidth | 100 GB/month | Way more than you'll use |

For an MVP serving a few hundred customers + a dozen staff, the free
tier is plenty for the first few months. Upgrade to Render's $7/mo
**Starter** plan when you're ready for production traffic — it removes
sleep + lasts indefinitely.

---

## Backing up the database

Once a week (or before the 90-day deadline), in the Render dashboard:

1. Click **akvopura-postgres** → **Backups** tab → **Create Backup**
2. Wait for it to finish, then click **Download** to save the `.sql`
   file to your laptop.

Restore is the reverse — create a new database, then in the Shell run
`psql $DATABASE_URL < backup.sql`.

---

## Troubleshooting

**"Application failed to respond" when I open the URL**
→ The service is asleep (free tier). First request takes 30-60 seconds
to cold-start. Try again.

**Mobile app shows "Cannot reach the server"**
→ Either you forgot to restart Expo after editing `.env`, or the
backend URL is wrong. Open `mobile/.env` and check.

**Manager can see orders but salesman portal is empty**
→ The seed wasn't run. Open Render shell → `npm run seed`.

**I want to wipe all data and start fresh**
→ In Render shell: `npx prisma migrate reset --force`. Warning:
deletes EVERYTHING.

**Cron doesn't seem to fire at 6 AM**
→ Set up the keep-alive pinger (Step 6). The owner can also manually
trigger via Settings → Maintenance → "Generate today's subscription
orders" any time.

---

## Cost summary

| Item | Free tier | Paid tier (when you outgrow free) |
|---|---|---|
| Render Web Service | $0 (sleeps) | $7/mo (always-on) |
| Render PostgreSQL | $0 (90-day expiry) | $7/mo (persistent) |
| cron-job.org pinger | $0 | $0 |
| **Total** | **$0/month** | **$14/month** |

That's it — you're hosted. 🚀
