import { promises as fs } from "fs";
import { DoneFile } from "./types";

export async function loadDoneFile(): Promise<DoneFile> {
  const doneFilePath = process.env.DONE_FILE || "done.json";
  try {
    const content = await fs.readFile(doneFilePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return { processedUrls: [] };
  }
}

export async function saveDoneFile(doneFile: DoneFile): Promise<void> {
  const doneFilePath = process.env.DONE_FILE || "done.json";
  await fs.writeFile(doneFilePath, JSON.stringify(doneFile, null, 2));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
