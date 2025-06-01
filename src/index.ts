import "dotenv/config";
import { promises as fs } from "fs";
import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { loadDoneFile, saveDoneFile } from "./utils";
import { login } from "./login";
import { getConversations } from "./listConversations";
import { saveConversation } from "./saveConversation";
import { DownloadManager } from "./DownloadManager";

// add stealth plugin and use defaults (all evasion techniques)
puppeteer.use(StealthPlugin());

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
    const downloadManager = await DownloadManager.create(page, outputDir);

    await login(page);
    const conversations = await getConversations(page, doneFile);

    console.log(`Found ${conversations.length} new conversations to process`);

    for (const conversation of conversations) {
      await saveConversation(page, conversation, downloadManager);
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
