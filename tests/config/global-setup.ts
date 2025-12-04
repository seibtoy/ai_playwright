import { chromium, FullConfig } from "@playwright/test";
import { AuthHelper } from "../helpers/save-session";
import { MailSlurp } from "mailslurp-client";

async function globalSetup(config: FullConfig) {
  const mailslurp = new MailSlurp({
    apiKey: process.env.MAILSLURP_API_KEY!,
  });

  const mainInboxName = process.env.MAILSLURP_MAIN_USER_INBOX_NAME!;
  const testInboxName = process.env.MAILSLURP_TEST_USER_INBOX_NAME!;

  const allInboxes = await mailslurp.inboxController.getAllInboxes({
    size: 100,
  });

  const mainInboxPreview = allInboxes.content?.find(
    (inbox) => inbox.name === mainInboxName
  );
  const testInboxPreview = allInboxes.content?.find(
    (inbox) => inbox.name === testInboxName
  );

  if (!mainInboxPreview || !testInboxPreview) {
    throw new Error("Inboxes not found");
  }

  const mainInbox = await mailslurp.inboxController.getInbox({
    inboxId: mainInboxPreview.id,
  });
  const testInbox = await mailslurp.inboxController.getInbox({
    inboxId: testInboxPreview.id,
  });

  const emailsBefore = await mailslurp.inboxController.getEmails({
    inboxId: mainInbox.id,
  });
  const testEmailsBefore = await mailslurp.inboxController.getEmails({
    inboxId: testInbox.id,
  });

  console.log(
    `📧 Emails before tests: Main inbox: ${emailsBefore.length}, Test inbox: ${testEmailsBefore.length}`
  );

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const auth = new AuthHelper(page);

  await auth.loginAsMainUser(page);
  await auth.loginAsTestUser(page);

  const emailsAfter = await mailslurp.inboxController.getEmails({
    inboxId: mainInbox.id,
  });
  const testEmailsAfter = await mailslurp.inboxController.getEmails({
    inboxId: testInbox.id,
  });

  const mainEmailsSent = emailsAfter.length - emailsBefore.length;
  const testEmailsSent = testEmailsAfter.length - testEmailsBefore.length;

  console.log(`📧 Emails sent during setup:`);
  console.log(`   Main inbox: ${mainEmailsSent} emails`);
  console.log(`   Test inbox: ${testEmailsSent} emails`);
  console.log(`   Total: ${mainEmailsSent + testEmailsSent} emails`);

  await browser.close();
}

export default globalSetup;
