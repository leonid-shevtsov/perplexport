# Perplexity Conversation Exporter

This tool automatically exports your Perplexity conversations as markdown files. Built with TypeScript and Puppeteer.

It's raw but functional. You will need to log in using your email code.

There is a rate limit. It seems to be a leaky bucket rate limit, with a total size of 20 and a replenishment rate of 1 in 10 minutes. So it probably makes sense to run the script around once in 4 hours. Retrying is not effective with a leaky bucket, as when all tokens are used up, you will only be able to do 1 download in 10 minutes.

## Setup

1.  Clone and install dependencies

    ```bash
    git clone https://github.com/leonid-shevtsov/perplexity-exporter.git
    yarn
    ```

2.  Create a `.env` file in the project root with your Perplexity credentials:

    ```
    PERPLEXITY_EMAIL=your_email@example.com
    OUTPUT_DIR=./conversations
    ```

    (Or just pass these environment variables to the script in some other way.)

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
