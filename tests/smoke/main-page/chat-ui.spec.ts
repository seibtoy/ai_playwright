import { test, expect } from "@playwright/test";
import { AuthHelper } from "@helpers/index";
import { ChatPage, Sidebar } from "@pages/index";

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

// test.describe("Check if action buttons in chat works correctly", () => {
//   let chatPage: ChatPage;
//   let authHelper: AuthHelper;

//   test.beforeEach(async ({ page }) => {
//     authHelper = new AuthHelper(page);
//     chatPage = new ChatPage(page);

//     await authHelper.loginAsMainUser(page);
//   });

//   test("Verify that action buttons visible and works correctly", async ({
//     browser,
//   }, testInfo) => {
//     const context = await browser.newContext({
//       permissions: ["clipboard-read", "clipboard-write"],
//     });

//     const page = await context.newPage();

//     const chatPage = new ChatPage(page);
//     await authHelper.loginAsMainUser(page);

//     await test.step("Send message and verify that action buttons visible", async () => {
//       await chatPage.sendMessage("Hello world", true, testInfo);

//       await expect(chatPage.copyButton.first()).toBeVisible();
//       await expect(chatPage.upvoteButton).toBeVisible();
//       await expect(chatPage.downvoteButton).toBeVisible();
//     });

//     await test.step("Click on upvote button and verify that it is disabled", async () => {
//       await chatPage.upvoteButton.click();
//       await expect(chatPage.upvoteButton).toHaveAttribute("disabled");
//     });

//     await test.step("Click on downvote button and verify that it is disabled", async () => {
//       await chatPage.downvoteButton.click();
//       await expect(chatPage.downvoteButton).toHaveAttribute("disabled");
//     });

//     await test.step("Click on copy button and verify that message is copied", async () => {
//       const content = chatPage.messageContent.last();
//       const expectedContent = await content.textContent();

//       await chatPage.copyButton.click();

//       const clipboardText = await page.evaluate(() =>
//         navigator.clipboard.readText()
//       );
//       expect(clipboardText.trim()).toBe(expectedContent!.trim());
//     });

//     await context.close();
//   });
// });

// test.describe("Check if privacy functionality works correctly", () => {
//   let chatPage: ChatPage;
//   let authHelper: AuthHelper;

//   test.beforeEach(async ({ page }) => {
//     authHelper = new AuthHelper(page);
//     chatPage = new ChatPage(page);

//     await authHelper.loginAsMainUser(page);
//   });

//   test("Verify that other users can't see private chat", async ({
//     page,
//   }, testInfo) => {
//     let chatUrl: string;

//     await test.step("Check that the private button is visible", async () => {
//       await expect(chatPage.privateButton).toBeVisible();
//     });

//     await test.step("Send message to create the new chat and get the chat url", async () => {
//       await chatPage.sendMessage("Hello world", true, testInfo);
//       chatUrl = page.url();
//     });

//     await test.step("Logout from main account", async () => {
//       await chatPage.logout();
//     });

//     await test.step("Login as test user", async () => {
//       await authHelper.loginAsTestUser(page);
//     });

//     await test.step("Open the chat url and verify that the chat is private", async () => {
//       await page.goto(chatUrl);
//       await expect(chatPage.pageNotFoundText).toBeVisible();
//     });
//   });

//   test("Verify that other users can see public chat", async ({
//     page,
//   }, testInfo) => {
//     let chatUrl: string;

//     await test.step("Check that the private button is visible", async () => {
//       await expect(chatPage.privateButton).toBeVisible();
//     });

//     await test.step("Send message to create the new chat and get the chat url", async () => {
//       await chatPage.sendMessage("Hello world", true, testInfo);
//       chatUrl = page.url();
//     });

//     await test.step("Change chat privace from private to public", async () => {
//       await chatPage.privateButton.click();
//       await page
//         .getByRole("menuitem", { name: "Public Anyone with the link" })
//         .click();
//       await expect(chatPage.publicButton).toBeVisible();
//       await page.waitForTimeout(5000);
//     });

//     await test.step("Logout from main account", async () => {
//       await chatPage.logout();
//     });

//     await test.step("Login as test user", async () => {
//       await authHelper.loginAsTestUser(page);
//     });

//     await test.step("Open the chat url and verify that the chat is private", async () => {
//       await page.goto(chatUrl);
//       await expect(chatPage.messageContent.last()).toBeVisible();
//     });
//   });
// });

// to fix
