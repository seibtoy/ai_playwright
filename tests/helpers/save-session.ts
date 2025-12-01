import { type Page } from "@playwright/test";
import { MailSlurp, type InboxDto } from "mailslurp-client";
import fs from "fs";
import { SigninPage } from "@/tests/pages/signin-page";
import { URLS } from "@/tests/config/urls";

interface InboxStorage {
  mainUser: InboxDto | null;
  testUser: InboxDto | null;
}

export class AuthHelper extends SigninPage {
  private readonly mailslurp: MailSlurp;
  private static inboxStorage: InboxStorage = {
    mainUser: null,
    testUser: null,
  };

  private static currentUserInbox: InboxDto | null = null;

  constructor(page: Page) {
    super(page);
    this.mailslurp = new MailSlurp({
      apiKey: process.env.MAILSLURP_API_KEY!,
    });
    AuthHelper.loadInboxStorage();
  }

  private static ensureStoragePath() {
    if (!fs.existsSync(URLS.STORAGE_PATH)) {
      fs.mkdirSync(URLS.STORAGE_PATH, { recursive: true });
    }
  }

  private static loadInboxStorage() {
    AuthHelper.ensureStoragePath();
    if (fs.existsSync(URLS.INBOX_STORAGE_FILE)) {
      AuthHelper.inboxStorage = JSON.parse(
        fs.readFileSync(URLS.INBOX_STORAGE_FILE, "utf-8")
      );
    }
  }

  private static saveInboxStorage() {
    AuthHelper.ensureStoragePath();
    fs.writeFileSync(
      URLS.INBOX_STORAGE_FILE,
      JSON.stringify(AuthHelper.inboxStorage, null, 2)
    );
  }

  private static async initInboxes(): Promise<void> {
    const mailslurp = new MailSlurp({
      apiKey: process.env.MAILSLURP_API_KEY!,
    });
    let hasChanges = false;

    const allInboxes = await mailslurp.inboxController.getAllInboxes({
      size: 100,
    });

    const mainUserInboxPreview = allInboxes.content?.find(
      (inbox) => inbox.name === process.env.MAILSLURP_MAIN_USER_INBOX_NAME!
    );
    const testUserInboxPreview = allInboxes.content?.find(
      (inbox) => inbox.name === process.env.MAILSLURP_TEST_USER_INBOX_NAME!
    );

    if (!AuthHelper.inboxStorage.mainUser) {
      if (mainUserInboxPreview) {
        AuthHelper.inboxStorage.mainUser =
          await mailslurp.inboxController.getInbox({
            inboxId: mainUserInboxPreview.id,
          });
        hasChanges = true;
      } else {
        AuthHelper.inboxStorage.mainUser =
          await mailslurp.inboxController.createInbox({
            name: process.env.MAILSLURP_MAIN_USER_INBOX_NAME!,
          });
        hasChanges = true;
      }
    }

    if (!AuthHelper.inboxStorage.testUser) {
      if (testUserInboxPreview) {
        AuthHelper.inboxStorage.testUser =
          await mailslurp.inboxController.getInbox({
            inboxId: testUserInboxPreview.id,
          });
        hasChanges = true;
      } else {
        AuthHelper.inboxStorage.testUser =
          await mailslurp.inboxController.createInbox({
            name: process.env.MAILSLURP_TEST_USER_INBOX_NAME!,
          });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      AuthHelper.saveInboxStorage();
    }
  }

  private async completeLogin(page: Page, inbox: InboxDto) {
    await page.goto(`${process.env.BASE_URL!}/signin`);

    const testId = `login-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const taggedEmail = inbox.emailAddress.replace("@", `+${testId}@`);

    await this.emailInput.fill(taggedEmail);
    await this.sendCodeButton.click();

    let targetEmailPreview;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const emails = await this.mailslurp.inboxController.getEmails({
        inboxId: inbox.id,
      });

      targetEmailPreview = emails.find((email) =>
        email.to?.some((to: any) => {
          const recipient = typeof to === "string" ? to : to.emailAddress;
          return recipient === taggedEmail || recipient === inbox.emailAddress;
        })
      );

      if (targetEmailPreview) break;

      console.log(
        `[RETRY ${attempt}] Email for ${taggedEmail} not found yet, retrying...`
      );
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!targetEmailPreview) {
      throw new Error(`Email for ${taggedEmail} not found after retries`);
    }

    const targetEmail = await this.mailslurp.emailController.getEmail({
      emailId: targetEmailPreview.id,
    });

    const match = targetEmail.body?.match(
      /<span[^>]*class=["']bold["'][^>]*>(\d{6})<\/span>/i
    );
    const code = match?.[1];
    if (!code) throw new Error("Verification code not found in email");

    const inputs = this.verificationCodeInputGroup;
    for (let i = 0; i < code.length; i++) {
      await inputs.nth(i).fill(code[i]);
    }

    await page.waitForURL(`${process.env.BASE_URL!}/`);

    await this.mailslurp.inboxController.deleteAllInboxEmails({
      inboxId: inbox.id,
    });

    return { ...inbox, emailAddress: taggedEmail };
  }

  async loginAsMainUser(page: Page) {
    await AuthHelper.initInboxes();
    const inbox = AuthHelper.inboxStorage.mainUser!;

    if (fs.existsSync(URLS.STORAGE_STATE_MAIN_USER)) {
      const storageState = JSON.parse(
        fs.readFileSync(URLS.STORAGE_STATE_MAIN_USER, "utf-8")
      );
      await page.context().addCookies(storageState.cookies);

      try {
        await page.goto(`${process.env.BASE_URL!}/`, {
          waitUntil: "domcontentloaded",
        });
      } catch (error) {
        await page.waitForLoadState("domcontentloaded");
      }

      const settingsButton = page.locator(
        'button[data-sidebar="menu-button"][data-slot="dropdown-menu-trigger"]'
      );

      try {
        await settingsButton.waitFor({ state: "visible", timeout: 10000 });

        const emailText = await page
          .locator('button[data-sidebar="menu-button"] div.truncate')
          .textContent({ timeout: 5000 });

        if (emailText) {
          AuthHelper.currentUserInbox = { ...inbox, emailAddress: emailText };
        } else {
          AuthHelper.currentUserInbox = inbox;
        }
      } catch (error) {
        console.log(
          "User not logged in or session expired, using inbox email address. If you are in the local environment, try to clear the storage folder."
        );
        AuthHelper.currentUserInbox = inbox;
      }
      return;
    }

    await page.context().clearCookies();

    const cleanedInbox = await this.completeLogin(page, inbox);

    AuthHelper.ensureStoragePath();
    await page.context().storageState({ path: URLS.STORAGE_STATE_MAIN_USER });
    AuthHelper.currentUserInbox = cleanedInbox;
  }

  async loginAsTestUser(page: Page) {
    await AuthHelper.initInboxes();
    const inbox = AuthHelper.inboxStorage.testUser!;

    if (fs.existsSync(URLS.STORAGE_STATE_TEST_USER)) {
      const storageState = JSON.parse(
        fs.readFileSync(URLS.STORAGE_STATE_TEST_USER, "utf-8")
      );
      await page.context().addCookies(storageState.cookies);

      try {
        await page.goto(`${process.env.BASE_URL!}/`, {
          waitUntil: "domcontentloaded",
        });
      } catch (error) {
        await page.waitForLoadState("domcontentloaded");
      }

      const settingsButton = page.locator(
        'button[data-sidebar="menu-button"][data-slot="dropdown-menu-trigger"]'
      );

      try {
        await settingsButton.waitFor({ state: "visible", timeout: 10000 });

        const emailText = await page
          .locator('button[data-sidebar="menu-button"] div.truncate')
          .textContent({ timeout: 5000 });

        if (emailText) {
          AuthHelper.currentUserInbox = { ...inbox, emailAddress: emailText };
        } else {
          AuthHelper.currentUserInbox = inbox;
        }
      } catch (error) {
        console.log(
          "User not logged in or session expired, using inbox email address. If you are in the local environment, try to clear the storage folder."
        );
        AuthHelper.currentUserInbox = inbox;
      }
      return;
    }

    await page.context().clearCookies();

    const cleanedInbox = await this.completeLogin(page, inbox);

    AuthHelper.ensureStoragePath();
    await page.context().storageState({ path: URLS.STORAGE_STATE_TEST_USER });
    AuthHelper.currentUserInbox = cleanedInbox;
  }

  static getCurrentUserInbox() {
    return AuthHelper.currentUserInbox?.emailAddress;
  }

  static getCurrentUserInboxName() {
    const email = AuthHelper.currentUserInbox?.emailAddress;
    if (!email) return undefined;
    return email.split("@")[0];
  }
}
