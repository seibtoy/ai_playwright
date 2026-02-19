import { test, expect } from "@/tests/fixtures/index";
import { URLS } from "@/tests/config/urls";

test.describe("Organization access: admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ADMIN });

  test("Admin should see all organizations", async ({ page, adminSidebar }) => {
    await test.step("Go to the organizations tab", async () => {
      await adminSidebar.organizationsTab.click();
    });

    await test.step("Check that table with organizations is visible", async () => {
      await expect(
        page.getByRole("button", { name: "Organization Name" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "User Count" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Created" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Actions" })).toBeVisible();
    });
  });

  test("Admin should see all registered users regardless of whether he is in the organization or not", async ({
    page,
    adminSidebar,
  }) => {
    await test.step("Go to the users tab", async () => {
      await adminSidebar.usersTab.click();
    });

    await test.step("Call the API to check the users data count", async () => {
      const response = await page.request.get("/api/admin/users");
      const data = await response.json();
      expect(data.length).toBeGreaterThan(300);
    });
  });
});

test.describe("Organization access: org admin", () => {
  test.use({ storageState: URLS.STORAGE_STATE_ORG_ADMIN });

  test("Org admin should see his own organization only", async ({
    page,
    adminSidebar,
  }) => {
    await test.step("Go to the organizations tab", async () => {
      await adminSidebar.organizationTab.click();
      await expect(page.getByText(/Employees\d+Total users in/)).toBeVisible();
    });

    await test.step("Check that org admin doesn't see organizations table", async () => {
      await expect(
        page.getByRole("button", { name: "Organization Name" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "User Count" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Created" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("cell", { name: "Actions" }),
      ).not.toBeVisible();
    });
  });

  test("Org admin should see users from his organization only", async ({
    page,
    adminSidebar,
  }) => {
    let employeeCount: number;

    await test.step("Go to the organizations tab", async () => {
      await adminSidebar.organizationTab.click();
      await expect(page.getByText(/Employees\d+Total users in/)).toBeVisible();
    });

    await test.step("Remember the count of members in the organization", async () => {
      const cardText = await page
        .getByText(/Employees\d+Total users in/)
        .textContent();
      employeeCount = Number(cardText?.match(/Employees(\d+)/)?.[1]);
    });

    await test.step("Go to the users tab", async () => {
      await adminSidebar.usersTab.click();
    });

    await test.step("Call the API to check the users data and match it with data from the card", async () => {
      const response = await page.request.get("/api/admin/users");
      const data = await response.json();
      expect(data.length).toBe(employeeCount);
    });
  });
});
