import { test, expect } from "@playwright/test";
import { ensureAuthorized } from "../../helpers/save-session";
import { ChatPage } from "../../pages/chat-page";

test.describe("User interacts with chat UI", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    chatPage = new ChatPage(page);
  });

  test.afterEach(async ({ page }) => {
    await ensureAuthorized(page);
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

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    chatPage = new ChatPage(page);
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

  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
    chatPage = new ChatPage(page);
  });

  test("Verify that action buttons visible", async ({ page }, testInfo) => {
    await chatPage.sendMessage("Hello world", true, testInfo);

    await expect(
      page
        .locator(
          "div > .flex.gap-4.w-full.group-data-\\[role\\=user\\]\\/message\\:ml-auto > .flex.flex-col.gap-4.w-full > .flex.flex-col.md\\:flex-row > .flex > button"
        )
        .first()
    ).toBeVisible();

    await expect(chatPage.upvoteButton).toBeVisible();
    await expect(chatPage.downvoteButton).toBeVisible();
  });

  test("Check that action buttons works correctly", async ({ page }) => {});
});
