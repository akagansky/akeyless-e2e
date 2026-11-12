import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { test as base } from "@playwright/test";
import { KEEP_ALL_TRACES, requireEnv, userFolder } from "../config/env";
import { CreateStaticSecretPage } from "../pages/createStaticSecretPage";
import { ItemsPage } from "../pages/itemsPage";
import { LoginPage } from "../pages/loginPage";
import { deleteItem, isNotFound } from "../utils/akeylessCli";

interface Pages {
  createSecretForm: CreateStaticSecretPage;
  items: ItemsPage;
}

interface ConsoleFixtures {
  /** Page objects on a page signed in with the Access Key. Tracing starts after sign-in. */
  pages: Pages;
  /** Returns a random secret name; the test deletes that item from the user folder. */
  newSecretName: () => string;
}

export const test = base.extend<ConsoleFixtures>({
  pages: async ({ page, context }, use, testInfo) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInWithAccessKey(
      requireEnv("AKEYLESS_ACCESS_ID"),
      requireEnv("AKEYLESS_ACCESS_KEY"),
    );

    await context.tracing.start({ screenshots: true, snapshots: true });
    await use({
      createSecretForm: new CreateStaticSecretPage(page),
      items: new ItemsPage(page),
    });

    if (!KEEP_ALL_TRACES && testInfo.status === testInfo.expectedStatus) {
      await context.tracing.stop();
      return;
    }
    const tracePath = testInfo.outputPath("trace.zip");
    await context.tracing.stop({ path: tracePath });
    await testInfo.attach("trace", { path: tracePath, contentType: "application/zip" });
    await rm(tracePath);
    await testInfo.attach("screenshot", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  },

  newSecretName: async ({}, use) => {
    const names: string[] = [];
    await use(() => {
      const name = `PlaywrightSecret-${randomUUID().slice(0, 8)}`;
      names.push(name);
      return name;
    });
    for (const name of names) {
      await deleteItem(`${userFolder()}/${name}`).catch((error: unknown) => {
        if (!isNotFound(error)) throw error;
      });
    }
  },
});

export { expect } from "@playwright/test";
