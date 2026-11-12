import type { Locator, Page } from "@playwright/test";

export interface StaticSecretInput {
  name: string;
  folder: string;
  value: string;
}

/** Create Static Secret form. */
export class CreateStaticSecretPage {
  readonly nameInput: Locator;
  readonly locationInput: Locator;
  readonly valueInput: Locator;
  readonly finishButton: Locator;
  readonly notAuthorizedError: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.getByRole("textbox", { name: "Name", exact: true });
    this.locationInput = page.getByRole("combobox", { name: "Location" });
    this.valueInput = page.getByRole("textbox", { name: "Value", exact: true });
    this.finishButton = page.getByRole("button", { name: "Finish" });
    this.notAuthorizedError = page.getByText(
      "You are not authorized to create Items at this location",
    );
  }

  /** Opens the create static secret form. */
  async goto(): Promise<void> {
    await this.page.goto("/items/create/static-secret");
  }

  /** Returns the dropdown option for a folder path. */
  locationOption(folder: string): Locator {
    return this.page.getByRole("option", { name: folder, exact: true });
  }

  /** Fills name, location (picked from the dropdown) and value. */
  async fill({ name, folder, value }: StaticSecretInput): Promise<void> {
    await this.nameInput.fill(name);
    await this.locationInput.fill(folder);
    await this.locationOption(folder).click();
    await this.valueInput.fill(value);
  }

  /** Submits the form and waits until the console leaves the create page. */
  async clickFinish(): Promise<void> {
    await this.finishButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes("/items/create"));
  }
}
