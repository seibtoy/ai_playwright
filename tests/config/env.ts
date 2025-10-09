function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  BASE_URL: requireEnv("BASE_URL"),
  AI_LEADERSHIP_URL: requireEnv("AI_LEADERSHIP_URL"),
  MAILSLURP_API_KEY: requireEnv("MAILSLURP_API_KEY"),
  MAILSLURP_MAIN_USER_INBOX_NAME: requireEnv("MAILSLURP_MAIN_USER_INBOX_NAME"),
  MAILSLURP_TEST_USER_INBOX_NAME: requireEnv("MAILSLURP_TEST_USER_INBOX_NAME"),
};
