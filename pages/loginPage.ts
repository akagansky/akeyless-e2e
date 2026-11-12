import type { Locator, Page } from "@playwright/test";

/** Sets a value the way typing does, without the value reaching a step title. */
function setInputValue(input: HTMLInputElement, value: string): void {
  const descriptor:
    { set?: (this: HTMLInputElement, value: string) => void } | undefined =
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (!descriptor?.set) {
    throw new Error("HTMLInputElement value setter is not available");
  }
  descriptor.set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Console sign-in page, Access Key tab. */
export class LoginPage {
  readonly accessIdInput: Locator;
  readonly accessKeyInput: Locator;
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.accessIdInput = page.getByRole("textbox", { name: "Access ID" });
    this.accessKeyInput = page.getByRole("textbox", { name: "Access Key" });
    this.signInButton = page.getByRole("button", { name: "Sign in" });
  }

  /** Opens the sign-in page with the Access Key tab preselected. */
  async goto(): Promise<void> {
    await this.page.goto("/?auth-type=access-key");
  }

  /** Fills Access ID and Access Key, submits and waits for the home page. */
  async signInWithAccessKey(accessId: string, accessKey: string): Promise<void> {
    await this.accessIdInput.fill(accessId);
    await this.accessKeyInput.evaluate(setInputValue, accessKey);
    await this.signInButton.click();
    await this.page.waitForURL(/\/home/);
  }
}
