# Akeyless console e2e (Playwright)

E2E tests for static secrets in the Akeyless SaaS console. The CLI verifies
results and creates test data.

## Tests

- `createStaticSecret.spec.ts`: create in the UI, check the items list, check the
  value with the CLI.
- `deleteStaticSecret.spec.ts`: create with the CLI, delete in the UI (the
  dialog asks to type the name), check the list and the CLI.
- `createStaticSecretUnauthorized.spec.ts`: a folder outside the role's path shows
  "not authorized" and Finish is disabled.

Tests are independent and run in parallel (3 workers, `playwright.config.ts`).

## Setup

Requirements:

- Node.js 22.18 or newer, npm
- [Akeyless CLI](https://docs.akeyless.io/docs/cli) on `PATH`
- An Akeyless API key whose role can create and delete items under
  `/Candidate GitHub Access/login/<AKEYLESS_GITHUB_USER>`
- Access to `https://console.akeyless.io`

Steps:

1. Clone the repository and install dependencies:

   ```
   git clone git@github.com:akagansky/akeyless-e2e.git && cd akeyless-e2e
   npm install
   npx playwright install chromium
   ```

2. Configure the CLI with the same API key (the tests call `akeyless` with the
   `default` profile):

   ```
   akeyless configure --access-id <access id> --access-key <access key> --access-type access_key
   akeyless list-items --path /   # must not return 401
   ```

3. Create `.env` in the repository root:

   ```
   AKEYLESS_ACCESS_ID=<access id of the API key>
   AKEYLESS_ACCESS_KEY=<access key>
   AKEYLESS_GITHUB_USER=<github username>
   TRACE=on # optional: keep trace and screenshot of passing tests too
   ```

4. Run `npm test` (see Run). Expected: `3 passed`.

## Run

```
npm test                    # headless
npm run test:headed         # visible browser
npx playwright test --debug # step-through inspector
npm run report              # open the HTML report
npm run typecheck
npm run lint                # ESLint (typescript-eslint, playwright)
npm run format              # Prettier, format:check only verifies
```

Secret names are `PlaywrightSecret-<random>` under
`/Candidate GitHub Access/login/<AKEYLESS_GITHUB_USER>`. Items a test creates are
deleted afterwards, even when it fails.

## Auth

The fixture signs in through the console "Access Key" tab for every test.
The GitHub OIDC flow is not automated: GitHub (here via Google) rejects
automated browsers, and credentials must not be scripted. The console keeps its
token outside `storageState` (cookies and localStorage), so a saved session did
not restore the login. Limits: rights equal the access role bound to the API
key, and the sign-in page uses reCAPTCHA. A saved token cannot be injected: the
console binds sessions to a DPoP key pair kept in the browser.

## Structure

- `pages/` page objects: locators and actions, no assertions
- `fixtures/` `pages` (`createSecretForm`, `items`) on a signed-in page, and
  `newSecretName`: returns a random name and deletes that item after the test
- `utils/akeylessCli.ts` create, read and delete through the CLI
- `scripts/getDynamicSecret.ts` gets temporary Postgres credentials from the
  `lab-postgres-dynamic` dynamic secret through the Gateway with the JS SDK
  (`node --env-file=.env scripts/getDynamicSecret.ts`, Gateway URL from
  `AKEYLESS_GATEWAY_URL`, default `http://localhost:8000/api/v2`)
- `types/` minimal typings for the untyped Akeyless SDK
- `tests/` specs, assertions live here only

Failures keep a screenshot and a trace (all tests with `TRACE=on`), attached in the HTML report and saved
in `test-results/<test>/attachments/` (`npx playwright show-trace <trace.zip>`).

## Secrets in artifacts

- Built-in `trace` and `screenshot` are off: Playwright starts them before the
  sign-in and records typed values. The `pages` fixture starts tracing
  after sign-in and keeps trace and screenshot only when a test fails.
- The Access Key is set with `evaluate`, so it is not part of a step title in
  the report (a `fill` step title contains the value).
- Left in the artifacts: the short-lived session token in request headers and
  the random test secret value. Keep traces local.
- A failed sign-in leaves no trace or screenshot.
- Check an artifact: `grep -rl "$AKEYLESS_ACCESS_KEY" playwright-report test-results`
  and `unzip -p <trace.zip> | grep -c "$AKEYLESS_ACCESS_KEY"` should find nothing.

## Extending to a regression suite

- Update: edit the value, expect a new version via CLI.
- Read: open the detail view, assert name, path and type.
- Negative: duplicate name, empty name, role without Create.
