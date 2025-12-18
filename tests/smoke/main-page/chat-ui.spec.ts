import { expect, test } from '@playwright/test';
import { URLS } from '@/tests/config/urls';
import { ChatPage } from '@/tests/pages/chat-page';
import { SigninPage } from '@/tests/pages/signin-page';

test.describe('User interacts with chat UI', () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test('Verifies visibility and behavior of main chat UI elements when the chat is started', async () => {
    await test.step('Send message to the chat for display the UI', async () => {
      await chatPage.sendMessageViaAPI('Hello');
    });

    await test.step("Checks that the 'New Chat' button is visible", async () => {
      await expect(chatPage.newChatButton).toBeVisible();
    });

    await test.step("Checks that the 'Private' button is visible", async () => {
      await expect(chatPage.privateButton).toBeVisible();
    });

    await test.step("Checks that the 'Feedback' button is visible", async () => {
      await expect(chatPage.feedbackButton).toBeVisible();
    });

    await test.step('Checks that the chat input is present and ready for typing', async () => {
      await expect(chatPage.input).toBeVisible();
      await expect(chatPage.input).toBeEnabled();
    });
  });
});

test.describe('Check file attachment', () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test('Attach file via button', async ({ page }) => {
    await expect(chatPage.attachmentsButton).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      chatPage.attachmentsButton.click(),
    ]);

    await fileChooser.setFiles('tests/data/test-pdf.pdf');
    await expect(chatPage.inputAttachmentPreview).toBeVisible();

    await page.getByTestId('send-button').click();
    await chatPage.recordingButton.waitFor({ state: 'visible' });
    await expect(chatPage.messageContent).toBeVisible();
  });
});

test.describe('Check if action buttons in chat works correctly', () => {
  test('Verify that action buttons visible and works correctly', async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
      permissions:
        testInfo.project.name === 'chromium'
          ? ['clipboard-read', 'clipboard-write']
          : [],
    });

    const page = await context.newPage();
    await page.goto(`${process.env.BASE_URL}/`);

    const chatPage = new ChatPage(page);

    await test.step('Send message and verify that action buttons visible', async () => {
      await chatPage.sendMessage('Hello world');

      await expect(chatPage.copyButton.first()).toBeVisible();
      await expect(chatPage.upvoteButton).toBeVisible();
      await expect(chatPage.downvoteButton).toBeVisible();
    });

    await test.step('Click on upvote button and verify that it is disabled', async () => {
      await chatPage.upvoteButton.click();
      await expect(chatPage.upvoteButton).toHaveAttribute('disabled');
    });

    await test.step('Click on downvote button and verify that it is disabled', async () => {
      await chatPage.downvoteButton.click();
      await expect(chatPage.downvoteButton).toHaveAttribute('disabled');
    });

    await test.step('Click on copy button and verify that message is copied', async () => {
      const content = chatPage.messageContent.last();
      const expectedContent = await content.textContent();

      await chatPage.copyButton.click();

      // eslint-disable-next-line playwright/no-conditional-in-test
      if (testInfo.project.name === 'chromium') {
        const clipboardText = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );
        // eslint-disable-next-line playwright/no-conditional-expect
        expect(clipboardText.trim()).toBe(expectedContent?.trim());
      } else {
        // eslint-disable-next-line playwright/no-conditional-expect
        await expect(chatPage.copyButton.first()).toBeVisible();
      }
    });
    await context.close();
  });
});

test.describe('Check if privacy functionality works correctly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test("Verify that other users can't see private chat", async ({
    browser,
  }) => {
    // --- CONTEXT FOR MAIN USER ---
    const mainContext = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
    });
    const mainPage = await mainContext.newPage();
    const mainChatPage = new ChatPage(mainPage);

    // --- CREATE CHAT ---
    await mainPage.goto(`${process.env.BASE_URL}/`);
    await mainChatPage.sendMessageViaAPI('Hello world');
    await expect(mainChatPage.privateButton).toBeVisible();
    const chatUrl = mainPage.url();

    await mainContext.close();

    // --- CONTEXT FOR TEST USER ---
    const testContext = await browser.newContext({
      storageState: URLS.STORAGE_STATE_TEST_USER,
    });
    const testPage = await testContext.newPage();
    const testChatPage = new ChatPage(testPage);

    await testPage.goto(chatUrl);
    await expect(testChatPage.chatNotFoundModal).toBeVisible();

    await testContext.close();
  });

  test('Verify that other users can see public chat', async ({ browser }) => {
    // --- CONTEXT FOR MAIN USER ---
    const mainContext = await browser.newContext({
      storageState: URLS.STORAGE_STATE_MAIN_USER,
    });
    const mainPage = await mainContext.newPage();
    const mainChatPage = new ChatPage(mainPage);

    await mainPage.goto(`${process.env.BASE_URL}/`);

    // --- CREATE CHAT ---
    await mainChatPage.sendMessageViaAPI('Hello world');
    const chatUrl = mainPage.url();
    await expect(mainChatPage.privateButton).toBeVisible();

    // --- CHANGE PRIVACY TO PUBLIC ---
    await mainChatPage.privateButton.click();
    await mainPage
      .getByRole('menuitem', { name: 'Public Anyone with the link' })
      .click();
    await expect(mainChatPage.publicButton).toBeVisible();
    await expect(mainChatPage.publicButton).toBeEnabled();

    // --- LOGOUT MAIN USER ---
    await mainContext.close();

    // --- CONTEXT FOR TEST USER ---
    const testContext = await browser.newContext({
      storageState: URLS.STORAGE_STATE_TEST_USER,
    });
    const testPage = await testContext.newPage();
    const testChatPage = new ChatPage(testPage);

    await testPage.goto(chatUrl);

    // --- VERIFY THAT THE CHAT IS PUBLIC ---
    await expect(testChatPage.messageContent.last()).toBeVisible();

    await testContext.close();
  });
});

test.describe('Check if USER GUEST can create up to 5 chats', () => {
  test('Verify that user guest can create up to 5 chats', async ({
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
      await test.step('Check that the input is visible', async () => {
        await expect(chatPage.input).toBeVisible();
      });

      await test.step('Create 5 chats', async () => {
        let response = await chatPage.sendMessageViaAPI('Testing message');
        expect(response.status()).toBe(200);

        for (let i = 1; i < 5; i++) {
          await chatPage.createNewChat();
          response = await chatPage.sendMessageViaAPI('Testing message');
          expect(response.status()).toBe(200);
        }
      });

      await test.step('Trying to create 6th chat', async () => {
        await chatPage.createNewChat();
        await chatPage.input.fill('Last message');
        await expect(chatPage.sendButton).toBeEnabled();
      });

      await test.step('Verify that the chat is not created and return 403 error', async () => {
        const [response] = await Promise.all([
          newPage.waitForResponse(
            (response) =>
              response.url().includes('/api/chat') &&
              response.request().method() === 'POST',
          ),
          chatPage.sendButton.click(),
        ]);
        expect(response.status()).toBe(403);

        await expect(
          newPage
            .getByLabel('Notifications alt+T')
            .getByText('Guest accounts are limited to'),
        ).toBeVisible();
      });
    } finally {
      await context.close();
    }
  });
});

test.describe('Check if chat not found modal works correctly', () => {
  test.use({ storageState: URLS.STORAGE_STATE_MAIN_USER });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto(`${process.env.BASE_URL}/`);
  });

  test('Verify that chat not found modal works correctly', async ({ page }) => {
    await test.step('Open the wrong url and verify that the chat not found modal is visible', async () => {
      await page.goto(
        `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`,
      );
      await expect(chatPage.chatNotFoundModal).toBeVisible();
    });

    await test.step('Check if text in chat not found modal is correct', async () => {
      await expect(page.getByText('Chat not found')).toBeVisible();
      await expect(page.getByText('This conversation may have')).toBeVisible();
    });

    await test.step('Click on the refresh page button and verify that the page is refreshed', async () => {
      await Promise.all([
        page.waitForURL(
          `${process.env.BASE_URL}/chat/4b33087a-c85c-4f94-ac5c-e6ff52d55555`,
          {
            waitUntil: 'load',
          },
        ),
        chatPage.refreshPageButtonInModal.click(),
      ]);
    });

    await test.step('Click on the start a new chat button and verify that the new chat is created', async () => {
      await chatPage.startANewChatButtonInModal.click();
      await expect(page.getByText('Hello there!')).toBeVisible();
      await expect(page.getByText('What’s top of mind for you')).toBeVisible();
    });
  });
});
