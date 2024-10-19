import * as cheerio from "cheerio";
import { chromium } from "playwright";
import {
  BROWSER_USER_AGENT,
  CONCURRENCY_LIMIT,
  FORBIDDEN_STATUS_CODES,
  OKAY_STATUS_CODES,
  TASK_TIMEOUT,
  log,
  progressBar,
} from "./utils";
import { Link, LinkCheckResult, LinkWithResult } from "./types";
import PromisePool from "@supercharge/promise-pool";

type CheckLinksArgs = {
  links: Link[];
  verbose?: boolean;
  concurrencyLimit?: number;
};

export const checkLinks = async ({ links, verbose, concurrencyLimit }: CheckLinksArgs) => {
  console.log(`Checking ${links.length} links...`);
  const resultMap = new Map<string, LinkCheckResult>();

  progressBar.start(links.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(concurrencyLimit ?? CONCURRENCY_LIMIT)
    .withTaskTimeout(TASK_TIMEOUT)
    .for(links)
    .process(async (link): Promise<LinkWithResult> => {
      const existingResult = resultMap.get(link.href);
      if (existingResult) {
        // Already checked, just use the result
        link.result = existingResult;
      } else {
        // New link, check it
        const newResult = await checkLink(link.href);
        resultMap.set(link.href, newResult);
        link.result = newResult;
      }
      progressBar.increment();
      return link as LinkWithResult;
    });
  progressBar.stop();

  console.log(`Checked ${results.length} links.`);
  console.log(`Unexpected errors ocurred for ${errors.length} links`);
  log(errors, verbose);
  return { results, errors };
};

function getUserAgent(url: string) {
  // Android website gets stuck in an infinite loop if user agent is spoofed
  if (url.includes("android.com")) {
    return "Link checker";
  }
  return BROWSER_USER_AGENT;
}

/**
 *
 * @param url link URL
 * @returns LinkCheckResult
 * @throws {Error} - network can fail or something
 */
export const checkLink = async (
  url: string,
  verbose = false
): Promise<LinkCheckResult> => {
  const hash = new URL(url).hash;
  try {
    const response = await fetch(url, {
      method: hash ? "GET" : "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": getUserAgent(url),
      },
    });

    if (OKAY_STATUS_CODES.includes(response.status) === false) {
      log(
        `Responded with ${response.status}, ${response.statusText}, trying with Playwright`,
        verbose
      );
      return await checkLinkWithPlaywright(url, verbose);
    }

    if (!hash) {
      log(`OK`, verbose);
      return { ok: true };
    }

    if (hash.includes(":~:")) {
      /**
       * The link includes a [Text Fragment](https://developer.mozilla.org/en-US/docs/Web/Text_fragments)
       * Checking this properly is not trivial, let's ignore them for now
       **/
      return { ok: true, note: "Text Fragment" };
    }

    var $ = cheerio.load(await response.text());

    // Some websites put the hash into the `href="#hash"` attribute instead of `id="hash"`
    var element = $(`${hash}, [href="${hash}"]`).first();
    if (element.length === 0) {
      log(`Hash ${hash} not found at first, trying with Playwright`, verbose);
      return await checkLinkWithPlaywright(url, verbose);
    }

    log(`OK`, verbose);
  } catch (error) {
    log(`Something went wrong: ${error}`, verbose);
    log("Checking with Playwright", verbose);
    const result = await checkLinkWithPlaywright(url, verbose);
  }

  return { ok: true };
};

async function isHashPresent(page, hash, timeout = 5000) {
  const locator = page.locator(`[id="${hash}"], [href="#${hash}"]`).first();

  try {
    // Wait for the locator to be visible with a custom timeout
    await locator.waitFor({ state: "visible", timeout: timeout });
    return true;
  } catch (error) {
    // If the timeout is reached, return false instead of throwing an error
    if (error.name === "TimeoutError") {
      return false;
    }
    // Re-throw any other errors
    throw error;
  }
}

export async function checkLinkWithPlaywright(
  url: string,
  verbose = false,
  headless = true
): Promise<LinkCheckResult> {
  const browser = await chromium.launch({
    headless,
    // Potentially helps avoid some bot detection checks
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: getUserAgent(url),
  });
  const page = await context.newPage();

  try {
    // Navigate to the URL
    const response = await Promise.race([
      page.goto(url),
      page.waitForResponse(
        (response) => response.url() === url && response.status() > 99
      ),
    ]);

    log(`Navigation response: ${response?.status()}`, verbose);
    if (response && FORBIDDEN_STATUS_CODES.includes(response.status())) {
      return {
        ok: false,
        error: "could not check",
        errorDetail: `Status ${response.status()}, ${response.statusText()}`,
      };
    }

    // Check if the current URL matches the given URL
    if (!response || !OKAY_STATUS_CODES.includes(response.status())) {
      return {
        ok: false,
        error: "broken link",
        errorDetail: response?.status().toString(),
      };
    }

    const hash = new URL(url).hash.replace("#", "");

    if (hash.includes(":~:")) {
      return { ok: true, note: "Text Fragment" };
    }

    if (hash && !(await isHashPresent(page, hash))) {
      log(`Hash not found`, verbose);
      return {
        ok: false,
        error: "hash not found",
        errorDetail: `hash: ${hash}`,
      };
    }

    log(`OK`, verbose);
    return { ok: true };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      ok: false,
      error: "broken link",
      errorDetail: error.toString(),
    };
  } finally {
    if (headless) {
      await browser.close();
    }
  }
}
