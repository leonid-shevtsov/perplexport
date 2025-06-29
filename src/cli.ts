#!/usr/bin/env node

import { Command } from "commander";
import exportLibrary from "./exportLibrary";

const program = new Command();

program
  .name("perplexport")
  .description("Export Perplexity conversations as markdown files")
  .version("1.0.0")
  .option("-o, --output <directory>", "Output directory for conversations", ".")
  .option(
    "-d, --done-file <file>",
    "Done file location (tracks which URLs have been downloaded before)",
    "done.json"
  )
  .requiredOption("-e, --email <email>", "Perplexity email")
  .parse();

const options = program.opts();

async function main(): Promise<void> {
  await exportLibrary({
    outputDir: options.output,
    doneFilePath: options.doneFile,
    email: options.email,
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
