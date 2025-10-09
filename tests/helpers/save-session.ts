import { type Page } from "@playwright/test";
import { MailSlurp, type InboxDto } from "mailslurp-client";
import fs from "fs";
import { SigninPage } from "@pages/index";
import { ENV } from "@config/env";

interface InboxStorage {
  mainUser: InboxDto | null;
  testUser: InboxDto | null;
}

const CLASS_OPTIONS = Object.freeze({
  STORAGE_STATE_MAIN_USER: "tests/storage/storage-state-main-user.json",
  STORAGE_STATE_TEST_USER: "tests/storage/storage-state-test-user.json",
  INBOX_STORAGE_FILE: "tests/storage/inboxes.json",
});

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
      apiKey: ENV.MAILSLURP_API_KEY,
    });
    AuthHelper.loadInboxStorage();
  }

  private static loadInboxStorage() {
    if (fs.existsSync(CLASS_OPTIONS.INBOX_STORAGE_FILE)) {
      AuthHelper.inboxStorage = JSON.parse(
        fs.readFileSync(CLASS_OPTIONS.INBOX_STORAGE_FILE, "utf-8")
      );
    }
  }

  private static saveInboxStorage() {
    fs.writeFileSync(
      CLASS_OPTIONS.INBOX_STORAGE_FILE,
      JSON.stringify(AuthHelper.inboxStorage, null, 2)
    );
  }

  private static async initInboxes(): Promise<void> {
    const mailslurp = new MailSlurp({ apiKey: ENV.MAILSLURP_API_KEY });
    let hasChanges = false;

    const allInboxes = await mailslurp.inboxController.getAllInboxes({
      size: 100,
    });

    const mainUserInboxPreview = allInboxes.content?.find(
      (inbox) => inbox.name === ENV.MAILSLURP_MAIN_USER_INBOX_NAME
    );
    const testUserInboxPreview = allInboxes.content?.find(
      (inbox) => inbox.name === ENV.MAILSLURP_TEST_USER_INBOX_NAME
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
            name: "playwright-main-user",
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
            name: "playwright-test-user",
          });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      AuthHelper.saveInboxStorage();
    }
  }

  private async completeLogin(page: Page, inbox: InboxDto) {
    await page.goto("/signin");
    await this.emailInput.fill(inbox.emailAddress);
    await this.sendCodeButton.click();

    const emailMsg = await this.mailslurp.waitForLatestEmail(inbox.id, 30000);
    const match = emailMsg.body!.match(
      /<span[^>]*class=["']bold["'][^>]*>(\d{6})<\/span>/i
    );
    const code = match?.[1];

    const inputs = this.verificationCodeInputGroup;
    for (let i = 0; i < code!.length; i++) {
      await inputs.nth(i).fill(code![i]);
    }

    await page.waitForURL("/");

    await this.mailslurp.inboxController.deleteAllInboxEmails({
      inboxId: inbox.id,
    });

    return inbox;
  }

  async loginAsMainUser(page: Page) {
    await AuthHelper.initInboxes();
    const inbox = AuthHelper.inboxStorage.mainUser!;

    if (fs.existsSync(CLASS_OPTIONS.STORAGE_STATE_MAIN_USER)) {
      const storageState = JSON.parse(
        fs.readFileSync(CLASS_OPTIONS.STORAGE_STATE_MAIN_USER, "utf-8")
      );
      await page.context().addCookies(storageState.cookies);
      await page.goto("/");
      AuthHelper.currentUserInbox = inbox;
      return;
    }

    await page.context().clearCookies();

    await this.completeLogin(page, inbox);
    await page
      .context()
      .storageState({ path: CLASS_OPTIONS.STORAGE_STATE_MAIN_USER });
    AuthHelper.currentUserInbox = inbox;
  }

  async loginAsTestUser(page: Page) {
    await AuthHelper.initInboxes();
    const inbox = AuthHelper.inboxStorage.testUser!;

    if (fs.existsSync(CLASS_OPTIONS.STORAGE_STATE_TEST_USER)) {
      const storageState = JSON.parse(
        fs.readFileSync(CLASS_OPTIONS.STORAGE_STATE_TEST_USER, "utf-8")
      );
      await page.context().addCookies(storageState.cookies);
      await page.goto("/");
      AuthHelper.currentUserInbox = inbox;
      return;
    }

    await page.context().clearCookies();

    await this.completeLogin(page, inbox);
    await page
      .context()
      .storageState({ path: CLASS_OPTIONS.STORAGE_STATE_TEST_USER });
    AuthHelper.currentUserInbox = inbox;
  }

  static getCurrentUserInbox() {
    return AuthHelper.currentUserInbox?.emailAddress;
  }
}
