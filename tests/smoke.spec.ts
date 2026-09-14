import { test, expect } from '@playwright/test';

const BASE_URL = 'https://staging.med-vault.com';

test('homepage loads', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('body')).not.toContainText('Error');
});

test('Back-to-School Plus offer is visible with correct price', async ({ page }) => {
  await page.goto(BASE_URL);
  // Placeholder until the actual offers section is built (Phase 3, Part B) —
  // this will need real selectors once that component exists.
  await expect(page.getByText('Back-to-School Plus')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/10,?500/)).toBeVisible();
});

test('offers API is reachable', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/v1/packages/offers`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.offers.some((o: any) => o.name === 'Back-to-School Plus')).toBe(true);
});

/**
 * Confirmed against the real StaffLogin.tsx component:
 * - The identifier input has no name/id/type attribute at all — just a
 *   bare input, so it's targeted by position (first input in the form),
 *   not by name or label association (the label isn't actually linked
 *   to it via htmlFor/id, so getByLabel() would not reliably work here).
 * - The password input does have type="password" — reliably selectable.
 * - The submit button has type="submit", no reliable text assumption
 *   needed (button text is a translated string, not fixed English).
 * - A successful doctor login navigates to /doctor — confirmed directly
 *   from the component's own navigate() call.
 *
 * This test depends on the test doctor account having
 * mustChangePassword: false — otherwise StaffLogin redirects to
 * /change-password instead of /doctor. Already set correctly for the
 * test account created this session, but worth knowing if this test
 * ever starts failing after a fresh doctor registration is used instead.
 */
test('doctor login works', async ({ page }) => {
  await page.goto(`${BASE_URL}/staff-login`);
  await page.locator('form input').first().fill(process.env.STAGING_TEST_DOCTOR_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.STAGING_TEST_DOCTOR_PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(`${BASE_URL}/doctor`, { timeout: 10000 });
});

/**
 * Confirmed against the real DoctorDashboard.tsx: it renders an
 * <h1>{t('upcomingAppointments')}</h1> unconditionally once loaded — a
 * real, stable heading rather than just "no error text" placeholder.
 */
test('doctor dashboard loads after login', async ({ page }) => {
  await page.goto(`${BASE_URL}/staff-login`);
  await page.locator('form input').first().fill(process.env.STAGING_TEST_DOCTOR_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.STAGING_TEST_DOCTOR_PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE_URL}/doctor`);
  await expect(page.getByRole('heading', { name: 'Upcoming appointments' })).toBeVisible();
});

/**
 * Confirmed against the real Layout.tsx: the header's "Log out" button
 * calls logout() then navigates by role — doctor/lab/admin go to
 * /staff-login, only patients go to /login. (Before this was fixed, the
 * handler unconditionally called navigate('/login') for every role, and
 * only landed a doctor on /staff-login by accident, via a race with
 * RequireRole's own redirect guard for the now-unauthenticated /doctor
 * route — confirmed by real, reproducible behavior on staging.)
 */
test('logout works', async ({ page }) => {
  await page.goto(`${BASE_URL}/staff-login`);
  await page.locator('form input').first().fill(process.env.STAGING_TEST_DOCTOR_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.STAGING_TEST_DOCTOR_PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE_URL}/doctor`);
  await page.getByText(/log ?out/i).click();
  await expect(page).toHaveURL(`${BASE_URL}/staff-login`);
});
