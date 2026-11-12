import type { Locator, Page } from "@playwright/test";

/** Items list of a folder, with the item details and its delete dialog. */
export class ItemsPage {
  readonly deleteButton: Locator;
  readonly confirmNameInput: Locator;
  readonly confirmButton: Locator;

  constructor(private readonly page: Page) {
    this.deleteButton = page.getByRole("button", { name: "Delete Static Secret" });
    this.confirmNameInput = page.getByRole("textbox", { name: "Name", exact: true });
    this.confirmButton = page.getByRole("button", { name: "Confirm" });
  }

  /** Opens the items list of a folder. */
  async gotoFolder(folder: string): Promise<void> {
    const path = encodeURIComponent(Buffer.from(`${folder}/`).toString("base64"));
    await this.page.goto(`/items/folder/${path}`);
  }

  /** Returns the list entry with exactly this item name. */
  item(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  /** Opens a listed item and deletes it: its name confirms the dialog. */
  async deleteItem(name: string): Promise<void> {
    await this.item(name).click();
    await this.deleteButton.click();
    await this.confirmNameInput.fill(name);
    await this.confirmButton.click();
    await this.confirmNameInput.waitFor({ state: "hidden" });
  }
}
