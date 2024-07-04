import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { LinkCheckResult } from "./types";

const okayStatusCodes = [200, 301, 302, 303, 307, 308];

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
  });
  if (okayStatusCodes.includes(response.status) === false) {
    if (verbose) {
      console.log("Responded with", response.status);
    }
    // return { ok: false, error: "broken link" };
    return await checkLinkWithPlaywright(url, verbose);
  }
  if (hash) {
    var $ = cheerio.load(await response.text());
    var element = $(hash);
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
  const page = await browser.newPage();
  const hash = new URL(url).hash;

  try {
    // Navigate to the URL
    const response = await Promise.race([
      page.goto(url),
      page.waitForResponse(
        (response) => response.url() === url && response.status() > 99
      ),
    ]);

    // Check if the current URL matches the given URL
    if (!response || !okayStatusCodes.includes(response.status())) {
      return { ok: false, error: "broken link" };
    }

    if (hash) {
      // Check if the element with id equal to hash is present
      const isHashElementPresent = await page.evaluate((hash) => {
        const element = document.getElementById(hash);
        return Boolean(element);
      }, hash);
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
