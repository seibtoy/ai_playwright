import { test as base, expect } from "@playwright/test";
import { ChatPage } from "@/tests/pages/chat-page";
import { AdminSidebar } from "@/tests/pages/admin-sidebar";

type AppFixtures = {
  adminSidebar: AdminSidebar;
  chatPage: ChatPage;
};

export const test = base.extend<AppFixtures>({
  adminSidebar: async ({ page }, use) => {
    const chatPage = new ChatPage(page);
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }
    await page.goto(baseUrl);
    await chatPage.openAdminPanel();
    await use(new AdminSidebar(page));
  },
  chatPage: async ({ page }, use) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigateMainPage();
    await use(chatPage);
  },
});

export { expect };
