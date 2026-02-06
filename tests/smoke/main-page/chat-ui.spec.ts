import { expect, test } from "@playwright/test";
import { URLS } from "@/tests/config/urls";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("Chat UI: basic elements", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should display UI elements before first message", async ({
    page,
  }) => {
    await test.step("Verify action buttons are visible", async () => {
      await expect(chatPage.newMeetingOptimizerButton).toBeVisible();
      await expect(chatPage.myStratSyncButton).toBeVisible();
    });
    await test.step("Verify New Meeting Optimizer button leads to the correct page", async () => {
      await chatPage.newMeetingOptimizerButton.click();
      await expect(page).toHaveURL(/chat_id=[a-f0-9-]+/);
      await page.goto(`${process.env.BASE_URL}/`);
    });
    await test.step("Verify My StratSync button leads to the correct page", async () => {
      await chatPage.myStratSyncButton.click();
      await expect(page).toHaveURL(/dashboard\/stratsync/);
    });
  });

  test("Should display UI elements after chat is started", async () => {
    await test.step("Send message to display the chat UI", async () => {
      await chatPage.sendMessageViaAPI("Hello");
    });

    await test.step("Verify 'New Chat' button is visible", async () => {
      await expect(chatPage.newChatButton).toBeVisible();
    });

    await test.step("Verify 'Private' button is visible", async () => {
      await expect(chatPage.privateButton).toBeVisible();
    });

    await test.step("Verify 'Feedback' button is visible", async () => {
      await expect(chatPage.feedbackButton).toBeVisible();
    });

    await test.step("Verify chat input is present and enabled", async () => {
      await expect(chatPage.input).toBeVisible();
      await expect(chatPage.input).toBeEnabled();
    });
  });
});

test.describe("Chat UI: file attachment", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should attach file via button", async ({ page }) => {
    await test.step("Click attachments button and select file", async () => {
      await expect(chatPage.attachmentsButton).toBeVisible();

      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        chatPage.attachmentsButton.click(),
      ]);

      await fileChooser.setFiles("tests/data/test-pdf.pdf");
    });

    await test.step("Verify attachment preview is visible", async () => {
      await expect(chatPage.inputAttachmentPreview).toBeVisible();
    });

    await test.step("Send message and verify it contains attachment", async () => {
      await page.getByTestId("send-button").click();
      await chatPage.recordingButton.waitFor({ state: "visible" });
      await expect(chatPage.messageContent).toBeVisible();
    });
  });
});

test.describe("Chat UI: action buttons", () => {
  test("Should copy message and export PDF via action buttons", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
      permissions:
        testInfo.project.name === "chromium"
          ? ["clipboard-read", "clipboard-write"]
          : [],
    });

    const page = await context.newPage();
    await page.goto(`${process.env.BASE_URL}/`);

    const chatPage = new ChatPage(page);

    await test.step("Send message and verify action buttons are visible", async () => {
      await chatPage.sendMessage("Hello world");
    });

    await test.step("Open dropdown", async () => {
      await chatPage.mainChatActionsDropdown.click();
    });

    await test.step("Click copy button and verify message is copied", async () => {
      await chatPage.copyButton.click();

      // eslint-disable-next-line playwright/no-conditional-in-test
      if (testInfo.project.name === "chromium") {
        const clipboardText = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(clipboardText.trim().length).toBeGreaterThan(0);
      }
    });

    await test.step("Open dropdown", async () => {
      await chatPage.mainChatActionsDropdown.click();
    });

    await test.step("Click export PDF button and verify PDF is downloaded", async () => {
      const downloadPromise = page.waitForEvent("download");
      await chatPage.exportPDFButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain(".pdf");
      expect(await download.failure()).toBeNull();
    });
    await context.close();
  });
});

test.describe("Chat UI: privacy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should hide private chat from other users", async ({
    browser,
  }) => {
    let chatUrl: string;

    await test.step("Create private chat as main user", async () => {
      const mainContext = await browser.newContext({
        storageState: URLS.STORAGE_STATE_MAIN_USER,
      });
      const mainPage = await mainContext.newPage();
      const mainChatPage = new ChatPage(mainPage);

      await mainPage.goto(`${process.env.BASE_URL}/`);
      await mainChatPage.sendMessageViaAPI("Hello world");
      await expect(mainChatPage.privateButton).toBeVisible();
      chatUrl = mainPage.url();

      await mainContext.close();
    });

    await test.step("Open chat URL as test user and verify not found", async () => {
      const testContext = await browser.newContext({
        storageState: URLS.STORAGE_STATE_TEST_USER,
      });
      const testPage = await testContext.newPage();
      const testChatPage = new ChatPage(testPage);

      await testPage.goto(chatUrl);
      await expect(testChatPage.chatNotFoundModal).toBeVisible();

      await testContext.close();
    });
  });

  test("Should show public chat to other users", async ({ browser }) => {
    let chatUrl: string;

    await test.step("Create chat as main user", async () => {
      const mainContext = await browser.newContext({
        storageState: URLS.STORAGE_STATE_MAIN_USER,
      });
      const mainPage = await mainContext.newPage();
      const mainChatPage = new ChatPage(mainPage);

      await mainPage.goto(`${process.env.BASE_URL}/`);
      await mainChatPage.sendMessageViaAPI("Hello world");
      chatUrl = mainPage.url();
      await expect(mainChatPage.privateButton).toBeVisible();

      await test.step("Change chat privacy to public", async () => {
        await mainChatPage.privateButton.click();
        await mainPage
          .getByRole("menuitem", { name: "Public Anyone with the link" })
          .click();
        await expect(mainChatPage.publicButton).toBeVisible();
        await expect(mainChatPage.publicButton).toBeEnabled();
      });

      await mainContext.close();
    });

    await test.step("Open chat URL as test user", async () => {
      const testContext = await browser.newContext({
        storageState: URLS.STORAGE_STATE_TEST_USER,
      });
      const testPage = await testContext.newPage();
      const testChatPage = new ChatPage(testPage);

      await testPage.goto(chatUrl);

      await test.step("Verify chat content is visible", async () => {
        await expect(testChatPage.messageContent.last()).toBeVisible();
      });

      await testContext.close();
    });
  });
});

test.describe("Chat UI: guest chat limit", () => {
  test("Should limit guest user to 5 chats", async ({
    browser,
  }) => {
    let chatPage: ChatPage;
    let signinPage: SigninPage;

    const context = await browser.newContext();
    const newPage = await context.newPage();

    try {
      chatPage = new ChatPage(newPage);
      signinPage = new SigninPage(newPage);

      await signinPage.continueAsGuest(newPage);

      test.setTimeout(100000);
      await test.step("Verify chat input is visible", async () => {
        await expect(chatPage.input).toBeVisible();
      });

      await test.step("Create 5 chats", async () => {
        let response = await chatPage.sendMessageViaAPI("Testing message");
        expect(response.status()).toBe(200);

        for (let i = 1; i < 5; i++) {
          await chatPage.createNewChat();
          response = await chatPage.sendMessageViaAPI("Testing message");
          expect(response.status()).toBe(200);
        }
      });

      await test.step("Try to create 6th chat", async () => {
        await chatPage.createNewChat();
        await chatPage.input.fill("Last message");
        await expect(chatPage.sendButton).toBeEnabled();
      });

      await test.step("Verify 6th chat returns 403 error", async () => {
        const [response] = await Promise.all([
          newPage.waitForResponse(
            (response) =>
              response.url().includes("/api/chat") &&
              response.request().method() === "POST",
          ),
          chatPage.sendButton.click(),
        ]);
        expect(response.status()).toBe(403);

        await expect(
          newPage
            .getByLabel("Notifications alt+T")
            .getByText("Guest accounts are limited to"),
        ).toBeVisible();
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Chat UI: chat not found modal", () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Should display and interact with chat not found modal", async ({ page }) => {
    await test.step("Open invalid chat URL and verify modal is visible", async () => {
      await page.goto(
        `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`,
      );
      await expect(chatPage.chatNotFoundModal).toBeVisible();
    });

    await test.step("Verify modal text content", async () => {
      await expect(page.getByText("Chat not found")).toBeVisible();
      await expect(page.getByText("This conversation may have")).toBeVisible();
    });

    await test.step("Click refresh button and verify page reloads", async () => {
      await Promise.all([
        page.waitForURL(
          `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`,
          {
            waitUntil: "load",
          },
        ),
        chatPage.refreshPageButtonInModal.click(),
      ]);
    });

    await test.step("Click 'Start a new chat' and verify redirect", async () => {
      await chatPage.startANewChatButtonInModal.click();
      await expect(chatPage.newMeetingOptimizerButton).toBeVisible({
        timeout: 3000,
      });
      await expect(chatPage.myStratSyncButton).toBeVisible({ timeout: 3000 });
    });
  });
});
