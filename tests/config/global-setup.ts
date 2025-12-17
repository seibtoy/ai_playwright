import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";
import { Auth } from "../helpers/auth";
import { URLS } from "./urls";

export default async function globalSetup() {
  const storageDir = path.resolve(URLS.STORAGE_PATH);

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // MAIN USER
  const mainContext = await browser.newContext();
  const mainPage = await mainContext.newPage();
  await new Auth(mainPage).loginAsMainUser(mainPage);
  await mainContext.storageState({ path: URLS.STORAGE_STATE_MAIN_USER });
  await mainContext.close();

  // TEST USER
  const testContext = await browser.newContext();
  const testPage = await testContext.newPage();
  await new Auth(testPage).loginAsTestUser(testPage);
  await testContext.storageState({ path: URLS.STORAGE_STATE_TEST_USER });
  await testContext.close();

  await browser.close();
}
