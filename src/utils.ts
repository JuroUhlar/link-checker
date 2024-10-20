import * as cliProgress from "cli-progress";

export const progressBar = new cliProgress.SingleBar({ stopOnComplete: true });

export const log = (message: any, verbose = false) => {
  if (verbose) {
    console.log(message);
  }
};

export const CONCURRENCY_LIMIT = 20;
export const TASK_TIMEOUT = 20000;

export const OKAY_STATUS_CODES = [200, 301, 302, 303, 307, 308];
// Some websites have ReCaptcha or other anti-scraping measures that prevent us from checking their links, let's ignore/collect them separately
export const FORBIDDEN_STATUS_CODES = [403, 401];
// Spoofed user agent to bypass some websites restrictions
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36";
