import { test, expect } from "@playwright/test";
import { AuthHelper } from "@/tests/helpers/save-session";
import { ChatPage } from "@/tests/pages/chat-page";
import { SigninPage } from "@/tests/pages/signin-page";

test.describe("User interacts with chat UI", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);

    await authHelper.loginAsMainUser(page);
  });

  test("Verifies visibility and behavior of main chat UI elements", async ({
    page,
  }) => {
    await test.step("Checks that the 'New Chat' button is visible", async () => {
      await expect(chatPage.newChatButton).toBeVisible();
    });

    await test.step("Checks that the 'Private' button is visible", async () => {
      await expect(chatPage.privateButton).toBeVisible();
    });

    await test.step("Checks the welcome message in an empty chat", async () => {
      await expect(page.getByText("Hello there!")).toBeVisible();
      await expect(page.getByText("What’s top of mind for you")).toBeVisible();
    });

    await test.step("Checks that the 'Feedback' button is visible", async () => {
      await expect(chatPage.feedbackButton).toBeVisible();
    });

    await test.step("Checks that the chat input is present and ready for typing", async () => {
      await expect(chatPage.input).toBeVisible();
      await expect(chatPage.input).toBeEnabled();
    });
  });
});

test.describe("Check file attachment", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);
    await authHelper.loginAsMainUser(page);
  });

  test("Attach file via button", async ({ page }, testInfo) => {
    await expect(chatPage.attachmentsButton).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      chatPage.attachmentsButton.click(),
    ]);

    await fileChooser.setFiles("tests/data/test-pdf.pdf");
    await expect(chatPage.inputAttachmentPreview).toBeVisible();

    await page.getByTestId("send-button").click();
    if (testInfo.project.name === "webkit") {
      await chatPage.recordingButtonWebkit.waitFor({ state: "visible" });
      await expect(chatPage.recordingButtonWebkit).toBeVisible();
    } else {
      await chatPage.recordingButton.waitFor({ state: "visible" });
      await expect(chatPage.messageContent).toBeVisible();
    }
  });
});

test.describe("Check if action buttons in chat works correctly", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);

    await authHelper.loginAsMainUser(page);
  });

  test("Verify that action buttons visible and works correctly", async ({
    browser,
  }, testInfo) => {
    const contextOptions: any = {};
    if (testInfo.project.name === "chromium") {
      contextOptions.permissions = ["clipboard-read", "clipboard-write"];
    }
    const context = await browser.newContext(contextOptions);

    const page = await context.newPage();

    const chatPage = new ChatPage(page);
    await authHelper.loginAsMainUser(page);

    await test.step("Send message and verify that action buttons visible", async () => {
      await chatPage.sendMessage("Hello world", true, testInfo);

      await expect(chatPage.copyButton.first()).toBeVisible();
      await expect(chatPage.upvoteButton).toBeVisible();
      await expect(chatPage.downvoteButton).toBeVisible();
    });

    await test.step("Click on upvote button and verify that it is disabled", async () => {
      await chatPage.upvoteButton.click();
      await expect(chatPage.upvoteButton).toHaveAttribute("disabled");
    });

    await test.step("Click on downvote button and verify that it is disabled", async () => {
      await chatPage.downvoteButton.click();
      await expect(chatPage.downvoteButton).toHaveAttribute("disabled");
    });

    await test.step("Click on copy button and verify that message is copied", async () => {
      const content = chatPage.messageContent.last();
      const expectedContent = await content.textContent();

      await chatPage.copyButton.click();

      if (testInfo.project.name === "chromium") {
        const clipboardText = await page.evaluate(() =>
          navigator.clipboard.readText()
        );
        expect(clipboardText.trim()).toBe(expectedContent!.trim());
      } else {
        await expect(chatPage.copyButton.first()).toBeVisible();
      }
    });
    await context.close();
  });
});

test.describe("Check if privacy functionality works correctly", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);

    await authHelper.loginAsMainUser(page);
  });

  test("Verify that other users can't see private chat", async ({ page }) => {
    let chatUrl: string;

    await test.step("Check that the private button is visible", async () => {
      await expect(chatPage.privateButton).toBeVisible();
    });

    await test.step("Send message to create the new chat and get the chat url", async () => {
      await chatPage.sendMessageViaAPI("Hello world");
      chatUrl = page.url();
    });

    await test.step("Logout from main account", async () => {
      await chatPage.logout();
    });

    await test.step("Login as test user", async () => {
      await authHelper.loginAsTestUser(page);
    });

    await test.step("Open the chat url and verify that the chat is private", async () => {
      await page.goto(chatUrl);
      await expect(chatPage.chatNotFoundModal).toBeVisible();
    });
  });

  test("Verify that other users can see public chat", async ({ page }) => {
    let chatUrl: string;

    await test.step("Check that the private button is visible", async () => {
      await expect(chatPage.privateButton).toBeVisible();
    });

    await test.step("Send message to create the new chat and get the chat url", async () => {
      await chatPage.sendMessageViaAPI("Hello world");
      chatUrl = page.url();
    });

    await test.step("Change chat privace from private to public", async () => {
      await chatPage.privateButton.click();
      await page
        .getByRole("menuitem", { name: "Public Anyone with the link" })
        .click();
      await expect(chatPage.publicButton).toBeVisible();
      await page.waitForTimeout(300);
    });

    await test.step("Logout from main account", async () => {
      await chatPage.logout();
    });

    await test.step("Login as test user", async () => {
      await authHelper.loginAsTestUser(page);
    });

    await test.step("Open the chat url and verify that the chat is public", async () => {
      await page.goto(chatUrl);
      await expect(chatPage.messageContent.last()).toBeVisible();
    });
  });
});

test.describe("Check if USER GUEST can create up to 5 chats", () => {
  test("Verify that user guest can create up to 5 chats", async ({
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
      await test.step("Check that the input is visible", async () => {
        await expect(chatPage.input).toBeVisible();
      });

      await test.step("Create 5 chats", async () => {
        for (let i = 0; i < 5; i++) {
          await chatPage.createNewChat();
          const response = await chatPage.sendMessageViaAPI("Testing message");
          expect(response.status()).toBe(200);
        }
      });

      await test.step("Trying to create 6th chat", async () => {
        await chatPage.createNewChat();
        await chatPage.input.fill("Last message");
        await expect(chatPage.sendButton).toBeEnabled();
      });

      await test.step("Verify that the chat is not created and return 403 error", async () => {
        const [response] = await Promise.all([
          newPage.waitForResponse(
            (response) =>
              response.url().includes("/api/chat") &&
              response.request().method() === "POST"
          ),
          chatPage.sendButton.click(),
        ]);
        expect(response.status()).toBe(403);

        await expect(
          newPage
            .getByLabel("Notifications alt+T")
            .getByText("Guest accounts are limited to")
        ).toBeVisible();
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Check if chat not found modal works correctly", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);

    await authHelper.loginAsMainUser(page);
  });

  test("Verify that chat not found modal works correctly", async ({ page }) => {
    await test.step("Open the wrong url and verify that the chat not found modal is visible", async () => {
      await page.goto(
        `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`
      );
      await expect(chatPage.chatNotFoundModal).toBeVisible();
    });

    await test.step("Check if text in chat not found modal is correct", async () => {
      await expect(page.getByText("Chat not found")).toBeVisible();
      await expect(page.getByText("This conversation may have")).toBeVisible();
    });

    await test.step("Click on the refresh page button and verify that the page is refreshed", async () => {
      await Promise.all([
        page.waitForURL(
          `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`,
          {
            waitUntil: "load",
          }
        ),
        chatPage.refreshPageButtonInModal.click(),
      ]);
    });

    await test.step("Click on the start a new chat button and verify that the new chat is created", async () => {
      await chatPage.startANewChatButtonInModal.click();
      await expect(page.getByText("Hello there!")).toBeVisible();
      await expect(page.getByText("What’s top of mind for you")).toBeVisible();
    });
  });
});
