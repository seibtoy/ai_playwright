import {
  type Page,
  type Locator,
  expect,
  type TestInfo,
} from "@playwright/test";
import { Sidebar } from "./sidebar-component";

export class ChatPage extends Sidebar {
  readonly input: Locator;
  readonly sendButton: Locator;

  readonly recordingButton: Locator;
  readonly recordingButtonWebkit: Locator;

  readonly privateButton: Locator;
  readonly publicButton: Locator;

  readonly messageContent: Locator;
  readonly newChatButton: Locator;
  readonly feedbackButton: Locator;
  readonly attachmentsButton: Locator;
  readonly upvoteButton: Locator;
  readonly downvoteButton: Locator;
  readonly copyButton: Locator;
  readonly inputAttachmentPreview: Locator;
  readonly thinkingLocator: Locator;
  readonly saveAsFinalResponseButton: Locator;

  readonly pageNotFoundText: Locator;

  constructor(page: Page) {
    super(page);
    this.input = page.getByTestId("multimodal-input");
    this.sendButton = page.getByTestId("send-button");

    this.recordingButton = page.getByRole("button", {
      name: "Start recording",
    });
    this.recordingButtonWebkit = page.getByRole("button", {
      name: "Audio recording requires",
    });

    this.privateButton = page.getByRole("button", { name: "Private" });
    this.publicButton = page.getByRole("button", { name: "Public" });

    this.messageContent = page.getByTestId("message-content");
    this.newChatButton = page.getByRole("button", { name: "New Chat" });
    this.feedbackButton = page.locator('button[data-slot="popover-trigger"]');
    this.attachmentsButton = page.getByTestId("attachments-button");
    this.upvoteButton = page.getByTestId("message-upvote");
    this.downvoteButton = page.getByTestId("message-downvote");
    this.copyButton = page
      .getByTestId("message-assistant")
      .getByRole("button")
      .first();
    this.inputAttachmentPreview = page.getByTestId("input-attachment-preview");
    this.thinkingLocator = page.getByText("Thinking...");
    this.saveAsFinalResponseButton = page.getByRole("button", {
      name: "Save as Final Response",
    });
    this.pageNotFoundText = page.getByRole("heading", {
      name: "This page could not be found.",
    });
  }

  async sendMessage(
    message: string,
    waitForRecording: boolean = true,
    testInfo: TestInfo
  ) {
    await expect(this.input).toBeVisible();
    await this.input.click();
    await this.input.fill(message);
    await this.sendButton.click();

    const recordingButton =
      testInfo?.project?.name === "webkit"
        ? this.recordingButtonWebkit
        : this.recordingButton;

    const options = waitForRecording
      ? { state: "visible" as const }
      : { state: "visible" as const, timeout: 0 };

    await recordingButton.waitFor(options);
  }
}
