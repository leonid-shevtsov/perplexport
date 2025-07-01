# Perplexity Conversation Exporter

This tool automatically exports your Perplexity conversations as JSON and markdown files. Built with TypeScript and Puppeteer.

It's raw but functional. You will need to log in using your email code. Sometimes there are issues with stability (as to be expected with browser automation).

Your credentials and session are not stored, so from one side it's all secure, from the other requires manual attention to run.

I do not use the built-in export functionality (it's rate limited and the output is quite sparse), but render the conversation from its data. The data itself is stored as JSON and could be considered a complete backup of the conversation.

## Usage

```
Usage: npx perplexport -e <email> [options]

Export Perplexity conversations as markdown files

Options:
  -o, --output <directory>  Output directory for conversations (default: ".")
  -d, --done-file <file>    Done file location (tracks which URLs have been downloaded before) (default: "done.json")
  -e, --email <email>       Perplexity email
  -h, --help                display help for command
```

The script will:

1. Log in to your Perplexity account (Only login with email is currently supported)
2. You will need to provide the login code sent to your email
3. Navigate to your conversation library
4. Store every conversation's data in JSON
5. Render conversation into Markdown
6. Save the files in the specified output directory (defaults to `./conversations`)

### Troubleshooting

If the browser doesn't open at all, or opens and closes instantly, try `npx puppeteer browsers install chrome`.

## Development setup

```bash
git clone https://github.com/leonid-shevtsov/perplexport.git
yarn
```

---

(c) 2025 [Leonid Shevtsov](https://leonid.shevtsov.me)
