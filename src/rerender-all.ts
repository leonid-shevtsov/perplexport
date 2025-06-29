import renderConversation from "./renderConversation";
import fs from "fs";

// This script is intended to RERENDER all jsons into md. This will overwrite any manual edits, so be aware.
// It only makes sense to run this if there are unexpected improvements in the renderer.

const outputDir = process.env.OUTPUT_DIR || "./conversations";
// Get all JSON files in output directory
const files = fs
  .readdirSync(outputDir)
  .filter((file) => file.endsWith(".json"));

for (const file of files) {
  const filePath = `${outputDir}/${file}`;
  const outputPath = filePath.replace(".json", ".md");

  const conversation = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const markdown = renderConversation(conversation);

  fs.writeFileSync(outputPath, markdown);
  console.log(`Rendered ${file} to ${outputPath}`);
}
