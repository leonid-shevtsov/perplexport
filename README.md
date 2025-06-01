# Perplexity Conversation Exporter

This tool automatically exports your Perplexity conversations as markdown files. Built with TypeScript and Puppeteer.

## Setup

1. Install dependencies:

```bash
yarn
```

2. Create a `.env` file in the project root with your Perplexity credentials:

```
PERPLEXITY_EMAIL=your_email@example.com
OUTPUT_DIR=./conversations
```

## Usage

```bash
yarn start
```

The script will:

1. Log in to your Perplexity account (Only login with email is currently supported)
2. You will need to provide the login code sent to your email
3. Navigate to your conversation library
4. Export each conversation as a markdown file
5. Save the files in the specified output directory (defaults to `./conversations`)

---

(c) 2025 [Leonid Shevtsov](https://leonid.shevtsov.me)
