/** Minimal typings for the parts of the untyped Akeyless SDK used by scripts. */
declare module "akeyless" {
  export class ApiClient {
    basePath: string;
  }

  export class V2Api {
    constructor(client: ApiClient);
    auth(body: Auth): Promise<{ token?: string }>;
    getDynamicSecretValue(
      body: GetDynamicSecretValue,
    ): Promise<Record<string, unknown>>;
  }

  export class Auth {
    accessId?: string;
    static constructFromObject(data: Record<string, string>): Auth;
  }

  export class GetDynamicSecretValue {
    name?: string;
    static constructFromObject(data: Record<string, string>): GetDynamicSecretValue;
  }
}
