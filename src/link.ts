import * as cheerio from "cheerio";
import { chromium } from "playwright";
import {
  BROWSER_USER_AGENT,
  CONCURRENCY_LIMIT,
  OKAY_STATUS_CODES,
  log,
  progressBar,
} from "./utils";
import { Link, LinkCheckResult, LinkWithResult } from "./types";
import PromisePool from "@supercharge/promise-pool";

export const checkLinks = async (links: Link[], verbose = false) => {
  const resultMap = new Map<string, LinkCheckResult>();
  progressBar.start(links.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(
    CONCURRENCY_LIMIT
  )
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
  const response = await fetch(url, {
    method: hash ? "GET" : "HEAD",
    redirect: "follow",
    headers: {
      "User-Agent": getUserAgent(url),
    },
  });
  if (OKAY_STATUS_CODES.includes(response.status) === false) {
    log(`Responded with ${response.status}`, verbose);
    return await checkLinkWithPlaywright(url, verbose);
  }

  if (hash) {
    var $ = cheerio.load(await response.text());
    /**
     * GitHub readmes put the hash into the `href` attribute instead of `id`
     */
    var element = $(`${hash}, [href="${hash}"]`).first();
    if (element.length === 0) {
      // return { ok: false, error: "hash not found" };
      if (verbose) {
        console.log("Hash not found at first, checking with Playwright");
      }
      return await checkLinkWithPlaywright(url, verbose);
    }
  }
  if (verbose) {
    console.log("OK");
  }
  return { ok: true };
};

export async function checkLinkWithPlaywright(
  url: string,
  verbose = false
): Promise<LinkCheckResult> {
  const browser = await chromium.launch();
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
    if (verbose) {
      console.log(response?.status());
    }

    // Check if the current URL matches the given URL
    if (!response || !OKAY_STATUS_CODES.includes(response.status())) {
      return { ok: false, error: "broken link" };
    }

    const hash = new URL(url).hash.replace("#", "");
    if (hash) {
      // Check if the element with `id` of `href`  equal to hash is present
      const isHashElementPresent = await page
        .locator(`[id="${hash}"], [href="#${hash}"]`)
        .first()
        .isVisible();
      if (!isHashElementPresent) {
        return { ok: false, error: "hash not found" };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      ok: false,
      error: "broken link",
      errorDetail: error.toString(),
    };
  } finally {
    await browser.close();
  }
}
