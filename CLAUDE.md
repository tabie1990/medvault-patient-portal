# MedVAULT Campaign — Claude Code Handoff (Updated)

Everything below reflects what was actually confirmed working today, not
just the original plan. Read the status section first — most of the
verification work is already done; your actual job starts at "Your Job
From Here."

---

## STATUS — What's already confirmed working, don't redo this

**Phase 1 (staging deploy pipeline) — fully proven:**
- Deploy user, SSH key, GitHub Environment secrets, workflow file all
  working
- A real deploy succeeded, verified via fresh `dist/` timestamps and
  `curl -I` returning 200
- Rollback script tested and confirmed working, then redeployed the
  good version afterward

**Phase 2 (Playwright) — mostly done:**
- Installed, `tests/smoke.spec.ts` and `playwright.config.ts` exist
- The `doctor login works` test is confirmed against the **real**
  `StaffLogin.tsx` component (see "Confirmed Playwright selectors"
  below) — do not rewrite these selectors without a reason
- A stable test doctor account exists: `test.doctor@med-vault.com`,
  password set directly via database (see gotchas below for why)
- Two tests are still explicitly unconfirmed in their own code
  comments: dashboard-content check, logout — need the real
  layout/header component to fix properly

**Phase 3, Part A (backend verification) — fully proven, not just
compiled:**
- `npm run build` succeeds on the real `package.json` (see gotcha below
  about why an earlier attempt failed)
- Migration applied to staging (`add_package_offers_and_bookings`),
  copied back into git
- Full end-to-end proof, not just individual pieces: a real booking was
  created with correct server-computed pricing (10,500 × 2 children +
  4,500 home service = 25,500, confirmed exactly right), a real Campay
  sandbox payment was requested and completed, and the background
  poller correctly flipped both `status` and `paymentStatus` to `paid`
  automatically — verified directly in the database, not assumed

**What's NOT done — this is your actual job:**
- Homepage doctor cards section
- Homepage Offers & Packages section (calls `GET /packages/offers`,
  booking form, `POST /packages/bookings` +
  `POST /packages/bookings/:bookingRef/payment`)
- Public order-tracking page at `/track/:bookingRef`
- Partner/hospital logo carousel
- Fixing the two remaining unconfirmed Playwright tests once you have
  the real dashboard/layout components in front of you

---

## Real gotchas hit today — read this before you start, not after

**A reconstructed `package.json` is not safe to trust — ever.** Earlier
today, a `package.json` was rebuilt from memory (not the real repo
file) because it wasn't available at the time. It was missing several
real dependencies (`dotenv`, `express-rate-limit`, `helmet`,
`@anthropic-ai/sdk`, `@types/swagger-ui-express`), causing 11 confusing
compile errors that had nothing to do with the actual feature code.
**Always use the repo's real `package.json` and `package-lock.json` —
never regenerate either from assumption.** If a lock file is ever
missing from a repo, generate it with `npm install` and commit it
immediately — CI's `npm ci` step will hard-fail without one.

**Every repo needs a real `.gitignore` — check, don't assume.**
`medvault-patient-portal` had none at all until today. Confirm one
exists (`Get-ChildItem -Force -Filter ".gitignore"` on Windows,
`ls -la` on Linux) before assuming `node_modules`/`dist`/`.env` are
excluded.

**Bash history expansion silently mangles passwords containing `!`.**
An interactive bash command like
`node -e "...'MyPassword!'..."` fails with
`-bash: !',: event not found` and **never actually runs** — this cost
real time today because the failure looked like a completely different
problem (an "invalid credentials" error elsewhere, chased for several
messages before the real cause was found). If a test password or any
shell-embedded value contains `!`, either escape it properly or — much
simpler — just avoid `!` in any value that will be typed into an
interactive bash session.

**PowerShell's `curl.exe` mangles JSON body quoting unpredictably.**
Passing `-d '{\"key\": \"value\"}'` to `curl.exe` from PowerShell does
not behave like bash — the escaped quotes can be passed through
literally, producing malformed JSON server-side. Prefer
`Invoke-RestMethod` with a `ConvertTo-Json`-built body for any
PowerShell-side API testing; it avoids the native-executable
argument-passing quoting problem entirely.

**`prisma migrate dev` needs `CREATEDB` granted to the database role;
`migrate deploy` does not.** This is why production (which only ever
uses `migrate deploy`) never hit this, but staging did the first time
`migrate dev` was run there. Fix: `ALTER ROLE medvault_app WITH CREATEDB;`
— fine to leave granted on staging permanently, deliberately never
granted on production.

**Campay's sandbox caps every transaction at 25.00 XAF.** Real
error text: `"This is a demo system. Maximum amount is 25.00 XAF"`. Any
real payment-flow test on staging needs an offer priced under that cap
— a temporary cheap test offer (a few XAF, deleted after) is the
pattern already used successfully today, rather than trying to test
against the real Back-to-School Plus price on staging.

**Never copy these six variables between environments, for real safety
reasons, not just convention:**
- `DATABASE_URL` — would point staging at the real production database
- `JWT_SECRET` — must stay genuinely separate per environment
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_VERIFY_TOKEN` — staging deliberately has no WhatsApp
  configured at all, specifically so testing there can never reach a
  real patient
- `CAMPAY_TOKEN`, `CAMPAY_BASE_URL` — staging uses Campay's own sandbox
  credentials, never the real production token, so testing can never
  move real money

Every other variable (AI API keys, email/SMTP, Daily.co, platform fee
percentage) is fine to share between environments.

**Confirmed Playwright selectors — from the real `StaffLogin.tsx`, not
guessed:**
- The identifier input has **no** `name`, `id`, or `type` attribute at
  all — it's targeted by position: `page.locator('form input').first()`
- The password input has `type="password"` — reliably:
  `page.locator('input[type="password"]')`
- Submit button: `button[type="submit"]` — don't match by text, the
  label is a translated string, not fixed English
- Successful doctor login navigates to `/doctor` — confirmed directly
  from the component's own `navigate()` call

**Stable test doctor account for Playwright:**
- Email: `test.doctor@med-vault.com`
- Password: set directly via database (bcrypt hash), not via the
  temp-password + change-password API flow — that flow works fine in
  principle, but hit the bash `!` gotcha above during today's setup.
  If you ever need to reset it again, generate a fresh bcrypt hash with
  `node -e "..."` using a password **without** `!` in it, and update
  directly:
  ```sql
  UPDATE "Doctor" SET "passwordHash"='<hash>', "mustChangePassword"=false
  WHERE email='test.doctor@med-vault.com';
  ```

---

## Your job from here

### Build the frontend, in priority order

1. **Doctor cards on the homepage** — backend already fully returns
   `id, fullName, specialty, consultationTypes, teleconsultFee, photoUrl`
   via `GET /doctors/browse`. Fastest piece, do this first.
2. **Offers & Packages section on the homepage** — calls
   `GET /packages/offers` (confirmed working, returns Back-to-School
   Plus with real price/items), a booking form matching the same
   fields the WhatsApp flow collects (city, children count and ages,
   home service, preferred date/time), using
   `POST /packages/bookings` (server-computes price, confirmed
   accurate) and `POST /packages/bookings/:bookingRef/payment`
   (confirmed working against Campay sandbox).
3. **Public order-tracking page** at `/track/:bookingRef` — calls
   `GET /packages/bookings/:bookingRef` (confirmed working, no login
   required).
4. **Rotating partner/hospital logo carousel** — lowest priority,
   mostly static display.

### Fix the two remaining unconfirmed Playwright tests

Once you have the actual doctor dashboard and layout/header components
in front of you, replace the placeholder assertions in
`doctor dashboard loads after login` and `logout works` with real,
confirmed selectors — the same way the login test was already fixed
today using the real `StaffLogin.tsx`.

### The loop to follow

```
pull latest staging
  -> build on staging branch
  -> npm run build (must pass — use the real package.json, never
     regenerate one)
  -> push to staging
  -> Phase 1's pipeline auto-deploys
  -> Phase 2's Playwright suite runs automatically
  -> failure? read the trace/report, fix, retry
     (bounded — e.g. 3 attempts, then stop and flag for human review
     rather than looping indefinitely)
  -> all green?
  -> STOP. Report to the owner that staging is ready for manual review.
  -> Never merge to main. Never touch production. That stays
     entirely human-controlled.
```
