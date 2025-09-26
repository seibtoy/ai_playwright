import { test, expect } from "@playwright/test";
import { ensureAuthorized } from "../helpers/save-session";

test.describe("User interacts with chat UI", () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test.afterEach(async ({ page }) => {
    await ensureAuthorized(page);
  });

  test("Verifies visibility and behavior of main chat UI elements", async ({
    page,
  }) => {
    test.step("Checks that the 'New Chat' button is visible", async () => {
      await expect(
        page.getByRole("button", { name: "New Chat" })
      ).toBeVisible();
    });

    test.step("Checks that the 'Private' button is visible", async () => {
      await expect(page.getByRole("button", { name: "Private" })).toBeVisible();
    });

    test.step("Checks the welcome message in an empty chat", async () => {
      await expect(page.getByText("Hello there!")).toBeVisible();
      await expect(page.getByText("What’s top of mind for you")).toBeVisible();
    });

    test.step("Checks that the 'Feedback' button is visible", async () => {
      const button = page.locator('button[data-slot="popover-trigger"]');
      await expect(button).toBeVisible();
    });

    test.step("Checks that the chat input is present and ready for typing", async () => {
      const chatInput = page.getByTestId("multimodal-input");
      await expect(chatInput).toBeVisible();
      await expect(chatInput).toBeEnabled();
    });
  });
});
