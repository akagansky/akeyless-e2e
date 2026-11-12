import { ApiClient, Auth, GetDynamicSecretValue, V2Api } from "akeyless";
import { requireEnv, userFolder } from "../config/env.ts";

const GATEWAY_API_URL =
  process.env.AKEYLESS_GATEWAY_URL ?? "http://localhost:8000/api/v2";
const SECRET_NAME = `${userFolder()}/lab-postgres-dynamic`;

/** Authenticates with an API Key auth method and returns a session token. */
async function authenticate(api: V2Api): Promise<string> {
  const response = await api.auth(
    Auth.constructFromObject({
      "access-id": requireEnv("AKEYLESS_ACCESS_ID"),
      "access-key": requireEnv("AKEYLESS_ACCESS_KEY"),
    }),
  );
  if (!response.token) {
    throw new Error("Akeyless auth returned no token");
  }
  return response.token;
}

/** Requests temporary Postgres credentials from the dynamic secret via the Gateway. */
async function main(): Promise<void> {
  const client = new ApiClient();
  client.basePath = GATEWAY_API_URL;
  const api = new V2Api(client);
  const token = await authenticate(api);
  const creds = await api.getDynamicSecretValue(
    GetDynamicSecretValue.constructFromObject({ name: SECRET_NAME, token }),
  );
  console.log(JSON.stringify(creds, null, 2));
}

main().catch((error: unknown) => {
  console.error(`Failed to get dynamic secret ${SECRET_NAME}:`, error);
  process.exitCode = 1;
});
