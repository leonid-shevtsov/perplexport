import { promises as fs } from "fs";
import { DoneFile } from "./types";

export async function loadDoneFile(doneFilePath: string): Promise<DoneFile> {
  try {
    const content = await fs.readFile(doneFilePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading done file ${doneFilePath}:`, error);
    return { processedUrls: [] };
  }
}

export async function saveDoneFile(
  doneFile: DoneFile,
  doneFilePath: string
): Promise<void> {
  await fs.writeFile(doneFilePath, JSON.stringify(doneFile, null, 2));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
