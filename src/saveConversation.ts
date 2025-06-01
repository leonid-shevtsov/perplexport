import { Page } from "puppeteer";
import { Conversation } from "./types";
import { sleep } from "./utils";
import { DownloadManager } from "./DownloadManager";

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
    await page.click('[data-testid="thread-dropdown-menu"]');

    // Check if Export as Markdown option exists
    try {
      await page.waitForSelector("text/Export as Markdown", { timeout: 1000 });
      exportOptionFound = true;
    } catch (e) {
      // Option not found, wait a bit and try again
      await sleep(500);
    }
  }
  await page.click("text/Export as Markdown");
  const downloadedFile = await downloadManager.waitForDownload();
  console.log(`Downloaded file: ${downloadedFile}`);

  console.log(`Saved: ${conversation.url}`);
}
