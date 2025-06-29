import { promises as fs } from "fs";
import puppeteer from "puppeteer-extra";
import { Browser } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { ConversationSaver } from "./ConversationSaver";
import { getConversations } from "./listConversations";
import { login } from "./login";
import renderConversation from "./renderConversation";
import { loadDoneFile, saveDoneFile, sleep } from "./utils";

export interface ExportLibraryOptions {
  outputDir: string;
  doneFilePath: string;
  email: string;
}

export default async function exportLibrary(options: ExportLibraryOptions) {
  puppeteer.use(StealthPlugin());

  // Create output directory if it doesn't exist
  await fs.mkdir(options.outputDir, { recursive: true });

  // Load done file
  const doneFile = await loadDoneFile(options.doneFilePath);
  console.log(
    `Loaded ${doneFile.processedUrls.length} processed URLs from done file`
  );

  const browser: Browser = await puppeteer.launch({
    // Authentication is interactive.
    headless: false,
  });

  try {
    const page = await browser.newPage();

    await login(page, options.email);
    const conversations = await getConversations(page, doneFile);

    console.log(`Found ${conversations.length} new conversations to process`);

    const conversationSaver = new ConversationSaver(page);
    await conversationSaver.initialize();

    for (const conversation of conversations) {
      console.log(`Processing conversation ${conversation.url}`);

      const threadData = await conversationSaver.loadThreadFromURL(
        conversation.url
      );

      // place the thread data in the output directory
      await fs.writeFile(
        `${options.outputDir}/${threadData.id}.json`,
        JSON.stringify(threadData.conversation, null, 2)
      );

      // render conversation to markdown and save
      const markdown = renderConversation(threadData.conversation);
      await fs.writeFile(`${options.outputDir}/${threadData.id}.md`, markdown);

      doneFile.processedUrls.push(conversation.url);
      // Save after each conversation in case of interruption
      await saveDoneFile(doneFile, options.doneFilePath);

      await sleep(2000); // don't do it too fast
    }

    console.log("Done");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}
