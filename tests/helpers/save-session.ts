import { type Page } from "@playwright/test";
import { MailSlurp } from "mailslurp-client";
import fs from "fs";

const STORAGE_STATE = "tests/storage/storage-state.json";

export async function performLogin(page: Page) {
  const mailslurp = new MailSlurp({
    apiKey: process.env.MAILSLURP_API_KEY!,
  });

  const inbox = await mailslurp.inboxController.createInboxWithDefaults();
  const email = inbox.emailAddress;

  await page.goto("/signin");
  await page.getByRole("textbox", { name: "Email Address" }).fill(email);
  await page.getByRole("button", { name: "Send verification code" }).click();

  const emailMsg = await mailslurp.waitForLatestEmail(inbox.id, 30000);
  const match = emailMsg.body!.match(
    /<span[^>]*class=["']bold["'][^>]*>(\d{6})<\/span>/i
  );
  const code = match?.[1];

  const inputs = page
    .getByRole("group", { name: "Verification code" })
    .locator("input");

  for (let i = 0; i < code!.length; i++) {
    await inputs.nth(i).fill(code![i]);
  }

  await page.waitForURL("/");

  await page.context().storageState({ path: STORAGE_STATE });

  await mailslurp.deleteInbox(inbox.id);
}

export async function ensureAuthorized(page: Page) {
  if (fs.existsSync(STORAGE_STATE)) {
    const storageState = JSON.parse(fs.readFileSync(STORAGE_STATE, "utf-8"));
    await page.context().addCookies(storageState.cookies);
  }

  await page.goto("/");

  if (page.url().startsWith("/signin")) {
    await performLogin(page);
  }
}
