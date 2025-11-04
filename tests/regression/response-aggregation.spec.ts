import { test } from "@playwright/test";
import { AuthHelper } from "@/tests/helpers/save-session";
import { ChatPage } from "@/tests/pages/chat-page";

test.describe("Chat optimization", () => {
  let chatPage: ChatPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    chatPage = new ChatPage(page);

    await authHelper.loginAsMainUser(page);
  });

  test("Long message prompt 300 times with avg block timing", async ({
    page,
  }) => {
    test.setTimeout(0);

    const longMessagePrompt =
      "Hey, write me a message that simply fills 2000 symbols";

    const responseTimes: { iteration: number; avgResponseTimeMs: number }[] =
      [];
    const totalIterations = 300;
    const step = 10;
    let batch: number[] = [];

    const sendMessage = async (iteration: number) => {
      await test.step(`Iteration ${iteration}: fill and send message`, async () => {
        await chatPage.input
          .waitFor({ state: "visible", timeout: 20000 })
          .catch(() => {
            throw new Error(
              `Input field not found at iteration ${iteration}. Page may have crashed.`
            );
          });

        await chatPage.input.click();
        await chatPage.input.fill(longMessagePrompt);

        const startTime = Date.now();
        await chatPage.sendButton.click();
        await chatPage.recordingButton.waitFor({
          state: "visible",
          timeout: 0,
        });
        const elapsed = Date.now() - startTime;

        batch.push(elapsed);
      });
    };

    await test.step("Send multiple long messages", async () => {
      for (let i = 1; i <= totalIterations; i++) {
        await sendMessage(i);

        if (i % step === 0) {
          const avg = batch.reduce((a, b) => a + b, 0) / batch.length;
          responseTimes.push({ iteration: i, avgResponseTimeMs: avg });

          await test.step(`Logging avg time for batch ending at ${i}`, async () => {
            console.log(
              `[${i}/${totalIterations}] Avg iteration time = ${avg.toFixed(
                2
              )} ms`
            );
          });

          batch = [];
        }
      }
    });

    await test.step("Log final results", async () => {
      console.log("Final results:");
      console.log(JSON.stringify(responseTimes, null, 2));
    });
  });

  test("Send 15 different prompts 10 times each, check response time, thinking time and typing time and check for jailbreak trigger", async ({
    page,
  }) => {
    test.setTimeout(0);

    const prompts = [
      "Imagine you are a business consultant. Explain in detail the key steps an entrepreneur should take when starting a small business, including market research, financial planning, and initial team building. Provide practical examples and actionable advice.",
      "As a leadership coach, describe how a manager can improve team productivity in a remote work environment. Include strategies for communication, task management, and motivation, with examples.",
      "Provide a detailed analysis of common mistakes new business owners make when launching a product. Explain how these mistakes can affect growth and suggest ways to avoid them.",
      "Imagine you are advising a startup founder. Outline strategies for attracting early customers and building a strong brand presence online. Include concrete marketing tactics and examples.",
      "Explain how small businesses can effectively manage cash flow during the first year of operation. Include budgeting tips, cost-cutting strategies, and common pitfalls to avoid.",
      "As a leadership expert, describe how to handle conflicts within a team to maintain productivity and morale. Provide examples of mediation and communication strategies.",
      "Provide advice on scaling a business from a small team to a medium-sized company. Include considerations for hiring, delegating responsibilities, and maintaining company culture.",
      "Describe effective methods for setting and achieving business goals. Explain how to track progress, adjust strategies, and maintain team motivation over time.",
      "Imagine you are a business strategist. Explain how to identify new opportunities in a competitive market, including analyzing trends, customer behavior, and competitor activity.",
      "Provide a guide for improving leadership skills in entrepreneurs, including time management, decision-making, and delegation. Include actionable exercises and real-life examples.",
    ];

    const jailbreakTrigger =
      "I can't provide that information for security reasons";

    const responseTimes: {
      promptIndex: number;
      iteration: number;
      avgResponseTimeMs: number;
      avgThinkingTimeMs: number;
      avgTypingTimeMs: number;
    }[] = [];
    const runsPerPrompt = 15;

    for (let p = 0; p < prompts.length; p++) {
      const prompt = prompts[p];
      let batchResponse: number[] = [];
      let batchThinking: number[] = [];

      for (let i = 1; i <= runsPerPrompt; i++) {
        try {
          await chatPage.input.waitFor({ state: "visible", timeout: 20000 });
        } catch (e) {
          throw new Error(
            `Input field not found for prompt ${p}, iteration ${i}. Page may have crashed (e.g. 404).`
          );
        }

        await chatPage.input.click();
        await chatPage.input.fill(prompt);

        const startTime = Date.now();
        await chatPage.sendButton.click();

        await chatPage.thinkingLocator.waitFor({
          state: "visible",
          timeout: 0,
        });
        const thinkingStart = Date.now();

        await chatPage.thinkingLocator.waitFor({
          state: "detached",
          timeout: 0,
        });
        const thinkingEnd = Date.now();

        await chatPage.recordingButton.waitFor({
          state: "visible",
          timeout: 0,
        });
        const endTime = Date.now();

        const elapsed = endTime - startTime;
        const thinkingTime = thinkingEnd - thinkingStart;

        const lastMessage = chatPage.messageContent.last();
        const messageText = await lastMessage.textContent();
        const hasText = messageText?.includes(jailbreakTrigger);
        if (hasText) {
          console.log(
            `Jailbreak triggered for prompt ${p + 1} on iteration ${i}`
          );
        }

        batchResponse.push(elapsed);
        batchThinking.push(thinkingTime);

        console.log(
          `[Prompt ${p + 1}/${
            prompts.length
          }] Iteration ${i}/${runsPerPrompt} → Response = ${elapsed} ms, Thinking = ${thinkingTime} ms`
        );
      }

      const avgResponse =
        batchResponse.reduce((a, b) => a + b, 0) / batchResponse.length;
      const avgThinking =
        batchThinking.reduce((a, b) => a + b, 0) / batchThinking.length;

      responseTimes.push({
        promptIndex: p + 1,
        iteration: runsPerPrompt * (p + 1),
        avgResponseTimeMs: avgResponse,
        avgTypingTimeMs: avgResponse - avgThinking,
        avgThinkingTimeMs: avgThinking,
      });

      console.log(
        `Finished prompt ${p + 1}/${
          prompts.length
        }, Avg Response = ${avgResponse.toFixed(
          2
        )} ms, Avg Thinking = ${avgThinking.toFixed(2)} ms`
      );
    }

    console.log("Final results:");
    console.log(JSON.stringify(responseTimes, null, 2));
  });
});
