import {
  ConversationResponse,
  ImageModeBlock,
  SourcesModeBlock,
  VideoModeBlock,
} from "./types/conversation";

export default function renderConversation(
  conversation: ConversationResponse
): string {
  const { entries } = conversation;

  if (entries.length === 0) {
    return "";
  }

  let items = [
    `---\nPerplexity URL: https://www.perplexity.ai/search/${
      conversation.entries[0].thread_url_slug
    }\nLast updated: ${
      conversation.entries[entries.length - 1].updated_datetime
    }\n---`,
  ];

  entries.forEach((entry, entryIndex) => {
    if (entryIndex > 0) {
      items.push("* * *");
    }

    const queryLines = entry.query_str.split("\n");

    // important to get proper folding
    items.push(`# ${queryLines[0]}`);

    // convenient to read in a callout
    items.push(`>[!important] ${entry.query_str.split("\n").join("\n> ")}`);

    const answerBlock = entry.blocks.find(
      (block) => block.intended_usage === "ask_text"
    )?.markdown_block;

    const sourcesBlock = entry.blocks.find(
      (block) => block.intended_usage === "sources_answer_mode"
    )?.sources_mode_block;

    const imagesBlock = entry.blocks.find(
      (block) => block.intended_usage === "image_answer_mode"
    )?.image_mode_block;

    const videoBlock = entry.blocks.find(
      (block) => block.intended_usage === "video_answer_mode"
    )?.video_mode_block;

    if (imagesBlock) {
      items.push(renderImages(imagesBlock));
    }

    if (videoBlock) {
      items.push(renderVideo(videoBlock));
    }

    if (answerBlock) {
      items.push(cleanupAnswer(answerBlock.answer, entryIndex));
    }

    if (sourcesBlock) {
      items.push(renderSources(sourcesBlock, entryIndex));
    }
  });

  return items.join("\n\n");
}

function cleanupAnswer(answer: string, entryIndex: number): string {
  return (
    answer
      // every header in the answer has a weird pplx: link, i think for follow-ups
      .replace(/\[(.*?)\]\(pplx:\/\/.*?\)/g, "$1")
      // replace internal numbered refs
      .replace(/\[(\d+)\]/g, (_, num) => ` [[#^${entryIndex + 1}-${num}]] `)
  );
}

function renderSources(sources: SourcesModeBlock, entryIndex: number): string {
  let sourcesText = `## ${sources.rows.length} Sources\n\n`;
  sources.rows.forEach((row) => {
    if (row.web_result.url.startsWith("http")) {
      sourcesText += `- [${row.web_result.name}](${
        row.web_result.url
      }) ${hostLabel(row.web_result.url)}`;
    } else {
      sourcesText += `- ${row.web_result.name} (${row.web_result.url})`;
    }
    if (row.web_result.snippet) {
      sourcesText += `\n    ${row.web_result.snippet}`;
    }

    if (row.citation) {
      sourcesText += ` ^${entryIndex + 1}-${row.citation}`;
    }
    sourcesText += "\n";
  });

  return sourcesText;
}

function renderImages(images: ImageModeBlock): string {
  const imagesLine = images.media_items
    .map((item) => {
      const scale = 100 / item.image_height;
      return `[![${item.name}|${(item.image_width * scale).toFixed(0)}x100](${
        item.image
      })](${item.url})`;
    })
    .join(" ");

  return `${imagesLine}\n`;
}

function renderVideo(video: VideoModeBlock): string {
  let videosText = "";

  video.media_items.forEach((item) => {
    videosText += `- 📺 [${item.name}](${item.url}) ${hostLabel(item.url)}\n`;
  });

  return videosText;
}

function hostLabel(url: string): string {
  return `(${new URL(url).hostname.replace("www.", "")})`;
}
