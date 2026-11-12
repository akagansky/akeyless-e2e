/** Reads a required env var and fails loudly when it is missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. See README.md "Setup" for the full list.`,
    );
  }
  return value;
}

/** Root folder that holds every candidate's workspace. */
export const CANDIDATE_ROOT = "/Candidate GitHub Access/login";

/** The signed-in user's folder, the only place items may be created. */
export function userFolder(): string {
  return `${CANDIDATE_ROOT}/${requireEnv("AKEYLESS_GITHUB_USER")}`;
}

/** True when TRACE=on: keep the trace and screenshot of passing tests too. */
export const KEEP_ALL_TRACES = process.env.TRACE === "on";
