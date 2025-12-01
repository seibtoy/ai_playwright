import { chromium, FullConfig } from "@playwright/test";
import { AuthHelper } from "../helpers/save-session";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const auth = new AuthHelper(page);

  await auth.loginAsMainUser(page);
  await auth.loginAsTestUser(page);

  await browser.close();
}

export default globalSetup;
