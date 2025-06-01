import { CDPSession, Page } from "puppeteer";
import path from "path";

export class DownloadError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = "DownloadError";
  }
}

interface DownloadProgressEvent {
  state: "inProgress" | "completed" | "canceled" | "interrupted";
  error?: string;
  bytesReceived?: number;
  totalBytes?: number;
}

export class DownloadManager {
  private client!: CDPSession;
  private downloadPath: string;
  private lastDownloadedFile: string | null = null;
  private downloadPromise: Promise<string> | null = null;
  private downloadResolve: ((filename: string) => void) | null = null;
  private downloadReject: ((error: Error) => void) | null = null;
  private currentDownloadFilename: string | null = null;

  private constructor(downloadPath: string) {
    this.downloadPath = downloadPath;
  }

  public static async create(
    page: Page,
    downloadPath: string
  ): Promise<DownloadManager> {
    const manager = new DownloadManager(downloadPath);
    await manager.initialize(page);
    return manager;
  }

  private async initialize(page: Page): Promise<void> {
    this.client = await page.createCDPSession();
    this.setupDownloadListener();
    await this.configureDownloadBehavior();
  }

  private setupDownloadListener(): void {
    // Listen for download start to get the filename
    this.client.on("Browser.downloadWillBegin", (event) => {
      this.currentDownloadFilename = event.suggestedFilename;
    });

    // Listen for download completion
    this.client.on(
      "Browser.downloadProgress",
      async (event: DownloadProgressEvent) => {
        if (event.state === "completed" && this.currentDownloadFilename) {
          this.lastDownloadedFile = path.join(
            this.downloadPath,
            this.currentDownloadFilename
          );
          if (this.downloadResolve) {
            this.downloadResolve(this.lastDownloadedFile);
            this.downloadResolve = null;
            this.downloadReject = null;
          }
          this.currentDownloadFilename = null;
        } else if (
          event.state === "canceled" ||
          event.state === "interrupted"
        ) {
          // Check if it's a rate limit error
          const isRateLimit =
            event.error?.includes("429") || event.error?.includes("rate limit");
          if (this.downloadReject) {
            this.downloadReject(
              new DownloadError(
                `Download failed: ${event.error || "Unknown error"}`,
                isRateLimit ? 429 : undefined
              )
            );
            this.downloadResolve = null;
            this.downloadReject = null;
          }
          this.currentDownloadFilename = null;
        }
      }
    );
  }

  private setupResponseListener(page: Page): void {
    page.on("response", (response) => {
      if (!response.ok() && this.downloadReject) {
        this.downloadReject(
          new DownloadError(
            `Download failed: HTTP ${response.status()} ${response.statusText()}`,
            response.status()
          )
        );
        this.downloadResolve = null;
        this.downloadReject = null;
        this.currentDownloadFilename = null;
      }
    });
  }

  public async waitForDownload(
    triggerDownload?: () => Promise<void>
  ): Promise<string> {
    if (this.downloadPromise) {
      return this.downloadPromise;
    }

    this.downloadPromise = new Promise((resolve, reject) => {
      this.downloadResolve = resolve;
      this.downloadReject = reject;
    });

    try {
      if (triggerDownload) {
        await triggerDownload();
      }
      const result = await this.downloadPromise;
      this.downloadPromise = null;
      return result;
    } catch (error) {
      this.downloadPromise = null;
      throw error;
    }
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
