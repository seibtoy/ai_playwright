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
    "a86c424b611e8491442fcddc4cc93b584a24326e35c74af883645e3a00d52fbb",
  MAILSLURP_MAIN_USER_INBOX_NAME: "playwright-main-user",
  MAILSLURP_TEST_USER_INBOX_NAME: "playwright-test-user",
});
