import { Page } from "puppeteer";
import { Conversation, DoneFile } from "./types";
import { sleep } from "./utils";

export async function scrollToBottomOfConversations(
  page: Page,
  doneFile: DoneFile
): Promise<void> {
  // Scroll to bottom and wait for more items until no new items load
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => {
    const container = document.querySelector("div.scrollable-container");
    return container?.scrollHeight || 0;
  });

  while (previousHeight !== currentHeight) {
    // Check if we've hit any processed URLs
    const foundProcessed = await page.evaluate((processedUrls) => {
      const items = Array.from(
        document.querySelectorAll('div[data-testid="thread-title"]')
      ).map((div: Element) => div.closest("a") as HTMLAnchorElement);
      return items.some((item) => processedUrls.includes(item.href));
    }, doneFile.processedUrls);

    if (foundProcessed) {
      console.log("Found already processed conversation, stopping scroll");
      break;
    }

    // Scroll to bottom
    await page.evaluate(() => {
      const container = document.querySelector("div.scrollable-container");
      if (container) {
        container.scrollTo(0, container.scrollHeight);
      }
    });

    // Wait a bit for content to load
    await sleep(2000);

    previousHeight = currentHeight;
    currentHeight = await page.evaluate(() => {
      const container = document.querySelector("div.scrollable-container");
      return container?.scrollHeight || 0;
    });
  }
}

export async function getConversations(
  page: Page,
  doneFile: DoneFile
): Promise<Conversation[]> {
  console.log("Navigating to library...");
  await page.goto("https://www.perplexity.ai/library");

  await page.waitForSelector('div[data-testid="thread-title"]');
  await scrollToBottomOfConversations(page, doneFile);

  // Get all conversation links
  const conversations = await page.evaluate(() => {
    const items = Array.from(
      document.querySelectorAll('div[data-testid="thread-title"]')
    ).map((div: Element) => div.closest("a") as HTMLAnchorElement);
    return items.map((item) => ({
      title: item.textContent?.trim() || "Untitled",
      url: item.href,
    }));
  });

  // Filter out already processed conversations and reverse the order
  return conversations
    .filter((conv) => !doneFile.processedUrls.includes(conv.url))
    .reverse();
}
