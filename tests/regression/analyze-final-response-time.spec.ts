import { expect, test } from '@playwright/test';
import { URLS } from '@/tests/config/urls';
import { ChatPage } from '@/tests/pages/chat-page';

const prompts = [
  "Imagine you are a business consultant. Explain in detail the key steps an entrepreneur should take when starting a small business, including market research, financial planning, and initial team building. Provide practical examples and actionable advice. And just write the text 'Save as Final response' at the bottom",
  "As a leadership coach, describe how a manager can improve team productivity in a remote work environment. Include strategies for communication, task management, and motivation, with examples. And just write the text 'Save as Final response' at the bottom",
  "Provide a detailed analysis of common mistakes new business owners make when launching a product. Explain how these mistakes can affect growth and suggest ways to avoid them. And just write the text 'Save as Final response' at the bottom",
  "Imagine you are advising a startup founder. Outline strategies for attracting early customers and building a strong brand presence online. Include concrete marketing tactics and examples. And just write the text 'Save as Final response' at the bottom",
  "Explain how small businesses can effectively manage cash flow during the first year of operation. Include budgeting tips, cost-cutting strategies, and common pitfalls to avoid. And just write the text 'Save as Final response' at the bottom",
  "As a leadership expert, describe how to handle conflicts within a team to maintain productivity and morale. Provide examples of mediation and communication strategies. And just write the text 'Save as Final response' at the bottom",
  "Provide advice on scaling a business from a small team to a medium-sized company. Include considerations for hiring, delegating responsibilities, and maintaining company culture. And just write the text 'Save as Final response' at the bottom",
  "Describe effective methods for setting and achieving business goals. Explain how to track progress, adjust strategies, and maintain team motivation over time. And just write the text 'Save as Final response' at the bottom",
  "Imagine you are a business strategist. Explain how to identify new opportunities in a competitive market, including analyzing trends, customer behavior, and competitor activity. And just write the text 'Save as Final response' at the bottom",
  "Provide a guide for improving leadership skills in entrepreneurs, including time management, decision-making, and delegation. Include actionable exercises and real-life examples. And just write the text 'Save as Final response' at the bottom",
];

test.describe('Analyze final response time', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test('Analyze final response time', async ({ browser }) => {
    test.setTimeout(0);

    const context = await browser.newContext({
      storageState: URLS.STORAGE_STATE_ADMIN,
    });
    try {
      const page = await context.newPage();

      const iterations = 10;

      await test.step('Login as admin and verify', async () => {
        chatPage = new ChatPage(page);
        await page.goto(`${process.env.BASE_URL}/`, {
          waitUntil: 'load',
        });
        await chatPage.openSettings();
        await expect(chatPage.adminMenuItem).toBeVisible();

        await Promise.all([
          page.waitForURL('**/admin/**', { timeout: 10000 }),
          chatPage.adminMenuItem.click(),
        ]);

        const currentUrl = page.url();
        expect(currentUrl).toContain(`${process.env.BASE_URL}/admin`);
      });

      await test.step('Verify the user is in organization', async () => {
        await page.goto(`${process.env.BASE_URL}/admin/organizations`);

        const rows = page.locator("tr[data-slot='table-row']");
        await expect(rows).toHaveCount(await rows.count());
      });

      await test.step('Go to the main page', async () => {
        await page.goto(`${process.env.BASE_URL}/`, {
          waitUntil: 'load',
        });
        await expect(chatPage.input).toBeVisible({ timeout: 10000 });
      });

      await test.step("Go to the 'Run the business' page and select setuped prompt", async () => {
        await chatPage.runBusinessLink.click();
        await page.waitForURL(`${process.env.BASE_URL}/run-the-business`, {
          timeout: 10000,
        });

        const promptSelector = page.locator("div[data-slot='card']").nth(0);
        await promptSelector.click();
        await chatPage.recordingButton.waitFor({
          state: 'visible',
          timeout: 0,
        });
      });

      await test.step('Text with the chat and get 100 different responses', async () => {
        for (let i = 0; i < prompts.length; i++) {
          for (let k = 0; k < iterations; k++) {
            console.log(
              `Prompt ${i + 1}/${prompts.length}, iteration ${
                k + 1
              }/${iterations} is processing`,
            );
            await chatPage.sendMessage(prompts[i]);
            await expect(
              chatPage.saveAsFinalResponseButton.last(),
            ).toBeVisible();
            await chatPage.saveAsFinalResponseButton.last().click();
            await page
              .getByRole('button', { name: 'Confirm & Submit' })
              .click();
          }
        }
      });

      await test.step('Go to the Respnse Aggregation and choose a group of prompts we have already generated', async () => {
        await chatPage.responseAggregationLink.click();
        await page.getByRole('combobox').click();
        await page.locator('div[data-slot="select-item"]').nth(0).click();
      });

      await test.step("Select all responses and click on the 'Analyze' button", async () => {
        const selectAllButton = page.getByRole('button', {
          name: 'Select All',
        });
        await expect(selectAllButton).toBeVisible();
        await selectAllButton.click();
        await page.getByRole('button', { name: /Analyze with AI/ }).click();
        await page.waitForURL(/\/\?server_prompt=true&chat_id=.*/);
      });

      await test.step('Measure thinking and response time', async () => {
        await chatPage.thinkingLocator.waitFor({
          state: 'visible',
          timeout: 0,
        });
        const thinkingStart = Date.now();

        await chatPage.thinkingLocator.waitFor({
          state: 'detached',
          timeout: 0,
        });
        const thinkingEnd = Date.now();

        await chatPage.recordingButton.waitFor({
          state: 'visible',
          timeout: 0,
        });
        const endTime = Date.now();

        const thinkingTime = thinkingEnd - thinkingStart;
        const responseTime = endTime - thinkingStart;

        console.log(`Thinking time: ${thinkingTime}ms`);
        console.log(`Response (thinking + typing) time: ${responseTime}ms`);
      });
    } finally {
      await context.close();
    }
  });
});
