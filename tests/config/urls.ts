export const URLS = Object.freeze({
  BASE_URL:
    process.env.BASE_URL ||
    "https://thought-partner-env-staging-ai-leadership.vercel.app",
  AI_LEADERSHIP_URL: "https://connect.aileadership.com",
  STORAGE_PATH: "tests/storage",
  STORAGE_STATE_MAIN_USER: "tests/storage/storage-state-main-user.json",
  STORAGE_STATE_TEST_USER: "tests/storage/storage-state-test-user.json",
  STORAGE_STATE_ADMIN: "tests/storage/storage-state-admin.json",
  INBOX_STORAGE_FILE: "tests/storage/inboxes.json",
  MAILSLURP_API_KEY:
    "1a016528a1e0667b2d3e39c5c2e29e1e1a918dbef1ff31ab94a471b247d4c3da",
  MAILSLURP_MAIN_USER_INBOX_NAME: "playwright-main-user",
  MAILSLURP_TEST_USER_INBOX_NAME: "playwright-test-user",
});
