import "dotenv/config";
import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import { promises as fs } from "fs";
import path, { basename } from "path";

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

interface Conversation {
  title: string;
  url: string;
}

interface DoneFile {
  processedUrls: string[];
}

async function loadDoneFile(): Promise<DoneFile> {
  const doneFilePath = process.env.DONE_FILE || "done.json";
  try {
    const content = await fs.readFile(doneFilePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return { processedUrls: [] };
  }
}

async function saveDoneFile(doneFile: DoneFile): Promise<void> {
  const doneFilePath = process.env.DONE_FILE || "done.json";
  await fs.writeFile(doneFilePath, JSON.stringify(doneFile, null, 2));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page: Page): Promise<void> {
  console.log("Navigating to Perplexity...");
  await page.goto("https://www.perplexity.ai/");

  await page.click("button::-p-text('Accept All Cookies')");

  // Wait for email input and enter credentials
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.PERPLEXITY_EMAIL || "");

  // Click the login submit button
  await page.click("button::-p-text('Continue with email')");

  await page.waitForNavigation();

  await page.waitForSelector('input[placeholder="Enter Code"]');

  console.log(
    "Check your email and enter code in the window.\nWaiting for you to enter the email code and login to succeed..."
  );

  await page.waitForNavigation();

  // Wait for the main chat input to be ready
  await page.waitForSelector('textarea[placeholder="Ask anything…"]', {
    timeout: 120000,
  });

  console.log("Successfully logged in");
}

async function scrollToBottomOfConversations(
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

async function getConversations(
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

async function saveConversation(
  page: Page,
  conversation: Conversation
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

  // Wait for the download to complete (adjust timeout if needed)
  await sleep(5000);

  console.log(`Saved: ${conversation.url}`);
}

async function main(): Promise<void> {
  // Create output directory if it doesn't exist
  const outputDir = process.env.OUTPUT_DIR || "./conversations";
  await fs.mkdir(outputDir, { recursive: true });

  // Load done file
  const doneFile = await loadDoneFile();
  console.log(
    `Loaded ${doneFile.processedUrls.length} processed URLs from done file`
  );

  const browser: Browser = await puppeteer.launch({
    // Authentication is interactive.
    headless: false,
  });

  try {
    const page = await browser.newPage();

    // Configure Puppeteer to allow downloads and set download directory
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: outputDir,
    });

    await login(page);
    const conversations = await getConversations(page, doneFile);

    console.log(`Found ${conversations.length} new conversations to process`);

    for (const conversation of conversations) {
      await saveConversation(page, conversation);
      doneFile.processedUrls.push(conversation.url);
      // Save after each conversation in case of interruption
      await saveDoneFile(doneFile);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
