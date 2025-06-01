import "dotenv/config";
import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import { promises as fs } from "fs";
import path from "path";

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

interface Conversation {
  title: string;
  url: string;
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

async function getConversations(page: Page): Promise<Conversation[]> {
  console.log("Navigating to library...");
  await page.goto("https://www.perplexity.ai/library");

  await page.waitForSelector('div[data-testid="thread-title"]');

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

  return conversations;
}

async function saveConversation(
  page: Page,
  conversation: Conversation,
  outputDir: string
): Promise<void> {
  console.log(`Processing conversation: ${conversation.title}`);
  await page.goto(conversation.url);

  // Wait for the conversation content to load
  await page.waitForSelector('[data-testid="message-content"]');

  // Extract the conversation content
  const content = await page.evaluate(() => {
    const messages = document.querySelectorAll(
      '[data-testid="message-content"]'
    );
    return Array.from(messages)
      .map((msg) => {
        const role = msg.closest('[data-testid="user-message"]')
          ? "User"
          : "Assistant";
        return `## ${role}\n\n${msg.textContent?.trim() || ""}\n\n`;
      })
      .join("---\n\n");
  });

  // Create markdown content
  const markdown = `# ${conversation.title}\n\n${content}`;

  // Save to file
  const filename = `${conversation.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.md`;
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, markdown);
  console.log(`Saved to: ${filepath}`);
}

async function main(): Promise<void> {
  // Create output directory if it doesn't exist
  const outputDir = process.env.OUTPUT_DIR || "./conversations";
  await fs.mkdir(outputDir, { recursive: true });

  const browser: Browser = await puppeteer.launch({
    // Authentication is interactive.
    headless: false,
  });

  try {
    const page = await browser.newPage();

    await login(page);
    const conversations = await getConversations(page);

    console.log(`Found ${conversations.length} conversations`);

    console.log(JSON.stringify(conversations, null, 2));

    // for (const conversation of conversations) {
    //   await saveConversation(page, conversation, outputDir);
    //   await sleep(1000); // Be nice to the server
    // }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
