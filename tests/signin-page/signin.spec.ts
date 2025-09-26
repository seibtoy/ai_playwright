import { test, expect } from "@playwright/test";
import { generateEmail } from "../helpers/generate-email";

test.describe("UI elements before email submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("Verifies the sign-in page elements", async ({ page }) => {
    await expect(page.getByRole("img")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Sign in to AITP" })
    ).toBeVisible();

    await expect(page.getByText("Enter your email and we'll")).toBeVisible();

    await expect(page.getByText("Email Address")).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: "Email Address" })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Send verification code" })
    ).toBeVisible();

    await expect(page.getByText("By continuing, you agree to")).toBeVisible();
  });

  test("The 'Terms of Service' link leads to the correct page", async ({
    page,
  }) => {
    const newPagePromise = page.waitForEvent("popup");

    await page.getByText("Terms of Service").click();

    const newPage = await newPagePromise;

    await expect(newPage).toHaveURL(
      `${process.env.AI_LEADERSHIP_URL!}/legal/aitp-terms-of-service`
    );
  });

  test("The 'Send verification code' button should be inactive until the email is valid.", async ({
    page,
  }) => {
    const sendButton = page.getByRole("button", {
      name: "Send verification code",
    });
    const emailInput = page.getByRole("textbox", { name: "Email Address" });

    await expect(sendButton).toBeDisabled();

    await emailInput.fill("invalid-email-format");
    await expect(sendButton).toBeDisabled();

    await emailInput.fill(generateEmail());

    await expect(sendButton).toBeEnabled();
  });
});

test.describe("UI elements after email submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("Shows toast after email submission", async ({ page }) => {
    const sendButton = page.getByRole("button", {
      name: "Send verification code",
    });
    const emailInput = page.getByRole("textbox", { name: "Email Address" });

    await emailInput.fill(generateEmail());
    await sendButton.click();

    await expect(page.getByTestId("toast")).toBeVisible();
  });

  test("Displays verification form after sending code", async ({ page }) => {
    const sendButton = page.getByRole("button", {
      name: "Send verification code",
    });
    const emailInput = page.getByRole("textbox", { name: "Email Address" });

    await emailInput.fill(generateEmail());
    await sendButton.click();

    await expect(page.getByRole("img").nth(1)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Enter verification code" })
    ).toBeVisible();
    await expect(page.getByText("We've sent a 6-digit code to")).toBeVisible();
    await expect(
      page.getByText("Verification Code", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Didn't receive the code?Resend code")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Use a different email" })
    ).toBeVisible();
  });

  test('Returns to email input when clicking "Use a different email"', async ({
    page,
  }) => {
    const sendButton = page.getByRole("button", {
      name: "Send verification code",
    });
    const emailInput = page.getByRole("textbox", { name: "Email Address" });

    await emailInput.fill(generateEmail());
    await sendButton.click();

    await page.getByRole("button", { name: "Use a different email" }).click();
    await expect(
      page.getByRole("textbox", { name: "Email Address" })
    ).toBeVisible();
  });
});

test.describe("Email verification code API requests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("Sends a request to /signin when submitting a valid email", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: "Email Address" })
      .fill(generateEmail());

    const responsePromise = page.waitForResponse("**/signin");

    await page.getByRole("button", { name: "Send verification code" }).click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Verification Code$/ })
        .nth(1)
    ).toBeVisible();
  });
  test("Resend code button sends request", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Email Address" })
      .fill(generateEmail());
    await page.getByRole("button", { name: "Send verification code" }).click();

    await expect(
      page.getByRole("button", { name: "Resend code" })
    ).toBeVisible();

    const responsePromise = page.waitForResponse("**/signin");

    await page.getByRole("button", { name: "Resend code" }).click();

    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });
});
