import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "@playwright/test";
import { Auth } from "../helpers/auth";
import { URLS } from "./urls";

export default async function globalSetup() {
  const storageDir = path.resolve(URLS.STORAGE_PATH);

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const browser = await chromium.launch();

  const users = [
    { role: "User", storagePath: URLS.STORAGE_STATE_MAIN_USER },
    { role: "TestUser", storagePath: URLS.STORAGE_STATE_TEST_USER },
    { role: "Admin", storagePath: URLS.STORAGE_STATE_ADMIN },
    { role: "OrgAdmin", storagePath: URLS.STORAGE_STATE_ORG_ADMIN },
  ] as const;

  try {
    for (const { role, storagePath } of users) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await new Auth(page).login(page, role);
      await context.storageState({ path: storagePath });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
