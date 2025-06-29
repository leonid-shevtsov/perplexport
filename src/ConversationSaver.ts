import { Page } from "puppeteer";
import { ConversationResponse } from "./types/conversation";

interface ThreadData {
  id: string;
  conversation: ConversationResponse;
}

export class ConversationSaver {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private resolve: (data: ThreadData) => void = (_) => {};

  async initialize(): Promise<void> {
    this.page.on("response", async (response) => {
      const url = response.url();
      if (
        response.request().method() === "GET" &&
        url.includes("/rest/thread/") &&
        // TODO: might not be stable
        url.includes("limit=100")
      ) {
        const threadId = url.split("/rest/thread/")[1].split("?")[0];
        if (threadId === "list_recent") {
          //ignore list request
          return;
        }
        try {
          const data = (await response.json()) as ConversationResponse;
          if (this.resolve) {
            this.resolve({
              id: threadId,
              conversation: data,
            });
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    });
  }

  // we request the thread's page and wait for the response for thread data
  // the response is captured by the response handler above
  // and we route it through the promise
  // concurrency not possible with the browser anyway
  async loadThreadFromURL(url: string): Promise<ThreadData> {
    const pagePromise = new Promise<ThreadData>((resolve) => {
      this.resolve = resolve;
    });
    await this.page.goto(url);
    const threadData = await pagePromise;
    this.resolve = (_) => {};
    return threadData;
  }
}
