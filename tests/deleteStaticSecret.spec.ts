import { randomUUID } from "node:crypto";
import { userFolder } from "../config/env";
import { expect, test } from "../fixtures";
import { createSecret, findSecretValue } from "../utils/akeylessCli";

test("deletes a static secret that disappears from the list and the CLI", async ({
  pages,
  newSecretName,
}) => {
  const folder = userFolder();
  const name = newSecretName();
  const keptName = newSecretName();

  await createSecret(`${folder}/${name}`, `value-${randomUUID()}`);
  await createSecret(`${folder}/${keptName}`, `value-${randomUUID()}`);

  await test.step("the secret is listed before deletion", async () => {
    await pages.items.gotoFolder(folder);
    await expect(pages.items.item(name)).toBeVisible();
  });

  await test.step("delete the secret in the UI", async () => {
    await pages.items.deleteItem(name);
  });

  await test.step("the reloaded list keeps the other secret only", async () => {
    await pages.items.gotoFolder(folder);
    await expect(pages.items.item(keptName)).toBeVisible();
    await expect(pages.items.item(name)).toBeHidden();
  });

  await test.step("the CLI no longer finds the secret", async () => {
    await expect.poll(() => findSecretValue(`${folder}/${name}`)).toBeUndefined();
  });
});
