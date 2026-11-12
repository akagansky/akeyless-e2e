# Lab journal: tasks 3-5

Secrets are redacted as `<redacted>`. Workspace folder: `/Candidate GitHub Access/login/akagansky/`.

## Environment

| Tool            | Version           |
| --------------- | ----------------- |
| macOS           | 26.6.2 (arm64)    |
| Docker          | 29.9.3            |
| Akeyless CLI    | 1.155.0           |
| Node / pnpm     | 26.13.0 / 12.18.0 |
| Playwright      | 1.65.0            |
| Akeyless JS SDK | 5.0.40            |

## 2026-11-11 - Task 2: static secret via CLI

- `MySecret` (static secret), API keys `ApiExampleKey` and `MyApiKey`, roles
  `MyReadRole`, `GatewayAdminRole`, `MyRole`, all under the candidate folder.
- `MyReadRole`: one Items rule on `.../akagansky/MySecret`, Read + List, not
  recursive. Associated with `ApiExampleKey`.
- Items Create/Read/Update/Delete/List on `.../akagansky/*` (needed by Tasks 3-5)
  is in `GatewayAdminRole`. It was in `MyReadRole` before 2026-11-11.
- Fetch (CLI `default` profile = `ApiExampleKey`):
  `akeyless get-secret-value --name "/Candidate GitHub Access/login/akagansky/MySecret"`
- Limitation: `ApiExampleKey` also has `GatewayAdminRole` (full CRUD, needed for
  Tasks 3-5), so it does not show the Read + List limit on its own.
- `MyApiKey` sits on the pre-provisioned `MyRole`. Its access key was lost when the
  old CLI profile was deleted, and it was not reset.

## 2026-11-10 - Task 3: Gateway (Docker)

### Doc inconsistencies

- Env vars: `ADMIN_ACCESS_ID` / `ADMIN_ACCESS_KEY` are legacy; current docs use
  `GATEWAY_ACCESS_ID` / `GATEWAY_ACCESS_KEY`. Using the current names.
- Image: Authentication page uses `akeyless/base:latest-akeyless`, Standalone Docker
  page uses `akeyless/gateway:latest`. Using the first (already pulled); the second is
  the fallback.

### Constraint

- Console login at `:8000/console` needs an RBAC Administrative rule scoped to Gateway
  management (`scope` or `all`). `MyReadRole` (Read+List on one secret) is not enough.

### Run

```
docker run -d -p 8000:8000 -p 5696:5696 \
  -e GATEWAY_ACCESS_ID='p-rv0di307e3hsam' -e GATEWAY_ACCESS_KEY='<redacted>' \
  --name akeyless-gw akeyless/base:latest-akeyless
```

- Image is linux/amd64 on an arm64 host: runs under emulation, warning is harmless.
- Log: `New configuration successfully applied`, Gateway 5.6.0, cluster `defaultCluster`.
- `http://localhost:8000/console` redirects (307) to `/console/`, console reachable.

## 2026-11-10 - Task 4: Dynamic Secret (Postgres)

### UX observations

- Create PostgreSQL Target, step 3 "Postgres Configuration": field order is
  DB Username, DB Hostname, DB Password, DB Port, DB Name. Hostname sits between
  username and password, which splits the credential pair (normally adjacent) and
  contributed to a mix-up: the container name was typed into Username.
- DB Hostname is prefilled with `127.0.0.1`. For a Gateway running in Docker this is
  the Gateway container itself, not the DB. The correct value is the DB container name
  on the shared Docker network (`lab-postgres`).

### Permissions required (had to be added)

- Role `GatewayAdminRole` (associated with `ApiExampleKey`) needed, on
  `/Candidate GitHub Access/login/akagansky/*` with "Apply recursively":
  - Administrative rule: Gateway management, scope `all` (Gateway console login).
  - Rule type Targets: Read, List, Create, Update, Delete. Without it the Targets
    menu is missing in the Gateway console.
  - Rule type Items: Create, Read, Update, Delete, List. Missing Update gave
    `403 missing update permissions on item ".../lab-postgres-dynamic"`.
- Rule types are separate: Items and Targets do not cover each other.

### Gateway field in UI

- Create Dynamic Secret form: required "Gateway" dropdown is empty for the lab
  Gateway (not registered in console.akeyless.io). Created via CLI with
  `--gateway-url http://localhost:8000` instead.

### 4a: commands

Reconstructed from the current state (`docker inspect`, `akeyless target get`,
`akeyless dynamic-secret get`), not copied from shell history.

```
docker network create akeyless-lab
docker run -d --name lab-postgres --network akeyless-lab -p 5432:5432 \
  -e POSTGRES_PASSWORD='<redacted>' -e POSTGRES_DB=labdb postgres:16
docker network connect akeyless-lab akeyless-gw
```

- Postgres 16.15. Target `lab-postgres-target` (ID 723536) created in the Gateway
  console UI: host `lab-postgres`, port 5432, DB `labdb`.

```
akeyless dynamic-secret create postgresql \
  --name '/Candidate GitHub Access/login/akagansky/lab-postgres-dynamic' \
  --target-name '/Candidate GitHub Access/login/akagansky/lab-postgres-target' \
  --gateway-url http://localhost:8000 --user-ttl 10m
```

### Result

- Dynamic secret `/Candidate GitHub Access/login/akagansky/lab-postgres-dynamic`
  created (ID 544960246), target `lab-postgres-target`, Postgres 16 in Docker
  network `akeyless-lab`, user TTL 10m.

### 4b: fetch via SDK (API Key auth)

`scripts/getDynamicSecret.ts`: `Auth` with API Key (`ApiExampleKey`), then
`getDynamicSecretValue` against the Gateway `http://localhost:8000/api/v2`.

```
AKEYLESS_GITHUB_USER=akagansky AKEYLESS_ACCESS_ID=p-rv0di307e3hsam \
AKEYLESS_ACCESS_KEY='<redacted>' node scripts/getDynamicSecret.ts
```

```
{ "id": "tmp_Candidate_GitH_p-rv0di307e3hsam_7uZCH", "password": "<redacted>",
  "ttl_in_minutes": "10", "user": "tmp_Candidate_GitH_p-rv0di307e3hsam_7uZCH" }
```

- DB check: `\du` lists the `tmp_...` role; `select current_user` as that role returns
  the same name. The role disappears after the 10 minute TTL.
- Node warning `MODULE_TYPELESS_PACKAGE_JSON` is harmless (no `"type": "module"`).
- 4c (Cloud IAM) skipped: optional, and no AWS account or cloud VM available.

## 2026-11-10 - Task 5: Playwright

- Auth: console "Access Key" tab with `ApiExampleKey` (`.env`: access id, access key,
  GitHub user). GitHub OIDC not automated (see README "Auth").
- The CLI check helper uses the `default` profile, configured with the same
  `ApiExampleKey` (`p-rv0di307e3hsam`), so UI and CLI run with the same rights.
- Test design decisions (structure, selectors, auth limits, redaction, regression
  plan): see `README.md`.
- Run (headless, 3 workers):
  `PLAYWRIGHT_HTML_OPEN=never pnpm exec playwright test --project=chromium --reporter=line`
- Result: 3 passed (create, delete, unauthorized-folder).
- Checks: no `.only(` in specs; only `timeout:` is the CLI child-process limit
  (`CLI_TIMEOUT_MS`), not a Playwright wait.

## 2026-11-11 - Evidence

Files in `evidence/`. Secrets are redacted.

- `docker-ps.txt`: Gateway and Postgres containers running, ports 8000 and 5432.
- `test-run.log`: Playwright run, 3 passed in 19.2s.
