import { randomUUID } from "node:crypto";
import { userFolder } from "../config/env";
import { expect, test } from "../fixtures";
import { findSecretValue } from "../utils/akeylessCli";

test("creates a static secret that is listed and returns the stored value", async ({
  pages,
  newSecretName,
}) => {
  const folder = userFolder();
  const name = newSecretName();
  const value = `value-${randomUUID()}`;

  await test.step("create the secret in the UI", async () => {
    await pages.createSecretForm.goto();
    await pages.createSecretForm.fill({ name, folder, value });
    await pages.createSecretForm.clickFinish();
  });

  await test.step("the secret appears in the items list", async () => {
    await pages.items.gotoFolder(folder);
    await expect(pages.items.item(name)).toBeVisible();
  });

  await test.step("the CLI returns the stored value", async () => {
    await expect.poll(() => findSecretValue(`${folder}/${name}`)).toBe(value);
  });
});
