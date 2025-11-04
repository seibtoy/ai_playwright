# Playwright Test Suite

## Directory Structure

```
tests/
├── config/                 # Test configuration files
│   ├── env.ts             # Environment variables and configuration
│   └── global-setup.ts    # Global setup for authentication
├── data/                  # Test data files
│   └── test-pdf.pdf       # Sample PDF for file upload tests
├── helpers/               # Test helper functions and utilities
│   ├── generate-email.ts  # Email generation utility
│   ├── index.ts          # Helper exports
│   ├── save-admin-session.spec.ts  # Admin session setup
│   └── save-session.ts   # Authentication helper class
├── pages/                 # Page Object Model classes
│   ├── chat-page.ts      # Chat interface page object
│   ├── index.ts          # Page object exports
│   ├── profile-page.ts   # User profile page object
│   ├── sidebar-component.ts  # Sidebar component page object
│   ├── signin-page.ts    # Sign-in page object
│   └── stratsync-dashboard-page.ts  # Dashboard page object
├── regression/            # Regression tests
│   ├── analyze-final-response-time.spec.ts
│   └── response-aggregation.spec.ts
├── smoke/                 # Smoke tests
│   ├── main-page/        # Main page tests
│   │   ├── chat-ui.spec.ts
│   │   └── sidebar.spec.ts
│   ├── profile-page/     # Profile page tests
│   │   └── profile.spec.ts
│   └── signin-page/      # Authentication tests
│       └── signin.spec.ts
└── storage/              # Test data storage
    ├── inboxes.json      # MailSlurp inbox configuration
    ├── storage-state-admin.json      # Admin user session
    ├── storage-state-main-user.json  # Main user session
    └── storage-state-test-user.json  # Test user session
```

## Getting Started

### Prerequisites

1. **Environment Variables**: Ensure `.env` file contains:

   ```bash
   BASE_URL=https://your-app-url.com
   AI_LEADERSHIP_URL=https://connect.aileadership.com
   MAILSLURP_API_KEY=your_mailslurp_api_key
   MAILSLURP_MAIN_USER_INBOX_NAME=playwright-main-user
   MAILSLURP_TEST_USER_INBOX_NAME=playwright-test-user
   ```

2. **Dependencies**: All required packages are installed with the main project.

### Running Tests

#### Run All Tests

```bash
npx playwright test
```

#### Run Specific Test Categories

```bash
# Smoke tests only
npx playwright test tests/smoke/

# Regression tests only
npx playwright test tests/regression/

# Specific test file
npx playwright test tests/smoke/signin-page/signin.spec.ts
```

#### Run Tests with Different Options

```bash
# Run with UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Run with custom workers (parallelism)
npx playwright test --workers=6

# Run tests in debug mode
npx playwright test --debug
```

#### Generate Test Report

```bash
# Generate HTML report
npx playwright test --reporter=html

# Open the report
npx playwright show-report
```

## 🔧 Test Configuration

### Global Setup

Tests use a global setup (`tests/config/global-setup.ts`) that automatically:

- Authenticates main user and test user via MailSlurp email service
- Saves authentication state for reuse across tests
- Runs before all test suites

### Authentication System

The test suite uses **MailSlurp** for email-based authentication:

- **Main User**: `playwright-main-user` inbox
- **Test User**: `playwright-test-user` inbox
- **Admin User**: Manual setup required (see Admin Setup section)

### Parallel Execution

- **Default**: 3 workers (1 per browser: Chrome, Firefox, Safari)
- **CI Environment**: 1 worker with 2 retries
- **Customizable**: Use `--workers=N` flag

## 👨‍💼 Admin Setup (Manual Process)

The admin session requires manual setup due to security considerations:

### Step 1: Run Admin Session Setup

```bash
npx playwright test tests/helpers/save-admin-session.spec.ts
```

### Step 2: Manual Authentication

1. The test will open a browser and pause at the sign-in page
2. **Manually complete the authentication flow** using an admin email account
3. The test will automatically save the session state to `tests/storage/storage-state-admin.json`

### Step 3: Admin Email Requirements

- Use an email address that has admin privileges in your application
- Complete the full email verification process manually
- The session will be reused for subsequent admin tests

### Important Notes

- **DO NOT commit** `storage-state-admin.json` to version control
- Admin session expires and needs to be regenerated periodically
- This approach ensures admin credentials are never stored in code

## Test Categories

### Smoke Tests

Quick tests that verify basic functionality without deep testing.

#### `tests/smoke/signin-page/signin.spec.ts`

- **Purpose**: Verifies authentication UI and flow
- **Coverage**: Sign-in page elements, email validation, verification code flow
- **Key Tests**:
  - UI element visibility and behavior
  - Email input validation
  - Verification code submission
  - Terms of Service link functionality
  - Logout functionality

#### `tests/smoke/main-page/sidebar.spec.ts`

- **Purpose**: Tests sidebar navigation and functionality
- **Coverage**: Sidebar components, navigation links, menu interactions
- **Key Tests**:
  - Sidebar UI elements visibility
  - Menu toggle functionality
  - Navigation link correctness
  - User settings dropdown
  - Chat history display

#### `tests/smoke/main-page/chat-ui.spec.ts`

- **Purpose**: Verifies main chat interface functionality
- **Coverage**: Chat input, file attachments, UI interactions
- **Key Tests**:
  - Chat UI element visibility
  - File attachment functionality
  - Input field behavior

#### `tests/smoke/profile-page/profile.spec.ts`

- **Purpose**: Tests user profile page functionality
- **Coverage**: Profile information display, account management
- **Key Tests**:
  - Profile page elements visibility
  - Delete account modal functionality
  - User information display

### Regression Tests

Performance and stability tests that ensure no regressions in critical functionality.

#### `tests/regression/response-aggregation.spec.ts`

- **Purpose**: Tests chat response performance and aggregation
- **Coverage**: Long message handling, response timing, chat optimization
- **Key Tests**:
  - 300 iterations of long message prompts
  - Average block timing analysis
  - Response aggregation performance

#### `tests/regression/analyze-final-response-time.spec.ts`

- **Purpose**: Analyzes final response generation timing
- **Coverage**: Business consultant prompts, response time measurement
- **Key Tests**:
  - 10 different business consultation prompts
  - Final response generation timing
  - "Save as Final Response" functionality

## Page Object Model

The test suite uses the Page Object Model pattern for maintainable and reusable test code:

### `SigninPage`

- Email input handling
- Verification code submission
- Button interactions (Send code, Resend, Use different email)

### `ChatPage` (extends `Sidebar`)

- Chat input and send functionality
- File attachment handling
- Message interactions (upvote, downvote, copy)
- Recording functionality
- Visibility controls (private/public)

### `ProfilePage`

- Profile information display
- Account management functionality
- User settings interactions

### `Sidebar`

- Navigation menu functionality
- Chat history management
- User settings dropdown
- Logo and branding elements

## Helper Classes

### `AuthHelper`

- **Purpose**: Manages authentication for test users
- **Features**:
  - MailSlurp integration for email verification
  - Session state management
  - Automatic login for main and test users
  - Inbox management and cleanup

### `generateEmail()`

- **Purpose**: Generates unique email addresses for testing
- **Usage**: Creates timestamped emails for isolated test runs

## Test Data Management

### Storage Files

- **`storage-state-*.json`**: Authentication session states
- **`inboxes.json`**: MailSlurp inbox configuration
- **`test-pdf.pdf`**: Sample file for upload tests

### Environment Configuration

- **`env.ts`**: Centralized environment variable management
- **Validation**: Ensures required variables are present
- **Error Handling**: Clear error messages for missing configuration

## Troubleshooting

### Common Issues

1. **Authentication Failures**

   - Check MailSlurp API key validity
   - Verify inbox names match configuration
   - Ensure BASE_URL is accessible

2. **Environment Variable Errors**

   - Verify `.env` file exists and contains all required variables
   - Check variable names match exactly (case-sensitive)

3. **Parallel Test Issues**

   - Reduce workers if tests interfere: `--workers=1`
   - Check for shared state between tests

4. **Admin Session Issues**
   - Re-run admin setup when session expires
   - Verify admin email has proper permissions

### Debug Mode

```bash
# Run specific test in debug mode
npx playwright test tests/smoke/signin-page/signin.spec.ts --debug

# Run with browser visible
npx playwright test --headed --workers=1
```

## Performance Considerations

- **Parallel Execution**: Default 3 workers balance speed vs. resource usage
- **Session Reuse**: Authentication state is cached to avoid repeated logins
- **MailSlurp Optimization**: Inboxes are reused and emails are cleaned up
- **Timeout Configuration**: 30-second timeouts for actions and navigation

## Security Notes

- **No Hardcoded Credentials**: All authentication uses environment variables
- **Session State**: Stored locally and not committed to version control
- **Admin Access**: Requires manual setup with proper admin credentials
- **Email Cleanup**: Test emails are automatically deleted after use

## Contributing

When adding new tests:

1. **Follow the existing structure** (smoke vs. regression)
2. **Use Page Object Model** for maintainability
3. **Add proper test descriptions** and steps
4. **Update this README** with new test information
5. **Ensure tests are independent** and can run in parallel

## Best Practices

- **Test Independence**: Each test should be able to run standalone
- **Clear Naming**: Use descriptive test and describe block names
- **Proper Assertions**: Use appropriate Playwright assertions
- **Error Handling**: Include meaningful error messages
- **Resource Cleanup**: Clean up test data and browser state
