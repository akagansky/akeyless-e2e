import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Kills a CLI call that hangs, for example on an interactive prompt. */
const CLI_TIMEOUT_MS = 30_000;

/** CLI error text for an item that does not exist. */
const NOT_FOUND_ERROR = /Status 404 Not Found/;

/** True when a CLI call failed because the item does not exist. */
export function isNotFound(error: unknown): boolean {
  return error instanceof Error && NOT_FOUND_ERROR.test(error.message);
}

/** Runs a CLI command with the locally configured Akeyless CLI profile. */
async function cli(args: string[]): Promise<string> {
  const { stdout } = await run("akeyless", args, { timeout: CLI_TIMEOUT_MS });
  return stdout;
}

/** Reads a static secret value, undefined when the secret does not exist. */
export async function findSecretValue(name: string): Promise<string | undefined> {
  try {
    return (await cli(["get-secret-value", "--name", name])).trim();
  } catch (error: unknown) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

/** Deletes an item. */
export async function deleteItem(name: string): Promise<void> {
  await cli(["delete-item", "--name", name]);
}

/** Creates a static secret. */
export async function createSecret(name: string, value: string): Promise<void> {
  await cli(["create-secret", "--name", name, "--value", value]);
}
