import * as cliProgress from "cli-progress";

export const progressBar = new cliProgress.SingleBar({});

export const log = (message: any, verbose = false) => {
  if (verbose) {
    console.log(message);
  }
};

export const CONCURRENCY_LIMIT = 25;
export const OKAY_STATUS_CODES = [200, 301, 302, 303, 307, 308];
// Some sites (Segment docs for example) respond with 403 forbidden to simple fetch requests, must add a user agent to prevent this
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36";
