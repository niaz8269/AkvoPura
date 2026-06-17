# Play Store Launch Checklist

Step-by-step. Tick each box as you finish. Realistic timeline: **3 weeks** from
today (most of it is mandatory Google review wait).

---

## Phase 1 — Privacy policy hosting (15 min, no cost)

We generated `PRIVACY_POLICY.md` at the repo root. Google requires a publicly
accessible URL. Fastest free option: GitHub Pages.

- [ ] Open https://github.com/niaz8269/AkvoPura/settings/pages
- [ ] Under "Source" pick **Deploy from a branch**
- [ ] Branch: `main`, folder: `/ (root)`
- [ ] Click **Save**
- [ ] Wait ~2 minutes
- [ ] Your privacy policy will be live at:
  ```
  https://niaz8269.github.io/AkvoPura/PRIVACY_POLICY
  ```
  (note: `.md` extension is dropped, GitHub Pages renders Markdown as HTML)
- [ ] Test the URL — confirm the page loads with the privacy policy text

---

## Phase 2 — Google Play Console account ($25, ~1 hour + 1-2 days verification)

Google now requires identity verification for new developer accounts.

- [ ] Open https://play.google.com/console
- [ ] Sign in with `webai.auto@gmail.com` (or a dedicated business Gmail)
- [ ] Click **Create developer account**
- [ ] Pick **Organisation** account type (NOT Personal — easier for a business)
- [ ] Fill organisation details:
  - Organisation name: `AkvoPura Mineral Water`
  - Address: your business address in Timergara
  - Website: leave blank (or your future site)
  - Phone: business phone
- [ ] Pay $25 USD one-time registration fee with credit/debit card
- [ ] Google emails identity verification instructions — usually CNIC scan + a
      utility bill. Submit them.
- [ ] **Wait 1-2 days** for Google to verify. Until verified, you cannot publish
      anything.

---

## Phase 3 — Visual assets (1-2 hours)

You have:
- ✅ App icon (already `mobile/assets/brand/akvopura-brand.png`, 1024x1024)

You still need:
- [ ] **Feature graphic** (1024x500 PNG/JPG) — banner shown at top of your Play
      Store page. Can be a simple branded image: AkvoPura logo + tagline
      "Pure water, pure trust" on a blue gradient background.
- [ ] **Phone screenshots** (minimum 2, recommended 4-8, 1080x1920 portrait):
      - [ ] Customer Home (showing balance + place-order CTA)
      - [ ] Customer Order screen (showing product catalog)
      - [ ] Customer Bills history
      - [ ] Salesman Sell tab with customer picker
      - [ ] Manager Branch overview
      - [ ] Owner dashboard
      - To take screenshots in Expo Go: power button + volume down, OR use the
        device's normal screenshot gesture.

Tools to create the feature graphic (free):
- https://www.canva.com (search "Google Play feature graphic" template)
- Or Figma if you already use it

---

## Phase 4 — Create the app in Play Console (30 min)

After identity is verified:

- [ ] Play Console → **All apps** → **Create app**
- [ ] Fill the create-app form:
  - App name: `AkvoPura`
  - Default language: `English (US)` (or `English (UK)`)
  - App type: `App` (not Game)
  - Free or paid: `Free`
  - Confirm developer program policies + US export laws — tick both boxes
- [ ] Click **Create app**

You'll land on the app dashboard with a checklist sidebar.

---

## Phase 5 — Fill all the listing sections (1 hour)

Use the copy from `PLAY_STORE_LISTING.md` for each of these:

- [ ] **App access** — pick "All functionality is available without special
      access". Reason: customers self-register through the in-app form. Add
      a note: "Customer accounts require branch manager approval after
      sign-up; managers approve within 24 hours."
- [ ] **Ads** — pick "No, my app does not contain ads"
- [ ] **Content rating** — fill the questionnaire (all answers in
      `PLAY_STORE_LISTING.md` § Content rating)
- [ ] **Target audience** — pick 18+ (water delivery is for adults)
- [ ] **News app** — pick "Not a news app"
- [ ] **COVID-19 contact tracing** — pick "Not a contact-tracing or status app"
- [ ] **Data safety** — fill the questionnaire (answers in
      `PLAY_STORE_LISTING.md` § Data safety form answers)
- [ ] **Government app** — pick "Not a government app"
- [ ] **Financial features** — pick "None of these features"
- [ ] **Health** — pick "None of these features"

### Main store listing
- [ ] **App name**: `AkvoPura`
- [ ] **Short description**: copy from `PLAY_STORE_LISTING.md`
- [ ] **Full description**: copy from `PLAY_STORE_LISTING.md`
- [ ] **App icon**: upload `mobile/assets/brand/akvopura-brand.png`
- [ ] **Feature graphic**: upload the 1024x500 you created in Phase 3
- [ ] **Phone screenshots**: upload at least 2 (the more the better)

### Privacy policy
- [ ] **Privacy policy URL**: paste the GitHub Pages URL from Phase 1

### Category and tags
- [ ] **App category**: `Business`
- [ ] **Tags**: `delivery`, `water`, `business`, `inventory` (Google suggests
      tags from a list — pick what fits)

### Contact details
- [ ] **Email**: `akvopura4@gmail.com`
- [ ] **Phone**: business phone
- [ ] **Website**: leave blank or add later

---

## Phase 6 — Build the production AAB (~15 min build time)

`eas.json` already has a `production` profile that builds an AAB (Android App
Bundle) — required by Play Store.

- [ ] Open PowerShell in `E:\Work\AkvoPura\mobile`
- [ ] Run:
  ```powershell
  npx eas-cli@latest build --platform android --profile production
  ```
- [ ] When prompted for keystore — **reuse the one from your preview build**
      (Expo offers this automatically — say Yes)
- [ ] Wait ~15-20 min for cloud build
- [ ] Download the `.aab` file from the build page

---

## Phase 7 — Closed testing track (14 day MANDATORY wait)

Google requires every new app to run a closed test with at least 12 testers
for at least 14 consecutive days before going to production.

- [ ] Play Console → your app → **Testing** → **Closed testing**
- [ ] **Create a new track** named "Internal launch"
- [ ] Upload the `.aab` you built in Phase 6
- [ ] Add release name: `1.0.0` and release notes (e.g. "First public release")
- [ ] **Tester list**: create a new email list
- [ ] **Recruit 12 testers** (real people with Gmail addresses):
  - Your 2 branch managers
  - 4-6 salesmen
  - 4-6 friendly customers
- [ ] Add their Gmail addresses to the tester list
- [ ] Send each of them the **opt-in URL** that Play Console generates — they
      tap it on their phone, accept, then they can install the app from the
      Play Store
- [ ] **Each tester must install the app and use it for at least 14 days**.
      Track this in Play Console under "Tester activity".

---

## Phase 8 — Production release (after 14-day test passes)

- [ ] Play Console → your app → **Production** → **Create new release**
- [ ] Upload the same `.aab` (or build a new version if you fixed bugs from
      the closed test)
- [ ] Add release notes
- [ ] Submit for review
- [ ] **Google review: 3-7 days** typically. They check the app for policy
      compliance.
- [ ] Once approved, your app goes live on Play Store. Customers can find
      and install it.

---

## Total timeline summary

| Phase | Time | Cost |
|---|---|---|
| 1. Privacy policy hosting | 15 min | $0 |
| 2. Play Console account + verification | 1 hr + 1-2 days wait | $25 |
| 3. Visual assets | 1-2 hours | $0 |
| 4. Create app | 30 min | $0 |
| 5. Fill listing | 1 hour | $0 |
| 6. Build AAB | 15-20 min | $0 (EAS free tier) |
| 7. Closed test | 14 days mandatory wait | $0 |
| 8. Production review | 3-7 days | $0 |

**Total: ~3 weeks, $25 one-time cost.**

---

## Things I (Claude) will handle when you're ready

- Bumping the app version number for each new AAB build
- Helping you write release notes
- Helping debug any Google policy rejections
- Iterating on the privacy policy if Google asks for changes

Just ping me at each phase.
