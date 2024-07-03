import * as cheerio from "cheerio";
import { chromium } from "playwright";

export type LinkCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "hash not found" | "broken link" | "network error";
      errorDetail?: string;
    };

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
  if (response.status !== 200) {
    return { ok: false, error: "broken link" };
  }
  if (hash) {
    var $ = cheerio.load(await response.text());
    var element = $(hash);
    if (element.length === 0) {
      return await checkLinkWithPlaywright(url);
    }
  }
  return { ok: true };
};

async function checkLinkWithPlaywright(url: string): Promise<LinkCheckResult> {
  console.log("Checking link with Playwright to make sure");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const hash = new URL(url).hash;

  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: "networkidle" });

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
