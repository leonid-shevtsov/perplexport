import { Page } from "puppeteer";
import { Conversation } from "./types";
import { sleep } from "./utils";
import { DownloadManager, DownloadError } from "./DownloadManager";

export async function saveConversation(
  page: Page,
  conversation: Conversation,
  downloadManager: DownloadManager
): Promise<void> {
  console.log(`Processing conversation: ${conversation.url}`);
  await page.goto(conversation.url);

  // Keep trying to find the "Export as Markdown" option
  let exportOptionFound = false;
  while (!exportOptionFound) {
    // Click the kebab menu (three dots)
    await page.waitForSelector('[data-testid="thread-dropdown-menu"]');
    try {
      await page.click('[data-testid="thread-dropdown-menu"]');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Node is detached from document")
      ) {
        // Wait briefly and retry once
        await sleep(500);
        await page.click('[data-testid="thread-dropdown-menu"]');
      } else {
        throw error;
      }
    }

    // Check if Export as Markdown option exists
    try {
      await page.waitForSelector("text/Export as Markdown", { timeout: 1000 });
      exportOptionFound = true;
    } catch (e) {
      // Option not found, wait a bit and try again
      await sleep(500);
    }
  }

  let retryCount = 0;
  const maxRetries = 4;

  while (retryCount < maxRetries) {
    try {
      const downloadedFile = await downloadManager.waitForDownload(async () => {
        await page.click("text/Export as Markdown");
      });
      console.log(`Downloaded file: ${downloadedFile}`);
      console.log(`Saved: ${conversation.url}`);
      return;
    } catch (error) {
      if (error instanceof DownloadError && error.statusCode === 429) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(
            `Rate limit hit, waiting 5 minutes before retry ${retryCount}/${maxRetries}...`
          );
          await sleep(300000); // Wait 60 seconds
          await page.click('[data-testid="thread-dropdown-menu"]');
          continue;
        }
      }
      throw error; // Re-throw if it's not a rate limit error or we're out of retries
    }
  }
}
