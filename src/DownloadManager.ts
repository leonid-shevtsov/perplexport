import { CDPSession } from "puppeteer";
import path from "path";

export class DownloadManager {
  private client: CDPSession;
  private downloadPath: string;
  private lastDownloadedFile: string | null = null;
  private downloadPromise: Promise<string> | null = null;
  private downloadResolve: ((filename: string) => void) | null = null;
  private currentDownloadFilename: string | null = null;

  constructor(client: CDPSession, downloadPath: string) {
    this.client = client;
    this.downloadPath = downloadPath;
    this.setupDownloadListener();
  }

  private setupDownloadListener(): void {
    // Listen for download start to get the filename
    this.client.on("Browser.downloadWillBegin", (event) => {
      this.currentDownloadFilename = event.suggestedFilename;
    });

    // Listen for download completion
    this.client.on("Browser.downloadProgress", async (event) => {
      if (event.state === "completed" && this.currentDownloadFilename) {
        this.lastDownloadedFile = path.join(
          this.downloadPath,
          this.currentDownloadFilename
        );
        if (this.downloadResolve) {
          this.downloadResolve(this.lastDownloadedFile);
          this.downloadResolve = null;
        }
        this.currentDownloadFilename = null;
      }
    });
  }

  public async waitForDownload(): Promise<string> {
    if (this.downloadPromise) {
      return this.downloadPromise;
    }

    this.downloadPromise = new Promise((resolve) => {
      this.downloadResolve = resolve;
    });

    const result = await this.downloadPromise;
    this.downloadPromise = null;
    return result;
  }

  public getLastDownloadedFile(): string | null {
    return this.lastDownloadedFile;
  }

  public async configureDownloadBehavior(): Promise<void> {
    await this.client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      eventsEnabled: true,
      downloadPath: this.downloadPath,
    });
  }
}
