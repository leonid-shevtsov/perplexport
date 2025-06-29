import { Page } from "puppeteer";

export async function login(page: Page, email: string): Promise<void> {
  console.log("Navigating to Perplexity...");
  await page.goto("https://www.perplexity.ai/");

  await page.click("button::-p-text('Accept All Cookies')");

  // Wait for email input and enter credentials
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email);

  // Click the login submit button
  await page.click("button::-p-text('Continue with email')");

  await page.waitForNavigation();

  await page.waitForSelector('input[placeholder="Enter Code"]');

  console.log(
    "Check your email and enter code in the window.\nWaiting for you to enter the email code and login to succeed..."
  );

  await page.waitForNavigation();

  // Wait for the main chat input to be ready
  await page.waitForSelector("#ask-input", {
    timeout: 120000,
  });

  console.log("Successfully logged in");
}
