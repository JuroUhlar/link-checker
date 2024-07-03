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
export const checkLink = async (url: string): Promise<LinkCheckResult> => {
  const hash = new URL(url).hash;
  const response = await fetch(url, {
    method: hash ? "GET" : "HEAD",
    redirect: "follow",
  });
  if (okayStatusCodes.includes(response.status) === false) {
    return { ok: false, error: "broken link" };
  }
  if (hash) {
    var $ = cheerio.load(await response.text());
    var element = $(hash);
    if (element.length === 0) {
      return { ok: false, error: "hash not found" };
      // return await checkLinkWithPlaywright(url);
    }
  }
  return { ok: true };
};

async function checkLinkWithPlaywright(url: string): Promise<LinkCheckResult> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const hash = new URL(url).hash;

  try {
    // Navigate to the URL
    await page.goto(url);

    // Check if the current URL matches the given URL
    if (page.url() !== url) {
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
