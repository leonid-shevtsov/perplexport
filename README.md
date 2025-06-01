# Perplexity Conversation Exporter

This tool automatically exports your Perplexity conversations as markdown files. Built with TypeScript and Puppeteer.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with your Perplexity credentials:

```
PERPLEXITY_EMAIL=your_email@example.com
PERPLEXITY_PASSWORD=your_password
OUTPUT_DIR=./conversations
```

## Usage

You can run the exporter in several ways:

1. Development mode (with auto-reload):

```bash
npm run dev
```

2. Direct execution:

```bash
npm start
```

3. Build and run the compiled JavaScript:

```bash
npm run build
node dist/index.js
```

The script will:

1. Log in to your Perplexity account
2. Navigate to your conversation library
3. Export each conversation as a markdown file
4. Save the files in the specified output directory (defaults to `./conversations`)

## Output Format

Each conversation is saved as a markdown file with:

- The conversation title as the main heading
- Each message marked as either "User" or "Assistant"
- Messages separated by horizontal rules

## Notes

- The script includes a 1-second delay between processing conversations to be respectful to the server
- Files are named using the conversation title (sanitized for filesystem compatibility)
- The script runs Chrome in headless mode
- Built with TypeScript for better type safety and developer experience
