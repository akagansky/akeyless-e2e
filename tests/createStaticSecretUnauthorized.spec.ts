import { randomUUID } from "node:crypto";
import { CANDIDATE_ROOT } from "../config/env";
import { expect, test } from "../fixtures";

test("shows a not authorized error for a folder outside the role's path", async ({
  pages,
  newSecretName,
}) => {
  const folder = `${CANDIDATE_ROOT}/not-my-folder`;

  await pages.createSecretForm.goto();
  await pages.createSecretForm.fill({
    name: newSecretName(),
    folder,
    value: `value-${randomUUID()}`,
  });

  await expect(pages.createSecretForm.notAuthorizedError).toBeVisible();
  await expect(pages.createSecretForm.finishButton).toBeDisabled();
});
